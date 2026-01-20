
import React, { useState } from 'react';
import { Account, TransactionType, Transaction } from '../types';

interface Props {
  accounts: Account[];
  onAddAccount: (acc: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>) => void;
  onAddTransaction: (trans: any) => void;
}

const AccountsList: React.FC<Props> = ({ accounts, onAddAccount, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [search, setSearch] = useState('');

  const [newAcc, setNewAcc] = useState({ name: '', email: '', phone: '', creditLimit: 1000 });
  const [newTrans, setNewTrans] = useState({ accountId: '', amount: 0, type: TransactionType.STORE, description: '' });

  const filtered = accounts.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAccount = accounts.find(a => a.id === selectedAccId);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search accounts by name or email..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>Add New Account</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50">
                <th className="px-6 py-4">Account Holder</th>
                <th className="px-6 py-4">Contact Detail</th>
                <th className="px-6 py-4">Credit Utilization</th>
                <th className="px-6 py-4">Current Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="font-bold text-slate-800">{acc.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">ID: {acc.id}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-medium text-slate-600">{acc.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{acc.phone}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[100px]">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${acc.currentBalance > acc.creditLimit * 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((acc.currentBalance / acc.creditLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{Math.round((acc.currentBalance / acc.creditLimit) * 100)}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Limit: ${acc.creditLimit.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`text-lg font-black tracking-tight ${acc.currentBalance > acc.creditLimit * 0.9 ? 'text-red-600' : 'text-slate-900'}`}>
                      ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedAccId(acc.id); setIsStatementOpen(true); }}
                      className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors tracking-widest px-3 py-2"
                    >
                      Statement
                    </button>
                    <button 
                      onClick={() => { setSelectedAccId(acc.id); setIsTransModalOpen(true); }}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm shadow-blue-100"
                    >
                      Log Charge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <p>No house accounts found. Start by creating a new account profile.</p>
          </div>
        )}
      </div>

      {/* New Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-500 mb-8">Set up a new house charge credit profile.</p>
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              onAddAccount(newAcc);
              setIsModalOpen(false);
            }}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Legal Name / Business</label>
                <input required type="text" className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email</label>
                  <input required type="email" className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAcc.email} onChange={e => setNewAcc({...newAcc, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Phone</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAcc.phone} onChange={e => setNewAcc({...newAcc, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Monthly Credit Limit ($)</label>
                <input type="number" className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={newAcc.creditLimit} onChange={e => setNewAcc({...newAcc, creditLimit: Number(e.target.value)})} />
              </div>
              <div className="flex space-x-3 mt-8 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3.5 rounded-2xl border font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Transaction Modal */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Manual Charge</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">Customer: <span className="text-blue-600 font-bold">{selectedAccount?.name}</span></p>
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              onAddTransaction({
                accountId: selectedAccId,
                amount: newTrans.amount,
                type: newTrans.type,
                date: new Date().toISOString().split('T')[0],
                description: newTrans.description || 'Misc Store Purchase'
              });
              setIsTransModalOpen(false);
              setNewTrans({ ...newTrans, amount: 0, description: '' });
            }}>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Charge Category</label>
                <select className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as TransactionType})}>
                  <option value={TransactionType.FUEL}>Fuel (Gas/Diesel)</option>
                  <option value={TransactionType.STORE}>General Store Inventory</option>
                  <option value={TransactionType.PAYMENT}>Account Payment (Credit)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Amount ($)</label>
                <input required type="number" step="0.01" className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-2xl font-black text-blue-600 outline-none" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Notes / Description</label>
                <input type="text" placeholder="e.g. 50 Gal Diesel #2" className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
              </div>
              <div className="flex space-x-3 mt-8 pt-4">
                <button type="button" onClick={() => setIsTransModalOpen(false)} className="flex-1 px-4 py-3.5 rounded-2xl border font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl transition-all active:scale-95">Post Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Preview Modal */}
      {isStatementOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-0 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-black text-slate-900">Activity Statement</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time ledger view</p>
               </div>
               <button onClick={() => setIsStatementOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
            </div>
            
            <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-thin">
               <div className="flex justify-between text-sm">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Holder</h4>
                    <p className="font-bold text-slate-800">{selectedAccount.name}</p>
                    <p className="text-slate-500">{selectedAccount.email}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</h4>
                    <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Active Charging</div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Limit</p>
                    <p className="text-lg font-black text-slate-800">${selectedAccount.creditLimit.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Used Balance</p>
                    <p className="text-lg font-black text-blue-600">${selectedAccount.currentBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Credit</p>
                    <p className="text-lg font-black text-emerald-600">${(selectedAccount.creditLimit - selectedAccount.currentBalance).toLocaleString()}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Activity</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 font-medium">
                          <tr className="bg-white">
                             <td className="px-4 py-4 text-slate-400">Ledger Entry</td>
                             <td className="px-4 py-4 text-slate-600 italic">No detailed transaction records linked in fallback mode. See invoice history for details.</td>
                             <td className="px-4 py-4 text-right font-black text-slate-900">${selectedAccount.currentBalance.toFixed(2)}</td>
                          </tr>
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
               <button onClick={() => window.print()} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  <span>Print Summary</span>
               </button>
               <button onClick={() => setIsStatementOpen(false)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsList;
