import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Printer } from 'lucide-react';

export const GenerateBill: React.FC = () => {
  const auth = useAuth();

  const [tables, setTables] = useState<any[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);
  const [table, setTable] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [generatedInvoice, setGeneratedInvoice] = useState<any | null>(null);

  const loadTables = async () => {
    try {
      const tablesList = await auth.apiRequest(`/restaurant/tables`);
      // Sort tables
      const sortedTables = (tablesList || []).sort((a: any, b: any) => {
        const numA = parseInt(a.tableNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.tableNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setTables(sortedTables);
    } catch (err) {
      console.warn('Failed to load restaurant tables', err);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const selectBillingTable = async (t: any) => {
    setTableId(t.id);
    setTable(t);
    setCart([]);
    if (t.activeOrderId) {
      try {
        const activeOrder = await auth.apiRequest(`/restaurant/orders/${t.activeOrderId}`);
        if (activeOrder && activeOrder.items) {
          const loadedCart = activeOrder.items.map((it: any) => ({
            id: it.menuItem.id,
            name: it.menuItem.name,
            price: it.menuItem.price || it.unitPrice,
            quantity: it.quantity
          }));
          setCart(loadedCart);
        }
      } catch (e) {
        console.warn('Failed to load active orders', e);
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = subtotal * 0.05; // 5% GST
  const serviceChargeAmount = subtotal * 0.05; // 5% Service Charge
  const grandTotal = subtotal + taxAmount + serviceChargeAmount;

  const changeReturned = Math.max(0, (parseFloat(cashReceived) || 0) - grandTotal);

  const handleSettleBill = async () => {
    if (!tableId) return;
    try {
      setIsProcessing(true);
      const payload = {
        tableId,
        paymentMethod: selectedPaymentMethod,
        discount: 0,
        serviceCharge: serviceChargeAmount,
        tax: taxAmount,
        customerId: null,
        cashierName: 'Admin',
        customerMobile: '0000000000'
      };

      const res = await auth.apiRequest('/restaurant/tables/settle', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setGeneratedInvoice(res.invoice);
      setTableId(null);
      setTable(null);
      setCart([]);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'Failed to settle table bill');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-black antialiased p-6">
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-4 shadow-xl max-w-xs w-full">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-black">Settling table bill...</p>
          </div>
        </div>
      )}

      {/* Invoice Success View */}
      {generatedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col space-y-4 text-left my-8">
            <div className="text-center space-y-2 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider">✓ Settle Success</h2>
              <p className="text-xs text-slate-500 font-semibold">Table Bill Settled Successfully</p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 rounded-xl p-4 text-xs font-semibold text-slate-700 space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span>Invoice Number:</span>
                <span className="text-black font-extrabold">{generatedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 font-extrabold">₹{generatedInvoice.totalPayable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="text-slate-800 font-extrabold uppercase">{generatedInvoice.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-2 text-xs font-bold pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-black py-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setGeneratedInvoice(null)}
                className="flex-grow bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-center cursor-pointer uppercase tracking-wider"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {tableId === null ? (
        /* TABLE SELECTION GRID (Only occupied tables with running bills) */
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex-grow flex flex-col max-w-4xl mx-auto w-full text-left">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-black uppercase tracking-wider">GENERATE BILL</h1>
            <p className="text-xs text-slate-400 font-normal mt-0.5">Select a table with running orders to settle the bill.</p>
          </div>

          <div className="overflow-y-auto pr-1 flex-grow">
            {tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'CLEANING').length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-24">No tables currently occupied with running orders.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'CLEANING').map(t => {
                  const totalAmount = t.kitchenOrders?.[0]?.totalAmount || 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectBillingTable(t)}
                      className="p-5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition text-center cursor-pointer shadow-sm flex flex-col justify-between items-center space-y-2 min-h-[90px]"
                    >
                      <span className="text-lg font-bold text-rose-800">{t.tableNumber.replace('Table ', 'T')}</span>
                      <span className="text-[10px] font-bold text-emerald-600">₹{totalAmount.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BILL SETTLEMENT SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow max-w-6xl mx-auto w-full text-left">
          {/* Left Column: Running Order Items List */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-black uppercase tracking-wider">TABLE T{table?.tableNumber?.replace('Table ', '')}</h2>
                <p className="text-xs text-slate-450 mt-0.5">Summary of ordered food and beverages</p>
              </div>
              <button
                onClick={() => {
                  setTableId(null);
                  setTable(null);
                  setCart([]);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-black text-xs font-semibold py-1.5 px-3 rounded-lg transition"
              >
                ← Back
              </button>
            </div>

            {/* Items Table */}
            <div className="flex-grow overflow-y-auto pr-1">
              <table className="w-full text-xs text-left text-black">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-bold">{item.name}</td>
                      <td className="py-3 px-3 text-center font-extrabold">{item.quantity}</td>
                      <td className="py-3 px-3 text-right">₹{item.price.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-2.5 text-xs text-slate-600 font-semibold shrink-0">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-black">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%):</span>
                <span className="text-black">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%):</span>
                <span className="text-black">₹{serviceChargeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-black border-t border-dashed border-slate-200 pt-3">
                <span>Grand Total:</span>
                <span className="text-lg font-black text-emerald-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Payments Method selection & Settle */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider border-b border-slate-100 pb-3">Settle & Payment</h3>

            {/* Method selection */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold font-semibold">
              {[
                { id: 'UPI', label: 'UPI', icon: '📱' },
                { id: 'CASH', label: 'Cash', icon: '💵' },
                { id: 'CARD', label: 'Card', icon: '💳' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedPaymentMethod(method.id as any);
                    setCashReceived('');
                  }}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedPaymentMethod === method.id
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm border-2'
                      : 'border-slate-200 bg-white text-black hover:border-slate-350'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-method Panel */}
            {selectedPaymentMethod === 'UPI' && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center space-y-3.5 text-center animate-[fadeIn_0.15s_ease-out]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automatic Payment QR Code</span>
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=merchant@upi&pn=Bistro&am=${grandTotal.toFixed(2)}&cu=INR`
                    )}`}
                    alt="UPI Payment QR"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-normal max-w-xs">
                  Scan QR code with any UPI app (GPay, PhonePe, Paytm) to receive ₹{grandTotal.toFixed(2)} directly.
                </p>
              </div>
            )}

            {selectedPaymentMethod === 'CASH' && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3.5 animate-[fadeIn_0.15s_ease-out]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Received Amount</label>
                    <input
                      type="text"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Change Return</span>
                    <span className="text-lg font-black text-emerald-700 block pt-1">₹{changeReturned.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'CARD' && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3 animate-[fadeIn_0.15s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  💳
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black">Swipe Card Settlement</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-semibold">
                    Swipe or tap credit/debit card on terminal to settle ₹{grandTotal.toFixed(2)}.
                  </p>
                </div>
              </div>
            )}

            {/* Settle Action Button */}
            <button
              onClick={handleSettleBill}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl transition uppercase tracking-widest shadow-sm cursor-pointer text-center"
            >
              Confirm Settle & Pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateBill;
