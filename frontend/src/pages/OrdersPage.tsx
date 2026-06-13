import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  X,
  FileText,
  Printer,
  Download,
  MessageCircle,
  Layers,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await auth.apiRequest('/billing/history');
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
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

  // Combined Filters Logic (Date + Status + Payment + Search)
  const filteredOrders = useMemo(() => {
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

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      // 1. Date filter
      if (datePreset === 'today') {
        if (orderDate < startOfToday) return false;
      } else if (datePreset === 'yesterday') {
        if (orderDate < startOfYesterday || orderDate > endOfYesterday) return false;
      } else if (datePreset === 'last7') {
        if (orderDate < startOfSevenDaysAgo) return false;
      } else if (datePreset === 'last30') {
        if (orderDate < startOfThirtyDaysAgo) return false;
      } else if (datePreset === 'thismonth') {
        if (orderDate < startOfMonth) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate) {
          const [sYear, sMonth, sDay] = customStartDate.split('-').map(Number);
          const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (customEndDate) {
          const [eYear, eMonth, eDay] = customEndDate.split('-').map(Number);
          const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const status = order.status || 'COMPLETED';
        let mappedStatus = 'PENDING';
        if (status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'SUCCESS') {
          mappedStatus = 'COMPLETED';
        } else if (status.toUpperCase() === 'CANCELLED') {
          mappedStatus = 'CANCELLED';
        } else if (status.toUpperCase() === 'PARKED') {
          mappedStatus = 'PROCESSING';
        } else if (status.toUpperCase() === 'RETURNED' || status.toUpperCase() === 'REFUNDED') {
          mappedStatus = 'RETURNED';
        } else {
          mappedStatus = 'PENDING'; // DRAFT or general pending
        }

        if (mappedStatus !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Payment Filter
      if (paymentFilter !== 'all') {
        const method = order.paymentMethod || '';
        if (method.toUpperCase() !== paymentFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const orderIdMatch = String(order.id).toLowerCase().includes(q);
        const invoiceMatch = (order.invoiceNumber || '').toLowerCase().includes(q);
        const customerNameMatch = (order.customer?.name || 'walk-in customer').toLowerCase().includes(q);
        const customerPhoneMatch = (order.customer?.phone || order.customerMobile || '').includes(q);
        if (!orderIdMatch && !invoiceMatch && !customerNameMatch && !customerPhoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, datePreset, customStartDate, customEndDate, statusFilter, paymentFilter, searchTerm]);

  // Insights and Metrics Logic
  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    let total = 0;
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let cancelled = 0;
    let returned = 0;
    let todayOrders = 0;
    let weeklyOrders = 0;
    let monthlyOrders = 0;

    let todayRevenue = 0;
    let totalRevenue = 0;
    let totalPaidCount = 0;
    let highestOrderValue = 0;

    const productQuantities: Record<string, number> = {};
    const paymentCounts: Record<string, number> = {};
    const customerCounts: Record<string, { name: string; count: number }> = {};
    const hourCounts: Record<number, number> = {};

    orders.forEach((o) => {
      const oDate = new Date(o.createdAt);
      const status = (o.status || 'COMPLETED').toUpperCase();

      total += 1;
      
      // Period counters
      if (oDate >= startOfToday) todayOrders += 1;
      if (oDate >= startOfWeek) weeklyOrders += 1;
      if (oDate >= startOfMonth) monthlyOrders += 1;

      // Status counters
      if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'PAID') {
        completed += 1;
        totalRevenue += o.totalPayable;
        totalPaidCount += 1;
        if (o.totalPayable > highestOrderValue) {
          highestOrderValue = o.totalPayable;
        }
        if (oDate >= startOfToday) {
          todayRevenue += o.totalPayable;
        }

        // Product insights
        if (o.items) {
          o.items.forEach((item: any) => {
            const pName = item.product?.name || 'Unknown Item';
            const qty = item.quantity || 0;
            productQuantities[pName] = (productQuantities[pName] || 0) + qty;
          });
        }

        // Payment Mode insights
        const pm = o.paymentMethod || 'CASH';
        paymentCounts[pm] = (paymentCounts[pm] || 0) + 1;
      } else if (status === 'CANCELLED') {
        cancelled += 1;
      } else if (status === 'PARKED' || status === 'PROCESSING') {
        processing += 1;
      } else if (status === 'RETURNED' || status === 'REFUNDED') {
        returned += 1;
      } else {
        pending += 1; // DRAFT/PENDING
      }

      // Customer activity tracking
      const cId = o.customerId || 'walk-in';
      const cName = o.customer?.name || 'Walk-in Customer';
      if (!customerCounts[cId]) {
        customerCounts[cId] = { name: cName, count: 0 };
      }
      customerCounts[cId].count += 1;

      // Hour of day tracking
      const hr = oDate.getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    });

    const averageBillValue = totalPaidCount > 0 ? totalRevenue / totalPaidCount : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

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

    // Most Active Customer
    let topCustomer = 'Walk-in Customer';
    let maxCustomerOrders = 0;
    Object.entries(customerCounts).forEach(([k, v]) => {
      if (k !== 'walk-in' || maxCustomerOrders === 0) {
        if (v.count > maxCustomerOrders) {
          topCustomer = v.name;
          maxCustomerOrders = v.count;
        }
      }
    });

    // Peak Order Time
    let peakHourStr = '12 PM - 2 PM';
    let maxHourOrders = 0;
    Object.entries(hourCounts).forEach(([k, v]) => {
      const hrNum = parseInt(k);
      if (v > maxHourOrders) {
        maxHourOrders = v;
        const hrStart = hrNum % 12 === 0 ? 12 : hrNum % 12;
        const startAmpm = hrNum >= 12 ? 'PM' : 'AM';
        const hrEnd = (hrNum + 1) % 12 === 0 ? 12 : (hrNum + 1) % 12;
        const endAmpm = (hrNum + 1) >= 12 ? 'PM' : 'AM';
        peakHourStr = `${hrStart} ${startAmpm} - ${hrEnd} ${endAmpm}`;
      }
    });

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      returned,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      todayRevenue,
      totalRevenue,
      averageBillValue,
      completionRate,
      highestOrderValue,
      topProduct,
      topPayment,
      topCustomer,
      peakHourStr
    };
  }, [orders]);



  // Order Details Actions
  const handleDownloadPDF = (order: any) => {
    localStorage.setItem('selectedInvoice', JSON.stringify(order));
    navigate('/invoice');
  };

  const handleSendWhatsApp = (order: any) => {
    const phone = order.customer?.phone || order.customerMobile;
    if (!phone || phone === '0000000000') {
      alert('No valid mobile number registered for this customer.');
      return;
    }
    const message = `Hello ${order.customer?.name || 'Customer'},\nHere is your receipt for invoice: ${order.invoiceNumber}.\nTotal Amount: ₹${order.totalPayable}\nThank you for shopping with us!`;
    const waUrl = `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Status Badges
  const renderStatusBadge = (status: string = 'COMPLETED') => {
    const norm = status.toUpperCase();
    if (norm === 'COMPLETED' || norm === 'SUCCESS' || norm === 'PAID') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          Completed
        </span>
      );
    }
    if (norm === 'CANCELLED') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          Cancelled
        </span>
      );
    }
    if (norm === 'PARKED' || norm === 'PROCESSING') {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          Processing
        </span>
      );
    }
    if (norm === 'RETURNED' || norm === 'REFUNDED') {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
          Returned
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
        Pending
      </span>
    );
  };

  // Payment Badges
  const renderPaymentBadge = (method: string) => {
    const norm = method ? method.toUpperCase() : 'CASH';
    if (norm === 'CASH') {
      return (
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
          Cash
        </span>
      );
    }
    if (norm === 'UPI') {
      return (
        <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
          UPI
        </span>
      );
    }
    if (norm === 'CARD') {
      return (
        <span className="bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
          Card
        </span>
      );
    }
    if (norm === 'NETBANKING' || norm === 'NET BANKING') {
      return (
        <span className="bg-purple-50 text-purple-800 border border-purple-100 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
          Net Banking
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
        Wallet
      </span>
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 select-none font-sans text-sm text-slate-800 text-left p-8 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Order Hub</h1>
          <p className="text-xs text-slate-500 font-normal mt-1">Dedicated order management console, transaction lookup, status logs, and receipt retrieval.</p>
        </div>
      </div>

      {/* Redesigned Clean White KPI Cards with Premium Hover Behavior */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Volume */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[110px] hover:shadow-md hover:border-indigo-500 hover:bg-indigo-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider block">Total Volume</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2 group-hover:text-indigo-600 transition-colors">
            {metrics.total} <span className="text-xs font-normal text-slate-500 group-hover:text-indigo-500 transition-colors">Orders</span>
          </span>
        </div>

        {/* Card 2: Order Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[110px] hover:shadow-md hover:border-purple-500 hover:bg-purple-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider block">Order Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2 group-hover:text-purple-600 transition-colors">
            ₹{metrics.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[110px] hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider block">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2 group-hover:text-emerald-600 transition-colors">
            {metrics.completed} <span className="text-xs font-normal text-slate-500 group-hover:text-emerald-500 transition-colors">Paid</span>
          </span>
        </div>

        {/* Card 4: Queue Status */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[110px] hover:shadow-md hover:border-amber-500 hover:bg-amber-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider block">Queue Status</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2 group-hover:text-amber-600 transition-colors">
            {(metrics.pending + metrics.processing)} <span className="text-xs font-normal text-slate-500 group-hover:text-amber-500 transition-colors">Active</span>
          </span>
        </div>

        {/* Card 5: Cancelled */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[110px] hover:shadow-md hover:border-rose-500 hover:bg-rose-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider block">Cancelled</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2 group-hover:text-rose-600 transition-colors">
            {metrics.cancelled} <span className="text-xs font-normal text-slate-500 group-hover:text-rose-500 transition-colors">Dropped</span>
          </span>
        </div>
      </div>

      {/* Advanced Filters & Search Console */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search & Filter Console</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Term */}
          <div className="space-y-1">
            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">Search Query</label>
            <input
              type="text"
              placeholder="ID, name, phone, invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-55"
            />
          </div>

          {/* Time Preset */}
          <div className="space-y-1">
            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">Date Filter</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full bg-slate-55 border border-slate-250 rounded-xl px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none cursor-pointer"
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

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-55 border border-slate-250 rounded-xl px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-55 border border-slate-250 rounded-xl px-3 py-2 text-xs font-normal text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Net Banking</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-slate-55 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-normal text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-normal text-slate-500 uppercase tracking-wider block">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-slate-55 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-normal text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Full-Width Orders Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Orders List Ledger</h2>
          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{filteredOrders.length} transaction entries</span>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-slate-500 text-xs font-normal uppercase tracking-wider text-left bg-slate-50 select-none">
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Mobile Number</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Payment Method</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Order Date</th>
                <th className="px-4 py-3 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-normal italic">
                    Loading orders records from database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-normal italic">
                    No orders matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const qty = order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }}
                      className="hover:bg-indigo-50/20 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-4 font-mono font-normal text-slate-900">{order.invoiceNumber || order.id.slice(0, 8)}</td>
                      <td className="px-4 py-4 font-normal text-slate-800">{order.customer?.name || 'Walk-in Customer'}</td>
                      <td className="px-4 py-4 font-normal text-slate-500">{order.customer?.phone || order.customerMobile || 'N/A'}</td>
                      <td className="px-4 py-4 text-center font-normal text-slate-600">{qty}</td>
                      <td className="px-4 py-4 text-right font-normal text-slate-900">
                        ₹{order.totalPayable.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">{renderPaymentBadge(order.paymentMethod)}</td>
                      <td className="px-4 py-4 text-center">{renderStatusBadge(order.status)}</td>
                      <td className="px-4 py-4 text-right font-normal text-slate-450">{new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-4 text-right pr-6">
                        <button 
                          className="text-indigo-650 hover:text-indigo-900 font-medium hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL ORDER TRANSACTION MODAL VIEW */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 flex flex-col max-h-[90vh] text-slate-800">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Order Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:bg-slate-100 rounded-lg p-1 transition font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-5 text-xs text-left">
              
              {/* Order Info & Customer Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-55 border border-slate-200/80 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Order Details</span>
                  <p className="font-semibold">Order ID: <span className="font-normal text-slate-600">{selectedOrder.id}</span></p>
                  <p className="font-semibold">Invoice No: <span className="font-normal text-slate-600">{selectedOrder.invoiceNumber}</span></p>
                  <p className="font-semibold">Date: <span className="font-normal text-slate-600">{new Date(selectedOrder.createdAt).toLocaleString()}</span></p>
                  <p className="font-semibold">Cashier: <span className="font-normal text-slate-600">{selectedOrder.cashier?.name || 'Admin'}</span></p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Customer Info</span>
                  <p className="font-semibold">Name: <span className="font-normal text-slate-600">{selectedOrder.customer?.name || 'Walk-in Customer'}</span></p>
                  <p className="font-semibold">Phone: <span className="font-normal text-slate-600">{selectedOrder.customer?.phone || selectedOrder.customerMobile || 'N/A'}</span></p>
                  <p className="font-semibold">Status: <span className="font-normal uppercase text-slate-600">{selectedOrder.status || 'COMPLETED'}</span></p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-55 border border-slate-200/80 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider border-b border-slate-100 pb-1">Payment Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <p className="font-semibold">Subtotal: <span className="font-normal text-slate-600">₹{selectedOrder.subtotal.toFixed(2)}</span></p>
                  <p className="font-semibold">GST Tax: <span className="font-normal text-slate-600">₹{selectedOrder.tax.toFixed(2)}</span></p>
                  <p className="font-semibold">Discount: <span className="font-normal text-rose-600">-₹{selectedOrder.discount.toFixed(2)}</span></p>
                  <p className="font-semibold">Payment Method: <span className="font-normal uppercase text-slate-600">{selectedOrder.paymentMethod}</span></p>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-base font-bold text-emerald-700">₹{selectedOrder.totalPayable}</span>
                </div>
              </div>

              {/* Product Breakdown List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product List</span>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-250 text-slate-600 text-xs font-semibold bg-slate-50">
                        <th className="px-4 py-2">Product Name</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right pr-4">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {(selectedOrder.items || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-slate-900 truncate max-w-[150px]">{item.product?.name || 'Item'}</td>
                          <td className="px-4 py-2.5 text-center">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right pr-4 font-semibold text-slate-900">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Timeline Visual representation */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Timeline</span>
                <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">1</div>
                    <span className="text-[10px] font-semibold mt-1 text-slate-700">Placed</span>
                  </div>
                  <div className="h-0.5 bg-emerald-300 flex-1"></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">2</div>
                    <span className="text-[10px] font-semibold mt-1 text-slate-700">Paid</span>
                  </div>
                  <div className="h-0.5 bg-emerald-300 flex-1"></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      (selectedOrder.status || '').toUpperCase() === 'CANCELLED' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>3</div>
                    <span className="text-[10px] font-semibold mt-1 text-slate-700">
                      {(selectedOrder.status || '').toUpperCase() === 'CANCELLED' ? 'Cancelled' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 font-semibold border-t border-slate-100">
              <div className="flex gap-2 col-span-2">
                <button
                  onClick={() => handleDownloadPDF(selectedOrder)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> View Invoice
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('selectedInvoice', JSON.stringify(selectedOrder));
                    navigate('/invoice');
                    setTimeout(() => window.print(), 350);
                  }}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-500" /> Print Invoice
                </button>
              </div>
              
              <button
                onClick={() => {
                  localStorage.setItem('selectedInvoice', JSON.stringify(selectedOrder));
                  navigate('/invoice');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition cursor-pointer text-center uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => handleSendWhatsApp(selectedOrder)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition cursor-pointer text-center uppercase flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Receipt
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersPage;
