import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  FileText,
  ArrowRight,
  Package
} from 'lucide-react';

export const KitchenDashboard: React.FC = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const [orderData, requestData] = await Promise.all([
        apiRequest('/restaurant/orders').catch(() => []),
        apiRequest('/suppliers/kitchen-requests').catch(() => [])
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setRequests(Array.isArray(requestData) ? requestData : []);
    } catch (err) {
      console.warn('Failed to load metrics, using fallbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const newCount = orders.filter(o => o.status === 'NEW').length;
  const preparingCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto p-4 text-left">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
            Kitchen Dashboard
          </span>
          <h1 className="text-3xl font-normal mt-3 tracking-tight text-white">
            Kitchen Operations Control
          </h1>
          <p className="text-slate-300 mt-1 font-medium text-sm">
            Monitor real-time food preparation, manage ingredients inventory requests, and track chef recipe settings.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Orders', count: newCount, color: 'border-t-blue-500', bg: 'bg-blue-50/10', action: () => navigate('/restaurant/kitchen') },
          { label: 'Preparing Orders', count: preparingCount, color: 'border-t-amber-500', bg: 'bg-amber-50/10', action: () => navigate('/restaurant/kitchen') },
          { label: 'Ready Orders', count: readyCount, color: 'border-t-emerald-500', bg: 'bg-emerald-50/10', action: () => navigate('/restaurant/kitchen') },
          { label: 'Pending Requests', count: pendingRequestsCount, color: 'border-t-purple-500', bg: 'bg-purple-50/10', action: () => navigate('/restaurant/inventory-requests') }
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={card.action}
            className={`p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-t-[3px] ${card.color} ${card.bg} text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
            <span className="text-3xl font-normal text-black dark:text-white block leading-none">{card.count}</span>
          </button>
        ))}
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center text-emerald-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white text-base">Kitchen Orders Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access the live Kitchen Display Screen to accept and process food orders.</p>
          </div>
          <button
            onClick={() => navigate('/restaurant/kitchen')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Open KDS <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/20 rounded-xl flex items-center justify-center text-purple-650">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white text-base">Inventory Requests</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Request low stock raw materials and ingredients for procurement approval.</p>
          </div>
          <button
            onClick={() => navigate('/restaurant/inventory-requests')}
            className="w-full bg-purple-655 hover:bg-purple-700 text-white py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Create Request <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white text-base">Recipe Management</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Map dish menu items to ingredients for automatic stock deduction.</p>
          </div>
          <button
            onClick={() => navigate('/restaurant/recipes')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Manage Recipes <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Overview Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders List Summary */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <h3 className="font-medium text-black dark:text-white text-lg mb-4">Active Preparation Queue</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 space-y-3">
            {orders.filter(o => o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'ACCEPTED').length === 0 ? (
              <p className="text-xs text-slate-450 italic py-6 text-center">No active preparation orders currently.</p>
            ) : (
              orders.filter(o => o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'ACCEPTED').slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="font-semibold text-black dark:text-white text-sm">Table T{order.table?.tableNumber?.replace(/\D/g, '') || 'Takeaway'}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">#{order.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'NEW' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">{order.items?.length || 0} items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inventory Requests Summary */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <h3 className="font-medium text-black dark:text-white text-lg mb-4">Recent Inventory Requests</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 space-y-3">
            {requests.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-6 text-center">No inventory requests created yet.</p>
            ) : (
              requests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="font-semibold text-black dark:text-white text-sm">{req.requestNo}</h4>
                    <span className="text-[11px] text-slate-400">By: {req.requestedBy}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'Pending Approval' || req.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                      req.status === 'Approved' ? 'bg-blue-50 text-blue-700' :
                      req.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {req.status === 'Converted' ? 'Converted To PO' : req.status}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;
