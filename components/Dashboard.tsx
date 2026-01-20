
import React from 'react';
import { Account, Invoice, InvoiceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  accounts: Account[];
  invoices: Invoice[];
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<Props> = ({ accounts, invoices, onNavigate }) => {
  const totalReceivables = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const overdueInvoices = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE || (inv.status === InvoiceStatus.UNPAID && new Date(inv.dueDate) < new Date()));
  const overdueAmount = overdueInvoices.reduce((acc, curr) => acc + curr.amount, 0);

  // Alert Thresholds
  const BALANCE_THRESHOLD = 500;
  const COUNT_THRESHOLD = 3;
  const showRiskAlert = overdueAmount > BALANCE_THRESHOLD || overdueInvoices.length > COUNT_THRESHOLD;

  // Aging Calculation
  const getAgingData = () => {
    const today = new Date();
    let cat1 = 0; // 0-30 days
    let cat2 = 0; // 31-60 days
    let cat3 = 0; // 61+ days

    overdueInvoices.forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) cat1 += inv.amount;
      else if (diffDays <= 60) cat2 += inv.amount;
      else cat3 += inv.amount;
    });

    return [
      { category: '0-30 Days', amount: cat1, color: '#3b82f6' },
      { category: '31-60 Days', amount: cat2, color: '#f59e0b' },
      { category: '61+ Days', amount: cat3, color: '#ef4444' },
    ];
  };

  const agingData = getAgingData();

  // Dynamic Chart Data Processing
  const getChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: Record<string, number> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = months[d.getMonth()];
      dataMap[label] = 0;
    }

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const label = months[d.getMonth()];
      if (dataMap.hasOwnProperty(label)) {
        dataMap[label] += inv.amount;
      }
    });

    return Object.entries(dataMap).map(([month, revenue]) => ({ month, revenue }));
  };

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Risk Alert Banner */}
      {showRiskAlert && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-red-900">High Collection Risk Detected</h3>
              <p className="text-sm text-red-700">
                Overdue items have exceeded your safety threshold: 
                <span className="font-bold ml-1">${overdueAmount.toFixed(2)}</span> across 
                <span className="font-bold ml-1">{overdueInvoices.length} invoices</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('invoices')}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
          >
            Take Action
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Receivables" 
          value={`$${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          trend="+Calculated" 
          positive={true}
          subtitle="Total balance across all accounts"
        />
        <MetricCard 
          title="Overdue Balance" 
          value={`$${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          trend={`${overdueInvoices.length} invoices`}
          positive={false}
          subtitle="Action required"
          variant="danger"
        />
        <MetricCard 
          title="Active Accounts" 
          value={accounts.length.toString()} 
          trend="Live"
          positive={true}
          subtitle="Managed customers"
        />
        <MetricCard 
          title="Avg. Days to Pay" 
          value="14" 
          trend="-1 day"
          positive={true}
          subtitle="Stable performance"
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 tracking-tight">Real-time Revenue Trend</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Invoice Aging</h3>
          <div className="flex-1 space-y-6">
            {agingData.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-500">{item.category}</span>
                  <span className="text-slate-900 font-bold">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${overdueAmount > 0 ? (item.amount / overdueAmount) * 100 : 0}%`,
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {overdueAmount === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                No overdue balances
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={() => onNavigate('invoices')} className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
               Review Overdue Invoices
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Invoices</h3>
            <button onClick={() => onNavigate('invoices')} className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-medium text-slate-700">{inv.id}</td>
                    <td className="px-6 py-4 text-slate-600">{getAccountName(inv.accountId)}</td>
                    <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">${inv.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionBtn onClick={() => onNavigate('scanner')} label="Scan Receipt" color="bg-blue-600" />
            <QuickActionBtn onClick={() => onNavigate('invoice-generator')} label="Manual Invoice" color="bg-indigo-600" />
            <QuickActionBtn onClick={() => onNavigate('accounts')} label="New Account" color="bg-emerald-600" />
            <QuickActionBtn onClick={() => onNavigate('invoices')} label="Invoices" color="bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ title, value, trend, positive, subtitle, variant = 'default' }: any) {
  const colors = {
    default: 'border-slate-200',
    danger: 'border-red-200 bg-red-50/30',
    success: 'border-emerald-200 bg-emerald-50/30',
  };

  return (
    <div className={`p-6 rounded-2xl border bg-white shadow-sm transition-transform hover:scale-[1.02] duration-300 ${colors[variant as keyof typeof colors]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${positive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">{value}</div>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

function QuickActionBtn({ onClick, label, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white px-4 py-4 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-blue-100/20`}
    >
      <span>{label}</span>
    </button>
  );
}

export default Dashboard;
