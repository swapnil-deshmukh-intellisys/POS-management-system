import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  CircleDollarSign,
  CreditCard,
  Layers,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();

  // Cache dashboard data for instant load
  const [data, setData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('pos_dashboard_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(!data);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('week');

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest('/dashboard/metrics');
      setData(res);
      localStorage.setItem('pos_dashboard_data', JSON.stringify(res));
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeTimer);
    };
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50">
        <Activity className="w-10 h-10 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Compiling premium analytics dashboard...</span>
      </div>
    );
  }

  // Greeting logic
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours >= 5 && hours < 12) return 'Good Morning';
    if (hours >= 12 && hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };



  const getStatusLevel = (score: number) => {
    if (score >= 80) return { label: 'Good', dot: 'bg-emerald-500', text: 'text-emerald-750', bg: 'bg-emerald-50 border-emerald-100' };
    if (score >= 50) return { label: 'Warning', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };
    return { label: 'Critical', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-100' };
  };

  const currentStats = data.timeframes[activeTimeframe];

  return (
    <div className="space-y-8 select-none bg-slate-50 -m-8 p-8 min-h-screen text-slate-900 font-sans antialiased">

      {/* 1. PREMIUM DASHBOARD HERO SECTION */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 z-10 relative">
          <div className="space-y-2 text-left">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs uppercase font-medium tracking-wider px-3 py-1 rounded-full inline-block">
              Business Command Center
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {getGreeting()}, {user?.name ? user.name.trim().split(' ')[0] : 'Admin'}
            </h1>
            <p className="text-slate-300 text-xs font-normal max-w-xl text-left">
              Real-time store statistics, payment distributions, inventory levels and active sales streams are fully synchronized.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-normal text-slate-300 justify-start">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Store Status: <strong className="text-white font-semibold">OPEN</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>System Status: <strong className="text-white font-semibold">ONLINE</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Active Counter: <strong className="text-white font-semibold">#01</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            {/* Live Clock */}
            <div className="text-center sm:text-right pr-0 sm:pr-4 border-r-0 sm:border-r border-white/10">
              <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">Current Time</span>
              <span className="text-xl font-bold text-white font-mono tracking-wider">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">Today's Date</span>
              <div className="flex items-center gap-1.5 text-white font-bold text-sm mt-0.5 justify-center sm:justify-start">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S BUSINESS SUMMARY */}
      <div className="space-y-4 text-left">
        <h2 className="text-lg font-bold text-slate-950 tracking-tight block">
          Today's Business Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Card 1: Today's Revenue (Green Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Today's Revenue</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                ₹{data.health.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 uppercase inline-block">
                Completed Sales
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Today's Orders (Blue Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Today's Orders</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                {data.health.todayOrders} Bills
              </h3>
              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 uppercase inline-block">
                Transactions
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Today's Profit (Emerald Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-emerald-650 hover:bg-emerald-50/20 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Today's Profit</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-emerald-750 transition-colors">
                ₹{data.health.todayProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 uppercase inline-block">
                Net Margin
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: New Customers (Cyan Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-cyan-500 hover:bg-cyan-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">New Customers</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-cyan-600 transition-colors">
                +{data.health.todayCustomers} Members
              </h3>
              <span className="text-[10px] font-medium text-cyan-700 bg-cyan-50 border border-cyan-100 rounded px-2 py-0.5 uppercase inline-block">
                Enrollments
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5: Inventory Valuation (Orange Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-orange-500 hover:bg-orange-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Inventory Valuation</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-orange-600 transition-colors">
                ₹{data.health.inventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <span className="text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-0.5 uppercase inline-block">
                Warehouse Value
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 6: Pending Payments (Purple Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-purple-500 hover:bg-purple-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Pending Payments</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-purple-600 transition-colors">
                ₹{data.health.outstandingPayments.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
              <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded px-2 py-0.5 uppercase inline-block">
                Vendor Invoices
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 7: Low Stock Products (Amber Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-amber-500 hover:bg-amber-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Low Stock Products</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">
                {data.health.lowStockProducts} Items
              </h3>
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-0.5 uppercase inline-block">
                Threshold Alert
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 8: Out Of Stock (Red Accent) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between shadow-sm hover:shadow-md hover:border-red-500 hover:bg-red-50/10 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Out of Stock</span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-red-600 transition-colors">
                {data.actionRequired?.outOfStockProducts || 0} Items
              </h3>
              <span className="text-[10px] font-medium text-red-700 bg-red-50 border border-red-100 rounded px-2 py-0.5 uppercase inline-block">
                Empty Stock
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-sm group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* MID PANEL: CHARTS & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SALES STATUS */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Sales Status</h3>
              <p className="text-xs font-normal text-slate-500">Interactive performance widget</p>
            </div>
            {/* Period Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-center">
              {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setActiveTimeframe(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTimeframe === period
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Timeframe Revenue</span>
              <strong className="text-2xl font-bold text-slate-900 block mt-0.5">
                ₹{currentStats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Timeframe Profit</span>
              <strong className="text-2xl font-bold text-emerald-600 block mt-0.5">
                ₹{currentStats.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Completed Orders</span>
              <strong className="text-2xl font-bold text-slate-900 block mt-0.5">
                {currentStats.orderCount}
              </strong>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Customers Registered</span>
              <strong className="text-2xl font-bold text-slate-900 block mt-0.5">
                {currentStats.customerCount}
              </strong>
            </div>
          </div>

          <div className="h-64 w-full text-slate-700">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentStats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={500} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={500} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-xl space-y-1 text-xs text-left">
                          <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-widest">{label}</p>
                          <div className="space-y-0.5">
                            <div className="flex justify-between gap-6">
                              <span className="text-slate-400 font-normal">Revenue:</span>
                              <span className="font-bold text-white">₹{dataPoint.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-slate-400 font-normal">Orders:</span>
                              <span className="font-bold text-white">{dataPoint.orders ?? 0} Bills</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesPremium)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAYMENT SUMMARY */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Payment Summary</h3>
            <p className="text-xs font-normal text-slate-500">Payment contribution metrics (30d)</p>
          </div>

          <div className="space-y-2 my-auto">
            {data.paymentSummary && (
              <>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                      <CircleDollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">CASH</div>
                      <div className="text-[10px] text-slate-450 font-normal">Sales Mode</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">₹{data.paymentSummary.cashSales.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">UPI</div>
                      <div className="text-[10px] text-slate-450 font-normal">UPI Transfer</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">₹{data.paymentSummary.upiSales.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">CARD</div>
                      <div className="text-[10px] text-slate-450 font-normal">Card Swipe</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">₹{data.paymentSummary.cardSales.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 font-normal text-center">
            Updated live with transaction logs
          </div>
        </div>

      </div>

      {/* LOWER PANEL: TIMELINE, PERFORMANCE & STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* STORE STATUS CENTER */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Store Status Center</h3>
              <p className="text-xs font-normal text-slate-500">Real-time store operational health</p>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Inventory Status', score: 92, key: 'inv' },
                { name: 'Sales Status', score: 85, key: 'sales' },
                { name: 'Customer Activity', score: 78, key: 'cust' },
                { name: 'Supplier Activity', score: 89, key: 'supp' },
                { name: 'Payment Collection', score: 94, key: 'pay' }
              ].map((item) => {
                const status = getStatusLevel(item.score);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${status.label === 'Good' ? 'bg-emerald-500' :
                          status.label === 'Warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STOCK STATUS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-black text-black uppercase tracking-wider">Stock Status</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Real-time stocks breakdown</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <span className="text-[9px] font-black text-black uppercase block">Out of Stock</span>
                <strong className="text-xl font-black text-red-650 block mt-0.5">{data.actionRequired?.outOfStockProducts || 0}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <span className="text-[9px] font-black text-black uppercase block">Dead Stock</span>
                <strong className="text-xl font-black text-slate-905 block mt-0.5">2</strong>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Fast Moving Products</span>
              {data.topSellingProducts && data.topSellingProducts.map((prod: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-700 py-1 border-b border-slate-50">
                  <span className="truncate max-w-[150px]">{prod.name}</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black shrink-0">
                    {prod.unitsSold} Sold
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/inventory')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase py-3 rounded-2xl tracking-wider cursor-pointer mt-4 transition"
          >
            Review Stock Thresholds
          </button>
        </div>

        {/* RECENT ACTIVITIES */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-black uppercase tracking-wider">Recent Activities</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Live operational activity stream</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="relative border-l-2 border-slate-100 ml-2.5 space-y-4">
              {data.recentActivities && data.recentActivities.map((act: any, idx: number) => (
                <div key={idx} className="relative pl-5 text-xs text-slate-600">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
                  <h5 className="font-extrabold text-black">{act.message}</h5>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                    {new Date(act.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/sales-history')}
            className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs uppercase py-3 rounded-2xl tracking-wider cursor-pointer mt-4 transition"
          >
            Open Operation Logs
          </button>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3 text-left">
        <h2 className="text-lg font-bold text-slate-950 tracking-tight block">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/billing')}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-500 transition-all duration-300 group cursor-pointer flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">New Billing</h4>
              <p className="text-xs font-normal text-slate-400 mt-0.5 uppercase">Checkout Terminal</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/products?action=add')}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-500 transition-all duration-300 group cursor-pointer flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Add Product</h4>
              <p className="text-xs font-normal text-slate-400 mt-0.5 uppercase">Stock Master</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/customers?action=add')}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-cyan-500 transition-all duration-300 group cursor-pointer flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Add Customer</h4>
              <p className="text-xs font-normal text-slate-400 mt-0.5 uppercase">CRM Registration</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/purchases?action=create')}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-500 transition-all duration-300 group cursor-pointer flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Create Purchase</h4>
              <p className="text-xs font-normal text-slate-400 mt-0.5 uppercase">Procurement PO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
