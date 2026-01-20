
import React, { useState, useEffect } from 'react';
import { Invoice, Account, InvoiceStatus } from '../types';
import { ApiService } from '../services/api';

interface Props {
  invoices: Invoice[];
  accounts: Account[];
  onSendInvoice: (id: string) => Promise<void>;
  onMarkPaid: (id: string) => void;
}

const InvoicesView: React.FC<Props> = ({ invoices, accounts, onSendInvoice, onMarkPaid }) => {
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    ApiService.getSettings().then(setSettings).catch(console.error);
  }, []);

  const filtered = invoices.filter(inv => filter === 'ALL' || inv.status === filter);
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || null;
  const selectedAccount = selectedInvoice ? accounts.find(a => a.id === selectedInvoice.accountId) : null;

  const handleSendEmail = async (id: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await onSendInvoice(id);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {(['ALL', InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-xl">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} Invoices</span>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Master List */}
        <div className={`flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin transition-all duration-300 ${selectedInvoiceId ? 'hidden lg:block lg:w-80 flex-none' : 'w-full'}`}>
          {filtered.length === 0 ? (
            <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400">
              <p className="font-medium">No records found for this view.</p>
            </div>
          ) : (
            filtered.map(inv => {
              const acc = accounts.find(a => a.id === inv.accountId);
              const isActive = selectedInvoiceId === inv.id;
              
              return (
                <div 
                  key={inv.id} 
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isActive ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-xl' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-slate-900 font-mono text-xs">{inv.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-800 truncate">{acc?.name}</div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{inv.date}</div>
                    <div className="text-lg font-black text-slate-900">${inv.amount.toFixed(2)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Pane */}
        {selectedInvoiceId && selectedInvoice ? (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 lg:flex-1 bg-white lg:rounded-3xl border border-slate-200 shadow-2xl lg:shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-right-12 duration-500">
            {/* Detail Pane Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button 
                onClick={() => setSelectedInvoiceId(null)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-full flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                <span className="font-black text-xs uppercase tracking-widest">Close</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${selectedInvoice.status === InvoiceStatus.PAID ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Ledger Detail</span>
              </div>

              <button 
                onClick={() => setSelectedInvoiceId(null)}
                className="hidden lg:block p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Invoice Document Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin bg-slate-50/20">
              <div className="max-w-2xl mx-auto space-y-10 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-100">
                      {settings?.station_name?.[0] || 'R'}
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{settings?.station_name || 'Ruthton Express'}</h1>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">House Charge Statement</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter -mt-2">INVOICE</h2>
                    <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-mono font-black mt-4">
                      {selectedInvoice.id}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill To Customer</h4>
                    <div className="space-y-1">
                      <p className="text-base font-black text-slate-900">{selectedAccount?.name}</p>
                      <p className="text-slate-500 text-sm">{selectedAccount?.email}</p>
                      <p className="text-slate-400 text-xs font-mono">{selectedAccount?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billing Cycle</h4>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-bold uppercase">Issued: {selectedInvoice.date}</p>
                      <p className="text-sm text-red-600 font-black uppercase">Due: {selectedInvoice.dueDate}</p>
                      <div className="pt-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          selectedInvoice.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                          selectedInvoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Inventory & Service Charges</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-5 py-4">Item Detail</th>
                          <th className="px-5 py-4 text-center">Qty</th>
                          <th className="px-5 py-4 text-right">Rate</th>
                          <th className="px-5 py-4 text-right">Ext. Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-5 font-bold text-slate-800 text-xs">{item.description}</td>
                            <td className="px-5 py-5 text-center text-slate-500 text-xs font-mono">{item.quantity}</td>
                            <td className="px-5 py-5 text-right text-slate-400 text-xs font-mono">${item.price.toFixed(2)}</td>
                            <td className="px-5 py-5 text-right font-black text-slate-900 text-xs">${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white font-black">
                        <tr>
                          <td colSpan={3} className="px-5 py-6 text-right text-[10px] uppercase tracking-widest text-slate-400">Net Balance Payable</td>
                          <td className="px-5 py-6 text-right text-2xl tracking-tighter">
                            ${selectedInvoice.amount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Pane Sticky Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-100 flex flex-wrap gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              {selectedInvoice.status !== InvoiceStatus.PAID && (
                <button 
                  onClick={() => onMarkPaid(selectedInvoice.id)}
                  className="flex-1 min-w-[160px] py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center space-x-3 shadow-xl shadow-emerald-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Mark as Paid</span>
                </button>
              )}
              <button 
                onClick={() => handleSendEmail(selectedInvoice.id)}
                disabled={isSending}
                className={`flex-1 min-w-[160px] py-4 rounded-2xl font-black transition-all flex items-center justify-center space-x-3 ${
                  selectedInvoice.emailSent ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'
                }`}
              >
                {isSending ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span>{selectedInvoice.emailSent ? 'Email Resent' : 'Send Statement'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Record Explorer</h3>
              <p className="text-sm font-medium leading-relaxed">Select a statement from the left panel to inspect detailed transaction lines, account status, and payment logs.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesView;
