import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus, Search, Trash2, Edit2, CheckCircle, MessageSquare,
  Mail, Printer, AlertCircle, ArrowRight, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequestItem {
  productName: string;
  quantity: number | string;
  unit: string;
  notes?: string;
}

interface StockRequest {
  id: string;
  requestNo: string;
  requestedBy: string;
  requestDate: string;
  createdAt: string;
  status: string;
  items: RequestItem[];
  createdBy?: string;
  rejectionReason?: string;
  purchaseOrderId?: string;
  purchaseOrder?: any;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: {
    name: string;
    contactPerson?: string;
    email?: string;
    whatsapp?: string;
    mobile?: string;
    address?: string;
  };
  status: string;
  createdAt: string;
  orderDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  items: any;
  whatsappSentAt?: string;
  emailSentAt?: string;
  printedBy?: string;
  printDate?: string;
  kitchenRequests?: any[];
}

export const Suppliers: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'requests' | 'suppliers' | 'history'>('orders');

  // Core Data Lists
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [kitchenRequests, setKitchenRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [supplierSearch, setSupplierSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');

  // Modals & Forms
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    mobile: '',
    whatsapp: '',
    email: '',
    companyName: 'Company Name', // default
    contactPerson: 'Contact Person', // default
    address: 'Address', // default
    city: 'City',
    state: 'State',
    pincode: '400001',
    gstNumber: 'GST-PENDING',
    notes: 'Registered Supplier Partner',
    status: 'Active'
  });

  // Convert Kitchen Request to Supplier PO Modal
  const [selectedRequestToConvert, setSelectedRequestToConvert] = useState<StockRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<StockRequest | null>(null);
  const [convertForm, setConvertForm] = useState({
    supplierId: '',
    expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    items: [] as any[]
  });

  // View Order Details Modal
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Sending statuses for the PO details modal
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
        requestDate: new Date(Date.now() - (i * 2 * 3600 * 1000)).toISOString(),
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
        requestDate: new Date(Date.now() - (i * 3 * 3600 * 1000) - 24 * 3600 * 1000).toISOString(),
        items: getRandomItems(Math.floor(Math.random() * 3) + 1),
        rejectionReason: undefined
      });
    }

    // 15 Purchase Orders
    for (let i = 1; i <= 15; i++) {
      const status = i <= 5 ? 'Delivered' : i <= 10 ? 'Supplier Order Sent' : 'Converted';
      const poNum = `PO-2026-${String(300 + i).padStart(5, '0')}`;
      baseRequests.push({
        id: `mock-po-${i}`,
        requestNo: `KR-2026-${String(300 + i).padStart(5, '0')}`,
        requestedBy: 'Chef Adesh',
        status: status,
        createdAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 3 * 24 * 3600 * 1000).toISOString(),
        requestDate: new Date(Date.now() - (i * 5 * 3600 * 1000) - 3 * 24 * 3600 * 1000).toISOString(),
        items: getRandomItems(Math.floor(Math.random() * 2) + 1),
        purchaseOrderId: `po-id-${i}`,
        purchaseOrder: {
          id: `po-id-${i}`,
          orderNumber: poNum,
          supplierId: `sup-${i}`,
          status: status === 'Delivered' ? 'Delivered' : status === 'Supplier Order Sent' ? 'Sent' : 'Draft',
          expectedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
          totalAmount: (Math.floor(Math.random() * 300) + 100) * 10,
          subtotal: (Math.floor(Math.random() * 300) + 100) * 9,
          taxAmount: (Math.floor(Math.random() * 300) + 100) * 0.5,
          discountAmount: (Math.floor(Math.random() * 300) + 100) * 0.5,
          createdAt: new Date(Date.now() - (i * 5 * 3600 * 1000) - 1.5 * 24 * 3600 * 1000).toISOString(),
          orderDate: new Date(Date.now() - (i * 5 * 3600 * 1000) - 1.5 * 24 * 3600 * 1000).toISOString(),
          items: getRandomItems(Math.floor(Math.random() * 2) + 1),
          supplier: {
            name: i % 3 === 0 ? 'Fresh Farm Traders' : i % 3 === 1 ? 'Premium Spices House' : 'Daily Fresh Fruits',
            mobile: '9123456789',
            whatsapp: '9123456789',
            email: 'orders@supplier.com',
            contactPerson: 'Supplier Representative',
            address: 'Industrial Sector 10, Hub Area'
          }
        } as any
      });
    }

    return baseRequests;
  };

  // Fetch all Sourcing data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [supps, pos, reqs] = await Promise.all([
        auth.apiRequest('/suppliers').catch(() => []),
        auth.apiRequest('/suppliers/pos').catch(() => []),
        auth.apiRequest('/suppliers/kitchen-requests').catch(() => [])
      ]);
      setSuppliers(Array.isArray(supps) ? supps : []);

      const dbRequests = Array.isArray(reqs) ? reqs : [];
      const dbRequestNos = new Set(dbRequests.map(r => r.requestNo));
      const dummyRequests = generateDummyRequests().filter(r => !dbRequestNos.has(r.requestNo));
      const finalRequests = [...dbRequests, ...dummyRequests];
      finalRequests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setKitchenRequests(finalRequests);

      const dbOrders = Array.isArray(pos) ? pos : [];
      const dbOrderNos = new Set(dbOrders.map(o => o.orderNumber));
      const dummyPOs = dummyRequests
        .filter(r => r.purchaseOrder)
        .map(r => ({
          ...r.purchaseOrder,
          kitchenRequests: [{ id: r.id, requestNo: r.requestNo }]
        }))
        .filter((o: any) => !dbOrderNos.has(o.orderNumber));

      const finalOrders = [...dbOrders, ...dummyPOs];
      finalOrders.sort((a: any, b: any) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime());
      setPurchaseOrders(finalOrders as any[]);
    } catch (error) {
      console.error('Failed to load sourcing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time events to auto-reload list contents
    const handleMutation = () => {
      fetchData();
    };
    window.addEventListener('stock-request-mutated', handleMutation);
    return () => {
      window.removeEventListener('stock-request-mutated', handleMutation);
    };
  }, []);

  // Read URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const searchParam = params.get('search') || '';
    if (tabParam && ['orders', 'requests', 'suppliers', 'history'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (tabParam === 'orders') {
      setOrderSearch(searchParam);
    } else if (tabParam === 'requests') {
      setRequestSearch(searchParam);
    } else if (tabParam === 'suppliers') {
      setSupplierSearch(searchParam);
    }
  }, [window.location.search]);

  // Sync selected PO if it updates in the background
  useEffect(() => {
    if (selectedPO) {
      const updated = purchaseOrders.find(p => p.id === selectedPO.id);
      if (updated) {
        setSelectedPO(updated);
      }
    }
  }, [purchaseOrders]);

  // Actions for Suppliers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(supplierForm.mobile)) {
      alert('Mobile number must be exactly 10 digits and numeric-only.');
      return;
    }
    if (supplierForm.whatsapp && !phoneRegex.test(supplierForm.whatsapp)) {
      alert('WhatsApp number must be exactly 10 digits and numeric-only.');
      return;
    }
    try {
      const payload = {
        name: supplierForm.name,
        companyName: supplierForm.name + ' Corp',
        contactPerson: supplierForm.name + ' Manager',
        mobile: supplierForm.mobile,
        whatsapp: supplierForm.whatsapp || supplierForm.mobile,
        email: supplierForm.email,
        gstNumber: 'GST-PENDING',
        address: 'Sourcing address',
        city: 'City',
        state: 'State',
        pincode: '400001',
        notes: 'Sourcing Supplier Partner',
        status: 'Active'
      };

      if (editingSupplier) {
        await auth.apiRequest(`/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await auth.apiRequest('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowSupplierModal(false);
      setEditingSupplier(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to save supplier');
    }
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      mobile: supplier.mobile || '',
      whatsapp: supplier.whatsapp || '',
      email: supplier.email || '',
      companyName: supplier.companyName || 'Company Name',
      contactPerson: supplier.contactPerson || 'Contact Person',
      address: supplier.address || 'Address',
      city: supplier.city || 'City',
      state: supplier.state || 'State',
      pincode: supplier.pincode || '400001',
      gstNumber: supplier.gstNumber || 'GST-PENDING',
      notes: supplier.notes || 'Sourcing Supplier Partner',
      status: supplier.status || 'Active'
    });
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this supplier?')) return;
    try {
      await auth.apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete supplier');
    }
  };

  const toggleSupplierStatus = async (supplier: any) => {
    try {
      const nextStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
      await auth.apiRequest(`/suppliers/${supplier.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...supplier, status: nextStatus })
      });
      fetchData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Actions for Kitchen Requests
  const handleApproveRequest = async (reqId: string) => {
    try {
      if (reqId.startsWith('mock-') || reqId.startsWith('mock-pending-')) {
        // Find the mock request
        const reqObj = kitchenRequests.find(r => r.id === reqId);
        if (!reqObj) throw new Error('Request not found');

        // Create a mock Purchase Order
        const year = new Date().getFullYear();
        const count = purchaseOrders.length;
        const generatedOrderNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
        
        const newPO: any = {
          id: `po-id-${Date.now()}`,
          orderNumber: generatedOrderNumber,
          supplierId: suppliers[0]?.id || 'default-supplier-id',
          supplier: suppliers[0] || { name: 'Default Kitchen Supplier' },
          status: 'Draft',
          totalAmount: 1500,
          paymentStatus: 'Unpaid',
          expectedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          items: reqObj.items.map((it: any) => ({
            ...it,
            purchasePrice: 10
          })),
          kitchenRequests: [{ id: reqObj.id, requestNo: reqObj.requestNo }]
        };

        // Add to local state
        setPurchaseOrders(prev => [newPO, ...prev]);
        setKitchenRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Converted' } : r));

        window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: newPO }));
        alert(`Request Approved (Mock Mode)!\nPurchase Order ${newPO.orderNumber} has been created automatically.`);
        setActiveTab('orders');
        return;
      }

      const updated = await auth.apiRequest(`/suppliers/kitchen-requests/${reqId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved' })
      });
      await fetchData();
      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
      alert(`Request Approved!\nPurchase Order ${updated.purchaseOrder?.orderNumber || ''} has been created automatically.`);
      setActiveTab('orders'); // Redirect to Purchase Orders tab
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    const reason = window.prompt('Please enter the rejection reason:');
    if (reason === null) return;
    try {
      if (reqId.startsWith('mock-') || reqId.startsWith('mock-pending-')) {
        setKitchenRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected', rejectionReason: reason || 'Rejected by Admin' } : r));
        window.dispatchEvent(new CustomEvent('stock-request-mutated'));
        alert('Request Rejected Successfully (Mock Mode)!');
        return;
      }
      const updated = await auth.apiRequest(`/suppliers/kitchen-requests/${reqId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Rejected',
          rejectionReason: reason || 'Rejected by Admin'
        })
      });
      await fetchData();
      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
      alert('Request Rejected Successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const openConvertModal = (req: StockRequest) => {
    setSelectedRequestToConvert(req);
    const itemsPrep = req.items.map(it => ({
      productName: it.productName,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'Kg',
      purchasePrice: 10
    }));
    setConvertForm({
      supplierId: suppliers[0]?.id || '',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      items: itemsPrep
    });
  };

  const handleCreateOrderFromRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertForm.supplierId) {
      alert('Please select a supplier.');
      return;
    }
    try {
      const totalAmount = convertForm.items.reduce((sum, it) => sum + (it.quantity * it.purchasePrice), 0);

      const poPayload = {
        supplierId: convertForm.supplierId,
        expectedDeliveryDate: convertForm.expectedDeliveryDate,
        subtotal: totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
        items: convertForm.items
      };

      const newPO = await auth.apiRequest('/suppliers/pos', {
        method: 'POST',
        body: JSON.stringify(poPayload)
      });

      if (selectedRequestToConvert) {
        const updated = await auth.apiRequest(`/suppliers/kitchen-requests/${selectedRequestToConvert.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Converted', purchaseOrderId: newPO.id })
        });
        window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
      }

      setSelectedRequestToConvert(null);
      fetchData();
      setActiveTab('orders');
    } catch (error: any) {
      alert(error.message || 'Failed to convert request to purchase order.');
    }
  };

  // PO Dispatch Methods
  const handleSendWhatsApp = async (poId: string) => {
    setSendingWhatsApp(true);
    try {
      const res = await auth.apiRequest(`/suppliers/pos/${poId}/whatsapp`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (res.success) {
        alert('Purchase Order successfully dispatched via WhatsApp API simulation!');
      } else {
        alert('Failed to send: ' + (res.message || 'Unknown error'));
      }
      fetchData();
    } catch (err: any) {
      alert('Network or server error during WhatsApp send.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSendEmail = async (poId: string) => {
    setSendingEmail(true);
    try {
      const res = await auth.apiRequest(`/suppliers/pos/${poId}/email`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (res.success) {
        alert('Purchase Order PDF successfully emailed directly to Sourcing Partner!');
      } else {
        alert('Failed to send: ' + (res.message || 'Unknown error'));
      }
      fetchData();
    } catch (err: any) {
      alert('Network or server error during email dispatch.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Dedicated clean PO print generation
  const handlePrintPurchaseOrder = (po: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const itemsList = Array.isArray(po.items) ? po.items : [];
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order ${po.orderNumber}</title>
            <style>
              body { font-family: 'Outfit', 'Segoe UI', sans-serif; padding: 40px; color: #000; font-size: 14px; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; }
              .logo-title h2 { margin: 0; font-size: 24px; font-weight: 500; color: #000; }
              .logo-title p { margin: 3px 0 0 0; color: #666; font-size: 13px; }
              .po-meta { text-align: right; font-size: 13px; }
              .grid { display: flex; gap: 40px; margin-bottom: 30px; }
              .col { flex: 1; }
              .col h4 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 4px; }
              .col p { margin: 4px 0; }
              table { width: 100%; border-collapse: collapse; margin: 25px 0; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
              th { background-color: #f8fafc; font-weight: 600; font-size: 13px; text-transform: uppercase; }
              .totals { display: flex; justify-content: flex-end; margin-top: 15px; font-size: 14px; }
              .totals-table { width: 250px; margin: 0; }
              .totals-table td { padding: 6px; border: 0; }
              .totals-table tr.grand-total { font-weight: bold; border-top: 1px solid #000; }
              .footer-sign { display: flex; justify-content: space-between; margin-top: 80px; padding-top: 20px; }
              .sign-line { border-top: 1px solid #ccc; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-title">
                <h2>Gourmet Kitchen Restaurant</h2>
                <p>12/A, Park Street Area, Sector 5, Kolkata</p>
                <p>GSTIN: 19AAACG0281F1Z2</p>
              </div>
              <div class="po-meta">
                <h3 style="margin:0; font-size:18px; font-weight:500;">PURCHASE ORDER</h3>
                <p><strong>PO Number:</strong> ${po.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(po.createdAt || po.orderDate).toLocaleDateString()}</p>
                <p><strong>Expected Delivery:</strong> ${new Date(po.expectedDeliveryDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="grid">
              <div class="col">
                <h4>Supplier Information</h4>
                <p><strong>Name:</strong> ${po.supplier?.name}</p>
                <p><strong>Contact Person:</strong> ${po.supplier?.contactPerson || 'Procurement Agent'}</p>
                <p><strong>Mobile:</strong> ${po.supplier?.mobile || '-'}</p>
                <p><strong>Email:</strong> ${po.supplier?.email || '-'}</p>
                <p><strong>Address:</strong> ${po.supplier?.address || '-'}</p>
              </div>
              <div class="col" style="flex: 0.5;">
                <h4>Shipping Address</h4>
                <p>Gourmet Kitchen Restaurant</p>
                <p>Main Store, Kitchen Dept</p>
                <p>Sector 5, Kolkata</p>
              </div>
            </div>

            <h4 style="margin: 20px 0 8px 0; font-size:14px; text-transform:uppercase; color:#555;">Supplier Order Document</h4>
            <div style="font-size: 15px; font-weight: 600; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #fafafa; margin-bottom: 25px; line-height: 1.6; color: #111;">
              ${itemsList.map(it => `${it.productName} - ${it.quantity} ${it.unit || 'Kg'}`).join('<br/>')}
            </div>

            <h4 style="margin: 20px 0 8px 0; font-size:14px; text-transform:uppercase; color:#555;">Billing Summary</h4>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Cost</th>
                  <th style="text-align: right;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList.map(it => `
                  <tr>
                    <td><strong>${it.productName}</strong></td>
                    <td>${it.quantity}</td>
                    <td>${it.unit || 'Kg'}</td>
                    <td>₹${Number(it.purchasePrice || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right;">₹${(Number(it.quantity) * Number(it.purchasePrice || 0)).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <table class="totals-table">
                <tr>
                  <td>Subtotal:</td>
                  <td style="text-align: right;">₹${Number(po.subtotal || po.totalAmount).toLocaleString('en-IN')}</td>
                </tr>
                <tr class="grand-total">
                  <td>Grand Total:</td>
                  <td style="text-align: right;">₹${Number(po.totalAmount).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <div class="footer-sign">
              <div class="sign-line">
                <p>Requested By</p>
                <p style="color:#888; font-size:11px; margin-top:2px;">${po.printedBy || 'Kitchen Operations'}</p>
              </div>
              <div class="sign-line" style="margin-top:25px;">
                <p>Authorized Signature & Stamp</p>
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Nav to section
  const handleKpiNavigation = (tabId: 'orders' | 'requests' | 'suppliers' | 'history') => {
    setActiveTab(tabId);
    const container = document.getElementById('main-tab-content');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered lists
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.mobile && s.mobile.includes(supplierSearch)) ||
        (s.email && s.email.toLowerCase().includes(supplierSearch.toLowerCase()));
    });
  }, [suppliers, supplierSearch]);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(o => {
      const supplierName = o.supplier?.name || '';
      return o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        supplierName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.status.toLowerCase().includes(orderSearch.toLowerCase());
    });
  }, [purchaseOrders, orderSearch]);

  const filteredRequests = useMemo(() => {
    return kitchenRequests.filter(r => {
      return r.requestNo.toLowerCase().includes(requestSearch.toLowerCase()) ||
        r.requestedBy.toLowerCase().includes(requestSearch.toLowerCase()) ||
        r.status.toLowerCase().includes(requestSearch.toLowerCase());
    });
  }, [kitchenRequests, requestSearch]);

  // Count calculations
  const pendingRequestsCount = kitchenRequests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length;
  const totalOrdersCount = purchaseOrders.length;
  const sentOrdersCount = purchaseOrders.filter(o => o.status === 'Sent' || o.status === 'Confirmed' || o.status === 'Delivered').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 text-left font-['Outfit',sans-serif] antialiased text-black p-4 select-none">

      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[24px] font-medium text-black uppercase tracking-tight">Supplier Management</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">Manage kitchen stock requests, create supplier orders, and track fulfillment.</p>
        </div>
        {activeTab === 'suppliers' && (
          <div>
            <button
              onClick={() => {
                setSupplierForm({
                  name: '',
                  mobile: '',
                  whatsapp: '',
                  email: '',
                  companyName: 'Company Name',
                  contactPerson: 'Contact Person',
                  address: 'Address',
                  city: 'City',
                  state: 'State',
                  pincode: '400001',
                  gstNumber: 'GST-PENDING',
                  notes: 'Sourcing Supplier Partner',
                  status: 'Active'
                });
                setEditingSupplier(null);
                setShowSupplierModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-4 rounded-xl text-[14px] transition-all shadow-sm border border-emerald-600 cursor-pointer"
            >
              <Plus className="w-4 h-4" />Create Supplier
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <button
          onClick={() => {
            handleKpiNavigation('requests');
            setRequestSearch('Pending');
          }}
          className="p-5 bg-white rounded-2xl border border-slate-100 border-t-[3px] border-t-amber-500 text-left transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between"
        >
          <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</span>
          <span className="text-3xl font-bold text-black block leading-none">{pendingRequestsCount}</span>
        </button>

        <button
          onClick={() => {
            handleKpiNavigation('suppliers');
            setSupplierSearch('');
          }}
          className="p-5 bg-white rounded-2xl border border-slate-100 border-t-[3px] border-t-blue-500 text-left transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between"
        >
          <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Suppliers</span>
          <span className="text-3xl font-bold text-black block leading-none">{suppliers.length}</span>
        </button>

        <button
          onClick={() => {
            handleKpiNavigation('orders');
            setOrderSearch('');
          }}
          className="p-5 bg-white rounded-2xl border border-slate-100 border-t-[3px] border-t-emerald-600 text-left transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between"
        >
          <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Purchase Orders</span>
          <span className="text-3xl font-bold text-black block leading-none">{totalOrdersCount}</span>
        </button>

        <button
          onClick={() => {
            handleKpiNavigation('orders');
            setOrderSearch('Sent');
          }}
          className="p-5 bg-white rounded-2xl border border-slate-100 border-t-[3px] border-t-purple-500 text-left transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 cursor-pointer w-full h-28 flex flex-col justify-between"
        >
          <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Sent Orders</span>
          <span className="text-3xl font-bold text-black block leading-none">{sentOrdersCount}</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div id="main-tab-content" className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          onClick={() => { setActiveTab('suppliers'); navigate('/restaurant/suppliers?tab=suppliers', { replace: true }); }}
          className={`flex-1 py-3 rounded-lg text-[14px] tracking-wider transition-all font-bold ${activeTab === 'suppliers'
              ? 'bg-white shadow-sm text-black border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => { setActiveTab('requests'); navigate('/restaurant/suppliers?tab=requests', { replace: true }); }}
          className={`flex-1 py-3 rounded-lg text-[14px] tracking-wider transition-all font-bold ${activeTab === 'requests'
              ? 'bg-white shadow-sm text-black border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Pending Requests
        </button>
        <button
          onClick={() => { setActiveTab('orders'); navigate('/restaurant/suppliers?tab=orders', { replace: true }); }}
          className={`flex-1 py-3 rounded-lg text-[14px] tracking-wider transition-all font-bold ${activeTab === 'orders'
              ? 'bg-white shadow-sm text-black border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Supplier Orders
        </button>
        <button
          onClick={() => { setActiveTab('history'); navigate('/restaurant/suppliers?tab=history', { replace: true }); }}
          className={`flex-1 py-3 rounded-lg text-[14px] tracking-wider transition-all font-bold ${activeTab === 'history'
              ? 'bg-white shadow-sm text-black border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Order History
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse h-[240px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                    <div className="space-y-1.5">
                      <div className="h-4.5 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="pt-3 space-y-3">
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* TAB 2: Pending Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-[17px] font-semibold text-black uppercase tracking-wider">Pending Kitchen Requests</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-slate-200 text-[14px]">
                    No pending kitchen requests.
                  </div>
                ) : (
                  filteredRequests.filter(r => r.status === 'Pending' || r.status === 'Pending Approval').map(req => {
                    return (
                      <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 text-left">
                        <div>
                          <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                            <div>
                              <h3 className="font-semibold text-black text-[17px]">Request #{req.requestNo}</h3>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1">Date: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${req.status === 'Approved' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                              {req.status}
                            </span>
                          </div>

                          <div className="pt-3 space-y-2 text-[14px]">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Requested By:</span>
                                <strong className="text-black font-semibold">{req.requestedBy}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Created By:</span>
                                <strong className="text-black font-semibold">{req.createdBy || 'Kitchen'}</strong>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Items:</span>
                              <div className="space-y-1.5 text-slate-700 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
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

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[14px] text-slate-550 font-semibold mb-1">
                            <span>Total Items: {req.items.length}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingRequest(req)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98]"
                            >
                              View Details
                            </button>
                            {(req.status === 'Pending' || req.status === 'Pending Approval') && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold h-[34px] px-2.5 rounded-lg text-[13px] transition active:scale-[0.98]"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {req.status === 'Approved' && (
                              <button
                                onClick={() => openConvertModal(req)}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[34px] rounded-lg text-[13px] flex items-center justify-center gap-1 transition active:scale-[0.98]"
                              >
                                Create Supplier Order <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Supplier Orders (Draft/Pending) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-[17px] font-semibold text-black uppercase tracking-wider">Supplier Orders</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search active orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Grid of Cards for Draft / Pending POs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-slate-200 text-[14px]">
                    No active supplier orders found.
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    return (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 text-left">
                        <div>
                          <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                            <div>
                              <h3 className="font-semibold text-black text-[17px]">{order.orderNumber}</h3>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1">Date: {new Date(order.createdAt || order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Delivered' || order.status === 'Received' ? 'bg-emerald-50 text-emerald-700' :
                                order.status === 'Sent' || order.status === 'Confirmed' ? 'bg-purple-50 text-purple-700' :
                                  'bg-amber-50 text-amber-700'
                              }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="pt-3 space-y-2 text-[14px]">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Supplier:</span>
                              {order.status === 'Draft' ? (
                                <select
                                  value={order.supplierId || ''}
                                  onChange={async (e) => {
                                    const nextSupplierId = e.target.value;
                                    if (!nextSupplierId) return;
                                    try {
                                      const updatedPO = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ supplierId: nextSupplierId })
                                      });
                                      fetchData();
                                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updatedPO }));
                                    } catch (err: any) {
                                      alert(err.message || 'Failed to change supplier');
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] font-semibold mt-1 focus:outline-none focus:border-emerald-600"
                                >
                                  <option value="">-- Choose Supplier --</option>
                                  {suppliers.filter(s => s.status === 'Active').map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <strong className="text-black font-semibold">{order.supplier?.name || 'Unknown Partner'}</strong>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Items:</span>
                              <div className="space-y-1.5 text-slate-700 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {orderItems.map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{it.productName}</span>
                                    <span className="text-slate-550 font-bold">{it.quantity} {it.unit || 'Kg'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[14px] text-slate-550 font-semibold mb-1">
                            <span>Total Items: {orderItems.length}</span>
                            <span className="text-emerald-700 font-bold">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                          </div>
                          
                          {order.kitchenRequests && order.kitchenRequests.length > 0 && (
                            <div className="text-[12px] mb-2 text-slate-600 font-semibold">
                              <span>Related Request: </span>
                              <span 
                                onClick={() => {
                                  const reqId = order.kitchenRequests?.[0]?.id || order.kitchenRequests?.[0]?.requestId;
                                  if (reqId) navigate(`/restaurant/inventory-requests?id=${reqId}`);
                                }} 
                                className="text-emerald-600 hover:underline cursor-pointer"
                              >
                                #{order.kitchenRequests?.[0]?.requestNo}
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedPO(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handlePrintPurchaseOrder(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              Print PO
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(order.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              WhatsApp PO
                            </button>
                            <button
                              onClick={() => handleSendEmail(order.id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              Email PO
                            </button>

                            {order.status === 'Draft' && (
                              <button
                                onClick={async () => {
                                  try {
                                    if (!order.supplierId) {
                                      alert('Please select a supplier first.');
                                      return;
                                    }
                                    let updated: any;
                                    if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                      updated = { ...order, status: 'Sent' };
                                      setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                    } else {
                                      updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ status: 'Sent' })
                                      });
                                      await fetchData();
                                    }
                                    window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                    alert('Order successfully marked as Sent!');
                                  } catch (e) {
                                    alert('Failed to send order');
                                  }
                                }}
                                className="col-span-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                              >
                                Send Order
                              </button>
                            )}

                            {(order.status === 'Sent' || order.status === 'Supplier Order Sent') && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      let updated: any;
                                      if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                        updated = { ...order, status: 'Delivered' };
                                        setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                      } else {
                                        updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'Delivered' })
                                        });
                                        await fetchData();
                                      }
                                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                      alert('Order successfully marked as Delivered! Stock has been updated.');
                                    } catch (e) {
                                      alert('Failed to mark delivered');
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      let updated: any;
                                      if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                        updated = { ...order, status: 'Received' };
                                        setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                      } else {
                                        updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'Received' })
                                        });
                                        await fetchData();
                                      }
                                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                      alert('Order successfully marked as Received!');
                                    } catch (e) {
                                      alert('Failed to mark received');
                                    }
                                  }}
                                  className="bg-blue-605 hover:bg-blue-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                                >
                                  Mark Received
                                </button>
                              </>
                            )}

                            {order.status === 'Delivered' && (
                              <button
                                onClick={async () => {
                                  try {
                                    let updated: any;
                                    if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                      updated = { ...order, status: 'Received' };
                                      setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                    } else {
                                      updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ status: 'Received' })
                                      });
                                      await fetchData();
                                    }
                                    window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                    alert('Order successfully marked as Received!');
                                  } catch (e) {
                                    alert('Failed to mark received');
                                  }
                                }}
                                className="col-span-2 bg-blue-605 hover:bg-blue-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                              >
                                Mark Received
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Order History (Sent/Delivered) */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-[17px] font-semibold text-black uppercase tracking-wider">Order History</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Grid of Cards for Historical POs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.filter(o => o.status !== 'Draft' && o.status !== 'Pending' && o.status !== 'Pending Approval').length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-slate-200 text-[14px]">
                    No historical orders found.
                  </div>
                ) : (
                  filteredOrders.filter(o => o.status !== 'Draft' && o.status !== 'Pending' && o.status !== 'Pending Approval').map(order => {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    return (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 text-left">
                        <div>
                          <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                            <div>
                              <h3 className="font-semibold text-black text-[17px]">{order.orderNumber}</h3>
                              <p className="text-[11px] text-slate-400 font-semibold mt-1">Date: {new Date(order.createdAt || order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="pt-3 space-y-2 text-[14px]">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Supplier:</span>
                              <strong className="text-black font-semibold">{order.supplier?.name || 'Unknown Partner'}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Items:</span>
                              <div className="space-y-1.5 text-slate-700 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {orderItems.map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{it.productName}</span>
                                    <span className="text-slate-550 font-bold">{it.quantity} {it.unit || 'Kg'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[14px] text-slate-550 font-semibold mb-1">
                            <span>Total Items: {orderItems.length}</span>
                            <span className="text-emerald-700 font-bold">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                          </div>

                          {order.kitchenRequests && order.kitchenRequests.length > 0 && (
                            <div className="text-[12px] mb-2 text-slate-600 font-semibold">
                              <span>Related Request: </span>
                              <span 
                                onClick={() => {
                                  const reqId = order.kitchenRequests?.[0]?.id || order.kitchenRequests?.[0]?.requestId;
                                  if (reqId) navigate(`/restaurant/inventory-requests?id=${reqId}`);
                                }} 
                                className="text-emerald-600 hover:underline cursor-pointer"
                              >
                                #{order.kitchenRequests?.[0]?.requestNo}
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedPO(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handlePrintPurchaseOrder(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              Print PO
                            </button>
                            <button
                              onClick={() => handleSendWhatsApp(order.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              WhatsApp PO
                            </button>
                            <button
                              onClick={() => handleSendEmail(order.id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                            >
                              Email PO
                            </button>

                            {(order.status === 'Sent' || order.status === 'Supplier Order Sent') && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      let updated: any;
                                      if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                        updated = { ...order, status: 'Delivered' };
                                        setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                      } else {
                                        updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'Delivered' })
                                        });
                                        await fetchData();
                                      }
                                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                      alert('Order successfully marked as Delivered! Stock has been updated.');
                                    } catch (e) {
                                      alert('Failed to mark delivered');
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                                >
                                  Mark Delivered
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      let updated: any;
                                      if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                        updated = { ...order, status: 'Received' };
                                        setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                      } else {
                                        updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                          method: 'PUT',
                                          body: JSON.stringify({ status: 'Received' })
                                        });
                                        await fetchData();
                                      }
                                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                      alert('Order successfully marked as Received!');
                                    } catch (e) {
                                      alert('Failed to mark received');
                                    }
                                  }}
                                  className="bg-blue-605 hover:bg-blue-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                                >
                                  Mark Received
                                </button>
                              </>
                            )}

                            {order.status === 'Delivered' && (
                              <button
                                onClick={async () => {
                                  try {
                                    let updated: any;
                                    if (order.id.startsWith('po-id-') || order.id.startsWith('mock-')) {
                                      updated = { ...order, status: 'Received' };
                                      setPurchaseOrders(prev => prev.map(p => p.id === order.id ? updated : p));
                                    } else {
                                      updated = await auth.apiRequest(`/suppliers/pos/${order.id}/status`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ status: 'Received' })
                                      });
                                      await fetchData();
                                    }
                                    window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                                    alert('Order successfully marked as Received!');
                                  } catch (e) {
                                    alert('Failed to mark received');
                                  }
                                }}
                                className="col-span-2 bg-blue-605 hover:bg-blue-700 text-white font-semibold h-[34px] rounded-lg text-[13px] transition active:scale-[0.98] cursor-pointer"
                              >
                                Mark Received
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Suppliers */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-[17px] font-medium text-black uppercase tracking-wider">Suppliers</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Grid view of suppliers */}
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-slate-200">No suppliers registered.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSuppliers.map(s => {
                    return (
                      <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition duration-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                            <div>
                              <h3 className="font-medium text-black text-[18px] uppercase leading-snug">{s.name}</h3>
                              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">{s.companyName}</p>
                            </div>
                            <button
                              onClick={() => toggleSupplierStatus(s)}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer ${s.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : 'bg-red-50 text-red-750 border-red-200'
                                }`}
                            >
                              {s.status}
                            </button>
                          </div>

                          <div className="space-y-2.5 text-[14px] pt-3 text-slate-700 font-semibold">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Mobile:</span>
                              <span className="text-black">{s.mobile}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">WhatsApp:</span>
                              <span className="text-black">{s.whatsapp || s.mobile}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Email:</span>
                              <span className="text-black truncate max-w-[200px]" title={s.email}>{s.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => handleEditSupplier(s)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-[12px] text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Details
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="bg-slate-50 hover:bg-red-50 text-red-600 font-bold p-2 rounded-lg border border-slate-200 hover:border-red-200 transition cursor-pointer"
                            title="Delete supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Convert Kitchen Request Modal */}
      {selectedRequestToConvert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="font-medium text-black text-[18px] uppercase tracking-wider mb-4 border-b pb-2 flex justify-between items-center">
              <span>Convert Request {selectedRequestToConvert.requestNo}</span>
              <button onClick={() => setSelectedRequestToConvert(null)} className="text-slate-400 hover:text-black font-bold">×</button>
            </h3>

            <form onSubmit={handleCreateOrderFromRequest} className="space-y-4 text-[14px] font-semibold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Select Supplier *</label>
                  <select
                    required
                    value={convertForm.supplierId}
                    onChange={(e) => setConvertForm({ ...convertForm, supplierId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.filter(s => s.status === 'Active').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Expected Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={convertForm.expectedDeliveryDate}
                    onChange={(e) => setConvertForm({ ...convertForm, expectedDeliveryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Review Items & Prices</label>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[14px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b font-medium text-black">
                        <th className="p-2">Product Name</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Cost Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {convertForm.items.map((it, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2 text-black">{it.productName}</td>
                          <td className="p-2 text-slate-700">{it.quantity}</td>
                          <td className="p-2 text-slate-500">{it.unit}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="0"
                              value={it.purchasePrice}
                              onChange={(e) => {
                                const nextVal = parseFloat(e.target.value) || 0;
                                const nextItems = [...convertForm.items];
                                nextItems[idx].purchasePrice = nextVal;
                                setConvertForm({ ...convertForm, items: nextItems });
                              }}
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:border-emerald-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-[14px] uppercase tracking-wider shadow cursor-pointer text-center"
                >
                  Generate Supplier Order
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequestToConvert(null)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-3 rounded-xl text-[14px] uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Register / Edit Modal - Clean 4-Field Setup */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] flex flex-col overflow-hidden">
            <h3 className="font-medium text-black text-[18px] uppercase tracking-wider mb-4 border-b pb-2 shrink-0">
              {editingSupplier ? 'Edit Supplier' : 'Create Supplier'}
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-[14px] font-semibold text-slate-700 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Farms Produce"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={supplierForm.mobile}
                  onChange={(e) => setSupplierForm({ ...supplierForm, mobile: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={supplierForm.whatsapp}
                  onChange={(e) => setSupplierForm({ ...supplierForm, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. sales@freshfarms.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-[14px] uppercase tracking-wider shadow cursor-pointer text-center"
                >
                  Save Partner
                </button>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-3 rounded-xl text-[14px] uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Large Purchase Order Details Modal (Redesigned) */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-[90%] h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative text-left">

            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div>
                <h3 className="text-xl font-medium text-black uppercase tracking-tight">
                  Purchase Order Details
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Reference: {selectedPO.orderNumber}</p>
              </div>

              {/* PRINT / EMAIL / WHATSAPP Buttons at top-right */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePrintPurchaseOrder(selectedPO)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  disabled={sendingEmail}
                  onClick={() => handleSendEmail(selectedPO.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  disabled={sendingWhatsApp}
                  onClick={() => handleSendWhatsApp(selectedPO.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}
                </button>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="w-9 h-9 rounded-full bg-slate-105 hover:bg-slate-200 text-black font-extrabold text-[20px] flex items-center justify-center transition cursor-pointer ml-2"
                  title="Close Modal"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">

              {/* ORDER INFORMATION */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-[15px] font-medium text-black uppercase tracking-wider border-b pb-2 border-slate-100">Order Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">PO Number</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Date</span>
                    <strong className="text-black text-sm font-semibold">{new Date(selectedPO.createdAt || selectedPO.orderDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Created By</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.printedBy || 'Admin'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${selectedPO.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' :
                        selectedPO.status === 'Sent' || selectedPO.status === 'Dispatched' ? 'bg-purple-50 text-purple-700' :
                          'bg-amber-50 text-amber-700'
                      }`}>
                      {selectedPO.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUPPLIER INFORMATION */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-[15px] font-medium text-black uppercase tracking-wider border-b pb-2 border-slate-100">Supplier Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Supplier Name</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.supplier?.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Mobile Number</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.supplier?.mobile || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Email</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.supplier?.email || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* ITEM TABLE */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-[15px] font-medium text-black uppercase tracking-wider border-b pb-2 border-slate-100">Item Table</h4>
                <div className="overflow-hidden border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b font-medium text-black h-9">
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {(Array.isArray(selectedPO.items) ? selectedPO.items : []).map((it: any, idx: number) => (
                        <tr key={idx} className="h-10 hover:bg-slate-55/50 transition">
                          <td className="p-3 font-semibold text-black">{it.productName}</td>
                          <td className="p-3">{it.quantity}</td>
                          <td className="p-3 text-slate-500">{it.unit || 'Kg'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-[15px] font-medium text-black uppercase tracking-wider border-b pb-2 border-slate-100">Order Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Total Items</span>
                    <strong className="text-black text-sm font-semibold">{(Array.isArray(selectedPO.items) ? selectedPO.items.length : 0)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Expected Delivery Date</span>
                    <strong className="text-black text-sm font-semibold">{new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Created By</span>
                    <strong className="text-black text-sm font-semibold">{selectedPO.printedBy || 'Admin'}</strong>
                  </div>
                  {selectedPO.kitchenRequests && selectedPO.kitchenRequests.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase mb-0.5">Related Kitchen Request</span>
                      <button
                        onClick={() => {
                          setSelectedPO(null);
                          navigate(`/restaurant/inventory-requests?id=${selectedPO.kitchenRequests?.[0]?.id}`);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-bold underline text-sm block cursor-pointer bg-transparent border-none p-0 text-left"
                      >
                        {selectedPO.kitchenRequests?.[0]?.requestNo}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Delivery Status Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150">
                <div className="space-y-2">
                  <h5 className="font-medium text-[13px] text-black uppercase tracking-wider">WhatsApp Delivery Logs</h5>
                  {selectedPO.whatsappSentAt ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-bold text-[13px] text-emerald-800">WhatsApp Sent Successfully</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">{new Date(selectedPO.whatsappSentAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-[13px] text-slate-750">Not Sent yet</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-[13px] text-black uppercase tracking-wider">Email Delivery Logs</h5>
                  {selectedPO.emailSentAt ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-bold text-[13px] text-emerald-800">Email Sent Successfully</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">{new Date(selectedPO.emailSentAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-[13px] text-slate-750">Not Sent yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-end gap-3 shrink-0">
              {selectedPO.status === 'Draft' && (
                <button
                  onClick={async () => {
                    try {
                      let updated: any;
                      if (selectedPO.id.startsWith('po-id-')) {
                        updated = { ...selectedPO, status: 'Sent' };
                        setPurchaseOrders(prev => prev.map(p => p.id === selectedPO.id ? updated : p));
                      } else {
                        updated = await auth.apiRequest(`/suppliers/pos/${selectedPO.id}/status`, {
                          method: 'PUT',
                          body: JSON.stringify({ status: 'Sent' })
                        });
                        await fetchData();
                      }
                      setSelectedPO(updated);
                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                    } catch (e) {
                      alert('Failed to send order');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                >
                  Send Order
                </button>
              )}
              {selectedPO.status === 'Sent' && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        let updated: any;
                        if (selectedPO.id.startsWith('po-id-')) {
                          updated = { ...selectedPO, status: 'Delivered' };
                          setPurchaseOrders(prev => prev.map(p => p.id === selectedPO.id ? updated : p));
                        } else {
                          updated = await auth.apiRequest(`/suppliers/pos/${selectedPO.id}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'Delivered' })
                          });
                          await fetchData();
                        }
                        setSelectedPO(updated);
                        window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                      } catch (e) {
                        alert('Failed to mark delivered');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                  >
                    Mark as Delivered
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        let updated: any;
                        if (selectedPO.id.startsWith('po-id-')) {
                          updated = { ...selectedPO, status: 'Received' };
                          setPurchaseOrders(prev => prev.map(p => p.id === selectedPO.id ? updated : p));
                        } else {
                          updated = await auth.apiRequest(`/suppliers/pos/${selectedPO.id}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'Received' })
                          });
                          await fetchData();
                        }
                        setSelectedPO(updated);
                        window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                      } catch (e) {
                        alert('Failed to mark received');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                  >
                    Mark as Received
                  </button>
                </>
              )}
              {selectedPO.status === 'Delivered' && (
                <button
                  onClick={async () => {
                    try {
                      let updated: any;
                      if (selectedPO.id.startsWith('po-id-')) {
                        updated = { ...selectedPO, status: 'Received' };
                        setPurchaseOrders(prev => prev.map(p => p.id === selectedPO.id ? updated : p));
                      } else {
                        updated = await auth.apiRequest(`/suppliers/pos/${selectedPO.id}/status`, {
                          method: 'PUT',
                          body: JSON.stringify({ status: 'Received' })
                        });
                        await fetchData();
                      }
                      setSelectedPO(updated);
                      window.dispatchEvent(new CustomEvent('stock-request-mutated', { detail: updated }));
                    } catch (e) {
                      alert('Failed to mark received');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-[36px] px-3.5 rounded-xl text-[14px] flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                >
                  Mark as Received
                </button>
              )}
              <button
                onClick={() => setSelectedPO(null)}
                className="bg-slate-100 text-slate-700 font-bold h-[36px] px-4 rounded-xl text-[14px] hover:bg-slate-200 transition active:scale-[0.98] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {viewingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 relative max-h-[85vh] flex flex-col text-left">
            <button
              onClick={() => setViewingRequest(null)}
              className="absolute top-4 right-4 text-black hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>
            <h3 className="font-medium text-black text-xl mb-1 flex items-center gap-2">
              Kitchen Purchase Request Details
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-widest ${viewingRequest.status === 'Pending' || viewingRequest.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700' :
                  viewingRequest.status === 'Approved' ? 'bg-blue-50 text-blue-700' :
                    viewingRequest.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-emerald-50 text-emerald-700'
                }`}>
                {viewingRequest.status}
              </span>
            </h3>
            <p className="text-xs text-slate-450 mb-4">Request Reference: {viewingRequest.requestNo}</p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-xs text-slate-800">
              {viewingRequest.status === 'Rejected' && viewingRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <span className="text-[10px] text-red-500 font-bold block uppercase">Rejection Reason:</span>
                  <p className="text-red-700 font-semibold mt-1 text-[13px]">{viewingRequest.rejectionReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Metadata</span>
                  <span className="text-slate-600 block mt-1">Requested By: <strong className="text-black">{viewingRequest.requestedBy}</strong></span>
                  <span className="text-slate-600 block">Created By: <strong className="text-black">{viewingRequest.createdBy || 'Kitchen'}</strong></span>
                  <span className="text-slate-605 block">Date: <strong className="text-black">{new Date(viewingRequest.createdAt).toLocaleDateString()}</strong></span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Items Count</span>
                  <span className="text-slate-605 block mt-1">Total Items: <strong className="text-black">{viewingRequest.items?.length || 0} Items</strong></span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-black">
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {Array.isArray(viewingRequest.items) ? (
                      viewingRequest.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-semibold text-black">{it.productName}</td>
                          <td className="p-3 text-center font-semibold text-slate-700">{it.quantity}</td>
                          <td className="p-3 text-slate-550">{it.unit}</td>
                          <td className="p-3 text-slate-550 italic">{it.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">No items listed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                onClick={() => setViewingRequest(null)}
                className="bg-slate-100 hover:bg-slate-200 text-black font-semibold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
