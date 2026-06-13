import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Download, MessageCircle, Store } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const InvoiceCenter: React.FC = () => {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('id');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState('');

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

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const invoiceNum = (inv.invoiceNumber || '').toLowerCase();
    const customerName = (inv.customer?.name || 'walk-in customer').toLowerCase();
    const customerPhone = (inv.customer?.phone || inv.customerMobile || '').toLowerCase();
    return invoiceNum.includes(q) || customerName.includes(q) || customerPhone.includes(q);
  });
  const [invoiceType, setInvoiceType] = useState<'THERMAL' | 'GST' | 'A4'>('GST');
  const [isSending, setIsSending] = useState(false);

  const [settings, setSettings] = useState({
    shopName: 'Society Supermarket',
    shopAddress: 'Sector 15, HSR Layout, Bengaluru',
    gstNumber: '29AAAAA1111A1Z1',
    mobileNumber: '+91 99999 88888',
    whatsappNumber: '+91 99999 88888',
    email: 'info@societysupermarket.com',
    logo: '',
    invoiceFooter: 'Thank you for visiting our store',
  });

  const loadInvoices = async () => {
    let allInvoices: any[] = [];
    const offline = JSON.parse(localStorage.getItem('offlineInvoices') || '[]');
    const recent = JSON.parse(localStorage.getItem('recentInvoices') || '[]');

    try {
      const data = await auth.apiRequest('/orders');
      if (Array.isArray(data)) {
        allInvoices = [...offline, ...data];
      } else {
        allInvoices = [...offline, ...recent];
      }
    } catch (err) {
      allInvoices = [...offline, ...recent];
    }

    const unique = new Map<string, any>();
    allInvoices.forEach((inv) => {
      if (inv) {
        unique.set(inv.invoiceNumber || inv.id, inv);
      }
    });

    const sorted = Array.from(unique.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    setInvoices(sorted);

    try {
      const dbSettings = await auth.apiRequest('/settings');
      if (dbSettings) {
        setSettings({
          shopName: dbSettings.shopName || 'Society Supermarket',
          shopAddress: dbSettings.shopAddress || 'Sector 15, HSR Layout, Bengaluru',
          gstNumber: dbSettings.gstNumber || '29AAAAA1111A1Z1',
          mobileNumber: dbSettings.mobile || '+91 99999 88888',
          whatsappNumber: dbSettings.mobile || '+91 99999 88888',
          email: dbSettings.email || 'info@societysupermarket.com',
          logo: dbSettings.logo || '',
          invoiceFooter: dbSettings.footerMessage || 'Thank you for visiting our store',
        });
      }
    } catch (e) {
      console.warn('Offline settings fallback');
    }

    const cached = localStorage.getItem('selectedInvoice');
    if (cached) {
      const parsed = JSON.parse(cached);
      localStorage.removeItem('selectedInvoice');
      if (parsed && (parsed.invoiceNumber || parsed.id)) {
        setSearchParams({ id: parsed.invoiceNumber || parsed.id });
      }
    }
  };

  useEffect(() => {
    loadInvoices();
    window.addEventListener('offline-sync-complete', loadInvoices);
    return () => {
      window.removeEventListener('offline-sync-complete', loadInvoices);
    };
  }, []);

  useEffect(() => {
    if (invoiceIdParam && invoices.length > 0) {
      const matched = invoices.find(
        (inv) => inv.invoiceNumber === invoiceIdParam || inv.id === invoiceIdParam
      );
      if (matched) {
        setSelectedInvoice(matched);
      } else {
        setSelectedInvoice(null);
      }
    } else {
      setSelectedInvoice(null);
    }
  }, [invoiceIdParam, invoices]);

  useEffect(() => {
    if (selectedInvoice) {
      document.body.classList.add('is-invoice-view');
    } else {
      document.body.classList.remove('is-invoice-view');
    }
    return () => {
      document.body.classList.remove('is-invoice-view');
    };
  }, [selectedInvoice]);


  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDFDirect = () => {
    const element = document.getElementById('print-area');
    if (!element || !selectedInvoice) return;
    
    // Dynamic import of html2pdf from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${selectedInvoice.invoiceNumber || 'receipt'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
    };
    document.body.appendChild(script);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedInvoice) return;
    const phone = selectedInvoice.customer?.phone || selectedInvoice.customerMobile || '';
    if (!phone || phone === '0000000000') {
      alert('No valid customer mobile number found for this transaction.');
      return;
    }

    setIsSending(true);
    try {
      // Call mock api
      await auth.apiRequest('/invoice/send-whatsapp', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: selectedInvoice.id, phone }),
      });

      alert(`WhatsApp invoice notification message queued for ${phone}!`);
    } catch (err) {
      // Mock fallback if offline
      const msg = `Invoice summary for ${selectedInvoice.invoiceNumber}: Total ₹${selectedInvoice.totalPayable}. Thank you!`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="space-y-6 text-left font-sans text-black no-print max-w-5xl mx-auto py-4 relative">
      
      {!selectedInvoice ? (
        // List Mode (Unique Invoice Management UI)
        <div className="space-y-6">
          <div className="pt-4 text-left">
            <h1 className="text-3xl font-black text-black tracking-tight uppercase">Invoice</h1>
            <p className="text-sm text-black font-semibold mt-1">Search, audit, print, and share customer transaction invoices.</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
            <span className="font-black text-lg text-black uppercase tracking-wider block mb-4 border-b border-slate-200 pb-2">Sales Invoices Records</span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                    <th className="px-4 py-4">Invoice Number</th>
                    <th className="px-4 py-4">Customer Name</th>
                    <th className="px-4 py-4">Mobile Number</th>
                    <th className="px-4 py-4">Date & Time</th>
                    <th className="px-4 py-4 text-right">Amount</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
                  {filteredInvoices.map((inv) => {
                    const phone = inv.customer?.phone || inv.customerMobile || 'N/A';
                    return (
                      <tr
                        key={inv.id || inv.invoiceNumber}
                        onClick={() => setSearchParams({ id: inv.invoiceNumber || inv.id })}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-black dark:text-white font-mono font-bold">{inv.invoiceNumber}</td>
                        <td className="px-4 py-4 font-bold text-black dark:text-white">{inv.customer?.name || 'Walk-in Customer'}</td>
                        <td className="px-4 py-4">{phone}</td>
                        <td className="px-4 py-4">{new Date(inv.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">₹{parseFloat(inv.totalPayable).toFixed(2)}</td>
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSearchParams({ id: inv.invoiceNumber || inv.id })}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setSearchParams({ id: inv.invoiceNumber || inv.id });
                                setTimeout(handlePrint, 200);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => {
                                setSearchParams({ id: inv.invoiceNumber || inv.id });
                                setTimeout(handleDownloadPDFDirect, 200);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              PDF
                            </button>
                            <button
                              onClick={async () => {
                                if (phone && phone !== '0000000000' && phone !== 'N/A') {
                                  try {
                                    await auth.apiRequest('/invoice/send-whatsapp', {
                                      method: 'POST',
                                      body: JSON.stringify({ invoiceId: inv.id, phone }),
                                    });
                                    alert(`WhatsApp invoice notification message queued for ${phone}!`);
                                  } catch (e) {
                                    const msg = `Invoice summary for ${inv.invoiceNumber}: Total ₹${inv.totalPayable}. Thank you!`;
                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }
                                } else {
                                  alert('No valid customer mobile number found for this transaction.');
                                }
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              WhatsApp
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400 font-bold">No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Single Selected Invoice Mode
        <div className="space-y-6 max-w-3xl mx-auto relative">

          {/* Action Bar (Top) */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4 no-print">
            
            {/* Tooltip print format selector */}
            <div className="flex flex-col gap-1.5 text-left w-full md:w-auto">
              <span className="text-xs font-black text-black uppercase tracking-wider">Print Format</span>
              <div className="flex border border-slate-200 rounded-xl bg-slate-50 p-0.5 text-[11px] font-bold h-9 items-center">
                {[
                  { id: 'THERMAL', label: 'Thermal Receipt', desc: 'For thermal printers' },
                  { id: 'GST', label: 'GST Invoice', desc: 'Standard GST bill' },
                  { id: 'A4', label: 'A4 Invoice', desc: 'Full-page invoice' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setInvoiceType(opt.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
                      invoiceType === opt.id ? 'bg-black text-white shadow-sm font-black' : 'text-slate-600 hover:text-black'
                    }`}
                    title={opt.desc}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick format tooltips helper text */}
            <div className="text-[11px] text-black font-bold text-left bg-slate-50 border border-slate-200 p-2 rounded-xl w-full md:w-56">
              {invoiceType === 'THERMAL' && '⚡ Thermal Receipt: For thermal printers'}
              {invoiceType === 'GST' && '📄 GST Invoice: Standard GST bill'}
              {invoiceType === 'A4' && '🏢 A4 Invoice: Full-page invoice'}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer h-9"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={handleDownloadPDFDirect}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer h-9"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer h-9 disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
          </div>
 
          {/* Centered Preview Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm min-h-[500px] flex flex-col justify-between print:border-0 print:shadow-none print:p-0" id="print-area">
            {invoiceType === 'THERMAL' ? (
              /* Thermal Layout */
              <div className="w-full max-w-[300px] mx-auto font-mono text-xs space-y-4 text-black font-normal">
                <div className="text-center space-y-1">
                  <span className="font-black text-lg uppercase tracking-wide">SOCIETY SUPERMARKET</span>
                  <p className="text-[11px] font-normal">{settings.shopAddress}</p>
                  <p className="text-[11px] font-normal">Phone: {settings.mobileNumber}</p>
                </div>
                <div className="border-t border-b border-dashed border-black py-2 space-y-1 text-left">
                  <p className="text-black">Invoice: {selectedInvoice.invoiceNumber}</p>
                  <p className="text-black">Date: {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                  <p className="text-black">Cashier: {selectedInvoice.cashier?.name || selectedInvoice.cashierName || 'Admin'}</p>
                  <p className="text-black">Customer: {selectedInvoice.customer?.name || 'Walk-in'}</p>
                  <p className="text-black">Mobile: {selectedInvoice.customer?.phone || selectedInvoice.customerMobile || 'N/A'}</p>
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between font-black border-b border-dashed border-black pb-1">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Total</span>
                  </div>
                  <div className="space-y-1 font-normal">
                    {(selectedInvoice.items || []).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[130px] font-normal text-black">{item.product?.name || 'Product'}</span>
                        <span className="text-black">{item.quantity}</span>
                        <span className="text-black">₹{(item.total || item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-dashed border-black pt-2 space-y-1.5 text-right font-normal text-xs">
                  <div className="flex justify-between text-black">
                    <span>Discount:</span>
                    <span>-₹{selectedInvoice.discount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-black">
                    <span>GST (18%):</span>
                    <span>₹{selectedInvoice.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-dashed border-black pt-1.5 text-black">
                    <span>NET PAYABLE:</span>
                    <span>₹{selectedInvoice.totalPayable}</span>
                  </div>
                </div>
                <div className="text-center pt-4 space-y-1 border-t border-dashed border-black">
                  <p className="text-[11px] font-normal uppercase tracking-wider text-black">{settings.invoiceFooter}</p>
                  <p className="text-[10px] text-black">Thank you for your visit!</p>
                </div>
              </div>
            ) : invoiceType === 'GST' ? (
              /* GST Tax Invoice Redesigned */
              <div className="space-y-6 text-sm text-black font-sans">
                <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-4 pb-6 border-b border-slate-200">
                  <div className="text-center sm:text-left space-y-2">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Shop Logo" className="max-h-16 object-contain mb-2 mx-auto sm:mx-0" />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md mx-auto sm:mx-0">
                        <Store className="w-6 h-6" />
                      </div>
                    )}
                    <h2 className="text-3xl font-black text-black leading-tight">{settings.shopName}</h2>
                    <p className="text-sm text-black max-w-xs font-normal">{settings.shopAddress}</p>
                    <p className="text-sm text-black font-normal">GSTIN: {settings.gstNumber}</p>
                    <p className="text-sm text-black font-normal">Mobile: {settings.mobileNumber}</p>
                  </div>

                  <div className="text-center sm:text-right space-y-2">
                    <span className="text-xs uppercase font-black tracking-widest text-black block">Tax Invoice</span>
                    <h3 className="text-2xl font-black text-black">{selectedInvoice.invoiceNumber}</h3>
                    <div className="text-sm text-black space-y-1">
                      <div className="flex justify-center sm:justify-end gap-1.5">
                        <span className="font-normal text-slate-500">Bill ID:</span>
                        <span className="font-normal">{selectedInvoice.id}</span>
                      </div>
                      <div className="flex justify-center sm:justify-end gap-1.5">
                        <span className="font-normal text-slate-500">Date:</span>
                        <span className="font-normal">{new Date(selectedInvoice.createdAt).toLocaleString('en-GB')}</span>
                      </div>
                      <div className="flex justify-center sm:justify-end gap-1.5">
                        <span className="font-normal text-slate-500">Cashier:</span>
                        <span className="font-normal">{selectedInvoice.cashier?.name || selectedInvoice.cashierName || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Payment Status Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Details Box */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left flex justify-between items-center shadow-sm">
                    <div>
                      <span className="text-xs text-black uppercase tracking-wider block font-black mb-1">Customer Details</span>
                      <div className="space-y-0.5 text-sm">
                        <p className="font-normal text-black text-xl">{selectedInvoice.customer?.name || 'Walk-in Customer'}</p>
                        <p className="font-normal text-slate-650 text-base">Mobile: {selectedInvoice.customer?.phone || selectedInvoice.customerMobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Box */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-xs text-black uppercase tracking-wider block font-black">Scan to View</span>
                      <span className="text-[11px] text-slate-650 block font-normal leading-tight">
                        Scan the QR code to verify or audit this retail invoice details online.
                      </span>
                    </div>
                    <div className="shrink-0 bg-white p-1 rounded-xl border border-slate-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`Invoice No: ${selectedInvoice.invoiceNumber}\nBill No: ${selectedInvoice.id}\nInvoice URL: ${window.location.origin}/invoice/${selectedInvoice.invoiceNumber}?token=${selectedInvoice.qrToken || ''}`)}`}
                        alt="QR"
                        className="w-16 h-16"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Table */}
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
                      {(selectedInvoice.items || []).map((item: any, idx: number) => {
                        const price = item.unitPrice || 0;
                        const qty = item.quantity || 0;
                        const taxRate = item.product?.gstPercent || 18;
                        return (
                          <tr key={idx} className="text-black hover:bg-slate-50/50 transition-colors">
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

                {/* Summary row */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2 text-left shadow-sm">
                  <span className="text-xs text-black uppercase tracking-wider block font-black border-b pb-1.5 border-slate-200">Final Total</span>
                  <div className="space-y-1.5 text-base text-black font-normal font-sans">
                    <div className="flex justify-between">
                      <span className="font-normal text-slate-650">Subtotal:</span>
                      <span>₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="font-normal text-slate-650">Customer Discount:</span>
                        <span className="text-rose-600">-₹{selectedInvoice.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-normal text-slate-650">GST Tax:</span>
                      <span>₹{(selectedInvoice.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-black">
                      <span>Grand Total:</span>
                      <span className="text-3xl font-black text-black">₹{parseFloat(String(selectedInvoice.totalPayable)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* A4 Layout Standard */
              <div className="space-y-8 text-base text-black font-sans">
                <div className="border-b border-slate-250 pb-5 flex justify-between items-end">
                  <div className="text-left">
                    <h1 className="text-3xl font-black text-black tracking-tight">{settings.shopName}</h1>
                    <p className="text-slate-650 font-normal mt-1">{settings.shopAddress}</p>
                    <p className="text-slate-650 font-normal">GSTIN: {settings.gstNumber} | Mobile: {settings.mobileNumber}</p>
                  </div>
                  <span className="text-3xl font-black text-black">INVOICE</span>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm font-normal text-left">
                  <div>
                    <h4 className="font-black text-black mb-2 uppercase text-xs">Customer Details</h4>
                    <p className="font-normal text-black text-xl">{selectedInvoice.customer?.name || 'Walk-in Customer'}</p>
                    <p className="text-slate-650 font-normal">Mobile: {selectedInvoice.customer?.phone || selectedInvoice.customerMobile || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-black text-black mb-2 uppercase text-xs">Invoice Information</h4>
                    <p className="text-slate-650 font-normal"><span className="text-slate-500 font-normal">No:</span> {selectedInvoice.invoiceNumber}</p>
                    <p className="text-slate-650 font-normal"><span className="text-slate-500 font-normal">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                    <p className="text-slate-650 font-normal"><span className="text-slate-500 font-normal">Cashier:</span> {selectedInvoice.cashier?.name || selectedInvoice.cashierName || 'Admin'}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden font-normal shadow-sm">
                  <table className="w-full text-left text-base border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-black border-b border-slate-200 font-black uppercase text-xs tracking-wider">
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedInvoice.items || []).map((item: any, index: number) => (
                        <tr key={index} className="text-black font-normal">
                          <td className="p-3 font-normal text-black text-base">{item.product?.name || 'Product'}</td>
                          <td className="p-3 text-center font-normal text-base">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.unitPrice}</td>
                          <td className="p-3 text-right font-normal text-base">₹{(item.total || item.unitPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-5 text-left">
                  <div className="text-xs text-slate-500 font-normal italic">
                    All disputes are subject to Bangalore jurisdiction.
                  </div>
                  <div className="w-72 space-y-2 text-base font-normal text-black">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-black font-normal">₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-rose-650">
                        <span>Discount Applied:</span>
                        <span className="font-normal">-₹{selectedInvoice.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST Tax Amount:</span>
                      <span className="text-black font-normal">₹{selectedInvoice.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-black">
                      <span>TOTAL PAYABLE:</span>
                      <span className="text-emerald-700 text-2xl font-black">₹{selectedInvoice.totalPayable}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCenter;
