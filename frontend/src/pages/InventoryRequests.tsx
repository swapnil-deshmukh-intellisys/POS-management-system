import React, { useEffect, useState } from 'react';
import {
  X, Plus, Trash2, Printer, Download,
  Eye, Mail, MessageSquare, Check,
  AlertCircle, CheckCircle2, Package, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  status: 'Pending' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted' | 'Supplier Order Sent' | 'Delivered';
  createdAt: string;
  items: RequestItem[];
  approvedAt?: string;
  convertedAt?: string;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  createdBy?: string;
}

export const InventoryRequests: React.FC = () => {
  const auth = useAuth();

  // State Management
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  
  // Nested Purchase Order Modal
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // Create Request Form State
  const [formItems, setFormItems] = useState<RequestItem[]>([
    { productName: '', quantity: '10', unit: 'Kg', notes: '' }
  ]);
  const [formLoading, setFormLoading] = useState(false);

  // Active status filter (triggered by summary KPI card click)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending Approval' | 'Approved' | 'Converted' | 'Sent'>('All');

  // Fetch Sourcing Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const reqData = await auth.apiRequest('/suppliers/kitchen-requests').catch(() => []);

      const dbRequests = Array.isArray(reqData) ? reqData : [];
      const dbRequestNos = new Set(dbRequests.map(r => r.requestNo));
      const dummyRequests = generateDummyRequests().filter(r => !dbRequestNos.has(r.requestNo));
      
      const finalRequests = [...dbRequests, ...dummyRequests];
      finalRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRequests(finalRequests);
    } catch (err) {
      console.error('Error fetching inventory requests:', err);
      const dummyRequests = generateDummyRequests();
      dummyRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(dummyRequests);
    } finally {
      setIsLoading(false);
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

  // Sync activeFilter and selectedRequest with URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam && ['All', 'Pending Approval', 'Approved', 'Converted', 'Sent'].includes(filterParam)) {
      setActiveFilter(filterParam as any);
    }

    const idParam = params.get('id') || params.get('requestId');
    if (idParam && requests.length > 0) {
      const match = requests.find(r => r.id === idParam || r.requestNo === idParam);
      if (match) {
        setSelectedRequest(match);
      }
    }
  }, [window.location.search, requests]);

  // Generate Dummy Data for UI Testing:
  // - 20 Sample Requests (Pending Approval, Rejected, etc.)
  // - 10 Approved Requests (Approved status)
  // - 15 Purchase Orders (Converted status, with linked POs)
  const generateDummyRequests = (): StockRequest[] => {
    const baseRequests: StockRequest[] = [];
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

    // Helper to generate items list
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

    // 20 Sample Requests (18 Pending Approval, 2 Rejected)
    for (let i = 1; i <= 20; i++) {
      const status = i > 18 ? 'Rejected' : 'Pending Approval';
      baseRequests.push({
        id: `mock-pending-${i}`,
        requestNo: `KR-2026-${String(100 + i).padStart(5, '0')}`,
        requestedBy: i % 2 === 0 ? 'Chef Adesh' : 'Kitchen Manager',
        status: status as any,
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

    // 15 Purchase Orders (Converted, Supplier Order Sent, Delivered)
    for (let i = 1; i <= 15; i++) {
      const status = i <= 5 ? 'Delivered' : i <= 10 ? 'Supplier Order Sent' : 'Converted';
      const poNum = `PO-2026-${String(300 + i).padStart(5, '0')}`;
      baseRequests.push({
        id: `mock-po-${i}`,
        requestNo: `KR-2026-${String(300 + i).padStart(5, '0')}`,
        requestedBy: 'Chef Adesh',
        status: status as any,
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
          whatsappSentAt: status !== 'Converted' ? new Date(Date.now() - 24 * 3600 * 1000).toISOString() : undefined,
          emailSentAt: status === 'Delivered' ? new Date(Date.now() - 24 * 3600 * 1000).toISOString() : undefined,
          createdAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 1.5 * 24 * 3600 * 1000).toISOString(),
          supplier: {
            id: `sup-${i}`,
            name: i % 3 === 0 ? 'Fresh Farm Traders' : i % 3 === 1 ? 'Premium Spices House' : 'Daily Fresh Fruits',
            mobile: '9123456789',
            whatsapp: '9123456789',
            email: 'orders@supplier.com'
          }
        }
      });
    }

    return baseRequests;
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
      
      // Notify components and Admin command centers in real time
      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: newRequest }));
      
      alert(`Request Created Successfully\n\nRequest Number:\n${newRequest.requestNo}\n\nStatus:\nPending Approval`);
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

  // print preview
  const handlePrintRequest = (req: StockRequest) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Inventory Request ${req.requestNo}</title>
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
              <h2>Kitchen Inventory Request</h2>
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

  // Calculations for KPI Summary
  const pendingCount = requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const convertedCount = requests.filter(r => r.status === 'Converted' || r.purchaseOrderId).length;
  const sentCount = requests.filter(r => r.status === 'Supplier Order Sent' || r.purchaseOrder?.status === 'Sent' || r.purchaseOrder?.whatsappSentAt || r.purchaseOrder?.emailSentAt).length;

  // Filter requests according to card selection
  const getFilteredRequests = () => {
    switch (activeFilter) {
      case 'Pending Approval':
        return requests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval');
      case 'Approved':
        return requests.filter(r => r.status === 'Approved');
      case 'Converted':
        return requests.filter(r => r.status === 'Converted' || r.purchaseOrderId);
      case 'Sent':
        return requests.filter(r => r.status === 'Supplier Order Sent' || r.purchaseOrder?.status === 'Sent' || r.purchaseOrder?.whatsappSentAt || r.purchaseOrder?.emailSentAt);
      default:
        return requests;
    }
  };

  const displayedRequests = getFilteredRequests();

  // Helper to render workflow visual highlighting
  const renderWorkflowVisual = (status: string, purchaseOrder?: PurchaseOrder) => {
    const steps = [
      { key: 'created', label: 'Request Created', isDone: true },
      { key: 'pending', label: 'Pending Approval', isDone: status !== 'Rejected' },
      { key: 'approved', label: 'Approved', isDone: ['Approved', 'Converted', 'Supplier Order Sent', 'Delivered'].includes(status) },
      { key: 'po_created', label: 'Purchase Order Created', isDone: ['Converted', 'Supplier Order Sent', 'Delivered'].includes(status) || !!purchaseOrder },
      { key: 'sent', label: 'Supplier Order Sent', isDone: status === 'Supplier Order Sent' || purchaseOrder?.status === 'Sent' || !!purchaseOrder?.whatsappSentAt || !!purchaseOrder?.emailSentAt || status === 'Delivered' },
      { key: 'delivered', label: 'Delivered', isDone: status === 'Delivered' || purchaseOrder?.status === 'Delivered' || purchaseOrder?.status === 'Received' }
    ];

    // Find current active step index
    let activeIdx = 0;
    if (status === 'Pending Approval' || status === 'Pending') activeIdx = 1;
    else if (status === 'Approved') activeIdx = 2;
    else if (status === 'Converted' || (purchaseOrder && purchaseOrder.status === 'Pending')) activeIdx = 3;
    else if (status === 'Supplier Order Sent' || purchaseOrder?.status === 'Sent' || purchaseOrder?.whatsappSentAt) activeIdx = 4;
    else if (status === 'Delivered' || purchaseOrder?.status === 'Delivered' || purchaseOrder?.status === 'Received') activeIdx = 5;

    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl space-y-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Workflow Pipeline Tracker</span>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          {steps.map((step, idx) => {
            const isActive = idx === activeIdx;
            const isFinished = step.isDone && idx <= activeIdx;
            return (
              <div key={idx} className="flex-1 flex flex-row md:flex-col items-center gap-2 md:gap-1.5 w-full relative">
                {/* Visual Circle Indicator */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-350 shrink-0 ${
                  isFinished 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : isActive 
                      ? 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  {isFinished && idx < activeIdx ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                {/* Title */}
                <div className="text-left md:text-center">
                  <span className={`text-[11px] font-semibold block transition-colors ${
                    isActive ? 'text-amber-600' : isFinished ? 'text-emerald-700 font-bold' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {/* Horizontal line between circles */}
                {idx < 5 && (
                  <div className="hidden md:block absolute top-3.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 bg-slate-200 dark:bg-slate-700 z-0">
                    <div className={`h-full bg-emerald-600 transition-all duration-350 ${step.isDone && idx < activeIdx ? 'w-full' : 'w-0'}`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 space-y-8 text-black dark:text-slate-100 min-h-screen w-full text-left font-sans antialiased">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-medium text-black dark:text-white uppercase tracking-tight">Inventory Requests</h1>
          <p className="text-[14px] text-slate-500 mt-2 font-medium">Request inventory items required for kitchen operations and supplier procurement.</p>
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

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between animate-pulse">
              <div className="flex justify-between items-start">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-24"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-755"></div>
              </div>
              <div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-16 mt-2"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-755 rounded-md w-32 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Pending Requests', 
              count: pendingCount, 
              filter: 'Pending Approval', 
              desc: 'Awaiting store approval',
              icon: AlertCircle,
              bgIcon: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/40',
              hoverIcon: 'group-hover:bg-amber-600',
              activeColor: 'border-amber-500 ring-2 ring-amber-100 dark:ring-amber-955/50'
            },
            { 
              label: 'Approved Requests', 
              count: approvedCount, 
              filter: 'Approved', 
              desc: 'Ready for purchase order',
              icon: CheckCircle2,
              bgIcon: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-100 dark:border-blue-900/40',
              hoverIcon: 'group-hover:bg-blue-600',
              activeColor: 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-955/50'
            },
            { 
              label: 'POs Created', 
              count: convertedCount, 
              filter: 'Converted', 
              desc: 'Converted to purchase order',
              icon: Package,
              bgIcon: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900/40',
              hoverIcon: 'group-hover:bg-emerald-600',
              activeColor: 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-955/50'
            },
            { 
              label: 'Orders Sent', 
              count: sentCount, 
              filter: 'Sent', 
              desc: 'Dispatched to suppliers',
              icon: Send,
              bgIcon: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-100 dark:border-purple-900/40',
              hoverIcon: 'group-hover:bg-purple-600',
              activeColor: 'border-purple-500 ring-2 ring-purple-100 dark:ring-purple-955/50'
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            const isSelected = activeFilter === card.filter;
            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveFilter(isSelected ? 'All' : card.filter as any);
                  setTimeout(() => {
                    document.getElementById('requests-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className={`bg-white dark:bg-slate-800 border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-slate-900/50 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${isSelected ? card.activeColor : 'border-slate-200 dark:border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs group-hover:text-white transition-all duration-300 shrink-0 ${card.bgIcon} ${card.hoverIcon}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mt-2">
                    {card.count} Requests
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                    {card.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request List Section */}
      <div id="requests-list-section" className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
        <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
          <h3 className="text-[17px] font-semibold text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
            {activeFilter === 'All' ? 'All' : activeFilter} Requests List
            <span className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-655 rounded-full font-semibold">
              {displayedRequests.length}
            </span>
          </h3>
        </div>

        {/* Requests Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-700 rounded-3xl p-5 animate-pulse h-[240px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-700">
                    <div className="space-y-1.5">
                      <div className="h-4.5 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="h-2.5 w-12 bg-slate-250 dark:bg-slate-700 rounded"></div>
                        <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2.5 w-12 bg-slate-250 dark:bg-slate-700 rounded"></div>
                        <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : displayedRequests.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 italic bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl">
              No inventory requests found
            </div>
          ) : (
            displayedRequests.map((req) => (
              <div key={req.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start border-b pb-3 border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-semibold text-black dark:text-white text-[17px]">Request #{req.requestNo}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Date: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      req.status === 'Pending' || req.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700' :
                      req.status === 'Approved' ? 'bg-blue-50 text-blue-700' :
                      req.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {req.status === 'Converted' ? 'Converted To PO' : req.status}
                    </span>
                  </div>
                  
                  <div className="pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Requested By:</span>
                        <strong className="text-black dark:text-white text-[14px] font-semibold">{req.requestedBy}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Created By:</span>
                        <strong className="text-black dark:text-white text-[14px] font-semibold">{req.createdBy || 'Kitchen'}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Items:</span>
                      <div className="space-y-1.5 text-slate-800 dark:text-slate-200 font-semibold text-[14px] bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-700">
                        {req.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{it.productName}</span>
                            <span className="text-slate-500 font-bold">{it.quantity} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-slate-550 dark:text-slate-400">Total Items: {req.items.length}</span>
                  <button
                     onClick={() => setSelectedRequest(req)}
                     className="px-4 py-2 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-black dark:text-white border border-slate-250 dark:border-slate-655 rounded-xl font-bold active:scale-95 transition cursor-pointer text-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE REQUEST MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 relative max-h-[90vh] flex flex-col text-left">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-black dark:text-white hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
            <h3 className="font-medium text-black dark:text-white text-xl mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">
              Create Purchase Request
            </h3>

            <form onSubmit={handleSaveStockRequest} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-normal text-black dark:text-slate-200 scrollbar-thin">
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
                          className="mt-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* VIEW REQUEST DETAILS DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            onClick={() => setSelectedRequest(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          ></div>

          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-850 h-full shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-700 z-10 animate-slide-in text-left">
            <div className="p-6 border-b border-slate-100 dark:border-slate-750 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Request Details</span>
                <h3 className="text-xl font-medium text-black dark:text-white mt-0.5">{selectedRequest.requestNo}</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-black dark:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs text-slate-800 dark:text-slate-200">
              
              {/* Interactive Workflow Visual Flow */}
              {renderWorkflowVisual(selectedRequest.status, selectedRequest.purchaseOrder)}

              {/* Request Info Card */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Request Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Requested By</span>
                    <strong className="text-black dark:text-white text-sm font-semibold">{selectedRequest.requestedBy}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Created By</span>
                    <strong className="text-black dark:text-white text-sm font-semibold">{selectedRequest.createdBy || 'Kitchen'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Request Date</span>
                    <strong className="text-black dark:text-white text-sm font-semibold">{new Date(selectedRequest.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
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
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] flex justify-between items-center">
                    <span>Linked Purchase Order</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px] uppercase tracking-wider font-semibold">Procurement PO</span>
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Order Reference</span>
                      <strong className="text-black dark:text-white text-sm">{selectedRequest.purchaseOrder.orderNumber}</strong>
                      <span className="text-[10px] text-slate-400 block mt-1">Supplier: {selectedRequest.purchaseOrder.supplier?.name || 'Assigned Supplier'}</span>
                    </div>
                    <button
                      onClick={() => setViewingPO(selectedRequest.purchaseOrder!)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-655 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-black dark:text-white flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View PO
                    </button>
                  </div>
                </div>
              )}

              {/* Supplier Dispatch Info Logs */}
              {selectedRequest.purchaseOrder && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Procurement Dispatch Tracker</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">WhatsApp Notification</span>
                      </div>
                      {selectedRequest.purchaseOrder.whatsappSentAt ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                          Sent at {new Date(selectedRequest.purchaseOrder.whatsappSentAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded font-semibold">Pending Send</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Email Notification</span>
                      </div>
                      {selectedRequest.purchaseOrder.emailSentAt ? (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                          Sent at {new Date(selectedRequest.purchaseOrder.emailSentAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded font-semibold">Pending Send</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Item List</h4>
                <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 font-semibold text-black dark:text-white">
                        <th className="p-3">Item</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-350">
                      {selectedRequest.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition h-10">
                          <td className="p-3 font-semibold text-black dark:text-white">{it.productName}</td>
                          <td className="p-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{it.quantity}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{it.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Bottom Actions Drawer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-750 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => handlePrintRequest(selectedRequest)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-black dark:text-white font-semibold py-2.5 rounded-xl uppercase cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => handlePrintRequest(selectedRequest)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-black dark:text-white font-semibold py-2.5 rounded-xl uppercase cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NESTED VIEW PURCHASE ORDER DETAILS MODAL */}
      {viewingPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 relative max-h-[85vh] flex flex-col text-left">
            <button
              onClick={() => setViewingPO(null)}
              className="absolute top-4 right-4 text-black dark:text-white hover:text-slate-750 cursor-pointer"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
            <h3 className="font-medium text-black dark:text-white text-xl mb-1 flex items-center gap-2">
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

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-xs text-slate-800 dark:text-slate-200">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Supplier Contact</span>
                  <strong className="text-black dark:text-white text-sm block mt-0.5">{viewingPO.supplier?.name || 'Unknown Supplier'}</strong>
                  {viewingPO.supplier?.mobile && <span className="text-slate-500 block">{viewingPO.supplier.mobile}</span>}
                  {viewingPO.supplier?.email && <span className="text-slate-500 block">{viewingPO.supplier.email}</span>}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Delivery / Payment Info</span>
                  <span className="text-slate-605 block mt-1">Expected Delivery: <strong className="text-black dark:text-white">{new Date(viewingPO.expectedDeliveryDate).toLocaleDateString()}</strong></span>
                  <span className="text-slate-605 block">Payment Status: <strong className="text-black dark:text-white">{viewingPO.paymentStatus}</strong></span>
                  <span className="text-slate-605 block">Total Amount: <strong className="text-emerald-600 dark:text-emerald-450 font-semibold">₹{viewingPO.totalAmount}</strong></span>
                </div>
              </div>

              <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 font-semibold text-black dark:text-white">
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-350">
                    {Array.isArray(viewingPO.items) ? (
                      viewingPO.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="p-3 font-semibold text-black dark:text-white">{it.productName}</td>
                          <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-305">{it.quantity} {it.unit}</td>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 flex justify-end">
              <button
                onClick={() => setViewingPO(null)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-655 text-black dark:text-white font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close PO Details
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

export default InventoryRequests;
