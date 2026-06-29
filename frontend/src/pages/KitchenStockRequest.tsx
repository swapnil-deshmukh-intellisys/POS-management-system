import React, { useEffect, useState } from 'react';
import {
  Activity, Clock, X, Plus, Trash2, Printer, Download,
  CheckCircle2, ShoppingCart, Send, FileText, ChevronRight,
  Eye, Mail, MessageSquare, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Define TS Interfaces
interface RequestItem {
  productName: string;
  quantity: number | string;
  unit: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  rating?: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: 'Draft' | 'Pending' | 'Sent' | 'Confirmed' | 'Delivered' | 'Received';
  expectedDeliveryDate: string;
  totalAmount: number;
  paymentStatus: string;
  whatsappSentAt?: string;
  emailSentAt?: string;
  createdAt: string;
  items?: any;
  supplier?: Supplier;
}

interface StockRequest {
  id: string;
  requestNo: string;
  requestedBy: string;
  status: 'Pending' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted';
  createdAt: string;
  items: RequestItem[];
  approvedAt?: string;
  convertedAt?: string;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  createdBy?: string;
}

export const KitchenStockRequest: React.FC = () => {
  const auth = useAuth();
  const isAdmin = auth.user?.role === 'ADMIN' || auth.user?.role === 'MANAGER';

  // State Management
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [requestToConvert, setRequestToConvert] = useState<StockRequest | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  
  // Nested Purchase Order Modal
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // Create Request Form State
  const [formItems, setFormItems] = useState<RequestItem[]>([
    { productName: '', quantity: '10', unit: 'Kg', notes: '' }
  ]);
  const [formLoading, setFormLoading] = useState(false);
  const [submitPOError, setSubmitPOError] = useState('');

  // Active status filter (if any, triggered by summary card click)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Pending Approval' | 'Approved' | 'Converted'>('All');

  // Fetch Sourcing Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqData, actData, supplierData] = await Promise.all([
        auth.apiRequest('/suppliers/kitchen-requests').catch(() => []),
        auth.apiRequest('/suppliers/activities').catch(() => []),
        auth.apiRequest('/suppliers').catch(() => [])
      ]);

      // Merge database records with dummy data (ensuring no duplicate requestNo)
      const dbRequests = Array.isArray(reqData) ? reqData : [];
      const dbRequestNos = new Set(dbRequests.map(r => r.requestNo));
      const dummyRequests = generateDummyRequests().filter(r => !dbRequestNos.has(r.requestNo));
      
      const finalRequests = [...dbRequests, ...dummyRequests];
      
      // Always sort by created_at DESC (which is r.createdAt)
      finalRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRequests(finalRequests);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      
      const finalActivities = actData && actData.length > 0 ? actData : generateDummyActivities();
      setActivities(finalActivities);
    } catch (err) {
      console.error('Error fetching kitchen requests:', err);
      const dummyRequests = generateDummyRequests();
      dummyRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(dummyRequests);
      setActivities(generateDummyActivities());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleMutation = () => {
      fetchData();
    };
    window.addEventListener('stock-request-mutated', handleMutation);
    return () => {
      window.removeEventListener('stock-request-mutated', handleMutation);
    };
  }, []);

  // Generate 25 realistic dummy requests
  const generateDummyRequests = (): StockRequest[] => {
    const itemsPool = [
      { name: 'Tomato', unit: 'Kg' },
      { name: 'Onion', unit: 'Kg' },
      { name: 'Cheese', unit: 'Kg' },
      { name: 'Paneer', unit: 'Kg' },
      { name: 'Oil', unit: 'Liter' },
      { name: 'Milk', unit: 'Liter' },
      { name: 'Butter', unit: 'Kg' },
      { name: 'Rice', unit: 'Kg' },
      { name: 'Garlic', unit: 'Kg' },
      { name: 'Ginger', unit: 'Kg' },
      { name: 'Capsicum', unit: 'Kg' },
      { name: 'Salt', unit: 'Kg' }
    ];

    const roles = ['Kitchen Manager', 'Chef Adesh', 'Kitchen Staff', 'Sous Chef Rohan'];
    const statuses: ('Pending Approval' | 'Approved' | 'Converted')[] = ['Pending Approval', 'Approved', 'Converted'];
    const baseRequests: StockRequest[] = [];

    const now = new Date();

    for (let i = 1; i <= 25; i++) {
      const status = statuses[i % 3];
      const dateOffsetDays = i;
      const createdAt = new Date(now.getTime() - dateOffsetDays * 6 * 3600 * 1000);
      
      const itemsCount = 1 + (i % 4);
      const itemsList: RequestItem[] = [];
      for (let j = 0; j < itemsCount; j++) {
        const itemObj = itemsPool[(i + j) % itemsPool.length];
        const qty = 5 + ((i * j * 3) % 45);
        itemsList.push({
          productName: itemObj.name,
          quantity: qty,
          unit: itemObj.unit,
          notes: j === 0 ? 'Urgent reorder for weekend rush.' : ''
        });
      }

      baseRequests.push({
        id: `dummy-req-${i}`,
        requestNo: `SR-2026-${String(100 + i).padStart(3, '0')}`,
        requestedBy: roles[i % roles.length],
        status,
        createdAt: createdAt.toISOString(),
        items: itemsList,
        approvedAt: status !== 'Pending Approval' ? new Date(createdAt.getTime() + 45 * 60 * 1000).toISOString() : undefined,
        convertedAt: status === 'Converted' ? new Date(createdAt.getTime() + 2 * 3600 * 1000).toISOString() : undefined,
        purchaseOrder: status === 'Converted' ? {
          id: `dummy-po-${i}`,
          orderNumber: `PO-2026-${String(200 + i).padStart(3, '0')}`,
          status: i % 2 === 0 ? 'Sent' : 'Delivered',
          expectedDeliveryDate: new Date(createdAt.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
          totalAmount: 1500 + (i * 250),
          paymentStatus: i % 2 === 0 ? 'Pending' : 'Paid',
          whatsappSentAt: new Date(createdAt.getTime() + 3 * 3600 * 1000).toISOString(),
          emailSentAt: new Date(createdAt.getTime() + 3.5 * 3600 * 1000).toISOString(),
          createdAt: new Date(createdAt.getTime() + 2 * 3600 * 1000).toISOString(),
          items: itemsList.map(it => ({ ...it, purchasePrice: 120 })),
          supplier: {
            id: `dummy-sup-${i}`,
            name: i % 2 === 0 ? 'ABC Traders' : 'XYZ Foods',
            contactPerson: i % 2 === 0 ? 'Amit Patel' : 'Rahul Sharma',
            mobile: i % 2 === 0 ? '9123456789' : '9876543210',
            email: i % 2 === 0 ? 'orders@abctraders.com' : 'sales@xyzfoods.com',
            rating: i % 2 === 0 ? 4.8 : 4.2
          }
        } : undefined
      });
    }

    return baseRequests;
  };

  const generateDummyActivities = () => {
    return [
      { id: 'act-1', activity: 'Stock Request SR-2026-125 created by Kitchen Manager', createdAt: new Date().toISOString() },
      { id: 'act-2', activity: 'Stock Request SR-2026-124 Approved by Admin', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'act-3', activity: 'Stock Request SR-2026-123 converted to PO-2026-0082', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'act-4', activity: 'Stock Request SR-2026-122 created by Chef Adesh', createdAt: new Date(Date.now() - 14400000).toISOString() },
      { id: 'act-5', activity: 'Stock Request SR-2026-121 Approved by Admin', createdAt: new Date(Date.now() - 28800000).toISOString() },
      { id: 'act-6', activity: 'Stock Request SR-2026-120 converted to PO-2026-0081', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];
  };

  // Reorder Item Action
  const handleRequestItemDirect = async (name: string, suggest: string) => {
    try {
      const unit = suggest.split(' ')[1] || 'Kg';
      const quantity = parseFloat(suggest) || 10;
      const newRequest = await auth.apiRequest('/suppliers/kitchen-requests', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productName: name, quantity, unit, notes: 'Auto Low Stock Recommendation' }]
        })
      });
      fetchData();
      alert(`Request Created Successfully\n\nRequest Number:\n${newRequest.requestNo}\n\nStatus:\nPending Approval`);
    } catch (e) {
      alert('Failed to submit direct request');
    }
  };

  // Modal Save Stock Request
  const handleSaveStockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const itemsPayload = formItems.map(it => ({
        productName: it.productName,
        quantity: parseFloat(String(it.quantity)) || 0,
        unit: it.unit,
        notes: it.notes || ''
      }));

      const newRequest = await auth.apiRequest('/suppliers/kitchen-requests', {
        method: 'POST',
        body: JSON.stringify({ items: itemsPayload })
      });

      setShowCreateModal(false);
      setFormItems([{ productName: '', quantity: '10', unit: 'Kg', notes: '' }]);
      fetchData();
      
      alert(`Request Created Successfully\n\nRequest Number:\n${newRequest.requestNo}\n\nStatus:\nPending Approval`);
    } catch (error: any) {
      alert(error.message || 'Error submitting stock request');
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

  // Status transition handlers (Approve, Reject)
  const handleStatusChange = async (reqId: string, status: 'Approved' | 'Rejected') => {
    try {
      await auth.apiRequest(`/suppliers/kitchen-requests/${reqId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchData();
      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest(prev => prev ? { ...prev, status, approvedAt: status === 'Approved' ? new Date().toISOString() : undefined } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update request status');
    }
  };

  // Convert Approved Request to Purchase Order
  const handleOpenConvertModal = (req: StockRequest) => {
    setRequestToConvert(req);
    setSelectedSupplierId(suppliers[0]?.id || '');
    setSubmitPOError('');
    setShowSupplierModal(true);
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setSubmitPOError('Please select a supplier');
      return;
    }
    if (!requestToConvert) return;

    setFormLoading(true);
    setSubmitPOError('');

    try {
      const itemsPayload = requestToConvert.items.map(it => ({
        productName: it.productName,
        quantity: parseFloat(String(it.quantity)) || 1,
        unit: it.unit,
        purchasePrice: 0 // Will auto-assign cost price or default in backend
      }));

      // Calculate a dummy total amount for PO creation, which backend can override or store
      const totalAmount = itemsPayload.reduce((sum, item) => sum + (item.quantity * 50), 0);

      await auth.apiRequest('/suppliers/pos', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          expectedDeliveryDate,
          totalAmount,
          items: itemsPayload,
          kitchenRequestId: requestToConvert.id
        })
      });

      setShowSupplierModal(false);
      setRequestToConvert(null);
      setSelectedRequest(null); // Close the drawer too
      fetchData();
    } catch (error: any) {
      setSubmitPOError(error.message || 'Failed to convert to purchase order');
    } finally {
      setFormLoading(false);
    }
  };

  // print preview
  const handlePrintRequest = (req: StockRequest) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Request ${req.requestNo}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #000; }
              .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
              .header h2 { margin: 0; color: #000; font-weight: normal; }
              .meta { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f9fafb; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Kitchen Purchase Request</h2>
              <p>Request Number: ${req.requestNo}</p>
            </div>
            <div class="meta">
              <div><strong>Requested By:</strong> ${req.requestedBy}</div>
              <div><strong>Date:</strong> ${new Date(req.createdAt).toLocaleDateString()}</div>
              <div><strong>Status:</strong> ${req.status}</div>
            </div>
            <h3>Requested Items:</h3>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${req.items.map(it => `
                  <tr>
                    <td>${it.productName}</td>
                    <td>${it.quantity}</td>
                    <td>${it.unit}</td>
                    <td>${it.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // PDF download mock
  const handleDownloadPDF = (req: StockRequest) => {
    alert(`Downloading PDF for ${req.requestNo}... (Document prepared for print / export)`);
    handlePrintRequest(req);
  };

  // Calculations for KPI Summary
  const pendingCount = requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const convertedCount = requests.filter(r => r.status === 'Converted').length;
  const totalRequestedItems = requests.reduce((sum, r) => sum + r.items.length, 0);

  // Recommended Reorders list
  const recommendedItems = [
    { name: 'Tomato', remaining: '5 Kg', suggest: '20 Kg', status: 'Low Stock' },
    { name: 'Onion', remaining: '3 Kg', suggest: '15 Kg', status: 'Low Stock' },
    { name: 'Cheese', remaining: '1.5 Kg', suggest: '10 Kg', status: 'Out Of Stock' },
    { name: 'Paneer', remaining: '2 Kg', suggest: '8 Kg', status: 'Low Stock' },
    { name: 'Oil', remaining: '0 Liter', suggest: '20 Liter', status: 'Out Of Stock' },
    { name: 'Rice', remaining: '12 Kg', suggest: '50 Kg', status: 'Frequently Used' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Filter columns based on activeFilter
  const showPendingColumn = activeFilter === 'All' || activeFilter === 'Pending' || activeFilter === 'Pending Approval';
  const showApprovedColumn = activeFilter === 'All' || activeFilter === 'Approved';
  const showConvertedColumn = activeFilter === 'All' || activeFilter === 'Converted';

  // Calculate active grid columns count dynamically
  let gridColsClass = "lg:grid-cols-3";
  let activeCols = 0;
  if (showPendingColumn) activeCols++;
  if (showApprovedColumn) activeCols++;
  if (showConvertedColumn) activeCols++;
  if (activeCols === 2) gridColsClass = "lg:grid-cols-2";
  if (activeCols === 1) gridColsClass = "lg:grid-cols-1";

  return (
    <div className="py-6 space-y-8 text-black min-h-screen w-full text-left font-['Outfit',sans-serif] antialiased">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-medium text-black tracking-tight leading-none">Kitchen Purchase Request</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Create inventory requests for items required by the kitchen and track approval status.</p>
        </div>
        <button
          onClick={() => {
            setFormItems([{ productName: '', quantity: '10', unit: 'Kg', notes: '' }]);
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Request</span>
        </button>
      </div>

      {/* Workflow Tracker Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Request Workflow Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: 'Kitchen Request', desc: 'Staff submits low stock alert', icon: FileText, color: 'text-slate-600 bg-slate-50' },
            { step: 'Approval Pending', desc: 'Manager review required', icon: Clock, color: 'text-amber-600 bg-amber-50/50' },
            { step: 'Approved', desc: 'Ready for procurement', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50/50' },
            { step: 'PO Created', desc: 'Converted to formal PO', icon: ShoppingCart, color: 'text-purple-600 bg-purple-50/50' },
            { step: 'Supplier Sent', desc: 'Dispatched via Email/WA', icon: Send, color: 'text-indigo-600 bg-indigo-50/50' },
            { step: 'Delivered', desc: 'Received & stocked in kitchen', icon: Check, color: 'text-emerald-600 bg-emerald-50/50' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group hover:border-emerald-100 transition duration-200">
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-xl ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">0{idx + 1}</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-black">{item.step}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</p>
                </div>
                {idx < 5 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 bg-white border border-slate-100 rounded-full p-0.5 text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Requests', count: pendingCount, filter: 'Pending Approval', color: 'border-t-[3px] border-amber-500' },
          { label: 'Approved Requests', count: approvedCount, filter: 'Approved', color: 'border-t-[3px] border-blue-500' },
          { label: 'Converted Orders', count: convertedCount, filter: 'Converted', color: 'border-t-[3px] border-emerald-500' },
          { label: 'Total Requested Items', count: totalRequestedItems, filter: 'All', color: 'border-t-[3px] border-purple-500' }
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFilter(card.filter as any)}
            className={`p-5 bg-white rounded-2xl border ${activeFilter === card.filter ? 'border-slate-350 shadow-md ring-2 ring-emerald-50' : 'border-slate-100'} ${card.color} text-left transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between`}
          >
            <span className="text-xs font-semibold text-slate-550 uppercase tracking-wider">{card.label}</span>
            <span className="text-3xl font-normal text-black block leading-none">{card.count}</span>
          </button>
        ))}
      </div>

      {/* Recommended Reorder Items */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Recommended Reorder Items</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedItems.map((item, idx) => {
            const badgeColor = item.status === 'Out Of Stock' ? 'bg-red-50 text-red-700' : item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
            return (
              <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 hover:shadow-sm transition-all duration-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black text-sm">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-[6px] text-[9px] font-semibold uppercase tracking-wider ${badgeColor}`}>{item.status}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Remaining: <span className="font-semibold text-slate-700">{item.remaining}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Suggested: <span className="font-semibold text-emerald-600">{item.suggest}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRequestItemDirect(item.name, item.suggest)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition active:scale-[0.96]"
                >
                  Request Item
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Request Columns */}
      <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        
        {/* Pending Requests Column */}
        {showPendingColumn && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-100">
              <h3 className="font-medium text-black uppercase tracking-wider text-sm flex items-center gap-2">
                Pending Requests
                <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold">
                  {pendingCount}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic font-medium">No pending requests</div>
              ) : (
                requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').map(req => (
                  <div key={req.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-3 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-black text-sm">{req.requestNo}</span>
                        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-[6px]">{req.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium space-y-0.5">
                        <p>Requested By: <span className="text-slate-700 font-semibold">{req.requestedBy}</span></p>
                        <p>Created By: <span className="text-indigo-600 font-semibold">{req.createdBy || 'Kitchen'}</span></p>
                        <p>Date: <span className="text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</span></p>
                        <p>Items: <span className="text-emerald-600 font-semibold">{req.items.length}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="w-full bg-white hover:bg-slate-100 text-black border border-slate-200 py-1.5 rounded-xl text-xs font-medium transition active:scale-[0.98]"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Approved Requests Column */}
        {showApprovedColumn && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-100">
              <h3 className="font-medium text-black uppercase tracking-wider text-sm flex items-center gap-2">
                Approved Requests
                <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold">
                  {approvedCount}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {requests.filter(r => r.status === 'Approved').length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic font-medium">No approved requests</div>
              ) : (
                requests.filter(r => r.status === 'Approved').map(req => (
                  <div key={req.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-3 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-black text-sm">{req.requestNo}</span>
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-[6px]">Approved</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium space-y-0.5">
                        <p>Requested By: <span className="text-slate-700 font-semibold">{req.requestedBy}</span></p>
                        <p>Created By: <span className="text-indigo-600 font-semibold">{req.createdBy || 'Kitchen'}</span></p>
                        <p>Date: <span className="text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</span></p>
                        <p>Items: <span className="text-emerald-600 font-semibold">{req.items.length}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="w-full bg-white hover:bg-slate-100 text-black border border-slate-200 py-1.5 rounded-xl text-xs font-medium transition active:scale-[0.98]"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Converted Orders Column */}
        {showConvertedColumn && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-100">
              <h3 className="font-medium text-black uppercase tracking-wider text-sm flex items-center gap-2">
                Converted Orders
                <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                  {convertedCount}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {requests.filter(r => r.status === 'Converted').length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic font-medium">No converted orders</div>
              ) : (
                requests.filter(r => r.status === 'Converted').map(req => (
                  <div key={req.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-3 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-black text-sm">{req.requestNo}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-[6px]">Converted</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium space-y-0.5">
                        <p>Requested By: <span className="text-slate-700 font-semibold">{req.requestedBy}</span></p>
                        <p>Created By: <span className="text-indigo-600 font-semibold">{req.createdBy || 'Kitchen'}</span></p>
                        <p>Date: <span className="text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</span></p>
                        <p>Items: <span className="text-emerald-600 font-semibold">{req.items.length}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="w-full bg-white hover:bg-slate-100 text-black border border-slate-200 py-1.5 rounded-xl text-xs font-medium transition active:scale-[0.98]"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Recent Request Activity Timeline */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] w-full">
        <div className="flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-medium text-black uppercase tracking-wider">Recent Request Activity</h3>
        </div>
        <div className="h-[450px] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
          {activities.map((act, idx) => (
            <div key={idx} className="flex gap-4 items-start text-sm">
              <div className="mt-1 bg-slate-100 p-2 rounded-xl shrink-0 text-slate-600">
                <Clock className="w-4 h-4" />
              </div>
              <div className="border-b border-slate-100 pb-3 flex-1 text-left">
                <p className="font-semibold text-slate-900 leading-tight">{act.activity}</p>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE REQUEST MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 p-6 relative max-h-[90vh] flex flex-col text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-black hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <h3 className="font-medium text-black text-xl mb-4 border-b pb-2 border-slate-100">
              Create Purchase Request
            </h3>

            <form onSubmit={handleSaveStockRequest} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-normal text-black scrollbar-thin">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Requested Items</span>
                    <button
                      type="button"
                      onClick={addFormRow}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-black px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>

                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <label className="text-[9px] font-semibold text-slate-550 uppercase block mb-1">Item Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tomato, Oil"
                          value={item.productName}
                          onChange={(e) => handleFormItemChange(idx, 'productName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-semibold text-slate-550 uppercase block mb-1">Qty *</label>
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleFormItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[9px] font-semibold text-slate-550 uppercase block mb-1">Unit *</label>
                        <input
                          type="text"
                          required
                          placeholder="Kg"
                          value={item.unit}
                          onChange={(e) => handleFormItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold"
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <label className="text-[9px] font-semibold text-slate-550 uppercase block mb-1">Notes</label>
                        <input
                          type="text"
                          placeholder="Specifications"
                          value={item.notes}
                          onChange={(e) => handleFormItemChange(idx, 'notes', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold"
                        />
                      </div>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFormRow(idx)}
                          className="mt-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
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
                  className="bg-transparent border border-slate-300 text-black font-medium px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT TO PO / SELECT SUPPLIER MODAL */}
      {showSupplierModal && requestToConvert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 relative max-h-[90vh] flex flex-col text-left">
            <button
              onClick={() => {
                setShowSupplierModal(false);
                setRequestToConvert(null);
              }}
              className="absolute top-4 right-4 text-black hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            
            <h3 className="font-medium text-black text-xl mb-2">
              Convert to Purchase Order
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select a supplier to dispatch this purchase request ({requestToConvert.requestNo}). This will generate a formal draft Purchase Order.
            </p>

            {submitPOError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-655 font-semibold">
                {submitPOError}
              </div>
            )}

            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Select Supplier *</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold cursor-pointer"
                >
                  <option value="" disabled>-- Select a Supplier --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.companyName ? `(${sup.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">Expected Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-black font-semibold cursor-pointer"
                />
              </div>

              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Items to Procure ({requestToConvert.items.length})</span>
                <div className="max-h-36 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin text-xs text-slate-700">
                  {requestToConvert.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-semibold text-black">{it.productName}</span>
                      <span>{it.quantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all duration-200 disabled:opacity-50"
                >
                  {formLoading ? 'Creating Order...' : 'Generate Purchase Order'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierModal(false);
                    setRequestToConvert(null);
                  }}
                  className="bg-transparent border border-slate-300 text-black font-medium px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NESTED VIEW PURCHASE ORDER MODAL */}
      {viewingPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 relative max-h-[85vh] flex flex-col text-left">
            <button
              onClick={() => setViewingPO(null)}
              className="absolute top-4 right-4 text-black hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <h3 className="font-medium text-black text-xl mb-1 flex items-center gap-2">
              Purchase Order Details
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-widest ${
                viewingPO.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                viewingPO.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                viewingPO.status === 'Sent' ? 'bg-indigo-50 text-indigo-700' :
                'bg-emerald-50 text-emerald-700'
              }`}>
                {viewingPO.status}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Order Reference: {viewingPO.orderNumber}</p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-xs text-slate-800">
              
              {/* Supplier and Order Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Supplier Contact</span>
                  <strong className="text-black text-sm block mt-0.5">{viewingPO.supplier?.name || 'Unknown Supplier'}</strong>
                  {viewingPO.supplier?.contactPerson && (
                    <span className="text-slate-500 block mt-0.5">Attn: {viewingPO.supplier.contactPerson}</span>
                  )}
                  {viewingPO.supplier?.mobile && (
                    <span className="text-slate-500 block">{viewingPO.supplier.mobile}</span>
                  )}
                  {viewingPO.supplier?.email && (
                    <span className="text-slate-500 block">{viewingPO.supplier.email}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Delivery / Payment Info</span>
                  <span className="text-slate-600 block mt-1">Expected Delivery: <strong className="text-black">{new Date(viewingPO.expectedDeliveryDate).toLocaleDateString()}</strong></span>
                  <span className="text-slate-600 block">Payment Status: <strong className="text-black">{viewingPO.paymentStatus}</strong></span>
                  <span className="text-slate-600 block">Total Amount: <strong className="text-emerald-600 font-semibold">₹{viewingPO.totalAmount}</strong></span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-black">
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {Array.isArray(viewingPO.items) ? (
                      viewingPO.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-semibold text-black">{it.productName}</td>
                          <td className="p-3 text-center font-semibold text-slate-700">{it.quantity} {it.unit}</td>
                          <td className="p-3 text-right text-slate-500">₹{it.purchasePrice || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 italic">No item details available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                onClick={() => setViewingPO(null)}
                className="bg-slate-100 hover:bg-slate-200 text-black font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close PO Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW REQUEST RIGHT SIDE DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedRequest(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          ></div>

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 z-10 animate-slide-in text-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Detail View</span>
                <h3 className="text-xl font-medium text-black mt-0.5">{selectedRequest.requestNo}</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 hover:bg-slate-50 rounded-xl transition text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs text-slate-800">
              
              {/* Request Info Card */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Request Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Requested By</span>
                    <strong className="text-black text-sm font-semibold">{selectedRequest.requestedBy}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Created By</span>
                    <strong className="text-indigo-605 text-sm font-semibold">{selectedRequest.createdBy || 'Kitchen'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Request Date</span>
                    <strong className="text-black text-sm font-semibold">{new Date(selectedRequest.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase mt-1 ${
                      selectedRequest.status === 'Pending' || selectedRequest.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700' :
                      selectedRequest.status === 'Approved' ? 'bg-blue-50 text-blue-700' :
                      selectedRequest.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {selectedRequest.status === 'Converted' ? 'Converted To PO' : selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Purchase Order details */}
              {selectedRequest.purchaseOrder && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex justify-between items-center">
                    <span>Linked Purchase Order</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px] uppercase tracking-wider font-semibold">Procurement PO</span>
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Order Reference</span>
                      <strong className="text-black text-sm">{selectedRequest.purchaseOrder.orderNumber}</strong>
                      <span className="text-[10px] text-slate-400 block mt-1">Supplier: {selectedRequest.purchaseOrder.supplier?.name || 'Assigned Supplier'}</span>
                    </div>
                    <button
                      onClick={() => setViewingPO(selectedRequest.purchaseOrder!)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-black flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View PO
                    </button>
                  </div>
                </div>
              )}

              {/* Supplier Dispatch Info Logs */}
              {selectedRequest.purchaseOrder && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Procurement Dispatch Tracker</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-700">WhatsApp Notification</span>
                      </div>
                      {selectedRequest.purchaseOrder.whatsappSentAt ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                          Sent at {new Date(selectedRequest.purchaseOrder.whatsappSentAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-semibold">Pending Send</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-700">Email Notification</span>
                      </div>
                      {selectedRequest.purchaseOrder.emailSentAt ? (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                          Sent at {new Date(selectedRequest.purchaseOrder.emailSentAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-semibold">Pending Send</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Item List</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-black">
                        <th className="p-3">Item</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {selectedRequest.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition h-10">
                          <td className="p-3 font-semibold text-black">{it.productName}</td>
                          <td className="p-3 text-center font-semibold text-emerald-600">{it.quantity}</td>
                          <td className="p-3 text-slate-500">{it.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline Activity */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Request History Log</h4>
                <div className="space-y-4 pl-2 border-l border-slate-200">
                  <div className="relative pl-4">
                    <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <strong className="text-black font-semibold block">Kitchen Purchase Request Created</strong>
                    <span className="text-[10px] text-slate-400 font-semibold">Submitted by {selectedRequest.requestedBy}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>

                  {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Pending Approval') && (
                    <div className="relative pl-4">
                      <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <strong className="text-amber-600 font-semibold block">Awaiting Admin Approval</strong>
                      <span className="text-[10px] text-slate-400">Request is currently in the manager queue.</span>
                    </div>
                  )}

                  {selectedRequest.status === 'Rejected' && (
                    <div className="relative pl-4">
                      <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <strong className="text-red-655 font-semibold block">Request Rejected</strong>
                      <span className="text-[10px] text-slate-400">Declined by admin/store manager.</span>
                    </div>
                  )}

                  {(selectedRequest.status === 'Approved' || selectedRequest.status === 'Converted') && (
                    <div className="relative pl-4">
                      <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <strong className="text-blue-600 font-semibold block">Request Approved</strong>
                      <span className="text-[10px] text-slate-400">Approved by store manager/admin.</span>
                      {selectedRequest.approvedAt && (
                        <span className="text-[10px] text-slate-400 block">{new Date(selectedRequest.approvedAt).toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'Converted' && selectedRequest.purchaseOrder && (
                    <>
                      <div className="relative pl-4">
                        <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <strong className="text-purple-600 font-semibold block">Purchase Order Created</strong>
                        <span className="text-[10px] text-slate-400 font-semibold">Generated PO ref: {selectedRequest.purchaseOrder.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(selectedRequest.purchaseOrder.createdAt).toLocaleString()}</span>
                      </div>

                      {/* WhatsApp Sent Timeline Step */}
                      {selectedRequest.purchaseOrder.whatsappSentAt && (
                        <div className="relative pl-4">
                          <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                          <strong className="text-indigo-600 font-semibold block">Supplier Notified (WhatsApp)</strong>
                          <span className="text-[10px] text-slate-400">WhatsApp message dispatched successfully to {selectedRequest.purchaseOrder.supplier?.name}</span>
                          <span className="text-[10px] text-slate-400 block">{new Date(selectedRequest.purchaseOrder.whatsappSentAt).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Email Sent Timeline Step */}
                      {selectedRequest.purchaseOrder.emailSentAt && (
                        <div className="relative pl-4">
                          <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                          <strong className="text-indigo-600 font-semibold block">Supplier Notified (Email)</strong>
                          <span className="text-[10px] text-slate-400">Purchase Order PDF dispatched to {selectedRequest.purchaseOrder.supplier?.email}</span>
                          <span className="text-[10px] text-slate-400 block">{new Date(selectedRequest.purchaseOrder.emailSentAt).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Delivered/Received Timeline Step */}
                      {['Delivered', 'Received'].includes(selectedRequest.purchaseOrder.status) && (
                        <div className="relative pl-4">
                          <span className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <strong className="text-emerald-600 font-semibold block">Items Delivered & Stocked</strong>
                          <span className="text-[10px] text-slate-400">Order successfully received. Stock levels automatically updated.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Admin Approval Actions */}
              {isAdmin && (selectedRequest.status === 'Pending' || selectedRequest.status === 'Pending Approval') && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'Approved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'Rejected')}
                    className="bg-transparent border border-red-200 text-red-655 hover:bg-red-50 font-medium px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer active:scale-95 transition"
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Admin Convert to PO Action */}
              {isAdmin && selectedRequest.status === 'Approved' && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenConvertModal(selectedRequest)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                  >
                    <ShoppingCart className="w-4 h-4" /> Convert to Supplier PO
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Actions Drawer */}
            <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50">
              <button
                onClick={() => handlePrintRequest(selectedRequest)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-black font-semibold py-2.5 rounded-xl uppercase cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedRequest)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-black font-semibold py-2.5 rounded-xl uppercase cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local custom styles injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slide-in-right {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 5px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
        `
      }} />

    </div>
  );
};

export default KitchenStockRequest;
