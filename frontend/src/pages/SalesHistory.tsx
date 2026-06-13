import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Printer,
  MessageCircle,
  Search,
  X,
  Download,
  FileText
} from 'lucide-react';

export const SalesHistory: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      const data = await auth.apiRequest('/billing/history');
      setSales(data || []);
    } catch (e) {
      console.error('Failed to load sales history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesHistory();
  }, []);

  // Global search listener
  useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setSearchTerm(e.detail || '');
    };
    setSearchTerm(sessionStorage.getItem('globalSearchQuery') || '');
    window.addEventListener('global-search', handleGlobalSearch);
    return () => {
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  // Date Filtering Logic (Timezone offset safe)
  // Combined Filters Logic (Date + Payment + Status + Search)
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfSevenDaysAgo = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfThirtyDaysAgo = new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate(), 0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return sales.filter((sale) => {
      // 1. Date Range Presets and Custom Ranges
      const saleDate = new Date(sale.createdAt);

      if (datePreset === 'today') {
        if (saleDate < startOfToday) return false;
      } else if (datePreset === 'yesterday') {
        if (saleDate < startOfYesterday || saleDate > endOfYesterday) return false;
      } else if (datePreset === 'last7') {
        if (saleDate < startOfSevenDaysAgo) return false;
      } else if (datePreset === 'last30') {
        if (saleDate < startOfThirtyDaysAgo) return false;
      } else if (datePreset === 'thismonth') {
        if (saleDate < startOfMonth) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate) {
          const [sYear, sMonth, sDay] = customStartDate.split('-').map(Number);
          const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
          if (saleDate < start) return false;
        }
        if (customEndDate) {
          const [eYear, eMonth, eDay] = customEndDate.split('-').map(Number);
          const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
          if (saleDate > end) return false;
        }
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'all') {
        const method = sale.paymentMethod || '';
        if (method.toUpperCase() !== paymentFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const status = sale.status || 'COMPLETED';
        if (status.toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const invoiceMatch = sale.invoiceNumber.toLowerCase().includes(q);
        const idMatch = String(sale.id).toLowerCase().includes(q);
        const customerNameMatch = (sale.customer?.name || 'walk-in customer').toLowerCase().includes(q);
        const customerPhoneMatch = (sale.customer?.phone || sale.customerMobile || '').includes(q);
        if (!invoiceMatch && !idMatch && !customerNameMatch && !customerPhoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [sales, datePreset, customStartDate, customEndDate, paymentFilter, statusFilter, searchTerm]);

  // Practical Business Metrics (derived dynamically from filtered/sales dataset)
  const insights = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    let todaySales = 0;
    let todayRevenue = 0;
    let thisMonthRevenue = 0;

    // Filtered list stats
    let totalRevenue = 0;
    let totalOrders = 0;
    const productQuantities: Record<string, number> = {};
    const paymentCounts: Record<string, number> = {};

    // Calculate metrics
    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      const isCompleted = (sale.status || 'COMPLETED').toUpperCase() === 'COMPLETED' || (sale.status || 'COMPLETED').toUpperCase() === 'SUCCESS';
      
      if (isCompleted) {
        if (saleDate >= startOfToday) {
          todaySales += 1;
          todayRevenue += sale.totalPayable;
        }
        if (saleDate >= startOfMonth) {
          thisMonthRevenue += sale.totalPayable;
        }
      }
    });

    filteredSales.forEach((sale) => {
      const isCompleted = (sale.status || 'COMPLETED').toUpperCase() === 'COMPLETED' || (sale.status || 'COMPLETED').toUpperCase() === 'SUCCESS';
      if (isCompleted) {
        totalRevenue += sale.totalPayable;
        totalOrders += 1;
        
        if (sale.items) {
          sale.items.forEach((item: any) => {
            const pName = item.product?.name || 'Unknown Item';
            const qty = item.quantity || 0;
            productQuantities[pName] = (productQuantities[pName] || 0) + qty;
          });
        }

        const pm = sale.paymentMethod || 'CASH';
        paymentCounts[pm] = (paymentCounts[pm] || 0) + 1;
      }
    });

    const averageBillValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top Selling Product
    let topProduct = 'None';
    let maxProdQty = 0;
    Object.entries(productQuantities).forEach(([k, v]) => {
      if (v > maxProdQty) {
        topProduct = k;
        maxProdQty = v;
      }
    });

    // Most Used Payment Method
    let topPayment = 'None';
    let maxPaymentCount = 0;
    Object.entries(paymentCounts).forEach(([k, v]) => {
      if (v > maxPaymentCount) {
        topPayment = k;
        maxPaymentCount = v;
      }
    });

    return {
      todaySales,
      todayRevenue,
      thisMonthRevenue,
      totalOrders,
      averageBillValue,
      topProduct,
      topPayment
    };
  }, [sales, filteredSales]);

  // Export CSV Action
  const handleExportCSV = () => {
    const headers = ['Bill No', 'Invoice No', 'Customer Name', 'Mobile', 'Quantity', 'Payment Method', 'Amount', 'Date & Time', 'Status'];
    const rows = filteredSales.map((s) => [
      s.id,
      s.invoiceNumber,
      s.customer?.name || 'Walk-in Customer',
      s.customer?.phone || s.customerMobile || 'N/A',
      s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
      s.paymentMethod,
      s.totalPayable,
      new Date(s.createdAt).toLocaleString(),
      s.status || 'COMPLETED'
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel XML Table format
  const handleExportExcel = () => {
    let tableHtml = '<table border="1"><tr>';
    const headers = ['Bill No', 'Invoice No', 'Customer Name', 'Mobile', 'Quantity', 'Payment Method', 'Amount', 'Date & Time', 'Status'];
    headers.forEach((h) => { tableHtml += `<th style="background-color:#047857; color:white; font-weight:bold;">${h}</th>`; });
    tableHtml += '</tr>';
    filteredSales.forEach((s) => {
      tableHtml += `<tr>
        <td>${s.id}</td>
        <td>${s.invoiceNumber}</td>
        <td>${s.customer?.name || 'Walk-in Customer'}</td>
        <td>${s.customer?.phone || s.customerMobile || 'N/A'}</td>
        <td>${s.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0}</td>
        <td>${s.paymentMethod}</td>
        <td>₹${s.totalPayable}</td>
        <td>${new Date(s.createdAt).toLocaleString()}</td>
        <td>${s.status || 'COMPLETED'}</td>
      </tr>`;
    });
    tableHtml += '</table>';
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Report_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Sender Handler
  const handleSendWhatsApp = (sale: any) => {
    const phone = sale.customer?.phone || sale.customerMobile;
    if (!phone || phone === '0000000000') {
      alert('No valid mobile number registered for this customer.');
      return;
    }
    const message = `Hello ${sale.customer?.name || 'Customer'},\nHere is your receipt for invoice: ${sale.invoiceNumber}.\nTotal Amount: ₹${sale.totalPayable}\nThank you for shopping with us!`;
    const waUrl = `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // View PDF helper
  const handleDownloadPDF = (sale: any) => {
    localStorage.setItem('selectedInvoice', JSON.stringify(sale));
    navigate('/invoice');
  };

  // Payment Method Badges (simple text badges only)
  const renderPaymentBadge = (method: string) => {
    const norm = method.toUpperCase();
    if (norm === 'CASH') {
      return (
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Cash
        </span>
      );
    }
    if (norm === 'UPI') {
      return (
        <span className="bg-blue-50 text-blue-800 border border-blue-250 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          UPI
        </span>
      );
    }
    if (norm === 'CARD') {
      return (
        <span className="bg-purple-50 text-purple-800 border border-purple-250 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Card
        </span>
      );
    }
    if (norm === 'NETBANKING' || norm === 'NET BANKING') {
      return (
        <span className="bg-amber-50 text-amber-800 border border-amber-250 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Net Banking
        </span>
      );
    }
    return (
      <span className="bg-indigo-50 text-indigo-800 border border-indigo-250 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
        Wallet
      </span>
    );
  };

  // Status Badges
  const renderStatusBadge = (status: string = 'COMPLETED') => {
    const norm = status.toUpperCase();
    if (norm === 'COMPLETED' || norm === 'SUCCESS' || norm === 'PAID') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Completed
        </span>
      );
    }
    if (norm === 'REFUNDED') {
      return (
        <span className="bg-orange-50 text-orange-700 border border-orange-250 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Refunded
        </span>
      );
    }
    return (
      <span className="bg-rose-50 text-rose-700 border border-rose-250 text-[10px] font-bold px-2 py-0.5 rounded-full">
        Cancelled
      </span>
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 select-none font-['Trebuchet_MS'] text-[15px] text-black text-left p-6">
      
      {/* Page Header */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-3xl font-bold text-black tracking-tight leading-none">Sales History</h1>
        <p className="text-sm text-black mt-2">Track, filter, audit invoices, and analyze business store performance.</p>
      </div>

      {/* Practical Business Insights Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Today's Sales</span>
          <span className="text-xl font-bold text-black block mt-2">{insights.todaySales}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Today's Revenue</span>
          <span className="text-xl font-bold text-emerald-600 block mt-2">₹{insights.todayRevenue.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">This Month Revenue</span>
          <span className="text-xl font-bold text-black block mt-2">₹{insights.thisMonthRevenue.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Total Orders</span>
          <span className="text-xl font-bold text-black block mt-2">{insights.totalOrders}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Avg Bill Value</span>
          <span className="text-xl font-bold text-black block mt-2">₹{insights.averageBillValue.toFixed(1)}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Top Selling Product</span>
          <span className="text-xs font-bold text-black block mt-2 truncate">{insights.topProduct}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Top Payment Mode</span>
          <span className="text-xs font-bold text-black block mt-2 truncate uppercase">{insights.topPayment}</span>
        </div>

      </div>

      {/* Advanced Filter Console */}
      <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider border-b border-[#E5E7EB] pb-2">Filter Ledgers</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Time Preset */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black uppercase tracking-wider block">Date Range</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full bg-slate-55 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Invoices</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black uppercase tracking-wider block">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-55 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Net Banking</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black uppercase tracking-wider block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-55 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Term */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black uppercase tracking-wider block">Search</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-black">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search name, phone, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs font-normal text-black focus:outline-none focus:border-emerald-600 bg-slate-55"
              />
            </div>
          </div>

        </div>

        {/* Custom Date Inputs if 'custom' is active */}
        {datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-4 max-w-md animate-[fadeIn_0.15s_ease-out]">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black uppercase tracking-wider block">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-slate-55 border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black uppercase tracking-wider block">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-slate-55 border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Export and Print Buttons */}
        <div className="border-t border-[#E5E7EB] pt-4 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#E5E7EB] text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#E5E7EB] text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
        </div>

      </div>

      {/* Sales History Ledgers Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider">Invoices Ledger Records</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                <th className="px-4 py-4">Bill No</th>
                <th className="px-4 py-4">Invoice No</th>
                <th className="px-4 py-4">Customer Name</th>
                <th className="px-4 py-4">Mobile Number</th>
                <th className="px-4 py-4 text-center">Quantity</th>
                <th className="px-4 py-4 text-center">Payment Method</th>
                <th className="px-4 py-4 text-right">Total Amount</th>
                <th className="px-4 py-4">Date & Time</th>
                <th className="px-4 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-bold">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-bold">
                    No transactions matched your query filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const qty = sale.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => {
                        setSelectedInvoice(sale);
                        setShowDetailModal(true);
                      }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-800 dark:text-slate-300"
                    >
                      <td className="px-4 py-4 font-bold text-black dark:text-white font-mono">{sale.id}</td>
                      <td className="px-4 py-4 font-bold text-black dark:text-white">{sale.invoiceNumber}</td>
                      <td className="px-4 py-4 font-bold text-black dark:text-white">{sale.customer?.name || 'Walk-in Customer'}</td>
                      <td className="px-4 py-4">{sale.customer?.phone || sale.customerMobile || 'N/A'}</td>
                      <td className="px-4 py-4 text-center">{qty}</td>
                      <td className="px-4 py-4 text-center">{renderPaymentBadge(sale.paymentMethod)}</td>
                      <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{sale.totalPayable.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">{new Date(sale.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">{renderStatusBadge(sale.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL TRANSACTION / INVOICE MODAL VIEW */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 flex flex-col max-h-[90vh] text-black">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Sale Transaction Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-black hover:bg-slate-100 rounded-lg p-1 transition font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-5 text-xs text-left">
              
              {/* Box 1: Invoice & Customer Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 border border-[#E5E7EB] p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-black uppercase block tracking-wider mb-1">Invoice Details</span>
                  <p className="font-bold">ID: <span className="font-normal">{selectedInvoice.id}</span></p>
                  <p className="font-bold">Number: <span className="font-normal">{selectedInvoice.invoiceNumber}</span></p>
                  <p className="font-bold">Date: <span className="font-normal">{new Date(selectedInvoice.createdAt).toLocaleString()}</span></p>
                  <p className="font-bold">Cashier: <span className="font-normal">{selectedInvoice.cashierName || 'Admin'}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-black uppercase block tracking-wider mb-1">Customer Info</span>
                  <p className="font-bold">Name: <span className="font-normal">{selectedInvoice.customer?.name || 'Walk-in Customer'}</span></p>
                  <p className="font-bold">Phone: <span className="font-normal">{selectedInvoice.customer?.phone || selectedInvoice.customerMobile || 'N/A'}</span></p>
                  <p className="font-bold">Status: <span className="font-normal uppercase">{selectedInvoice.status || 'COMPLETED'}</span></p>
                </div>
              </div>

              {/* Box 2: Payment & Financial Summary */}
              <div className="bg-slate-50/50 border border-[#E5E7EB] p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-black uppercase block tracking-wider border-b border-[#E5E7EB] pb-1">Financial Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <p className="font-bold">Subtotal: <span className="font-normal">₹{selectedInvoice.subtotal.toFixed(2)}</span></p>
                  <p className="font-bold">GST Tax: <span className="font-normal">₹{selectedInvoice.tax.toFixed(2)}</span></p>
                  <p className="font-bold">Discount: <span className="font-normal text-rose-650">-₹{selectedInvoice.discount.toFixed(2)}</span></p>
                  <p className="font-bold">Payment Method: <span className="font-normal uppercase">{selectedInvoice.paymentMethod}</span></p>
                </div>
                <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between items-center text-sm font-bold text-black">
                  <span>Grand Total:</span>
                  <span className="text-base font-bold text-emerald-700">₹{selectedInvoice.totalPayable}</span>
                </div>
              </div>

              {/* Box 3: Product Breakdown List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-black uppercase tracking-wider block">Purchased Products</span>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                        <th className="px-4 py-3 text-left">Product Name</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right pr-4">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-300">
                      {(selectedInvoice.items || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-black dark:text-white truncate max-w-[150px]">{item.product?.name || 'Item'}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right pr-4 font-black">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 font-bold border-t border-[#E5E7EB]">
              <div className="flex gap-2 col-span-2">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="flex-1 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-black py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> View Invoice
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('selectedInvoice', JSON.stringify(selectedInvoice));
                    navigate('/invoice');
                    setTimeout(() => window.print(), 350);
                  }}
                  className="flex-1 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-black py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
              </div>
              
              <button
                onClick={() => {
                  localStorage.setItem('selectedInvoice', JSON.stringify(selectedInvoice));
                  navigate('/invoice');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-center uppercase flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedInvoice)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-center uppercase flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Receipt
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
