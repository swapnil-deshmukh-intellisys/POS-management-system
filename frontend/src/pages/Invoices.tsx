import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, RefreshCw, Search, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Invoices: React.FC = () => {
  const auth = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [offlineInvoices, setOfflineInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const backendOrders = await auth.apiRequest('/orders');
      setOrders(backendOrders);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setOfflineInvoices(JSON.parse(localStorage.getItem('offlineInvoices') || '[]'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const invoices = useMemo(() => {
    const recentInvoices = JSON.parse(localStorage.getItem('recentInvoices') || '[]');
    const merged = [...offlineInvoices, ...orders, ...recentInvoices];
    const unique = new Map<string, any>();
    merged.forEach((invoice) => {
      unique.set(invoice.invoiceNumber || invoice.id, invoice);
    });
    return Array.from(unique.values())
      .filter((invoice) => {
        const haystack = `${invoice.invoiceNumber || ''} ${invoice.customer?.name || ''} ${invoice.status || ''}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orders, offlineInvoices, search]);

  const formatPrice = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const buildWhatsAppUrl = (invoice: any) => {
    const itemLines = (invoice.items || [])
      .slice(0, 6)
      .map((item: any) => `${item.product?.name || 'Item'} x ${item.quantity} = ${formatPrice(item.total || item.unitPrice * item.quantity)}`)
      .join('\n');
    const message = [
      `Invoice ${invoice.invoiceNumber}`,
      `Customer: ${invoice.customer?.name || 'Walk-in Customer'}`,
      itemLines,
      `Total: ${formatPrice(invoice.totalPayable)}`,
      `Status: ${invoice.status || 'COMPLETED'}`,
    ].filter(Boolean).join('\n');
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6 select-none font-['Trebuchet_MS']">
      <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Backend invoices and offline bills saved on this device.</p>
        </div>
        <button
          type="button"
          onClick={loadInvoices}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, customer, status..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                <th className="px-4 py-4 text-left">Invoice</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-right">Items</th>
                <th className="px-4 py-4 text-right">Discount</th>
                <th className="px-4 py-4 text-right">Total</th>
                <th className="px-4 py-4 text-left">Created</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-bold">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.invoiceNumber || invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 text-left font-extrabold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {invoice.offline ? <WifiOff className="h-4 w-4 text-amber-500" /> : null}
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left font-bold text-black dark:text-white">{invoice.customer?.name || 'Walk-in Customer'}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        invoice.status === 'PENDING_SYNC'
                          ? 'bg-amber-50 text-amber-700'
                          : invoice.status === 'DRAFT'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {invoice.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">{invoice.items?.length || 0}</td>
                    <td className="px-4 py-4 text-right text-rose-600 dark:text-rose-400 font-bold">{formatPrice(invoice.discount)}</td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">{formatPrice(invoice.totalPayable)}</td>
                    <td className="px-4 py-4 text-left">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-4 text-center">
                      <a
                        href={buildWhatsAppUrl(invoice)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    </td>
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

export default Invoices;
