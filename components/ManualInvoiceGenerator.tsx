
import React, { useState, useEffect } from 'react';
import { Account, Invoice, InvoiceStatus, LineItem } from '../types';

interface Props {
  accounts: Account[];
  onInvoiceCreated: (invoice: Invoice) => void;
  onCancel: () => void;
}

const ManualInvoiceGenerator: React.FC<Props> = ({ accounts, onInvoiceCreated, onCancel }) => {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, price: 0 }]);
  const [taxRate, setTaxRate] = useState(7.25);

  // Default due date to 15 days from now
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      alert("Please select a customer account.");
      return;
    }
    if (items.some(i => !i.description || i.price <= 0)) {
      alert("Please ensure all items have a description and price.");
      return;
    }

    const newInvoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      accountId: selectedAccountId,
      date: invoiceDate,
      dueDate: dueDate,
      amount: total,
      status: InvoiceStatus.UNPAID,
      items: items,
      emailSent: false
    };

    onInvoiceCreated(newInvoice);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">New Charge Invoice</h2>
            <p className="text-slate-400 text-sm mt-1">Manually build a statement for a house account</p>
          </div>
          <div className="text-right">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</span>
             <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase">Draft</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Account</label>
              <select 
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
              >
                <option value="">-- Select Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${acc.currentBalance.toFixed(2)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Invoice Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
              <span className="w-8 h-px bg-slate-200 mr-3"></span>
              Line Items
              <span className="flex-1 h-px bg-slate-200 ml-3"></span>
            </h3>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bulk Unleaded Delivery" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Qty</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Unit Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none"
                      value={item.price}
                      onChange={e => updateItem(index, 'price', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-32 hidden md:block">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Amount</label>
                    <div className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold border border-transparent">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2.5 text-slate-300 hover:text-red-500 transition-colors mb-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={addItem}
              className="mt-6 flex items-center space-x-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>Add Another Item</span>
            </button>
          </div>

          {/* Footer Totals */}
          <div className="flex flex-col md:flex-row justify-between items-start pt-8 border-t border-slate-100">
            <div className="max-w-xs text-slate-400 text-xs mb-6 md:mb-0">
              Notes: Payments are due within 15 days of the invoice date. Late fees of 1.5% may apply to overdue balances.
            </div>
            
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center">
                  Tax 
                  <input 
                    type="number" 
                    step="0.01" 
                    className="ml-2 w-16 px-1 py-0.5 border rounded text-[10px] font-bold" 
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                  />
                  %
                </span>
                <span className="font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Due</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-12">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl border font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save & Generate Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualInvoiceGenerator;
