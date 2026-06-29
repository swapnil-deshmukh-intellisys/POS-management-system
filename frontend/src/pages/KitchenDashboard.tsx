import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  X,
  Trash2,
  Clock,
  UserCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const dummyPreparingOrders = [
  { id: 'd-ord-1', orderNo: 'ORD-2026-925', tableNo: 'T1', customerName: 'Aman Sharma', chef: 'Chef Adesh', prepTime: '15 mins', status: 'PREPARING' },
  { id: 'd-ord-2', orderNo: 'ORD-2026-924', tableNo: 'T3', customerName: 'Neha Patel', chef: 'Chef Rohan', prepTime: '12 mins', status: 'PREPARING' },
  { id: 'd-ord-3', orderNo: 'ORD-2026-923', tableNo: 'T4', customerName: 'Vikram Singh', chef: 'Chef Amit', prepTime: '18 mins', status: 'PREPARING' },
  { id: 'd-ord-4', orderNo: 'ORD-2026-922', tableNo: 'T2', customerName: 'Pooja Roy', chef: 'Chef Priya', prepTime: '22 mins', status: 'PREPARING' },
  { id: 'd-ord-5', orderNo: 'ORD-2026-921', tableNo: 'T6', customerName: 'Rohan Joshi', chef: 'Chef Adesh', prepTime: '8 mins', status: 'PREPARING' },
  { id: 'd-ord-6', orderNo: 'ORD-2026-920', tableNo: 'Takeaway', customerName: 'Sunita Rao', chef: 'Chef Rohan', prepTime: '14 mins', status: 'PREPARING' },
  { id: 'd-ord-7', orderNo: 'ORD-2026-919', tableNo: 'T5', customerName: 'Amit Verma', chef: 'Chef Amit', prepTime: '25 mins', status: 'PREPARING' },
  { id: 'd-ord-8', orderNo: 'ORD-2026-918', tableNo: 'T8', customerName: 'Deepa Sen', chef: 'Chef Priya', prepTime: '11 mins', status: 'PREPARING' },
  { id: 'd-ord-9', orderNo: 'ORD-2026-917', tableNo: 'T7', customerName: 'Karan Malhotra', chef: 'Chef Adesh', prepTime: '16 mins', status: 'PREPARING' },
  { id: 'd-ord-10', orderNo: 'ORD-2026-916', tableNo: 'T10', customerName: 'Simran Kaur', chef: 'Chef Rohan', prepTime: '19 mins', status: 'PREPARING' },
  { id: 'd-ord-11', orderNo: 'ORD-2026-915', tableNo: 'T9', customerName: 'Kabir Dev', chef: 'Chef Amit', prepTime: '13 mins', status: 'PREPARING' },
  { id: 'd-ord-12', orderNo: 'ORD-2026-914', tableNo: 'T12', customerName: 'Jaya Nair', chef: 'Chef Priya', prepTime: '20 mins', status: 'PREPARING' },
  { id: 'd-ord-13', orderNo: 'ORD-2026-913', tableNo: 'Takeaway', customerName: 'Rajesh Gupta', chef: 'Chef Adesh', prepTime: '6 mins', status: 'PREPARING' },
  { id: 'd-ord-14', orderNo: 'ORD-2026-912', tableNo: 'T11', customerName: 'Meera Deshmukh', chef: 'Chef Rohan', prepTime: '17 mins', status: 'PREPARING' },
  { id: 'd-ord-15', orderNo: 'ORD-2026-911', tableNo: 'T14', customerName: 'Vijay Khanna', chef: 'Chef Amit', prepTime: '21 mins', status: 'PREPARING' },
  { id: 'd-ord-16', orderNo: 'ORD-2026-910', tableNo: 'T15', customerName: 'Anjali Bose', chef: 'Chef Priya', prepTime: '10 mins', status: 'PREPARING' },
  { id: 'd-ord-17', orderNo: 'ORD-2026-909', tableNo: 'T16', customerName: 'Sanjay Dutt', chef: 'Chef Adesh', prepTime: '15 mins', status: 'PREPARING' },
  { id: 'd-ord-18', orderNo: 'ORD-2026-908', tableNo: 'T18', customerName: 'Rita Sen', chef: 'Chef Rohan', prepTime: '24 mins', status: 'PREPARING' },
  { id: 'd-ord-19', orderNo: 'ORD-2026-907', tableNo: 'T17', customerName: 'Vijay Iyer', chef: 'Chef Amit', prepTime: '14 mins', status: 'PREPARING' },
  { id: 'd-ord-20', orderNo: 'ORD-2026-906', tableNo: 'T20', customerName: 'Geeta Phogat', chef: 'Chef Priya', prepTime: '12 mins', status: 'PREPARING' }
];

