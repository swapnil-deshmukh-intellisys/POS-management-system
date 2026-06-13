import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Printer, Download, MessageCircle, Store } from 'lucide-react';

export const PublicInvoiceView: React.FC = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicInvoice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:5000/api/public-invoice/${invoiceNumber}?token=${token}`
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Verification failed.');
        }
        const data = await response.json();
        setInvoice(data.invoice);
        setSettings(data.settings);
      } catch (err: any) {
        setError(err.message || 'Could not fetch invoice details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceNumber && token) {
      fetchPublicInvoice();
    } else {
      setError('Missing invoice details or verification token.');
      setIsLoading(false);
    }
  }, [invoiceNumber, token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('print-area');
    if (!element || !invoice) return;
    
    // Dynamically inject html2pdf
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${invoice.invoiceNumber || 'receipt'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
    };
    document.body.appendChild(script);
  };

  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const phone = invoice.order?.customer?.phone || invoice.order?.customerMobile || '';
    const msg = `Hi, here is your verified retail invoice link for transaction ${invoice.invoiceNumber}: ${window.location.href}. Thank you!`;
    window.open(`https://wa.me/${phone ? phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-55 p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          <p className="text-sm text-slate-500 font-semibold">Verifying secure retail invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-55 p-4 font-sans">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm max-w-sm text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Invoice Verification Failed</h2>
          <p className="text-sm text-slate-650 font-normal leading-relaxed">{error || 'This invoice link is invalid or secure token verification failed.'}</p>
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block font-normal">If you scanned a printed receipt, please contact shop support.</span>
          </div>
        </div>
      </div>
    );
  }

  const order = invoice.order || {};
  const customer = order.customer || {};
  const items = order.items || [];
  const shopName = settings?.shopName || 'Society Supermarket';
  const shopAddress = settings?.shopAddress || 'Sector 15, HSR Layout, Bengaluru';
  const gstNumber = settings?.gstNumber || '29AAAAA1111A1Z1';
  const mobileNumber = settings?.mobile || '+91 99999 88888';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 font-sans text-black select-none antialiased">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Verification Alert Badge */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-center justify-between text-xs font-semibold no-print">
          <span>🛡️ Officially Verified Retail Invoice</span>
          <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider text-emerald-700">Authentic</span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-2 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer h-9"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer h-9"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all cursor-pointer h-9"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Share
          </button>
        </div>

        {/* Main Invoice Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm min-h-[500px] flex flex-col justify-between print:border-0 print:shadow-none print:p-0" id="print-area">
          <div className="space-y-6 text-sm text-black">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-4 pb-6 border-b border-slate-200">
              <div className="text-center sm:text-left space-y-2">
                {settings?.logo ? (
                  <img src={settings.logo} alt="Shop Logo" className="max-h-16 object-contain mb-2 mx-auto sm:mx-0" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md mx-auto sm:mx-0">
                    <Store className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-3xl font-black text-black leading-tight">{shopName}</h2>
                <p className="text-sm text-black max-w-xs font-normal">{shopAddress}</p>
                <p className="text-sm text-black font-normal">GSTIN: {gstNumber}</p>
                <p className="text-sm text-black font-normal">Mobile: {mobileNumber}</p>
              </div>

              <div className="text-center sm:text-right space-y-2">
                <span className="text-xs uppercase font-black tracking-widest text-black block">Tax Invoice</span>
                <h3 className="text-2xl font-black text-black">{invoice.invoiceNumber}</h3>
                <div className="text-sm text-black space-y-1">
                  <div className="flex justify-center sm:justify-end gap-1.5">
                    <span className="font-normal text-slate-500">Bill ID:</span>
                    <span className="font-normal">{order.id}</span>
                  </div>
                  <div className="flex justify-center sm:justify-end gap-1.5">
                    <span className="font-normal text-slate-500">Date:</span>
                    <span className="font-normal">{new Date(invoice.createdAt).toLocaleString('en-GB')}</span>
                  </div>
                  <div className="flex justify-center sm:justify-end gap-1.5">
                    <span className="font-normal text-slate-500">Cashier:</span>
                    <span className="font-normal">{order.cashier?.name || order.cashierName || 'Admin'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-xs text-black uppercase tracking-wider block font-black mb-1">Customer Details</span>
                  <div className="space-y-0.5 text-sm">
                    <p className="font-normal text-black text-xl">{customer.name || 'Walk-in Customer'}</p>
                    <p className="font-normal text-slate-650 text-base">Mobile: {customer.phone || order.customerMobile || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left flex flex-col justify-center shadow-sm">
                <span className="text-xs text-black uppercase tracking-wider block font-black mb-1">Payment Method</span>
                <p className="font-normal text-black text-lg">{order.paymentMethod || 'CASH'}</p>
              </div>
            </div>

            {/* Product List Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-base font-normal text-left text-black table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-black uppercase tracking-wider">
                    <th className="px-3 py-3 w-[45%]">Product Details</th>
                    <th className="px-3 py-3 text-center w-[12%]">Qty</th>
                    <th className="px-3 py-3 text-right w-[15%]">MRP</th>
                    <th className="px-3 py-3 text-right w-[13%]">GST</th>
                    <th className="px-3 py-3 text-right w-[15%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {items.map((item: any, idx: number) => {
                    const price = item.unitPrice || 0;
                    const qty = item.quantity || 0;
                    const taxRate = item.product?.gstPercent || 18;
                    return (
                      <tr key={idx} className="text-black hover:bg-slate-55 transition-colors">
                        <td className="px-3 py-3 font-normal text-black text-base truncate">{item.product?.name || 'Item'}</td>
                        <td className="px-3 py-3 text-center font-normal text-black text-base">{qty}</td>
                        <td className="px-3 py-3 text-right text-black">₹{price.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-black font-normal">{taxRate}%</td>
                        <td className="px-3 py-3 text-right font-normal text-black text-base">₹{(item.total || price * qty).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2 text-left shadow-sm">
              <span className="text-xs text-black uppercase tracking-wider block font-black border-b pb-1.5 border-slate-200">Final Total</span>
              <div className="space-y-1.5 text-base text-black font-normal font-sans">
                <div className="flex justify-between">
                  <span className="font-normal text-slate-650">Subtotal:</span>
                  <span>₹{order.subtotal?.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-normal text-slate-650">Customer Discount:</span>
                    <span className="text-rose-600">-₹{order.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-normal text-slate-650">GST Tax:</span>
                  <span>₹{(order.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-black">
                  <span>Grand Total:</span>
                  <span className="text-3xl font-black text-black font-sans">₹{parseFloat(String(order.totalPayable || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicInvoiceView;
