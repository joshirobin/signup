
import React, { useState, useRef } from 'react';
import { scanReceipt } from '../services/geminiService';
import { Account, TransactionType } from '../types';

interface Props {
  accounts: Account[];
  onTransactionCreated: (trans: any) => void;
}

const AIScanner: React.FC<Props> = ({ accounts, onTransactionCreated }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScannedData(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await scanReceipt(base64.split(',')[1]); // Remove prefix
      setScannedData(result);
    } catch (err) {
      alert("Error scanning receipt. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleConfirm = () => {
    if (!selectedAccountId) {
      alert("Please select an account first");
      return;
    }
    onTransactionCreated({
      accountId: selectedAccountId,
      amount: scannedData.totalAmount,
      type: scannedData.isFuelTransaction ? TransactionType.FUEL : TransactionType.STORE,
      date: scannedData.date || new Date().toISOString().split('T')[0],
      items: scannedData.items
    });
    setScannedData(null);
    setPreviewUrl(null);
    setSelectedAccountId('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Smart AI Scanner</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">Upload or take a photo of a receipt. Our AI will automatically extract items, quantities, and totals for house charge logging.</p>
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-xl disabled:opacity-50 transition-all active:scale-95"
        >
          {isScanning ? 'AI is analyzing...' : 'Upload Receipt Photo'}
        </button>
      </div>

      {(previewUrl || isScanning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview Image */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 px-2">Source Image</h3>
             {previewUrl ? (
               <img src={previewUrl} alt="Receipt Preview" className="w-full rounded-xl object-contain max-h-[500px]" />
             ) : (
               <div className="w-full h-96 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
                 <span className="text-slate-400 font-medium">Processing...</span>
               </div>
             )}
          </div>

          {/* Extracted Data */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6">AI Extraction Results</h3>
            
            {isScanning ? (
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
                <div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
              </div>
            ) : scannedData ? (
              <div className="space-y-6 flex-1 overflow-y-auto">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Account</label>
                   <select 
                     className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-blue-50/30 font-medium"
                     value={selectedAccountId}
                     onChange={e => setSelectedAccountId(e.target.value)}
                   >
                     <option value="">-- Assign to Customer --</option>
                     {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                   </select>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 font-medium">Detected Items</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${scannedData.isFuelTransaction ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {scannedData.isFuelTransaction ? 'Fuel Transaction' : 'Store Items'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {scannedData.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.quantity}x {item.description}</span>
                        <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center">
                      <span className="font-bold text-slate-800">Total Charged</span>
                      <span className="text-xl font-bold text-blue-600">${scannedData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-auto pt-6">
                  <button onClick={() => setScannedData(null)} className="flex-1 px-6 py-3 border rounded-xl font-bold text-slate-600">Discard</button>
                  <button onClick={handleConfirm} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Confirm & Log</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                Awaiting scan results...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScanner;