export const KitchenDashboard: React.FC = () => {
  const { apiRequest, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formItems, setFormItems] = useState<any[]>([
    { productName: '', quantity: '10', unit: 'Kg', notes: '' }
  ]);
  const [formLoading, setFormLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');



  const generateDummyRequests = () => {
    const baseRequests: any[] = [];
    const itemsPool = [
      { name: 'Tomato', unit: 'Kg' },
      { name: 'Onion', unit: 'Kg' },
      { name: 'Cheese', unit: 'Kg' },
      { name: 'Paneer', unit: 'Kg' },
      { name: 'Oil', unit: 'Liter' },
      { name: 'Milk', unit: 'Liter' },
      { name: 'Butter', unit: 'Kg' },
      { name: 'Rice', unit: 'Kg' }
    ];

    const getRandomItems = (count: number) => {
      const selected = [];
      for (let i = 0; i < count; i++) {
        const item = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        selected.push({
          productName: item.name,
          quantity: Math.floor(Math.random() * 20) + 5,
          unit: item.unit,
          notes: i === 0 ? 'Urgent procurement' : ''
        });
      }
      return selected;
    };

    // 20 Sample Requests
    for (let i = 1; i <= 20; i++) {
      const status = i > 18 ? 'Rejected' : 'Pending Approval';
      baseRequests.push({
        id: `mock-pending-${i}`,
        requestNo: `KR-2026-${String(100 + i).padStart(5, '0')}`,
        requestedBy: i % 2 === 0 ? 'Chef Adesh' : 'Kitchen Manager',
        status: status,
        createdAt: new Date(Date.now() - (i * 2 * 3600 * 1000)).toISOString(),
        items: getRandomItems(Math.floor(Math.random() * 3) + 1)
      });
    }

    // 10 Approved Requests
    for (let i = 1; i <= 10; i++) {
      baseRequests.push({
        id: `mock-approved-${i}`,
        requestNo: `KR-2026-${String(200 + i).padStart(5, '0')}`,
        requestedBy: 'Kitchen Manager',
        status: 'Approved',
        createdAt: new Date(Date.now() - (i * 3 * 3600 * 1000) - 24 * 3600 * 1000).toISOString(),
        items: getRandomItems(Math.floor(Math.random() * 3) + 1),
        approvedAt: new Date(Date.now() - (i * 3 * 3600 * 1000) - 20 * 3600 * 1000).toISOString()
      });
    }

    // 15 Purchase Orders (Converted, etc.)
    for (let i = 1; i <= 15; i++) {
      const status = i <= 5 ? 'Delivered' : i <= 10 ? 'Supplier Order Sent' : 'Converted';
      const poNum = `PO-2026-${String(300 + i).padStart(5, '0')}`;
      baseRequests.push({
        id: `mock-po-${i}`,
        requestNo: `KR-2026-${String(300 + i).padStart(5, '0')}`,
        requestedBy: 'Chef Adesh',
        status: status,
        createdAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 3 * 24 * 3600 * 1000).toISOString(),
        items: getRandomItems(Math.floor(Math.random() * 2) + 1),
        approvedAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 2 * 24 * 3600 * 1000).toISOString(),
        convertedAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 1.5 * 24 * 3600 * 1000).toISOString(),
        purchaseOrderId: `po-id-${i}`,
        purchaseOrder: {
          id: `po-id-${i}`,
          orderNumber: poNum,
          status: status === 'Delivered' ? 'Delivered' : status === 'Supplier Order Sent' ? 'Sent' : 'Pending',
          expectedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
          totalAmount: (Math.floor(Math.random() * 300) + 100) * 10,
          paymentStatus: i % 2 === 0 ? 'Paid' : 'Unpaid',
          createdAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 1.5 * 24 * 3600 * 1000).toISOString(),
        }
      });
    }

    return baseRequests;
  };

  const fetchMetrics = async () => {
    try {
      const [orderData, requestData] = await Promise.all([
        apiRequest('/restaurant/orders').catch(() => []),
        apiRequest('/suppliers/kitchen-requests').catch(() => [])
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      
      const dbRequests = Array.isArray(requestData) ? requestData : [];
      const dbRequestNos = new Set(dbRequests.map(r => r.requestNo));
      const dummyRequests = generateDummyRequests().filter(r => !dbRequestNos.has(r.requestNo));
      const finalRequests = [...dbRequests, ...dummyRequests];
      setRequests(finalRequests);
    } catch (err) {
      console.warn('Failed to load metrics, using fallbacks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const sups = await apiRequest('/suppliers').catch(() => []);
      setSuppliers(Array.isArray(sups) ? sups : []);
    } catch (err) {
      console.warn('Failed to load suppliers.');
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (user?.role === 'ADMIN') {
      fetchSuppliers();
    }

    // Realtime connection via SSE
    const API_BASE = window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : `${window.location.protocol}//${window.location.hostname}:5000/api`;
    const eventSource = new EventSource(`${API_BASE}/restaurant/realtime`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'ORDER_MUTATED' || payload.event === 'STOCK_REQUEST_MUTATED') {
          fetchMetrics();
        }
      } catch (e) {
        // fail silently
      }
    };

    // Also listen to custom window events
    const handleMutation = () => {
      fetchMetrics();
    };
    window.addEventListener('stock-request-mutated', handleMutation);
    window.addEventListener('order-mutated', handleMutation);

    return () => {
      eventSource.close();
      window.removeEventListener('stock-request-mutated', handleMutation);
      window.removeEventListener('order-mutated', handleMutation);
    };
  }, [user]);

  const handleSaveStockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      for (const it of formItems) {
        if (!it.productName.trim()) {
          throw new Error('Please select/enter a product name.');
        }
        const qty = parseFloat(String(it.quantity));
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Quantity must be a positive number.');
        }
      }

      const itemsPayload = formItems.map(it => ({
        productName: it.productName,
        quantity: parseFloat(String(it.quantity)) || 0,
        unit: it.unit,
        notes: it.notes || ''
      }));

      const isUserAdmin = user?.role === 'ADMIN';

      // 1. Create Stock Request
      const newRequest = await apiRequest('/suppliers/kitchen-requests', {
        method: 'POST',
        body: JSON.stringify({ 
          items: itemsPayload,
          createdBy: isUserAdmin ? 'Admin' : 'Kitchen'
        })
      });

      // Prepend immediately to support zero-delay local updates
      setRequests(prev => [newRequest, ...prev]);



      // Trigger real-time event
      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: newRequest }));
      alert(`Request Submitted Successfully!\n\nRequest Number:\n${newRequest.requestNo}\n\nStatus:\nPending Approval`);

      setShowCreateModal(false);
      setFormItems([{ productName: '', quantity: '10', unit: 'Kg', notes: '' }]);
      setSelectedSupplierId('');
      fetchMetrics();
    } catch (error: any) {
      alert(error.message || 'Error submitting inventory request');
    } finally {
      setFormLoading(false);
    }
  };

  const addFormRow = () => {
    setFormItems(prev => [...prev, { productName: '', quantity: '10', unit: 'Kg', notes: '' }]);
  };

  const removeFormRow = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFormItemChange = (idx: number, field: string, val: string) => {
    setFormItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  // Convert active database orders into queue-compatible items
  const activeDbOrders = orders
    .filter(o => o.status === 'PREPARING' || o.status === 'ACCEPTED' || o.status === 'NEW')
    .map(o => ({
      id: o.id,
      orderNo: `ORD-${o.id.slice(-4).toUpperCase()}`,
      tableNo: `T${o.table?.tableNumber?.replace(/\D/g, '') || 'Takeaway'}`,
      customerName: o.customerName || o.customer?.name || 'Walk-in Guest',
      chef: o.chefName || 'Chef Adesh',
      prepTime: '8 mins',
      status: o.status
    }));

  const finalPreparationQueue = [...activeDbOrders, ...dummyPreparingOrders];

  // Helper for generating custom skeleton panels
  const renderSkeletonPanel = () => (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-pulse">
      <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    </div>
  );

  if (loading) {
    return renderSkeletonPanel();
  }

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto p-4 text-left font-sans">
      
      {/* 1. Kitchen Overview Section */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-normal text-black dark:text-white">
              Kitchen Overview
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Live metrics, quick operation triggers, and active kitchen session statistics.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200 self-start md:self-auto uppercase tracking-wider">
            Active Session
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div 
            onClick={() => navigate('/restaurant/kitchen?status=PREPARING')}
            className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-450 block uppercase tracking-wider font-semibold">Active Prep Queue</span>
            <strong className="text-3xl font-semibold text-amber-605 mt-2 block leading-none">
              {orders.filter(o => o.status === 'PREPARING' || o.status === 'ACCEPTED' || o.status === 'NEW').length}
            </strong>
          </div>
          <div 
            onClick={() => navigate('/restaurant/inventory-requests')}
            className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-450 block uppercase tracking-wider font-semibold">Recent Requests</span>
            <strong className="text-3xl font-semibold text-black dark:text-white mt-2 block leading-none">
              {requests.length}
            </strong>
          </div>
          <div 
            onClick={() => navigate('/restaurant/suppliers?tab=requests&search=Pending')}
            className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-450 block uppercase tracking-wider font-semibold">Pending Requests</span>
            <strong className="text-3xl font-semibold text-blue-600 mt-2 block leading-none">
              {requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length}
            </strong>
          </div>
          <div 
            onClick={() => navigate('/restaurant/suppliers?tab=orders')}
            className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-450 block uppercase tracking-wider font-semibold">Approved Orders</span>
            <strong className="text-3xl font-semibold text-emerald-600 mt-2 block leading-none">
              {requests.filter(r => r.status === 'Approved' || r.status === 'Converted').length}
            </strong>
          </div>
          <div 
            onClick={() => navigate('/restaurant/suppliers?tab=history')}
            className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <span className="text-xs text-slate-450 block uppercase tracking-wider font-semibold">Completed History</span>
            <strong className="text-3xl font-semibold text-purple-600 mt-2 block leading-none">
              {requests.filter(r => r.status === 'Delivered').length}
            </strong>
          </div>
        </div>
      </section>

      {/* 2. Quick Actions Section */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-normal text-black dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm uppercase tracking-wider transition shadow-sm border border-emerald-650 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Inventory Request
          </button>
          <button
            onClick={() => navigate('/restaurant/kitchen')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm uppercase tracking-wider transition shadow-sm border border-emerald-650 cursor-pointer active:scale-[0.98]"
          >
            <Clock className="w-4 h-4" /> View Kitchen Orders
          </button>
        </div>
      </section>

      {/* Two Column Layout for Middle Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 3. Active Preparation Queue Section */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 
              onClick={() => navigate('/restaurant/kitchen?status=PREPARING')}
              className="text-lg font-normal text-black dark:text-white hover:text-emerald-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              Active Preparation Queue <ArrowRight className="w-4 h-4" />
            </h2>
            <span className="text-xs font-semibold text-slate-450 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
              Total: {finalPreparationQueue.length} Orders
            </span>
          </div>
          
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 scrollbar-thin flex-1">
            {finalPreparationQueue.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate('/restaurant/kitchen?status=PREPARING')}
                className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-750 hover:shadow-md hover:scale-[1.01] transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="font-semibold text-black dark:text-white text-sm">{item.orderNo}</strong>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-750 dark:text-slate-350">{item.tableNo}</span>
                  </div>
                  <p className="text-xs text-slate-455 mt-1 truncate">Guest: {item.customerName} | Chef: {item.chef}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 font-semibold">{item.prepTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Recent Inventory Requests Section */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 
              onClick={() => navigate('/restaurant/inventory-requests')}
              className="text-lg font-normal text-black dark:text-white hover:text-emerald-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              Recent Inventory Requests <ArrowRight className="w-4 h-4" />
            </h2>
            <span className="text-xs font-semibold text-slate-450 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">Newest First</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 scrollbar-thin flex-1">
            {requests.length === 0 ? (
              <p className="text-xs text-slate-450 italic py-8 text-center">No inventory requests created yet.</p>
            ) : (
              [...requests]
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((req) => (
                  <div 
                    key={req.id} 
                    onClick={() => navigate(`/restaurant/inventory-requests?id=${req.id}`)}
                    className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-750 hover:shadow-md hover:scale-[1.01] transition cursor-pointer space-y-2 text-[13px]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <strong className="font-semibold text-black dark:text-white">{req.requestNo}</strong>
                        <span className="text-xs text-slate-400">({req.items?.length || 0} items)</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        req.status === 'Pending Approval' || req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        req.status === 'Approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        req.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-250'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                      <div>Requested By: <strong className="text-black dark:text-white font-medium">{req.requestedBy || 'Chef'}</strong></div>
                      <div>Created Date & Time: <strong className="text-black dark:text-white font-medium">{new Date(req.createdAt).toLocaleString()}</strong></div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

      </div>



      {/* 7. Kitchen Performance Summary Section */}
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-normal text-black dark:text-white mb-6">
          Kitchen Performance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Chef Roster Stats */}
          <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/30 space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Chef roster
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { name: 'Chef Adesh', speed: '12m', rating: '94%' },
                { name: 'Chef Rohan', speed: '14m', rating: '91%' },
                { name: 'Chef Priya', speed: '11m', rating: '96%' }
              ].map((chef, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold text-black dark:text-white">{chef.name}</span>
                  <span className="text-slate-500">Speed: {chef.speed} | Rating: <strong className="text-emerald-600 font-semibold">{chef.rating}</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Speed Index Stats */}
          <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/30 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-emerald-600" /> Prep Speed Index
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-normal text-black dark:text-white">13.5</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">minutes / order</span>
              </div>
              <p className="text-[11px] text-slate-450 mt-2 font-semibold">
                Status: <span className="text-emerald-600 font-bold">Optimal Speed</span>
              </p>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <span>Peak: <strong>16.2m</strong></span>
              <span>Off-peak: <strong>10.8m</strong></span>
            </div>
          </div>

          {/* Priority Alerts Stats */}
          <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/30 space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" /> Priority Alerts
            </h3>
            <div className="space-y-3">
              {[
                { orderNo: 'ORD-2026-922', tableNo: 'T2', delay: '7 mins' },
                { orderNo: 'ORD-2026-919', tableNo: 'T5', delay: '4 mins' }
              ].map((d, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-150 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-red-750 dark:text-red-400">{d.orderNo}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({d.tableNo})</span>
                  </div>
                  <strong className="text-red-650 font-semibold">{d.delay} delay</strong>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CREATE REQUEST MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 relative max-h-[90vh] flex flex-col text-left">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-black dark:text-white hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
            <h3 className="font-medium text-black dark:text-white text-xl mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">
              Create Inventory Request
            </h3>

            <form onSubmit={handleSaveStockRequest} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-normal text-black dark:text-slate-200 scrollbar-thin">
                
                {/* Created By Field (Read-only) */}
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Request Created By</label>
                    <input
                      type="text"
                      readOnly
                      value={user?.role === 'ADMIN' ? 'Admin' : 'Kitchen'}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-300 font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Supplier Selection for Admin Auto-Conversion to PO */}
                  {user?.role === 'ADMIN' && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Select Supplier * (Required for Auto Purchase Order)</label>
                      <select
                        required
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs text-black dark:text-white font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select Supplier --</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">Requested Items</span>
                    <button
                      type="button"
                      onClick={addFormRow}
                      className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-655 text-black dark:text-white px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex-1">
                        <label className="text-[9px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Item Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tomato, Oil"
                          value={item.productName}
                          onChange={(e) => handleFormItemChange(idx, 'productName', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black dark:text-white font-semibold"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Qty *</label>
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleFormItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black dark:text-white font-semibold"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Unit *</label>
                        <select
                          required
                          value={item.unit}
                          onChange={(e) => handleFormItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black dark:text-white font-semibold cursor-pointer"
                        >
                          <optgroup label="Weight">
                            <option value="g">Gram (g)</option>
                            <option value="Kg">Kilogram (Kg)</option>
                          </optgroup>
                          <optgroup label="Liquid">
                            <option value="ml">Milliliter (ml)</option>
                            <option value="L">Liter (L)</option>
                          </optgroup>
                          <optgroup label="Count">
                            <option value="Piece">Piece</option>
                            <option value="Dozen">Dozen</option>
                          </optgroup>
                          <optgroup label="Packaging">
                            <option value="Packet">Packet</option>
                            <option value="Box">Box</option>
                            <option value="Bag">Bag</option>
                            <option value="Carton">Carton</option>
                            <option value="Crate">Crate</option>
                          </optgroup>
                          <optgroup label="Restaurant">
                            <option value="Bottle">Bottle</option>
                            <option value="Can">Can</option>
                            <option value="Tray">Tray</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="flex-[1.5]">
                        <label className="text-[9px] font-semibold text-slate-550 dark:text-slate-400 uppercase block mb-1">Notes</label>
                        <input
                          type="text"
                          placeholder="Specifications"
                          value={item.notes}
                          onChange={(e) => handleFormItemChange(idx, 'notes', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black dark:text-white font-semibold"
                        />
                      </div>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFormRow(idx)}
                          className="mt-4 p-2 bg-red-50 hover:bg-red-105 text-red-655 dark:bg-slate-800 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 shrink-0">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all duration-200 disabled:opacity-50"
                >
                  {formLoading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-transparent border border-slate-350 text-black dark:text-white font-medium px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
