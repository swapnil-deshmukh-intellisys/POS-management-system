import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  RotateCcw,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ReturnLog {
  id: string;
  returnNumber: string;
  supplierName: string;
  productName: string;
  quantity: number;
  reason: string;
  status: string;
  refundAmount: number;
  creditNoteNumber?: string;
  type: 'Refund' | 'Replacement';
  date: string;
}

export const Suppliers: React.FC = () => {
  const auth = useAuth();

  // State lists
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'returns' | 'rankings'>('workspace');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected Supplier details panel state
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Manual PO Receive State
  const [showReceiveModal, setShowReceiveModal] = useState<any | null>(null);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [damagedQtyMap, setDamagedQtyMap] = useState<Record<string, number>>({});
  const [receiveNotes, setReceiveNotes] = useState('');

  // Supplier Form inputs
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');

  // Return Form inputs
  const [returnSupplierName, setReturnSupplierName] = useState('');
  const [returnProdName, setReturnProdName] = useState('');
  const [returnQty, setReturnQty] = useState('1');
  const [returnReason, setReturnReason] = useState('Damaged');
  const [returnActionType, setReturnActionType] = useState<'Refund' | 'Replacement'>('Refund');
  const [returnRefundAmount, setReturnRefundAmount] = useState('0');
  const [returnInvoiceNumber, setReturnInvoiceNumber] = useState('');
  const [returnPONumber, setReturnPONumber] = useState('');

  // Local state returns timeline and expiry alerts
  const [returnsList, setReturnsList] = useState<ReturnLog[]>([]);

  // Expiry Risk Alerts (Automatically calculated from DB)
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);



  // Custom Sourcing AI Analytics state
  const [aiSourcingData, setAiSourcingData] = useState<any>(null);

  // Custom added states
  const [panError, setPanError] = useState('');
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState<'All' | 'Returned' | 'Exchanged' | 'Damaged' | 'Active' | 'Out of Stock'>('All');
  const [showActiveProductModal, setShowActiveProductModal] = useState<any | null>(null);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<any | null>(null);
  const [showAllExpiryModal, setShowAllExpiryModal] = useState(false);

  const handlePanChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setPanNumber(uppercaseVal);
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (uppercaseVal === '') {
      setPanError('');
    } else if (!panRegex.test(uppercaseVal)) {
      setPanError('Invalid PAN format (e.g., ABCDE1234F)');
    } else {
      setPanError('');
    }
  };

  const handleUpdatePOStatus = async (poId: string, status: string) => {
    try {
      await auth.apiRequest(`/suppliers/pos/${poId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      await fetchAllData();
      if (selectedSupplier) {
        const refreshed = await auth.apiRequest(`/suppliers/${selectedSupplier.id}`);
        setSelectedSupplier(refreshed);
      }
    } catch (error) {
      console.error('Failed to update PO status:', error);
    }
  };

  // Load Main Data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const supData = await auth.apiRequest('/suppliers');
      setSuppliers(supData);
      setFilteredSuppliers(supData);

      let selectedId = selectedSupplier?.id;
      if (!selectedId && supData && supData.length > 0) {
        selectedId = supData[0].id;
      }

      const [refreshedDetails, retData, risks, aiData] = await Promise.all([
        selectedId ? auth.apiRequest(`/suppliers/${selectedId}`) : Promise.resolve(null),
        auth.apiRequest('/returns'),
        auth.apiRequest('/suppliers/analytics/expiry-risks').catch(() => []),
        auth.apiRequest('/suppliers/analytics/ai-analytics').catch(() => null)
      ]);

      if (refreshedDetails) {
        setSelectedSupplier(refreshedDetails);
      } else if (supData && supData.length > 0) {
        setSelectedSupplier(null);
      }

      if (retData && Array.isArray(retData)) {
        const mappedReturns = retData.map((r: any) => {
          return {
            id: r.id,
            returnNumber: r.returnNumber,
            supplierName: r.supplier?.name || 'Unknown Supplier',
            productName: r.product?.name || 'N/A',
            quantity: r.quantity || 0,
            reason: r.reason || 'N/A',
            status: r.status || 'Pending',
            refundAmount: r.refundAmount || 0,
            type: (r.refundAmount > 0 ? 'Refund' : 'Replacement') as 'Refund' | 'Replacement',
            date: r.requestedDate ? new Date(r.requestedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          };
        });
        setReturnsList(mappedReturns);
      }

      setExpiryAlerts(risks || []);
      setAiSourcingData(aiData || null);
    } catch (error) {
      console.error('Failed to load supplier/returns data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);



  // Filter Logic
  useEffect(() => {
    let result = suppliers;

    if (statusFilter !== 'All') {
      if (statusFilter === 'Top Suppliers') {
        result = result.filter(s => s.rating >= 4.5);
      } else {
        result = result.filter(s => s.status === statusFilter);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.mobile.toLowerCase().includes(q)
      );
    }

    setFilteredSuppliers(result);
  }, [search, statusFilter, suppliers]);

  // Save Add/Edit Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panError) {
      alert('Please correct the validation errors first.');
      return;
    }
    try {
      const payload = {
        name,
        companyName,
        contactPerson,
        mobile,
        email,
        gstNumber,
        panNumber: panNumber || undefined,
        address,
        city,
        state,
        pincode,
        notes: notes || undefined,
        status
      };

      let savedSupplier;
      if (editingSupplier) {
        savedSupplier = await auth.apiRequest(`/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        savedSupplier = await auth.apiRequest('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowFormModal(false);
      resetForm();
      await fetchAllData();
      if (savedSupplier) {
        const refreshed = await auth.apiRequest(`/suppliers/${savedSupplier.id || editingSupplier?.id}`);
        setSelectedSupplier(refreshed);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const openEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setCompanyName(supplier.companyName);
    setContactPerson(supplier.contactPerson);
    setMobile(supplier.mobile);
    setEmail(supplier.email);
    setGstNumber(supplier.gstNumber);
    setPanNumber(supplier.panNumber || '');
    setPanError('');
    setAddress(supplier.address);
    setCity(supplier.city);
    setState(supplier.state);
    setPincode(supplier.pincode);
    setNotes(supplier.notes || '');
    setStatus(supplier.status);
    setShowFormModal(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier? All linked records will be removed.')) return;
    try {
      await auth.apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
      fetchAllData();
      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setName('');
    setCompanyName('');
    setContactPerson('');
    setMobile('');
    setEmail('');
    setGstNumber('');
    setPanNumber('');
    setPanError('');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setNotes('');
    setStatus('Active');
  };

  // Add Return Log
  const handleCreateReturn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const matchedSupplier = suppliers.find(s =>
      s.name.toLowerCase().includes(returnSupplierName.toLowerCase()) ||
      s.companyName.toLowerCase().includes(returnSupplierName.toLowerCase())
    );

    if (!matchedSupplier) {
      alert(`No active supplier found with the name "${returnSupplierName}". Please verify the name.`);
      return;
    }

    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const matchedProduct = matchedSupplier.products?.find((p: any) => p.productName === returnProdName);
    const purchasePrice = matchedProduct?.costPrice || 0;
    const calculatedRefund = returnActionType === 'Refund' ? (parseInt(returnQty) * purchasePrice) : 0;

    const items = [
      {
        productId: matchedProduct?.productId || matchedSupplier.products?.[0]?.productId || '',
        productName: returnProdName,
        quantity: parseInt(returnQty),
        reason: returnReason,
        type: returnActionType,
        invoiceNumber: returnInvoiceNumber,
        purchaseOrderNumber: returnPONumber
      }
    ];

    try {
      const response = await auth.apiRequest('/suppliers/returns', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: matchedSupplier.id,
          returnNumber,
          items,
          refundAdjustedAmount: calculatedRefund,
          status: 'Pending'
        })
      });

      if (response) {
        fetchAllData(); // Refresh list from database
        setShowReturnModal(false);
        setReturnProdName('');
        setReturnQty('1');
        setReturnRefundAmount('0');
        setReturnSupplierName('');
        setReturnInvoiceNumber('');
        setReturnPONumber('');
      }
    } catch (error) {
      console.error('Error saving return to database:', error);
      alert('Failed to save return to database.');
    }
  };

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReceiveModal) return;

    const items = showReceiveModal.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantityReceived: Number(receivedQtyMap[item.productId] ?? item.quantity),
      quantityDamaged: Number(damagedQtyMap[item.productId] ?? 0)
    }));

    try {
      await auth.apiRequest(`/suppliers/pos/${showReceiveModal.id}/receive`, {
        method: 'PUT',
        body: JSON.stringify({
          receivedDate: receiveDate,
          items,
          notes: receiveNotes
        })
      });
      setShowReceiveModal(null);
      setReceivedQtyMap({});
      setDamagedQtyMap({});
      setReceiveNotes('');
      await fetchAllData();
    } catch (error) {
      console.error('Failed to confirm manual receipt:', error);
      alert('Error confirming receipt.');
    }
  };

  const handleReturnApproval = async (returnId: string, action: 'Approve' | 'Reject', rejectReason?: string) => {
    try {
      await auth.apiRequest(`/suppliers/returns/${returnId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          rejectReason
        })
      });
      await fetchAllData();
    } catch (error) {
      console.error('Failed to update return approval state:', error);
      alert('Error updating return approval state.');
    }
  };

  const handleUpdateReturnStatus = async (id: string, newStatus: any) => {
    try {
      const response = await auth.apiRequest(`/suppliers/returns/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (response) {
        fetchAllData(); // Refresh list from database
      }
    } catch (error) {
      console.error('Error updating return status in database:', error);
    }
  };

  // Calculate reward details for any supplier
  const getSupplierRewards = (sup: any) => {
    const ratingFactor = (sup.rating || 4.0) * 800;
    const productFactor = (sup.products?.length || 0) * 60;
    const points = Math.round(ratingFactor + productFactor);
    let tier: 'Gold Partner' | 'Silver Partner' | 'Bronze Partner' | 'Preferred Supplier' = 'Preferred Supplier';
    let badgeColor = 'bg-slate-100 text-slate-800';
    let icon = '🤝';

    if (points >= 4200) {
      tier = 'Gold Partner';
      badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
      icon = '🥇';
    } else if (points >= 3400) {
      tier = 'Silver Partner';
      badgeColor = 'bg-slate-100 text-slate-700 border border-slate-350';
      icon = '🥈';
    } else if (points >= 2800) {
      tier = 'Bronze Partner';
      badgeColor = 'bg-orange-50 text-orange-700 border border-orange-200';
      icon = '🥉';
    }

    return { points, tier, badgeColor, icon };
  };



  // Leaderboard lists
  const supplierLeaderboard = suppliers.map(s => {
    const rewards = getSupplierRewards(s);
    const completedOrders = Math.round((s.rating || 4) * 5);
    const salesValue = Math.round((s.rating || 4) * 12500);
    const satisfaction = Math.round((s.rating || 4) * 20);
    return {
      id: s.id,
      name: s.name,
      company: s.companyName,
      salesValue,
      orders: completedOrders,
      satisfaction,
      points: rewards.points,
      tier: rewards.tier,
      icon: rewards.icon,
      badgeColor: rewards.badgeColor
    };
  }).sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 font-['Outfit',sans-serif] text-slate-800">

      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-b border-slate-100 pb-4">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            Supplier Workspace
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1.5">Manage partner relations, track returns & credit notes, and evaluate performance analytics.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`px-5 py-3 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'workspace'
            ? 'border-slate-900 text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-850'
            }`}
        >
          <Activity className="w-3.5 h-3.5" /> Workspace & Directory
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-5 py-3 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'returns'
            ? 'border-slate-900 text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-850'
            }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Returns & Expiry Center
          {expiryAlerts.length > 0 && (
            <span className="h-4 px-1.5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
              {expiryAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-5 py-3 text-sm font-extrabold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'rankings'
            ? 'border-slate-900 text-slate-900'
            : 'border-transparent text-slate-500 hover:text-slate-850'
            }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Rewards & Sourcing Analytics
        </button>

      </div>

      {/* TAB 1: WORKSPACE & DIRECTORY */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Area: Directory Table */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="font-extrabold text-slate-950 text-base text-left w-full sm:w-auto">Directory</h3>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-semibold text-slate-755 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Top Suppliers">Top Rated</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                    <th className="px-4 py-4 text-left">Supplier / Co.</th>
                    <th className="px-4 py-4 text-center w-[100px] whitespace-nowrap">Scorecard</th>
                    <th className="px-4 py-4 text-center w-[120px] whitespace-nowrap">Tier</th>
                    <th className="px-4 py-4 text-right w-[120px] pr-4 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold">
                        Loading supplier database...
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold">
                        No suppliers found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => {
                      const rewards = getSupplierRewards(supplier);
                      const isSelected = selectedSupplier?.id === supplier.id;
                      return (
                        <tr
                          key={supplier.id}
                          onClick={() => setSelectedSupplier(supplier)}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-slate-55 bg-slate-100 dark:bg-slate-800 border-l-4 border-l-emerald-600 font-semibold text-black dark:text-white' : ''
                            }`}
                        >
                          <td className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-sm">
                                {supplier.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-extrabold text-black dark:text-white block">{supplier.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{supplier.companyName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{supplier.rating}</span>
                              <span className="text-amber-505 text-amber-500 text-xs">★</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${rewards.badgeColor}`}>
                              {rewards.icon} {rewards.tier.split(' ')[0]}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right pr-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditSupplier(supplier)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                title="Edit Vendor Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Supplier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

          {/* Right Area: Context-Aware Selected Supplier Dashboard Workspace */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="font-extrabold text-slate-950 text-base">Fulfillment Workspace</h3>
                {selectedSupplier && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${selectedSupplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-700'
                    }`}>
                    {selectedSupplier.status === 'Active' ? 'Fulfillment Open' : 'On Hold'}
                  </span>
                )}
              </div>

              {selectedSupplier ? (
                <div className="space-y-6">
                  {/* Supplier identity card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black text-base">
                        {selectedSupplier.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="block text-slate-950 text-base">{selectedSupplier.name}</strong>
                        <span className="text-xs font-bold text-slate-400">{selectedSupplier.companyName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm">
                      <a href={`tel:${selectedSupplier.mobile}`} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-150 transition-colors" title="Call"><Phone className="w-3.5 h-3.5" /></a>
                      <a href={`mailto:${selectedSupplier.email}`} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-150 transition-colors" title="Email"><Mail className="w-3.5 h-3.5" /></a>
                    </div>
                  </div>

                  {/* 1. Moved Top Performing Products to the top of Supplier Details */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <h4 className="font-extrabold text-slate-900 text-sm">Top Performing Products</h4>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-black text-slate-600 uppercase tracking-wider">Top Sellers</span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {(selectedSupplier.products || []).map((p: any, idx: number) => {
                        const seed = p.productName.charCodeAt(0) || 5;
                        const salesQty = (seed % 15) * 12 + 8;
                        const revenue = salesQty * p.costPrice;
                        const returnPct = (seed % 6) * 1.5;

                        return (
                          <div key={p.id || idx} className="flex items-center justify-between text-xs p-2 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-all">
                            <div>
                              <strong className="block text-slate-950 font-bold">{p.productName}</strong>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Sales: {salesQty} • Return Rate: {returnPct}%</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900 block font-semibold">₹{revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedSupplier.products || selectedSupplier.products.length === 0) && (
                        <p className="text-xs text-slate-400 italic text-center py-2">No product catalog mapped yet.</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Sourcing Dashboard Cards & Medals */}
                  {(() => {
                    const currentSourcing = aiSourcingData?.analyzed?.find((a: any) => a.id === selectedSupplier.id) || {
                      score: Math.max(0, 100 - (selectedSupplier.performance?.returnRate || 0) * 4 - (selectedSupplier.performance?.damageRate || 0) * 5),
                      deliverySuccessRate: selectedSupplier.performance?.deliveryPerformanceRate || 100,
                      qualityScore: 100 - (selectedSupplier.performance?.damageRate || 0),
                      returnRate: selectedSupplier.performance?.returnRate || 0,
                      damageRate: selectedSupplier.performance?.damageRate || 0,
                      medals: ['🏆 Best Supplier', '💎 Most Reliable Supplier']
                    };

                    return (
                      <div className="space-y-4">
                        {/* Supplier Financials & Order Status Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-left">
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Purchase Orders</span>
                            <strong className="block text-slate-900 text-sm mt-0.5 font-black">{selectedSupplier.orders?.length || 0} Orders</strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Received Orders</span>
                            <strong className="block text-emerald-600 text-sm mt-0.5 font-black">
                              {selectedSupplier.orders?.filter((o: any) => ['Received', 'Closed'].includes(o.status)).length || 0} Received
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Pending Payments</span>
                            <strong className="block text-amber-600 text-sm mt-0.5 font-black">
                              {selectedSupplier.orders?.filter((o: any) => o.paymentStatus !== 'Paid').length || 0} Pending
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Paid Amount</span>
                            <strong className="block text-emerald-700 text-sm mt-0.5 font-black">
                              ₹{(selectedSupplier.orders?.reduce((sum: number, o: any) => sum + (o.paidAmount || 0), 0) || 0).toLocaleString('en-IN')}
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Outstanding Amount</span>
                            <strong className="block text-rose-600 text-sm mt-0.5 font-black">
                              ₹{(selectedSupplier.orders?.reduce((sum: number, o: any) => sum + Math.max(0, o.totalAmount - (o.paidAmount || 0)), 0) || 0).toLocaleString('en-IN')}
                            </strong>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px]">Overall Rating</span>
                            <strong className="block text-slate-900 text-sm mt-0.5 font-black">★ {selectedSupplier.rating || 0.0}</strong>
                          </div>
                        </div>

                        {/* Supplier Medals Section */}
                        <div className="border border-slate-100 rounded-xl p-3.5 bg-white space-y-2">
                          <h4 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">Sourcing Merits & Awards</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {currentSourcing.medals?.map((medal: string) => {
                              let badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
                              if (medal.includes('Reliable')) badgeStyle = "bg-sky-50 text-sky-800 border-sky-200";
                              else if (medal.includes('Fastest')) badgeStyle = "bg-purple-50 text-purple-800 border-purple-200";
                              else if (medal.includes('Quality')) badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                              else if (medal.includes('Performance')) badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
                              else if (medal.includes('Improved')) badgeStyle = "bg-indigo-50 text-indigo-800 border-indigo-200";

                              return (
                                <span key={medal} className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${badgeStyle}`}>
                                  {medal}
                                </span>
                              );
                            })}
                            {(!currentSourcing.medals || currentSourcing.medals.length === 0) && (
                              <span className="text-xs text-slate-400 italic">No medals awarded.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Supplier Product History with Filters */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <h4 className="font-extrabold text-slate-900 text-sm">Product Catalog History</h4>
                        <span className="text-xs font-bold text-slate-505">Total: {selectedSupplier.products?.length || 0}</span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {(['All', 'Active', 'Returned', 'Exchanged', 'Damaged', 'Out of Stock'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setSelectedHistoryFilter(f)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${selectedHistoryFilter === f
                              ? 'bg-slate-950 border-slate-950 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100'
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-left">
                      {(selectedSupplier.products || []).filter((p: any) => {
                        if (selectedHistoryFilter === 'All') return true;
                        if (selectedHistoryFilter === 'Active') return p.minOrderQty > 0;
                        if (selectedHistoryFilter === 'Returned') {
                          return selectedSupplier.returns?.some((r: any) => {
                            const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
                            return items.some((item: any) => item.productName === p.productName && item.type !== 'Replacement');
                          });
                        }
                        if (selectedHistoryFilter === 'Exchanged') {
                          return selectedSupplier.returns?.some((r: any) => {
                            const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
                            return items.some((item: any) => item.productName === p.productName && item.type === 'Replacement');
                          });
                        }
                        if (selectedHistoryFilter === 'Damaged') {
                          return selectedSupplier.returns?.some((r: any) => {
                            const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
                            return items.some((item: any) => item.productName === p.productName && String(item.reason || '').toLowerCase().includes('damage'));
                          });
                        }
                        if (selectedHistoryFilter === 'Out of Stock') {
                          return p.minOrderQty <= 0;
                        }
                        return true;
                      }).map((p: any, idx: number) => {
                        const stockQty = Math.round((p.minOrderQty || 1) * 3);
                        const status = stockQty > 10 ? 'IN_STOCK' : stockQty > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
                        const category = 'Groceries';
                        const lastReceived = '2026-05-12';

                        return (
                          <div
                            key={p.id || idx}
                            onClick={() => setShowActiveProductModal({ ...p, stockQty, status, category, lastReceived })}
                            className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition"
                          >
                            <div>
                              <strong className="block text-slate-950 font-bold text-xs">{p.productName}</strong>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Min Qty: {p.minOrderQty} • Lead Time: {p.leadTime} days</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900 block text-xs">₹{p.costPrice}</span>
                              <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black mt-1 inline-block">View Details</span>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedSupplier.products || selectedSupplier.products.length === 0) && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No matching products found.</p>
                      )}
                    </div>
                  </div>

                  {/* 4. Supply Chain / Purchase Order Tracker */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <h4 className="font-extrabold text-slate-900 text-sm">Active Purchase Deliveries</h4>
                      <span className="text-xs font-bold text-slate-505">Orders: {selectedSupplier.orders?.length || 0}</span>
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                      {(selectedSupplier.orders || []).map((po: any, idx: number) => {
                        const expectedDate = po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate) : new Date();
                        const isLate = new Date() > expectedDate && !['Received', 'Closed', 'Quality Check Completed', 'Delivered'].includes(po.status);
                        
                        const trackingStatuses = ['Created', 'Packed', 'Dispatched', 'In Transit', 'Delivered', 'Received'];
                        let mappedStatus = po.status;
                        if (['Draft', 'Sent', 'Order Created'].includes(po.status)) mappedStatus = 'Created';
                        const currentStepIndex = trackingStatuses.indexOf(mappedStatus);

                        const poItems = Array.isArray(po.items) ? po.items : (typeof po.items === 'string' ? JSON.parse(po.items || '[]') : []);
                        const totalQty = poItems.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0);

                        return (
                          <div key={po.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-left">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <strong className="text-slate-950 font-bold block">{po.orderNumber}</strong>
                                <span className="text-[10px] text-slate-450 block mt-0.5">Supplier: {selectedSupplier.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isLate && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">LATE</span>}
                                <span className="bg-slate-950 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">{po.status}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-200/50 pt-2">
                              <div><span className="text-slate-400 font-bold block">Product Count</span><span className="font-extrabold text-slate-800">{poItems.length} Products</span></div>
                              <div><span className="text-slate-400 font-bold block">Total Quantity</span><span className="font-extrabold text-slate-800">{totalQty} Units</span></div>
                              <div><span className="text-slate-400 font-bold block">Dispatch Date</span><span className="font-extrabold text-slate-800">{po.orderDate ? new Date(new Date(po.orderDate).getTime() + 24*60*60*1000).toISOString().split('T')[0] : 'Pending'}</span></div>
                              <div><span className="text-slate-400 font-bold block">Expected Arrived</span><span className="font-extrabold text-slate-800">{expectedDate.toISOString().split('T')[0]}</span></div>
                            </div>

                            {/* timeline progress tracker stepper */}
                            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1.5 border-t border-b border-slate-200/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {trackingStatuses.map((step, stepIdx) => {
                                const isPassed = stepIdx <= currentStepIndex;
                                const isCurrent = stepIdx === currentStepIndex;
                                return (
                                  <div key={step} className="flex flex-col items-center flex-1 min-w-[55px]">
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7px] font-black transition-all ${
                                      isCurrent ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-sm' :
                                      isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
                                      'bg-white border-slate-200 text-slate-300'
                                    }`}>
                                      {isPassed ? '✓' : ''}
                                    </div>
                                    <span className={`text-[8px] mt-1 font-bold whitespace-nowrap text-center ${isCurrent ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] text-slate-505 font-bold">Value: ₹{po.totalAmount.toLocaleString()}</span>
                              {(auth.user?.role === 'ADMIN' || auth.user?.role === 'MANAGER') && (
                                <div className="flex gap-1.5 flex-wrap justify-end">
                                  {['Draft', 'Sent', 'Created'].includes(po.status) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePOStatus(po.id, 'Packed')}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded transition shadow-sm cursor-pointer"
                                    >
                                      Mark Packed
                                    </button>
                                  )}
                                  {po.status === 'Packed' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePOStatus(po.id, 'Dispatched')}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[9px] rounded transition shadow-sm cursor-pointer"
                                    >
                                      Mark Dispatched
                                    </button>
                                  )}
                                  {['Dispatched', 'In Transit'].includes(po.status) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePOStatus(po.id, 'Delivered')}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[9px] rounded transition shadow-sm cursor-pointer"
                                    >
                                      Mark Delivered
                                    </button>
                                  )}
                                  {po.status === 'Delivered' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const initialReceived: Record<string, number> = {};
                                        const initialDamaged: Record<string, number> = {};
                                        poItems.forEach((item: any) => {
                                          initialReceived[item.productId] = item.quantity;
                                          initialDamaged[item.productId] = 0;
                                        });
                                        setReceivedQtyMap(initialReceived);
                                        setDamagedQtyMap(initialDamaged);
                                        setShowReceiveModal(po);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded transition shadow-sm cursor-pointer"
                                    >
                                      Receive Products
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedSupplier.orders || selectedSupplier.orders.length === 0) && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No active delivery orders registered.</p>
                      )}
                    </div>
                  </div>

                  {/* Details summary */}
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-sm space-y-2.5">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-bold">GSTIN ID</span>
                      <span className="font-extrabold text-slate-900">{selectedSupplier.gstNumber}</span>
                    </div>
                    {selectedSupplier.panNumber && (
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-bold">PAN Number</span>
                        <span className="font-extrabold text-slate-900">{selectedSupplier.panNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Address</span>
                      <span className="font-bold text-slate-700 text-right max-w-[200px] leading-tight">
                        {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setReturnSupplierName(selectedSupplier.name);
                        setShowReturnModal(true);
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition"
                    >
                      Return Product
                    </button>

                    <Link
                      to="/purchases"
                      className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl font-bold text-sm text-center transition block"
                    >
                      Procurement PO
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Activity className="w-8 h-8 text-slate-350 mb-2" />
                  <span className="text-sm font-black text-slate-900">Workspace Pending</span>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                    Select a vendor from the catalog list to access the live operations context workspace panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETURNS & EXPIRY CENTER */}
      {activeTab === 'returns' && (() => {
        const totalReturns = returnsList.length;
        const pendingReturns = returnsList.filter(r => r.status === 'Pending').length;
        const totalRefunds = returnsList.filter(r => r.type === 'Refund' && r.status === 'Completed').length;
        const expiringProductsCount = expiryAlerts.length;
        const damagedQtyCount = returnsList.filter(r => r.reason.toLowerCase().includes('damage')).reduce((sum, r) => sum + r.quantity, 0);

        const getSimplifiedStatus = (ret: any) => {
          if (ret.type === 'Refund') {
            if (['Pending', 'Approved', 'Rejected'].includes(ret.status)) return ret.status;
            return 'Completed';
          } else {
            if (['Pending', 'Requested'].includes(ret.status)) return 'Requested';
            if (['Supplier Accepted', 'Replacement Dispatched', 'Dispatched', 'In Transit'].includes(ret.status)) return 'In Transit';
            if (['Replacement Received', 'Received'].includes(ret.status)) return 'Received';
            if (ret.status === 'Completed') return 'Completed';
            return ret.status;
          }
        };

        const highRiskExpiry = expiryAlerts.filter(a => a.daysLeft <= 30);

        return (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Returns</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{totalReturns}</h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Returns</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{pendingReturns}</h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Refunds</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{totalRefunds}</h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiring Products</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{expiringProductsCount}</h3>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Damaged Products</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{damagedQtyCount} Units</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Returns Ledger Simple List */}
              <div className="lg:col-span-8 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-extrabold text-slate-950 text-base text-left">Returns Log Ledger</h3>
                  <button
                    onClick={() => {
                      if (suppliers.length === 0) {
                        alert('Add a supplier first to file return forms.');
                        return;
                      }
                      setReturnSupplierName(suppliers[0].name);
                      setShowReturnModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> File New Return
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                        <th className="px-4 py-4 pl-2">Return ID</th>
                        <th className="px-4 py-4">Supplier</th>
                        <th className="px-4 py-4">Product (Qty)</th>
                        <th className="px-4 py-4">Type</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-4 py-4 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
                      {returnsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No return records logged.
                          </td>
                        </tr>
                      ) : (
                        returnsList.map(ret => {
                          const simplifiedStatus = getSimplifiedStatus(ret);
                          let statusStyle = 'bg-amber-50 text-amber-700';
                          if (simplifiedStatus === 'Completed' || simplifiedStatus === 'Received' || simplifiedStatus === 'Approved') {
                            statusStyle = 'bg-emerald-50 text-emerald-700';
                          } else if (simplifiedStatus === 'Rejected') {
                            statusStyle = 'bg-rose-50 text-rose-700';
                          }

                          return (
                            <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-4 pl-2 font-bold text-black dark:text-white">{ret.returnNumber}</td>
                              <td className="px-4 py-4">{ret.supplierName}</td>
                              <td className="px-4 py-4 text-slate-650 text-slate-600 dark:text-slate-400">{ret.productName} ({ret.quantity})</td>
                              <td className="px-4 py-4"><span className="font-extrabold text-black dark:text-white">{ret.type}</span></td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-xs tracking-wide ${statusStyle}`}>
                                  {simplifiedStatus}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right pr-4">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReturnDetail(ret)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
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

              {/* Right Column: High Risk Expiry Dashboard Block */}
              <div className="lg:col-span-4 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-extrabold text-slate-950 text-sm">High Risk Expiry</h3>
                  <button
                    onClick={() => setShowAllExpiryModal(true)}
                    className="text-[10px] font-bold text-emerald-650 hover:text-emerald-755 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2">
                  {highRiskExpiry.slice(0, 4).map(alert => (
                    <div key={alert.id} className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-rose-700">⚠️ {alert.daysLeft} Days Left</span>
                        <span className="text-slate-500">Qty: {alert.quantity}</span>
                      </div>
                      <strong className="block text-slate-900 text-xs font-bold">{alert.name}</strong>
                      <span className="text-[10px] text-slate-400 block">Est Loss: ₹{(alert.estimatedLoss || 0).toLocaleString()}</span>
                    </div>
                  ))}

                  {highRiskExpiry.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No expiring stock products flagged inside 30 days.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: REWARDS & SOURCING ANALYTICS */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Top Partner medals rankings */}
            <div className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-950 text-base text-left">Top Partner Leaderboard</h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                      <th className="px-4 py-4 text-left">Supplier / Co.</th>
                      <th className="px-4 py-4 text-center">Orders</th>
                      <th className="px-4 py-4 text-right">Sourcing Value</th>
                      <th className="px-4 py-4 text-right pr-4">Rewards Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
                    {supplierLeaderboard.map((item, idx) => {
                      let medal = '🎖';
                      if (idx === 0) medal = '🥇 Gold Partner';
                      else if (idx === 1) medal = '🥈 Silver Partner';
                      else if (idx === 2) medal = '🥉 Bronze Partner';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4 text-left">
                            <strong className="text-black dark:text-white block font-bold">{item.name}</strong>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{item.company}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-extrabold text-slate-900 dark:text-slate-200">{item.orders} POs</td>
                          <td className="px-4 py-4 text-right font-black text-slate-950 dark:text-white">₹{item.salesValue.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right pr-4 text-sm font-black text-slate-850 dark:text-slate-250">{medal} ({item.points} pts)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Partner Tier benefits and discount program */}
            <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm text-left space-y-4">
              <h3 className="font-extrabold text-slate-950 text-base">Supplier Discount & Loyalty Benefits</h3>
              <p className="text-slate-400 text-sm leading-normal">Suppliers mapped as preferred partners receive volume billing cashbacks and faster order priority.</p>

              <div className="space-y-3">
                <div className="p-3 border border-amber-200 bg-amber-50/20 rounded-xl text-sm space-y-1">
                  <strong className="text-amber-800 block">🥇 Gold Partner (4,200+ pts)</strong>
                  <p className="text-slate-650 text-sm">3.5% Cash rebate discount incentive on bulk invoices + Priority dispatch routes.</p>
                </div>
                <div className="p-3 border border-slate-250 bg-slate-50/30 rounded-xl text-sm space-y-1">
                  <strong className="text-slate-800 block">🥈 Silver Partner (3,400+ pts)</strong>
                  <p className="text-slate-650 text-sm">1.8% Cash rebate incentive + Guaranteed 48 hours delivery schedules.</p>
                </div>
                <div className="p-3 border border-orange-200 bg-orange-50/20 rounded-xl text-sm space-y-1">
                  <strong className="text-orange-800 block">🥉 Bronze Partner (2,800+ pts)</strong>
                  <p className="text-slate-650 text-sm">0.8% Cash rebate incentive + Detailed tracking scorecard reviews.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm select-none">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl text-left text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-[#000000]">
                  {editingSupplier ? 'Edit Supplier Details' : 'Add New Supplier'}
                </h3>
                <p className="text-[10px] font-semibold text-slate-500">Store vendor address, contact profile, and tax identifiers.</p>
              </div>
              <button onClick={() => { resetForm(); setShowFormModal(false); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 hover:text-slate-650 shadow-sm border border-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Supplier Name</label>
                  <input type="text" required placeholder="e.g. ABC Traders" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Company Name</label>
                  <input type="text" required placeholder="e.g. ABC Logistical Pvt Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Contact Person</label>
                  <input type="text" required placeholder="e.g. Amit Patel" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Mobile Number</label>
                  <input type="tel" required placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Email Address</label>
                  <input type="email" required placeholder="amit@abctraders.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">GST Number</label>
                  <input type="text" required placeholder="27AAAAA0000A1Z1" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">PAN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="AAAAA0000A"
                    value={panNumber}
                    onChange={(e) => handlePanChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800 uppercase"
                  />
                  {panError && <p className="text-rose-600 text-[10px] mt-1 font-bold">{panError}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Street Address</label>
                <input type="text" required placeholder="Office 45, GIDC Industrial Estate" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">City</label>
                  <input type="text" required placeholder="Ahmedabad" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">State</label>
                  <input type="text" required placeholder="Gujarat" value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Pincode</label>
                  <input type="text" required placeholder="380009" value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Status</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1">
                    <button type="button" onClick={() => setStatus('Active')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${status === 'Active' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>Active</button>
                    <button type="button" onClick={() => setStatus('Inactive')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${status === 'Inactive' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-rose-700 hover:bg-rose-50'}`}>Inactive</button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-700">Notes</label>
                  <textarea placeholder="Write administrative supplier notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { resetForm(); setShowFormModal(false); }} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-650 hover:bg-slate-50 transition-colors font-bold">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-bold transition-colors shadow-md">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-left border">
            <div className="flex items-center justify-between border-b p-4 bg-slate-50">
              <h4 className="font-extrabold text-[#000000] text-sm">Create Return Form</h4>
              <button onClick={() => setShowReturnModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateReturn} className="p-5 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Supplier</label>
                <input
                  type="text"
                  readOnly
                  value={returnSupplierName}
                  className="w-full rounded-xl border p-2.5 bg-slate-50 focus:outline-none text-slate-500 font-bold"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Product Name</label>
                <select
                  value={returnProdName}
                  required
                  onChange={(e) => {
                    const prodName = e.target.value;
                    setReturnProdName(prodName);
                    const mapped = selectedSupplier?.products?.find((p: any) => p.productName === prodName);
                    if (mapped && returnActionType === 'Refund') {
                      setReturnRefundAmount(String(mapped.costPrice * Number(returnQty)));
                    } else {
                      setReturnRefundAmount('0');
                    }
                  }}
                  className="w-full rounded-xl border p-2.5 bg-white focus:outline-none"
                >
                  <option value="">Select Mapped Product</option>
                  {selectedSupplier?.products?.map((p: any) => (
                    <option key={p.id} value={p.productName}>{p.productName} (₹{p.costPrice})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Invoice Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="INV-XXXXX"
                    value={returnInvoiceNumber}
                    onChange={(e) => setReturnInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Purchase Order No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="PO-XXXXX"
                    value={returnPONumber}
                    onChange={(e) => setReturnPONumber(e.target.value)}
                    className="w-full rounded-xl border p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQty}
                    onChange={(e) => {
                      const qty = e.target.value;
                      setReturnQty(qty);
                      const mapped = selectedSupplier?.products?.find((p: any) => p.productName === returnProdName);
                      if (mapped && returnActionType === 'Refund') {
                        setReturnRefundAmount(String(mapped.costPrice * Number(qty)));
                      }
                    }}
                    className="w-full rounded-xl border p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Action Type</label>
                  <select
                    value={returnActionType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setReturnActionType(type);
                      if (type === 'Replacement') {
                        setReturnRefundAmount('0');
                      } else {
                        const mapped = selectedSupplier?.products?.find((p: any) => p.productName === returnProdName);
                        if (mapped) {
                          setReturnRefundAmount(String(mapped.costPrice * Number(returnQty)));
                        }
                      }
                    }}
                    className="w-full rounded-xl border p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Refund">Refund</option>
                    <option value="Replacement">Replacement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Return Reason</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full rounded-xl border p-2.5 bg-white focus:outline-none"
                  >
                    <option value="Damaged Product">Damaged Product</option>
                    <option value="Expired Product">Expired Product</option>
                    <option value="Near Expiry Product">Near Expiry Product</option>
                    <option value="Wrong Item Received">Wrong Item Received</option>
                    <option value="Quantity Mismatch">Quantity Mismatch</option>
                    <option value="Manufacturing Defect">Manufacturing Defect</option>
                    <option value="Packaging Damage">Packaging Damage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Refund Amount (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={returnRefundAmount}
                    className="w-full rounded-xl border p-2.5 focus:outline-none bg-slate-50 text-slate-550 font-bold"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition mt-2 shadow-md">
                Submit Return Form
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PO Manual Receipt Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden text-left border">
            <div className="flex items-center justify-between border-b p-4 bg-slate-50">
              <div>
                <h4 className="font-extrabold text-[#000000] text-sm">Receive Products - PO Receipt</h4>
                <p className="text-[10px] font-semibold text-slate-500">Record incoming stock, count quantities, and flag damaged units.</p>
              </div>
              <button onClick={() => setShowReceiveModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleReceivePO} className="p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <strong className="block text-slate-900">{showReceiveModal.orderNumber}</strong>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Supplier: {selectedSupplier?.name}</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="rounded-lg border p-1 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <label className="block font-bold text-slate-700">Product Quantities Checklist</label>
                {(showReceiveModal.items || []).map((item: any) => {
                  return (
                    <div key={item.productId} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 font-bold">{item.productName}</strong>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black">Ordered: {item.quantity} units</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Received Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={receivedQtyMap[item.productId] ?? item.quantity}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(item.quantity, Number(e.target.value)));
                              setReceivedQtyMap(prev => ({ ...prev, [item.productId]: val }));
                            }}
                            className="w-full rounded-lg border p-1.5 focus:outline-none bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Damaged Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={damagedQtyMap[item.productId] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(item.quantity, Number(e.target.value)));
                              setDamagedQtyMap(prev => ({ ...prev, [item.productId]: val }));
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
                <label className="mb-1 block font-bold text-slate-700">Receipt Notes (Internal Ledger)</label>
                <textarea
                  placeholder="E.g., Batch code verification, packaging notes, discrepancies, etc."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border p-2.5 focus:outline-none bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(null)}
                  className="rounded-xl border px-4 py-2 text-slate-650 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-bold transition shadow-md animate-pulse"
                >
                  Confirm Goods Receipt (GRN)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Product Details Modal */}
      {showActiveProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-750 select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden text-left border">
            <div className="flex items-center justify-between border-b p-4 bg-slate-50">
              <h4 className="font-extrabold text-[#000000] text-sm">Product Inventory Status</h4>
              <button onClick={() => setShowActiveProductModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400 font-bold">Product Name</span>
                <span className="font-extrabold text-slate-950">{showActiveProductModal.productName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400 font-bold">Cost Price</span>
                <span className="font-extrabold text-slate-950">₹{showActiveProductModal.costPrice}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400 font-bold">Warehouse Stock</span>
                <span className="font-extrabold text-slate-950">{showActiveProductModal.stockQty} Units</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400 font-bold">Category</span>
                <span className="font-extrabold text-slate-950">{showActiveProductModal.category}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-400 font-bold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  showActiveProductModal.status === 'OUT_OF_STOCK' ? 'bg-rose-50 text-rose-700' :
                  showActiveProductModal.status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-700' :
                  'bg-emerald-50 text-emerald-700'
                }`}>{showActiveProductModal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Last Received Date</span>
                <span className="font-extrabold text-slate-950">{showActiveProductModal.lastReceived}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveProductModal(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition mt-2"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturnDetail && (() => {
        const ret = selectedReturnDetail;
        const isRefund = ret.type === 'Refund';
        const steps = isRefund
          ? ['Refund Requested', 'Pending Approval', 'Approved', 'Refund Received', 'Completed']
          : ['Replacement Requested', 'Supplier Accepted', 'Replacement Dispatched', 'Replacement Received', 'Completed'];

        let curStepIndex = 0;
        if (isRefund) {
          if (ret.status === 'Pending') curStepIndex = 1;
          else if (ret.status === 'Approved') curStepIndex = 2;
          else if (['Refunded', 'Refund Received', 'Completed'].includes(ret.status)) curStepIndex = 3;
          if (ret.status === 'Completed') curStepIndex = 4;
        } else {
          if (ret.status === 'Pending') curStepIndex = 0;
          else if (['Accepted', 'Supplier Accepted', 'Approved'].includes(ret.status)) curStepIndex = 1;
          else if (['Replacement Dispatched', 'Dispatched', 'In Transit'].includes(ret.status)) curStepIndex = 2;
          else if (['Replacement Received', 'Received'].includes(ret.status)) curStepIndex = 3;
          if (ret.status === 'Completed') curStepIndex = 4;
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden text-left border">
              <div className="flex items-center justify-between border-b p-4 bg-slate-50">
                <div>
                  <h4 className="font-extrabold text-[#000000] text-sm">Return Workflow Details</h4>
                  <p className="text-[10px] font-semibold text-slate-500">Track current return milestones and execute approvals.</p>
                </div>
                <button onClick={() => setSelectedReturnDetail(null)}><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b pb-3 border-slate-100">
                  <div><span className="text-slate-400 font-bold block">Return Number</span><strong className="text-slate-900 text-sm">{ret.returnNumber}</strong></div>
                  <div><span className="text-slate-400 font-bold block">File Date</span><span className="font-extrabold text-slate-800">{ret.date}</span></div>
                  <div><span className="text-slate-400 font-bold block">Supplier Name</span><span className="font-extrabold text-slate-850">{ret.supplierName}</span></div>
                  <div><span className="text-slate-400 font-bold block">Type</span><span className="font-extrabold text-emerald-600 uppercase">{ret.type}</span></div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Product Name</span>
                    <strong className="text-slate-900">{ret.productName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Returned Qty</span>
                    <strong className="text-slate-900">{ret.quantity} Units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Return Reason</span>
                    <strong className="text-slate-900">{ret.reason}</strong>
                  </div>
                  {isRefund && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Refund Amount</span>
                      <strong className="text-emerald-600 font-extrabold">₹{ret.refundAmount}</strong>
                    </div>
                  )}
                  {ret.creditNoteNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Credit Note Ref</span>
                      <strong className="text-purple-650">{ret.creditNoteNumber}</strong>
                    </div>
                  )}
                </div>

                {/* Progress Steps Timeline */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Workflow Progress Timeline</span>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {steps.map((step, idx) => {
                      const isPassed = idx <= curStepIndex;
                      const isCurrent = idx === curStepIndex;
                      const isRejected = ret.status === 'Rejected' && idx === 1;

                      return (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-1.5 flex-1 min-w-[75px]">
                            <div className={`h-8 flex-1 rounded-lg flex items-center justify-center font-black text-[9px] border px-1.5 transition-all text-center leading-tight ${
                              isRejected ? 'bg-rose-50 border-rose-350 text-rose-700' :
                              isCurrent ? 'bg-slate-900 border-slate-900 text-white shadow-sm' :
                              isPassed ? 'bg-emerald-50 border-emerald-350 text-emerald-700' :
                              'bg-white border-slate-200 text-slate-400'
                            }`}>
                              {isRejected ? 'Rejected' : step}
                            </div>
                          </div>
                          {idx < steps.length - 1 && <span className="text-slate-350"><ArrowRight className="w-3 h-3" /></span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Action Triggers for Admin/Manager */}
                {(auth.user?.role === 'ADMIN' || auth.user?.role === 'MANAGER') && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    {ret.status === 'Pending' && (
                      <>
                        <button
                          onClick={async () => {
                            await handleReturnApproval(ret.id, 'Approve');
                            setSelectedReturnDetail(null);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                        >
                          Approve Return
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason !== null) {
                              await handleReturnApproval(ret.id, 'Reject', reason);
                              setSelectedReturnDetail(null);
                            }
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                        >
                          Reject Return
                        </button>
                      </>
                    )}
                    {ret.status === 'Approved' && (
                      <button
                        onClick={async () => {
                          await handleUpdateReturnStatus(ret.id, isRefund ? 'Refund Received' : 'Supplier Accepted');
                          setSelectedReturnDetail(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                      >
                        {isRefund ? 'Mark Refund Received' : 'Accept Replacement'}
                      </button>
                    )}
                    {!isRefund && ret.status === 'Supplier Accepted' && (
                      <button
                        onClick={async () => {
                          await handleUpdateReturnStatus(ret.id, 'Replacement Dispatched');
                          setSelectedReturnDetail(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                      >
                        Dispatch Replacement
                      </button>
                    )}
                    {!isRefund && ret.status === 'Replacement Dispatched' && (
                      <button
                        onClick={async () => {
                          await handleUpdateReturnStatus(ret.id, 'Replacement Received');
                          setSelectedReturnDetail(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                      >
                        Receive Replacement
                      </button>
                    )}
                    {((isRefund && ret.status === 'Refund Received') || (!isRefund && ret.status === 'Replacement Received')) && (
                      <button
                        onClick={async () => {
                          await handleUpdateReturnStatus(ret.id, 'Completed');
                          setSelectedReturnDetail(null);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
                      >
                        Complete {isRefund ? 'Refund' : 'Replacement'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Expiry Products View All Modal */}
      {showAllExpiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm text-slate-700 select-none">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden text-left border">
            <div className="flex items-center justify-between border-b p-4 bg-slate-50">
              <div>
                <h4 className="font-extrabold text-[#000000] text-sm">Warehouse Expiry Tracker</h4>
                <p className="text-[10px] font-semibold text-slate-500">Live logs of expiring and near-expiry batches across warehouses.</p>
              </div>
              <button onClick={() => setShowAllExpiryModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                      <th className="px-4 py-4">Product</th>
                      <th className="px-4 py-4">Supplier</th>
                      <th className="px-4 py-4">Days Left</th>
                      <th className="px-4 py-4 text-right">Quantity</th>
                      <th className="px-4 py-4 text-right pr-4">Est. Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
                    {expiryAlerts.map(alert => {
                      let textStyle = 'text-slate-800 dark:text-slate-300';
                      if (alert.daysLeft <= 7) textStyle = 'text-rose-600 dark:text-rose-400 font-extrabold';
                      else if (alert.daysLeft <= 30) textStyle = 'text-amber-600 dark:text-amber-400 font-extrabold';

                      return (
                        <tr key={alert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-black dark:text-white">{alert.name}</td>
                          <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{alert.supplier}</td>
                          <td className={`px-4 py-4 ${textStyle}`}>{alert.daysLeft} Days</td>
                          <td className="px-4 py-4 text-right">{alert.quantity} Units</td>
                          <td className="px-4 py-4 text-right pr-4 font-extrabold text-slate-905 dark:text-white">₹{(alert.estimatedLoss || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {expiryAlerts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No batches registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAllExpiryModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close Tracker
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
