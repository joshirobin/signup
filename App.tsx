
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './services/api';
import { ICONS } from './constants';
import { Account, Transaction, Invoice, InvoiceStatus } from './types';
import { ApiService } from './services/api';
import Dashboard from './components/Dashboard';
import AccountsList from './components/AccountsList';
import InvoicesView from './components/InvoicesView';
import AIScanner from './components/AIScanner';
import ManualInvoiceGenerator from './components/ManualInvoiceGenerator';
import Settings from './components/Settings';
import Auth from './components/Auth';

type View = 'dashboard' | 'accounts' | 'invoices' | 'scanner' | 'invoice-generator' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setConnectionError(null);
    try {
      const [accs, invs] = await Promise.all([
        ApiService.getAccounts(),
        ApiService.getInvoices()
      ]);
      setAccounts(accs || []);
      setInvoices(invs || []);
    } catch (error: any) {
      console.error("Critical failure loading initial data:", error);
      setConnectionError(error.message || "Database synchronization failed.");
      addNotification("Error: Cloud ledger unreachable.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const addNotification = (msg: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [msg, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== msg));
    }, 5000);
  };

  const handleAddAccount = async (newAcc: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>) => {
    const acc: Account = {
      ...newAcc,
      id: `ACC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString().split('T')[0],
      currentBalance: 0
    };
    try {
      await ApiService.saveAccount(acc);
      await loadData();
      addNotification(`Account "${acc.name}" saved to cloud.`);
    } catch (err) {
      addNotification("Error: Could not save house account.");
    }
  };

  const handleAddTransaction = async (trans: Omit<Transaction, 'id'>) => {
    const newTrans: Transaction = { ...trans, id: `TX-${Date.now()}` };
    try {
      await ApiService.saveTransaction(newTrans);
      await loadData();
      addNotification(`Transaction posted successfully.`);
    } catch (err) {
      addNotification("Error: Transaction rejected by cloud service.");
    }
  };

  const handleAddInvoice = async (newInv: Invoice) => {
    try {
      await ApiService.saveInvoice(newInv);
      await loadData();
      addNotification(`Invoice ${newInv.id} issued.`);
      setCurrentView('invoices');
    } catch (err) {
      addNotification("Error: Invoice commitment failed.");
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await ApiService.markInvoiceEmailSent(invoiceId);
      await loadData();
      const inv = invoices.find(i => i.id === invoiceId);
      const acc = accounts.find(a => a.id === inv?.accountId);
      addNotification(`Statement ${invoiceId} dispatched to ${acc?.email}`);
    } catch (err) {
      addNotification("Error: Communications channel failure.");
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await ApiService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
      await loadData();
      addNotification(`Statement ${invoiceId} settled.`);
    } catch (err) {
      addNotification("Error: Ledger update failed.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-blue-500/20"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Authenticating Session</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cloud Ledger Handshake...</p>
        </div>
      );
    }

    if (connectionError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4 animate-in fade-in duration-500">
           <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-red-100">
             <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Connection Interrupted</h2>
           <p className="text-slate-500 max-w-sm mb-10 font-medium">Unable to synchronize with the Ruthton Express Cloud Persistence layer. Please check your credentials or network.</p>
           <div className="bg-slate-100 p-5 rounded-2xl font-mono text-[10px] text-slate-500 mb-10 border border-slate-200 w-full max-w-md break-all">
             LOG_SIG: {connectionError}
           </div>
           <div className="flex space-x-4">
             <button onClick={loadData} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95">Retry Sync</button>
             <button onClick={() => setCurrentView('settings')} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all">Diagnostics</button>
           </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard accounts={accounts} invoices={invoices} onNavigate={setCurrentView} />;
      case 'accounts':
        return <AccountsList accounts={accounts} onAddAccount={handleAddAccount} onAddTransaction={handleAddTransaction} />;
      case 'invoices':
        return (
          <InvoicesView 
            invoices={invoices} 
            accounts={accounts} 
            onSendInvoice={handleSendInvoice} 
            onMarkPaid={handleMarkAsPaid} 
          />
        );
      case 'scanner':
        return <AIScanner accounts={accounts} onTransactionCreated={handleAddTransaction} />;
      case 'invoice-generator':
        return <ManualInvoiceGenerator accounts={accounts} onInvoiceCreated={handleAddInvoice} onCancel={() => setCurrentView('invoices')} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard accounts={accounts} invoices={invoices} onNavigate={setCurrentView} />;
    }
  };

  const getInitials = (user: User) => {
    if (user.displayName) return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return user.email?.split('@')[0].slice(0, 2).toUpperCase() || "??";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:flex relative z-40">
        <div className="p-10 flex items-center space-x-4 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
          <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
            F
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">FuelCharge</span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mt-1 ml-0.5">Enterprise Pro</span>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-4 space-y-2">
          <NavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<ICONS.Dashboard />} label="Dashboard" />
          <NavItem active={currentView === 'accounts'} onClick={() => setCurrentView('accounts')} icon={<ICONS.Accounts />} label="House Accounts" />
          <NavItem active={currentView === 'invoices'} onClick={() => setCurrentView('invoices')} icon={<ICONS.Invoices />} label="Billing Ledger" />
          <NavItem active={currentView === 'invoice-generator'} onClick={() => setCurrentView('invoice-generator')} icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          } label="Issue Invoice" />
          <NavItem active={currentView === 'scanner'} onClick={() => setCurrentView('scanner')} icon={<ICONS.Scanner />} label="AI Scanner" />
        </nav>

        <div className="p-8 border-t border-slate-100 space-y-3">
          <NavItem active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<ICONS.Settings />} label="Diagnostics" />
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 text-slate-400 hover:bg-red-50 hover:text-red-600 group font-black text-[10px] uppercase tracking-widest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Experience Engine */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-12 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">F</div>
             <h1 className="text-xl font-black text-slate-900 capitalize tracking-tighter">{currentView.replace('-', ' ')}</h1>
          </div>
          
          <div className="flex items-center space-x-8">
             <div className="relative">
               <button className="p-3.5 text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                 {notifications.length > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white"></span>}
               </button>
             </div>
             
             <div className="flex items-center space-x-4 pl-8 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-black text-slate-900 leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Authorized Administrator</p>
               </div>
               {user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="h-11 w-11 rounded-[1.25rem] ring-4 ring-slate-100 object-cover shadow-2xl" />
               ) : (
                 <div className="h-11 w-11 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-2xl ring-4 ring-slate-100">
                    {getInitials(user)}
                 </div>
               )}
             </div>
          </div>
        </header>

        <div className="p-12 flex-1">
          {renderView()}
        </div>

        {/* Dynamic Event Notification System */}
        <div className="fixed bottom-12 right-12 z-50 flex flex-col space-y-4 pointer-events-none">
          {notifications.map((note, idx) => (
            <div key={idx} className="pointer-events-auto bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-12 duration-500 flex items-center space-x-5 border border-white/10 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">System Notification</span>
                <span className="text-sm font-bold tracking-tight text-white">{note}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-5 px-6 py-4.5 rounded-[1.5rem] transition-all duration-300 group relative ${
        active 
          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`}>{icon}</span>
      <span className="font-black text-[10px] uppercase tracking-[0.2em]">{label}</span>
      {active && (
        <div className="absolute right-6 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_12px_#3b82f6]"></div>
      )}
    </button>
  );
}
