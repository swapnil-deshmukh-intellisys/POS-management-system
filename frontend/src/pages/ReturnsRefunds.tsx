import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, RotateCcw, AlertCircle } from 'lucide-react';

export const ReturnsRefunds: React.FC = () => {
  const auth = useAuth();
  const [searchInvoiceNum, setSearchInvoiceNum] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Return values
  const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: number }>({});
  const [refundReason, setRefundReason] = useState('Customer Return');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'WALLET'>('CASH');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchInvoiceNum) return;
    setIsLoading(true);
    try {
      const allHistory = await auth.apiRequest('/billing/history');
      const invoice = allHistory.find(
        (o: any) => o.invoiceNumber.toLowerCase() === searchInvoiceNum.toLowerCase()
      );
      if (invoice) {
        setSelectedInvoice(invoice);
        // Initialize quantities to 0
        const initQuantities: { [key: string]: number } = {};
        invoice.items.forEach((item: any) => {
          initQuantities[item.productId] = 0;
        });
        setItemsToReturn(initQuantities);
      } else {
        alert('Invoice not found in system record');
        setSelectedInvoice(null);
      }
    } catch (err) {
      alert('Error searching for invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQtyChange = (productId: string, maxQty: number, val: number) => {
    const qty = Math.min(maxQty, Math.max(0, val));
    setItemsToReturn({ ...itemsToReturn, [productId]: qty });
  };

  const handleProcessRefund = async () => {
    if (!selectedInvoice) return;

    const returnItems = Object.entries(itemsToReturn)
      .map(([productId, quantity]) => ({ productId, quantity }))
      .filter((item) => item.quantity > 0);

    if (returnItems.length === 0) {
      alert('Please select at least 1 item to return');
      return;
    }

    // Compute refund total
    let refundAmount = 0;
    returnItems.forEach((ret) => {
      const origItem = selectedInvoice.items.find((i: any) => i.productId === ret.productId);
      if (origItem) {
        refundAmount += (origItem.unitPrice || origItem.product.sellingPrice) * ret.quantity;
      }
    });

    try {
      setIsLoading(true);
      await auth.apiRequest('/returns/create', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedInvoice.id,
          itemsReturned: returnItems,
          amount: refundAmount,
          method: refundMethod,
          reason: refundReason,
        }),
      });

      alert(`Refund of ₹${refundAmount.toFixed(2)} processed successfully. Stocks updated.`);
      setSelectedInvoice(null);
      setSearchInvoiceNum('');
    } catch (err) {
      alert('Failed to process return/refund.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans text-slate-800">
      <div className="pt-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Refunds Manager</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Initiate partial or complete invoice returns, automatically restore stock levels, and issue refunds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Search Side */}
        <div className="lg:col-span-1 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <span className="font-extrabold text-sm text-slate-900 block border-b border-slate-100 pb-3">Search Sales Invoice</span>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInvoiceNum}
                onChange={(e) => setSearchInvoiceNum(e.target.value)}
                placeholder="e.g. INV-20260603-1234"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" /> Find
              </button>
            </div>
          </div>
        </div>

        {/* Right Details Side */}
        <div className="lg:col-span-2 space-y-4">
          {selectedInvoice ? (
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Customer: {selectedInvoice.customer?.name || 'Walk-in Customer'} • Cashier: {selectedInvoice.cashier?.name || 'Cashier'}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                  Paid ₹{selectedInvoice.totalPayable}
                </span>
              </div>

              {/* Items Return Table */}
              <div className="space-y-3">
                <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider">Select Quantities to Return</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs font-semibold">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-slate-500 font-bold">
                    <span className="col-span-6">Product</span>
                    <span className="col-span-2 text-center">Purchased Qty</span>
                    <span className="col-span-2 text-center">Unit Price</span>
                    <span className="col-span-2 text-center">Return Qty</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((item: any) => (
                      <div key={item.productId} className="grid grid-cols-12 p-3 items-center">
                        <span className="col-span-6 font-bold text-slate-800">{item.product?.name || 'Product'}</span>
                        <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                        <span className="col-span-2 text-center font-bold">₹{item.unitPrice}</span>
                        <div className="col-span-2 flex justify-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={itemsToReturn[item.productId] || 0}
                            onChange={(e) => handleQtyChange(item.productId, item.quantity, parseInt(e.target.value) || 0)}
                            className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Refund Info inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 cursor-pointer"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI (Razorpay Mock)</option>
                    <option value="WALLET">WALLET / STORE CREDIT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Refund</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={isLoading}
                  className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10"
                >
                  <RotateCcw className="h-4 w-4" /> Process Return
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 py-16 text-center text-slate-400 font-semibold rounded-2xl flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <span>Please search for a valid sales invoice using the left panel.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReturnsRefunds;
