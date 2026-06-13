import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';


export const PaymentsPage: React.FC = () => {
  const auth = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = await auth.apiRequest('/billing/history'); // fetch orders and extract payments
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setSearch(e.detail || '');
    };
    setSearch(sessionStorage.getItem('globalSearchQuery') || '');
    window.addEventListener('global-search', handleGlobalSearch);
    return () => {
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  const filteredPayments = payments.filter((p) =>
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments Log</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Real-time payment gateway verification, split details, and cash register collections.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
            ₹
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collections</span>
            <span className="text-lg font-black text-slate-800">
              ₹{filteredPayments.reduce((sum, p) => sum + p.totalPayable, 0)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
            UPI
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">UPI Receipts</span>
            <span className="text-lg font-black text-slate-800">
              ₹{filteredPayments.filter(p => p.paymentMethod === 'UPI').reduce((sum, p) => sum + p.totalPayable, 0)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center font-black">
            CASH
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash In Drawer</span>
            <span className="text-lg font-black text-slate-800">
              ₹{filteredPayments.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.totalPayable, 0)}
            </span>
          </div>
        </div>
      </div>


      {/* Table list */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                <th className="px-4 py-4 text-left">Invoice No</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">Payment Mode</th>
                <th className="px-4 py-4 text-center">Gateway Status</th>
                <th className="px-4 py-4 text-right">Amount</th>
                <th className="px-4 py-4 text-left">Transaction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold">Loading payment ledger...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold">No payment logs found.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-black dark:text-white">{p.invoiceNumber}</td>
                    <td className="px-4 py-4 font-bold text-black dark:text-white">{p.customer?.name || 'Walk-in Customer'}</td>
                    <td className="px-4 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded font-black text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase">
                        SUCCESS
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">₹{p.totalPayable}</td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
