
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
      addNotification("Error: Backend is unreachable.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const addNotification = (msg: string) => {
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
      addNotification(`Account "${acc.name}" saved successfully.`);
    } catch (err) {
      addNotification("Error: Could not save house account.");
    }
  };

  const handleAddTransaction = async (trans: Omit<Transaction, 'id'>) => {
    const newTrans: Transaction = { ...trans, id: `TX-${Date.now()}` };
    try {
      await ApiService.saveTransaction(newTrans);
      await loadData();
      addNotification(`Transaction recorded.`);
    } catch (err) {
      addNotification("Error: Transaction could not be processed.");
    }
  };

  const handleAddInvoice = async (newInv: Invoice) => {
    try {
      await ApiService.saveInvoice(newInv);
      await loadData();
      addNotification(`Invoice ${newInv.id} generated.`);
      setCurrentView('invoices');
    } catch (err) {
      addNotification("Error: Invoice generation failed.");
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await ApiService.markInvoiceEmailSent(invoiceId);
      await loadData();
      const inv = invoices.find(i => i.id === invoiceId);
      const acc = accounts.find(a => a.id === inv?.accountId);
      addNotification(`Invoice ${invoiceId} sent to ${acc?.email}`);
    } catch (err) {
      addNotification("Error: Email delivery failed.");
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await ApiService.updateInvoiceStatus(invoiceId, InvoiceStatus.PAID);
      await loadData();
      addNotification(`Invoice ${invoiceId} marked as paid.`);
    } catch (err) {
      addNotification("Error: Status update failed.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
          <p className="text-slate-500 font-medium">Synchronizing with live server...</p>
        </div>
      );
    }

    if (connectionError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
           <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
           </div>
           <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Backend Connection Failed</h2>
           <p className="text-slate-500 max-w-md mb-8">The application cannot communicate with the live server. Please check your network or server configuration.</p>
           <div className="bg-slate-100 p-4 rounded-xl font-mono text-xs text-slate-600 mb-8 border border-slate-200">
             Error: {connectionError}
           </div>
           <div className="flex space-x-4">
             <button onClick={loadData} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Try Again</button>
             <button onClick={() => setCurrentView('settings')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all">Check Settings</button>
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

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-8 flex items-center space-x-4 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20">
            F
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tighter">FuelCharge<span className="text-blue-600">Pro</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<ICONS.Dashboard />} label="Dashboard Overview" />
          <NavItem active={currentView === 'accounts'} onClick={() => setCurrentView('accounts')} icon={<ICONS.Accounts />} label="Manage Accounts" />
          <NavItem active={currentView === 'invoices'} onClick={() => setCurrentView('invoices')} icon={<ICONS.Invoices />} label="Billing Ledger" />
          <NavItem active={currentView === 'invoice-generator'} onClick={() => setCurrentView('invoice-generator')} icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          } label="Generate Invoice" />
          <NavItem active={currentView === 'scanner'} onClick={() => setCurrentView('scanner')} icon={<ICONS.Scanner />} label="AI Smart Scan" />
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-2">
          <NavItem active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<ICONS.Settings />} label="Control Panel" />
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-red-50 hover:text-red-600 group font-bold text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <h1 className="text-xl font-black text-slate-900 capitalize tracking-tighter">{currentView.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center space-x-6">
             <div className="relative">
               <button className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                 {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white"></span>}
               </button>
             </div>
             
             <div className="flex items-center space-x-4 pl-6 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-black text-slate-900 leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Session</p>
               </div>
               {user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="h-10 w-10 rounded-2xl ring-4 ring-slate-100 object-cover shadow-lg" />
               ) : (
                 <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200 ring-4 ring-slate-100">
                    {getInitials(user.displayName || user.email)}
                 </div>
               )}
             </div>
          </div>
        </header>

        <div className="p-10 flex-1">
          {renderView()}
        </div>

        {/* Notifications Toast */}
        <div className="fixed bottom-10 right-10 z-50 flex flex-col space-y-3">
          {notifications.map((note, idx) => (
            <div key={idx} className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-12 flex items-center space-x-4 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <span className="text-sm font-black tracking-tight">{note}</span>
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
      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`}>{icon}</span>
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#3b82f6]"></div>}
    </button>
  );
}
