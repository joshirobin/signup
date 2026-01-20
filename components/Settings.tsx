
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>({ status: 'checking...', database: 'checking...', url: '' });
  
  const [settings, setSettings] = useState({
    station_name: '',
    station_id: '',
    support_email: '',
    tax_rate: 7.25
  });

  useEffect(() => {
    loadSettings();
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    const health = await ApiService.checkHealth();
    setHealthStatus(health);
  };

  const loadSettings = async () => {
    try {
      const data = await ApiService.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await ApiService.updateSettings(settings);
      alert("Cloud preferences synchronized.");
    } catch (err) {
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cloud Console Handshake...</p>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      
      {/* Cloud Connectivity Status */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative">
           <div>
             <h3 className="text-white text-lg font-black tracking-tight">Cloud Persistence</h3>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Firebase Persistence Layer</p>
           </div>
           <button onClick={checkBackendHealth} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Refresh Link</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Service Node</div>
             <div className="flex items-center space-x-3">
               <div className={`w-3 h-3 rounded-full ${healthStatus.status === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}></div>
               <span className={`text-base font-black ${healthStatus.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                 {healthStatus.status.toUpperCase()}
               </span>
             </div>
          </div>
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint Target</div>
             <span className="text-white font-mono text-[10px] truncate block uppercase">{healthStatus.url}</span>
          </div>
        </div>

        {healthStatus.error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
             <code className="block text-xs text-red-300 font-mono break-all">{healthStatus.error}</code>
          </div>
        )}
      </div>

      {/* Business Profile */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Organization Profile</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Station / Entity Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-slate-800" 
                value={settings.station_name} 
                onChange={e => setSettings({...settings, station_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Internal Station ID</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm text-slate-500" 
                value={settings.station_id} 
                onChange={e => setSettings({...settings, station_id: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Support / Billing Contact</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                value={settings.support_email} 
                onChange={e => setSettings({...settings, support_email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sales Tax Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                value={settings.tax_rate} 
                onChange={e => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Synchronizing...' : 'Update Cloud Profile'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
