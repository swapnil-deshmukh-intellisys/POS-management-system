import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  X,
  Search,
  ShoppingCart,
  TrendingUp,
  Clock,
  Package,
  DollarSign,
  FileText,
  CheckCircle,
  Activity,
  Trash2
} from 'lucide-react';

export const Purchases: React.FC = () => {
  const auth = useAuth();

  // View State: 'list' (main dashboard) or 'create' (full-page PO form)
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Core Data Lists
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Filter & Search State
  const [poFilter, setPoFilter] = useState<string>('ALL'); // ALL, PENDING, RECEIVED
  const [payFilter, setPayFilter] = useState<string>('ALL'); // ALL, PENDING, PAID
  const [poSearch, setPoSearch] = useState('');
  const [paySearch, setPaySearch] = useState('');

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Active Selections
  const [showPaymentModal, setShowPaymentModal] = useState<any | null>(null); // Holds active invoice for recording payment
  const [showReceiveModal, setShowReceiveModal] = useState<any | null>(null); // Holds active PO for receiving stock
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  // PO Creation Form State (Full Page Form)
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  // Array of bulk entry rows: { productName, quantity, unit, remarks }
  const [poItems, setPoItems] = useState<any[]>([
    { productName: '', quantity: '10', unit: 'PCS', remarks: '' }
  ]);

  // Payment Form State (Amount, Method, Ref, Date, Notes)
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // Manual PO Receive State
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [damagedQtyMap, setDamagedQtyMap] = useState<Record<string, number>>({});
  const [receiveNotes, setReceiveNotes] = useState('');

  // Fetch all procurement data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const posData = await auth.apiRequest('/suppliers/pos');
      setPurchaseOrders(posData || []);

      const supsData = await auth.apiRequest('/suppliers');
      setSuppliers(supsData || []);

      const invoicesData = await auth.apiRequest('/suppliers/invoices');
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Failed to load transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute active metrics for the 4 colorful KPI cards
  const pendingPOsCount = useMemo(() => {
    return purchaseOrders.filter((po) => !['Received', 'Closed', 'Cancelled'].includes(po.status)).length;
  }, [purchaseOrders]);

  const receivedPOsCount = useMemo(() => {
    return purchaseOrders.filter((po) => ['Received', 'Closed'].includes(po.status)).length;
  }, [purchaseOrders]);

  const pendingPaymentsVal = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((acc, inv) => {
        const paid = inv.payments?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
        return acc + Math.max(0, inv.totalAmount - paid);
      }, 0);
  }, [invoices]);

  const todaysPurchasesVal = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return purchaseOrders
      .filter((po) => new Date(po.orderDate).toISOString().split('T')[0] === todayStr && po.status !== 'Cancelled')
      .reduce((acc, po) => acc + po.totalAmount, 0);
  }, [purchaseOrders]);

  // Bulk Product Entry Rows handlers
  const handleAddRow = () => {
    setPoItems(prev => [
      ...prev,
      { productName: '', quantity: '10', unit: 'PCS', remarks: '' }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (poItems.length <= 1) {
      alert('You must have at least one product row.');
      return;
    }
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    setPoItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      alert('Please select a supplier.');
      return;
    }

    // Validate rows
    const validItems = poItems.filter(item => item.productName.trim() !== '');
    if (validItems.length === 0) {
      alert('Please enter at least one product name.');
      return;
    }

    try {
      // Build items payload (backend will match by name or create placeholder products)
      const itemsPayload = validItems.map(item => ({
        productName: item.productName.trim(),
        quantity: parseInt(item.quantity) || 1,
        unit: item.unit,
        purchasePrice: 0.0, // Set costPrice 0 initially, updated during invoice
        tax: 0,
        notes: item.remarks || ''
      }));

      await auth.apiRequest('/suppliers/pos', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: poSupplierId,
          expectedDeliveryDate: poExpectedDate,
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
          notes: poNotes,
          items: itemsPayload,
        }),
      });

      setViewMode('list');
      resetPoForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create PO:', error);
      alert('Error creating Purchase Order.');
    }
  };

  const resetPoForm = () => {
    setPoSupplierId('');
    setPoExpectedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPoNotes('');
    setPoItems([{ productName: '', quantity: '10', unit: 'PCS', remarks: '' }]);
  };

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReceiveModal) return;

    const poItemsList = Array.isArray(showReceiveModal.items)
      ? showReceiveModal.items
      : JSON.parse(showReceiveModal.items || '[]');

    const items = poItemsList.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantityReceived: Number(receivedQtyMap[item.productId] ?? item.quantity),
      quantityDamaged: Number(damagedQtyMap[item.productId] ?? 0),
    }));

    try {
      await auth.apiRequest(`/suppliers/pos/${showReceiveModal.id}/receive`, {
        method: 'PUT',
        body: JSON.stringify({
          receivedDate: receiveDate,
          items,
          notes: receiveNotes,
          branchId: 'default-branch',
        }),
      });

      setShowReceiveModal(null);
      setReceivedQtyMap({});
      setDamagedQtyMap({});
      setReceiveNotes('');
      await fetchData();
      if (selectedPO?.id === showReceiveModal.id) {
        const refreshed = await auth.apiRequest('/suppliers/pos');
        const updatedPO = refreshed.find((p: any) => p.id === showReceiveModal.id);
        setSelectedPO(updatedPO || null);
      }
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
      alert('Error confirming receipt.');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    try {
      await auth.apiRequest('/suppliers/payments', {
        method: 'POST',
        body: JSON.stringify({
          supplierInvoiceId: showPaymentModal.id,
          amountPaid: parseFloat(payAmount),
          paymentMethod: payMethod,
          referenceNumber: payRef,
          paymentDate: payDate,
          notes: payNotes
        }),
      });

      setShowPaymentModal(null);
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      fetchData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Error recording payment.');
    }
  };

  // Search and status filters for Purchase Orders Table
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const orderNum = String(po.orderNumber || '').toLowerCase();
      const supName = String(po.supplier?.name || '').toLowerCase();
      const status = String(po.status || '').toLowerCase();

      const itemsList = Array.isArray(po.items) ? po.items : JSON.parse(po.items || '[]');
      const matchesProduct = itemsList.some((item: any) =>
        String(item.productName || '').toLowerCase().includes(poSearch.toLowerCase())
      );

      const query = poSearch.toLowerCase().trim();
      const matchesSearch =
        orderNum.includes(query) ||
        supName.includes(query) ||
        status.includes(query) ||
        matchesProduct;

      if (poFilter === 'PENDING') {
        return matchesSearch && !['Received', 'Closed', 'Cancelled'].includes(po.status);
      }
      if (poFilter === 'RECEIVED') {
        return matchesSearch && ['Received', 'Closed'].includes(po.status);
      }
      return matchesSearch;
    });
  }, [purchaseOrders, poFilter, poSearch]);

  // Search and status filters for Supplier Payments Table
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invoiceNum = String(inv.invoiceNumber || '').toLowerCase();
      const supName = String(inv.supplier?.name || '').toLowerCase();
      const poNum = String(inv.purchaseOrder?.orderNumber || '').toLowerCase();
      const status = String(inv.status || '').toLowerCase();

      const query = paySearch.toLowerCase().trim();
      const matchesSearch =
        invoiceNum.includes(query) ||
        supName.includes(query) ||
        poNum.includes(query) ||
        status.includes(query);

      if (payFilter === 'PENDING') {
        return matchesSearch && inv.status !== 'Paid';
      }
      if (payFilter === 'PAID') {
        return matchesSearch && inv.status === 'Paid';
      }
      return matchesSearch;
    });
  }, [invoices, payFilter, paySearch]);

  // Dynamic Recent Activity logs derived from PO and Payments records
  const recentActivities = useMemo(() => {
    const list: any[] = [];
    purchaseOrders.slice(0, 10).forEach(po => {
      list.push({
        type: 'ORDER_PLACED',
        date: new Date(po.orderDate),
        title: `Purchase Order Placed`,
        description: `Order ${po.orderNumber} created for supplier ${po.supplier?.name || 'Supplier'}`,
        badgeColor: 'bg-indigo-50 text-indigo-750'
      });
      if (po.status === 'Received') {
        list.push({
          type: 'STOCK_RECEIVED',
          date: new Date(po.updatedAt || po.orderDate),
          title: `Stock Received`,
          description: `Inventory replenished from PO ${po.orderNumber} (${po.supplier?.name})`,
          badgeColor: 'bg-emerald-50 text-emerald-700'
        });
      }
    });

    invoices.slice(0, 10).forEach(inv => {
      inv.payments?.forEach((p: any) => {
        list.push({
          type: 'PAYMENT_RECORDED',
          date: new Date(p.paymentDate),
          title: `Supplier Payment Recorded`,
          description: `Recorded payment of ₹${p.amountPaid.toLocaleString()} for Bill ${inv.invoiceNumber} (${p.paymentMethod})`,
          badgeColor: 'bg-rose-50 text-rose-700'
        });
      });
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }, [purchaseOrders, invoices]);

  return (
    <div className="space-y-6 select-none font-['Outfit',sans-serif] text-[15px] text-slate-800 antialiased max-w-7xl mx-auto px-4">

      {viewMode === 'list' ? (
        <>
          {/* 1. HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 pb-2">
            <div className="text-left">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                Purchase Logistics
              </h1>
              <nav className="text-sm font-bold text-slate-400 mt-2 block tracking-wide">
                <span>Procurement Flow</span>
                &nbsp;&gt;&nbsp;
                <span className="text-slate-800">Orders & Payments</span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetPoForm();
                  setViewMode('create');
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Purchase Order
              </button>
            </div>
          </div>          {/* 2. COLORFUL KPI CARDS (Dashboard style with border hover states and icons animations) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Pending Orders */}
            <div
              onClick={() => {
                setPoFilter('PENDING');
                document.getElementById('pos-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left flex items-center justify-between transition-all duration-300 hover:border-amber-500 hover:shadow-md hover:-translate-y-1 cursor-pointer group"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Orders</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
                  {pendingPOsCount} Orders
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-110">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Received Orders */}
            <div
              onClick={() => {
                setPoFilter('RECEIVED');
                document.getElementById('pos-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left flex items-center justify-between transition-all duration-300 hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 cursor-pointer group"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Received Orders</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
                  {receivedPOsCount} Orders
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-110">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Pending Payments */}
            <div
              onClick={() => {
                setPayFilter('PENDING');
                document.getElementById('payments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left flex items-center justify-between transition-all duration-300 hover:border-rose-500 hover:shadow-md hover:-translate-y-1 cursor-pointer group"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
                <h3 className="text-2xl font-black text-slate-905 mt-1 block tracking-tight">
                  ₹{pendingPaymentsVal.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-110">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Today's Purchases */}
            <div
              onClick={() => {
                setPoFilter('ALL');
                setPoSearch('');
                document.getElementById('pos-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left flex items-center justify-between transition-all duration-300 hover:border-indigo-500 hover:shadow-md hover:-translate-y-1 cursor-pointer group"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Today's Purchases</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
                  ₹{todaysPurchasesVal.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 3. MIDDLE WORKSPACE: PURCHASE ORDERS TABLE */}
          <div id="pos-section" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Purchase Orders</h2>
            </div>

            {/* Filters and search row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-3">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search PO Number, Supplier, Product name..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:border-emerald-600 text-xs bg-slate-50/50 font-semibold"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {[
                  { label: 'All Orders', value: 'ALL' },
                  { label: 'Pending Delivery', value: 'PENDING' },
                  { label: 'Stock Received', value: 'RECEIVED' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setPoFilter(tab.value)}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${poFilter === tab.value
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-455 text-xs font-bold bg-slate-50/55">
                    <th className="px-4 py-3.5 text-left">PO Number</th>
                    <th className="px-4 py-3.5 text-left">Supplier</th>
                    <th className="px-4 py-3.5 text-left">Created By</th>
                    <th className="px-4 py-3.5 text-right">Products Count</th>
                    <th className="px-4 py-3.5 text-right">Total Quantity</th>
                    <th className="px-4 py-3.5 text-left">Created Date</th>
                    <th className="px-4 py-3.5 text-left">Delivery Date</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3.5"><div className="h-3.5 w-16 bg-slate-250 dark:bg-slate-705 rounded"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5 text-right"><div className="h-3.5 w-10 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                        <td className="px-4 py-3.5 text-right"><div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5 text-center"><div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto"></div></td>
                        <td className="px-4 py-3.5 text-center"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium italic">
                        No matching purchase orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseOrders.map((po) => {
                      const itemsList = Array.isArray(po.items) ? po.items : JSON.parse(po.items || '[]');
                      const totalQty = itemsList.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0);

                      return (
                        <tr
                          key={po.id}
                          onClick={() => {
                            setSelectedPO(po);
                          }}
                          className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3.5 font-extrabold text-slate-900">{po.orderNumber}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{po.supplier?.name}</td>
                          <td className="px-4 py-3.5 text-left font-semibold text-indigo-600">{po.createdBy || 'Kitchen'}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-indigo-650">{itemsList.length} items</td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">{totalQty} units</td>
                          <td className="px-4 py-3.5 text-slate-450">{new Date(po.orderDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5 text-slate-455">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${po.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                                  po.status === 'Sent' ? 'bg-indigo-50 text-indigo-700' :
                                    po.status === 'Received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-750'
                                }`}
                            >
                              {po.status === 'Accepted' ? 'Confirmed' : po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedPO(po);
                                }}
                                className="p-1 text-slate-455 hover:text-black rounded transition cursor-pointer"
                                title="View Details"
                              >
                                <FileText className="w-4.5 h-4.5" />
                              </button>

                              {po.status !== 'Received' && po.status !== 'Cancelled' && (
                                <button
                                  onClick={() => {
                                    const initialReceived: Record<string, number> = {};
                                    const initialDamaged: Record<string, number> = {};
                                    const poItemsList = po.poItems || [];
                                    poItemsList.forEach((item: any) => {
                                      initialReceived[item.productId || item.id] = item.quantity;
                                      initialDamaged[item.productId || item.id] = 0;
                                    });
                                    setReceivedQtyMap(initialReceived);
                                    setDamagedQtyMap(initialDamaged);
                                    setShowReceiveModal(po);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Receive Stock
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. SUPPLIER PAYMENTS & BILLS SECTION (Comes after stock receipt) */}
          <div id="payments-section" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-extrabold text-slate-900">Supplier Payments</h2>
            </div>

            {/* Filters and search row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-3">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Bill Number, Supplier, PO Number..."
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:border-emerald-600 text-xs bg-slate-50/50 font-semibold"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {[
                  { label: 'All Invoices', value: 'ALL' },
                  { label: 'Pending Payment', value: 'PENDING' },
                  { label: 'Paid In Full', value: 'PAID' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setPayFilter(tab.value)}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${payFilter === tab.value
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Bills Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-450 text-xs font-bold bg-slate-50/55">
                    <th className="px-4 py-3.5 text-left">Supplier Name</th>
                    <th className="px-4 py-3.5 text-left">Invoice/Bill No</th>
                    <th className="px-4 py-3.5 text-left">Purchase Order</th>
                    <th className="px-4 py-3.5 text-right">Total Amount (₹)</th>
                    <th className="px-4 py-3.5 text-right">Paid Amount (₹)</th>
                    <th className="px-4 py-3.5 text-right">Pending Amount (₹)</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3.5"><div className="h-3.5 w-24 bg-slate-250 dark:bg-slate-705 rounded"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                        <td className="px-4 py-3.5 text-right"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                        <td className="px-4 py-3.5 text-right"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                        <td className="px-4 py-3.5 text-right"><div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                        <td className="px-4 py-3.5 text-center"><div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto"></div></td>
                        <td className="px-4 py-3.5 text-center pr-4"><div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl mx-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium italic">
                        No supplier invoices available.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const totalPaid = inv.payments?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      const pendingAmt = Math.max(0, inv.totalAmount - totalPaid);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-800">{inv.supplier?.name}</td>
                          <td className="px-4 py-3.5 font-extrabold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-500">{inv.purchaseOrder?.orderNumber}</td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-950">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-rose-600">₹{pendingAmt.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-750 border border-emerald-250'
                                  : inv.status === 'Partial'
                                    ? 'bg-amber-50 text-amber-750 border border-amber-250'
                                    : 'bg-rose-50 text-rose-750 border border-rose-250'
                                }`}
                            >
                              {inv.status === 'Partial' ? 'Partially Paid' : inv.status === 'Paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center pr-4">
                            {pendingAmt > 0 ? (
                              <button
                                onClick={() => {
                                  setPayAmount(String(pendingAmt));
                                  setPayRef(`TXN-BILL-${Date.now().toString().slice(-5)}`);
                                  setPayNotes('');
                                  setShowPaymentModal(inv);
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-755 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-extrabold flex items-center justify-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Logged
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. BOTTOM: RECENT PURCHASE ACTIVITY */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-extrabold text-slate-900">Recent Purchase Activity</h2>
            </div>

            <div className="space-y-4 mt-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:shadow-sm transition">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider block mt-0.5 ${act.badgeColor}`}>
                    {act.type.replace('_', ' ')}
                  </span>
                  <div className="flex-1 text-xs">
                    <strong className="block text-slate-900 font-bold">{act.title}</strong>
                    <p className="text-slate-505 font-medium mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                    {act.date.toLocaleDateString()} {act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent procurement events logged.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* 6. FULL PAGE: NEW PURCHASE ORDER FORM */
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-left space-y-6 max-w-4xl mx-auto mt-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-emerald-600" /> New Purchase Order
              </h2>
              <p className="text-xs text-slate-400 mt-1">Fill out supplier details and type in quantities to request restocking.</p>
            </div>
            <button
              onClick={() => {
                setViewMode('list');
                resetPoForm();
              }}
              className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleCreatePO} className="space-y-6 text-xs font-semibold">

            {/* Top Section: Supplier, expected delivery, notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-xs">Select Supplier</label>
                  <select
                    required
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 p-2.5 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700 text-xs">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 p-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 text-xs font-semibold">General Remarks / Notes</label>
                <textarea
                  placeholder="E.g. Delivery terms, packaging remarks..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  rows={4.5}
                  className="w-full rounded-xl border border-slate-250 p-2.5 text-xs focus:outline-none focus:border-emerald-600 bg-white font-semibold"
                />
              </div>
            </div>

            {/* Middle Section: Products Entry Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">Products to Order</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition shadow-sm cursor-pointer"
                >
                  + Add Row
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-bold text-[11px]">
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3 text-center w-[120px]">Quantity</th>
                      <th className="px-4 py-3 text-center w-[120px]">Unit</th>
                      <th className="px-4 py-3">Remarks (Optional)</th>
                      <th className="px-4 py-3 text-center w-[60px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {poItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/30">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Coca Cola 750ml"
                            value={item.productName}
                            onChange={(e) => handleRowChange(index, 'productName', e.target.value)}
                            className="w-full border rounded-xl p-2 focus:outline-none focus:border-emerald-600 font-semibold bg-white text-xs"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                            className="w-20 border rounded-xl p-2 focus:outline-none focus:border-emerald-600 font-bold text-center bg-white text-xs"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Bottles, PCS"
                            value={item.unit}
                            onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                            className="w-20 border rounded-xl p-2 focus:outline-none focus:border-emerald-600 font-semibold text-center bg-white text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="Special remarks for this batch..."
                            value={item.remarks}
                            onChange={(e) => handleRowChange(index, 'remarks', e.target.value)}
                            className="w-full border rounded-xl p-2 focus:outline-none focus:border-emerald-600 font-semibold bg-white text-xs"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: Create buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  resetPoForm();
                }}
                className="flex-1 py-3.5 bg-white border border-slate-350 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-center text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md text-center text-xs"
              >
                Create Purchase Order
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL 2: PURCHASE ORDER DETAILS */}
      {selectedPO && (() => {
        const po = selectedPO;
        const poItemsList = po.poItems || [];
        const expectedDate = po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate) : new Date();

        // Calculate dynamically received quantity maps from GRNs
        const grnsList = po.grns || [];
        const receivedMap: Record<string, number> = {};
        grnsList.forEach((grn: any) => {
          const gItems = Array.isArray(grn.items) ? grn.items : JSON.parse(grn.items || '[]');
          gItems.forEach((gi: any) => {
            receivedMap[gi.productId] = (receivedMap[gi.productId] || 0) + (gi.quantityReceived || 0);
          });
        });

        // Parse PO payment history log
        const payHistory = Array.isArray(po.paymentsHistory)
          ? po.paymentsHistory
          : (typeof po.paymentsHistory === 'string' ? JSON.parse(po.paymentsHistory || '[]') : []);

        const pendingAmt = Math.max(0, po.totalAmount - (po.paidAmount || 0));

        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden text-left border border-slate-100 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-5 bg-slate-50/50">
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-900 text-base">Purchase Order: {po.orderNumber}</h4>
                  <span className="text-xs text-slate-450 block mt-0.5">Supplier: {po.supplier?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${po.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                      po.status === 'Sent' ? 'bg-indigo-50 text-indigo-700' :
                        po.status === 'Received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-755'
                    }`}>
                    {po.status === 'Accepted' ? 'Confirmed' : po.status}
                  </span>
                  <button onClick={() => setSelectedPO(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-black transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Status</span>
                    <strong className="text-slate-900 block text-xs mt-0.5">{po.paymentStatus || 'Pending'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid Amount</span>
                    <strong className="text-emerald-600 block text-xs mt-0.5">₹{(po.paidAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Amount</span>
                    <strong className="text-rose-650 text-rose-600 block text-xs mt-0.5">₹{pendingAmt.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-slate-50/50 border border-slate-200 p-3.5 rounded-2xl space-y-2 font-semibold">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Delivery Information</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Order Date: <span className="text-slate-900 font-bold block mt-0.5">{new Date(po.orderDate).toLocaleDateString()}</span></div>
                    <div>Expected Date: <span className="text-slate-900 font-bold block mt-0.5">{expectedDate.toLocaleDateString()}</span></div>
                  </div>
                  {po.notes && (
                    <div className="border-t border-slate-150 pt-2 mt-1">
                      <span className="text-[9px] text-slate-400 block uppercase">Notes</span>
                      <p className="text-slate-800 font-medium">{po.notes}</p>
                    </div>
                  )}
                </div>

                {/* Products ordered list showing ordered, received & pending qty */}
                <div className="space-y-2 text-left">
                  <span className="font-extrabold text-slate-505 uppercase tracking-wider text-[10px] block">
                    Products & Quantities Log
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 border-b border-slate-250">
                          <th className="px-3 py-2">Product Name</th>
                          <th className="px-3 py-2 text-right">Ordered</th>
                          <th className="px-3 py-2 text-right">Received</th>
                          <th className="px-3 py-2 text-right">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                        {poItemsList.map((item: any, idx: number) => {
                          const recQty = receivedMap[item.productId] || 0;
                          const pendQty = Math.max(0, item.quantity - recQty);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="px-3 py-2 text-slate-900">{item.product?.name || item.productName || 'Unknown Product'}</td>
                              <td className="px-3 py-2 text-right text-indigo-755">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{recQty}</td>
                              <td className="px-3 py-2 text-right text-rose-650">{pendQty}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History section */}
                <div className="space-y-2 text-left">
                  <span className="font-extrabold text-slate-505 uppercase tracking-wider text-[10px] block">
                    Supplier Payment History
                  </span>
                  {payHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50 rounded-xl border">No payment logs recorded.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[10px] font-bold">
                        <thead>
                          <tr className="bg-slate-50 text-slate-455 border-b border-slate-250">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Method</th>
                            <th className="px-3 py-2">Reference No</th>
                            <th className="px-3 py-2">Recorded By</th>
                            <th className="px-3 py-2 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {payHistory.map((h: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/40">
                              <td className="px-3 py-2">{new Date(h.date).toLocaleDateString()}</td>
                              <td className="px-3 py-2">{h.method}</td>
                              <td className="px-3 py-2 font-mono">{h.referenceNumber}</td>
                              <td className="px-3 py-2">{h.createdBy}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">₹{h.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-5 border-t bg-slate-50/50 gap-2">
                {po.status !== 'Received' && po.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      const initialReceived: Record<string, number> = {};
                      const initialDamaged: Record<string, number> = {};
                      poItemsList.forEach((item: any) => {
                        initialReceived[item.productId || item.id] = item.quantity;
                        initialDamaged[item.productId || item.id] = 0;
                      });
                      setReceivedQtyMap(initialReceived);
                      setDamagedQtyMap(initialDamaged);
                      setShowReceiveModal(po);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs animate-pulse"
                  >
                    Receive Stock
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: RECEIVE PRODUCTS DIALOG */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden text-left border border-slate-100">
            <div className="flex items-center justify-between border-b p-5 bg-slate-50/50">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Receive Product Delivery (GRN)</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">Adjust incoming batch counts and flag any damaged units.</p>
              </div>
              <button onClick={() => setShowReceiveModal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReceivePO} className="p-5 space-y-4 text-xs text-left">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                <div>
                  <strong className="block text-slate-900">{showReceiveModal.orderNumber}</strong>
                  <span className="text-[10px] text-slate-450 block mt-0.5">Supplier: {showReceiveModal.supplier?.name}</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="rounded-lg border border-slate-250 p-1 bg-white font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                <label className="block font-bold text-slate-700">Product Quantities Checklist</label>
                {(showReceiveModal.poItems || []).map((item: any) => {
                  return (
                    <div key={item.productId || item.id} className="p-3 bg-slate-50/30 border border-slate-150 rounded-2xl space-y-2 font-semibold">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                        <strong className="text-slate-900 font-extrabold">{item.product?.name || item.productName}</strong>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-black">Ordered: {item.quantity} units</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Received Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={receivedQtyMap[item.productId || item.id] ?? item.quantity}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(item.quantity, Number(e.target.value)));
                              setReceivedQtyMap((prev) => ({ ...prev, [item.productId || item.id]: val }));
                            }}
                            className="w-full rounded-lg border p-1.5 focus:outline-none bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-rose-600 mb-0.5">Damaged Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={damagedQtyMap[item.productId || item.id] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(item.quantity, Number(e.target.value)));
                              setDamagedQtyMap((prev) => ({ ...prev, [item.productId || item.id]: val }));
                            }}
                            className="w-full rounded-lg border p-1.5 focus:outline-none bg-white font-bold text-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Receipt Notes (GRN Tag)</label>
                <textarea
                  placeholder="Enter remarks about this delivery..."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-250 p-2.5 focus:outline-none bg-white font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3.5">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(null)}
                  className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-bold transition shadow-md hover:scale-[1.01]"
                >
                  Confirm Goods Receipt (GRN)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD SUPPLIER PAYMENT */}
      {showPaymentModal && (() => {
        const inv = showPaymentModal;
        const totalPaid = inv.payments?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
        const pendingAmt = Math.max(0, inv.totalAmount - totalPaid);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-left border border-slate-100">
              <div className="flex items-center justify-between border-b p-5 bg-slate-50/50">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Record Supplier Payment</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Record invoice payment details for Bill {inv.invoiceNumber}.</p>
                </div>
                <button onClick={() => setShowPaymentModal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 text-xs text-left">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 font-semibold text-slate-655 text-xs">
                  <div>Bill/Invoice No: <strong className="text-slate-900">{inv.invoiceNumber}</strong></div>
                  <div>Supplier: <strong className="text-slate-900">{inv.supplier?.name}</strong></div>
                  <div>Purchase Order: <strong className="text-slate-900">{inv.purchaseOrder?.orderNumber}</strong></div>
                  <div>Invoice Total: <strong className="text-slate-900">₹{inv.totalAmount.toLocaleString()}</strong></div>
                  <div>Already Paid: <strong className="text-emerald-600">₹{totalPaid.toLocaleString()}</strong></div>
                  <div>Remaining Due: <strong className="text-rose-600 font-extrabold text-sm block mt-0.5">₹{pendingAmt.toLocaleString()}</strong></div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={pendingAmt}
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 p-2.5 font-bold focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 p-2.5 bg-white font-semibold focus:outline-none focus:border-emerald-600"
                    >
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 p-2.5 font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Reference Number</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-250 p-2.5 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Notes / Remarks</label>
                  <textarea
                    placeholder="Enter transaction remarks..."
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-250 p-2.5 focus:outline-none bg-white font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-3.5">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-bold transition shadow-md hover:scale-[1.01]"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Purchases;
