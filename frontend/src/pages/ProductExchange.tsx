import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export const ProductExchange: React.FC = () => {
  const auth = useAuth();
  
  // Exchange form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDetails, setInvoiceDetails] = useState<any | null>(null);
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Selected Original Product
  const [selectedOriginalId, setSelectedOriginalId] = useState('');
  const [exchangeQuantity, setExchangeQuantity] = useState(1);

  // Replacement Product search/selection
  const [products, setProducts] = useState<any[]>([]);
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [replacementQuantity, setReplacementQuantity] = useState(1);
  const [reason, setReason] = useState('Damaged Product');

  // Submit States
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // History List
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Initial products lookup
  const loadInitialData = async () => {
    try {
      const dbProducts = await auth.apiRequest('/products');
      setProducts(dbProducts || []);

      setLoadingHistory(true);
      const hist = await auth.apiRequest('/exchange/history');
      setExchanges(hist || []);
    } catch (e) {
      console.error('Failed to load initial data', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleInvoiceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;

    setSearchingInvoice(true);
    setSearchError('');
    setInvoiceDetails(null);

    try {
      // Fetch invoice using id or invoiceNumber
      const data = await auth.apiRequest(`/billing/invoice/${invoiceNumber.trim()}`);
      if (data && data.order) {
        setInvoiceDetails(data.order);
      } else {
        setSearchError('Invoice not found');
      }
    } catch (err) {
      setSearchError('Invoice not found or database offline');
    } finally {
      setSearchingInvoice(false);
    }
  };

  const handleExecuteExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceDetails || !selectedOriginalId || !selectedReplacementId) {
      setErrorMsg('Please select original product, replacement product, and reasons.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      invoiceNumber: invoiceDetails.invoiceNumber,
      originalProductId: selectedOriginalId,
      originalQuantity: Number(exchangeQuantity),
      replacementProductId: selectedReplacementId,
      replacementQuantity: Number(replacementQuantity),
      reason
    };

    try {
      const res = await auth.apiRequest('/exchange', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.id) {
        setSuccessMsg('Product exchanged successfully! Inventory adjusted.');
        setInvoiceNumber('');
        setInvoiceDetails(null);
        setSelectedOriginalId('');
        setSelectedReplacementId('');
        setExchangeQuantity(1);
        setReplacementQuantity(1);
        
        // Reload history log
        const hist = await auth.apiRequest('/exchange/history');
        setExchanges(hist || []);
      } else {
        setErrorMsg('Failed to process exchange. Verify stock status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process exchange. Ensure replacement product has sufficient stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#111827] text-left p-6">
      
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-[#000000] tracking-tight flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin-slow" />
          Product Exchange Console
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Adjust inventory, record swap transactions, and log customer return swaps</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SWAP CREATOR MODULE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-black text-[#000000] uppercase tracking-wider">Configure Return Exchange</h3>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-650" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-650" />
                {errorMsg}
              </div>
            )}

            {/* Step 1: Lookup Invoice */}
            <form onSubmit={handleInvoiceSearch} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Enter Invoice Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. INV-2026-XXXX..."
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 text-[#111827]"
                />
                <button
                  type="submit"
                  disabled={searchingInvoice}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 rounded-xl transition text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {searchingInvoice ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchError && <span className="text-[10px] text-rose-650 font-bold block">{searchError}</span>}
            </form>

            {/* Step 2: Swap items on details availability */}
            {invoiceDetails && (
              <form onSubmit={handleExecuteExchange} className="space-y-4 pt-4 border-t border-slate-100 font-bold text-xs text-[#111827]">
                
                {/* Original Items list inside searched invoice */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-450 uppercase tracking-wider block">2. Select Original Purchased Product</label>
                  <select
                    value={selectedOriginalId}
                    onChange={(e) => setSelectedOriginalId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-[#111827] focus:outline-none"
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {(invoiceDetails.items || []).map((item: any) => (
                      <option key={item.productId} value={item.productId}>
                        {item.product?.name || 'Product'} (Qty purchased: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOriginalId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Exchange Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={exchangeQuantity}
                        onChange={(e) => setExchangeQuantity(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-[#111827]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Reason for Exchange</label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-[#111827]"
                      >
                        <option value="Damaged Product">Damaged Product</option>
                        <option value="Incorrect Size / Fit">Incorrect Size / Fit</option>
                        <option value="Customer Preference swap">Customer Preference swap</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3: Choose Replacement */}
                {selectedOriginalId && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-450 uppercase tracking-wider block">3. Choose Replacement Product</label>
                      <select
                        value={selectedReplacementId}
                        onChange={(e) => setSelectedReplacementId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-[#111827] focus:outline-none"
                        required
                      >
                        <option value="">-- Choose Replacement --</option>
                        {products
                          .filter((p) => p.id !== selectedOriginalId)
                          .map((p) => {
                            const stock = p.quantity ?? (p.stocks && p.stocks[0] ? p.stocks[0].quantity : 0);
                            return (
                              <option key={p.id} value={p.id} disabled={stock <= 0}>
                                {p.name} (Price: ₹{p.sellingPrice} | Stock: {stock} units)
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {selectedReplacementId && (
                      <div>
                        <label className="text-[10px] text-slate-450 uppercase tracking-wider block mb-1">Replacement Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={replacementQuantity}
                          onChange={(e) => setReplacementQuantity(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-[#111827]"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedOriginalId || !selectedReplacementId}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition cursor-pointer text-center uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {submitting ? 'Executing Swap Adjustments...' : 'Confirm Exchange Swap'}
                </button>

              </form>
            )}

            {!invoiceDetails && (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Find invoice above to configure exchanges.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EXCHANGE POLICIES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-xs font-bold text-slate-700 space-y-3">
            <h3 className="text-sm font-black text-[#000000] uppercase tracking-wider flex items-center gap-1">
              <Info className="w-4.5 h-4.5 text-slate-450" />
              Retail Exchange Guidelines
            </h3>
            <div className="space-y-2 leading-relaxed">
              <p className="text-rose-700 font-extrabold bg-rose-50 border border-rose-100 p-2 rounded-xl">
                ⚠️ Refund Warning: Retail policy strictly prohibits Cash or Bank Refunds/Returns. Damaged or size incorrect items are replacement-swap only.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Inventory balances auto-increment returned products.</li>
                <li>Replacement stock values decrement on completion.</li>
                <li>Exchange activities audit cashier identities dynamically.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* EXCHANGE LOGS LEDGER */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#000000] uppercase tracking-wider">Exchanges audit history</h3>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-xs font-semibold text-[#111827] text-left">
            <thead>
              <tr className="bg-slate-50 text-[#111827] border-b border-slate-150 uppercase text-[9px] tracking-wider font-black">
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Returned Product</th>
                <th className="px-4 py-3">Replacement Issued</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-center">Handled By</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingHistory ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Loading audit records...
                  </td>
                </tr>
              ) : exchanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    No exchanges logged in the system.
                  </td>
                </tr>
              ) : (
                exchanges.map((ex) => {
                  const item = ex.items?.[0] || {};
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3.5 font-black text-[#000000]">{ex.invoiceNumber}</td>
                      <td className="px-4 py-3.5 text-slate-500">{new Date(ex.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#111827]">{item.originalProduct?.name || 'Product'}</div>
                        <span className="text-[9px] text-slate-400 block font-black">Qty Returned: {item.originalQuantity}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-emerald-850">{item.replacementProduct?.name || 'Product'}</div>
                        <span className="text-[9px] text-emerald-600 block font-black">Qty Issued: {item.replacementQuantity}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{ex.customer?.name || 'Walk-in Customer'}</td>
                      <td className="px-4 py-3.5 text-center text-slate-500 font-bold">{ex.handledBy?.name || 'Admin'}</td>
                      <td className="px-4 py-3.5 text-slate-550 italic">{ex.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ProductExchange;
