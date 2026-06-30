import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Printer
} from 'lucide-react';

interface CustomerNote {
  id: string;
  note: string;
  createdAt: string;
}

interface CustomerTimeline {
  id: string;
  eventType: string;
  details: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    name: string;
    sku: string;
    sellingPrice: number;
  };
}

interface Order {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalPayable: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  customerType: string;
  notes: string | null;
  status: string;
  balance: number;
  loyaltyPoints: number;
  ordersCount: number;
  lifetimeSpend: number;
  lastVisit: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  notesList?: CustomerNote[];
  timelineList?: CustomerTimeline[];
}

export const Customers: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'repeat' | 'new' | 'today'>(() => {
    const f = searchParams.get('filter');
    if (f === 'active' || f === 'repeat' || f === 'new' || f === 'today') return f;
    return 'all';
  });

  // Global search input state (no input bar on this page, query received from Navbar)
  const [search, setSearch] = useState('');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  // Form Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formType, setFormType] = useState('Regular');
  const [formNotes, setFormNotes] = useState('');



  // Load Main Data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const custList = await auth.apiRequest('/customers');
      setCustomers(custList || []);
      setFilteredCustomers(custList || []);
    } catch (err) {
      console.error('Failed to fetch customers data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Global search listener
  useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setSearch(e.detail || '');
    };

    setSearch(sessionStorage.getItem('globalSearchQuery') || '');
    window.addEventListener('global-search', handleGlobalSearch);
    return () => {
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  // URL Parameter Sync
  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'active' || f === 'repeat' || f === 'new' || f === 'today') {
      setFilterType(f);
    } else {
      setFilterType('all');
    }
  }, [searchParams]);

  // Search and filter type filtering
  useEffect(() => {
    let result = customers;

    if (filterType === 'active') {
      result = result.filter(c => c.status === 'Active');
    } else if (filterType === 'repeat') {
      result = result.filter(c => c.ordersCount > 1);
    } else if (filterType === 'new') {
      result = result.filter(c => {
        const d = new Date(c.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filterType === 'today') {
      result = result.filter(c => {
        const d = new Date(c.lastVisit || c.createdAt);
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        c.id.toLowerCase().includes(q)
      );
    }

    setFilteredCustomers(result);
  }, [search, customers, filterType]);

  // Add / Edit submission
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile) {
      alert('Name and Mobile Number are required.');
      return;
    }

    const payload = {
      name: formName,
      phone: formMobile,
      email: formEmail || null,
      dob: formDob || null,
      address: formAddress || null,
      customerType: formType,
      notes: formNotes || null,
      status: 'Active'
    };

    try {
      if (editingCustomer) {
        await auth.apiRequest(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await auth.apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowAddEditModal(false);
      resetForm();
      await fetchAllData();
    } catch (err: any) {
      console.error('Failed to save customer details:', err);
      alert(err.message || 'Error occurred while saving customer profile.');
    }
  };

  // Edit Trigger
  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormMobile(c.phone || '');
    setFormEmail(c.email || '');
    setFormDob(c.dob ? c.dob.split('T')[0] : '');
    setFormAddress(c.address || '');
    setFormType(c.customerType);
    setFormNotes(c.notes || '');
    setShowAddEditModal(true);
  };

  // Delete Trigger
  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? All linked notes and history will be permanently deleted.')) return;
    try {
      await auth.apiRequest(`/customers/${id}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert(err.message || 'Failed to delete customer.');
    }
  };

  // Reset form inputs
  const resetForm = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormDob('');
    setFormAddress('');
    setFormType('Regular');
    setFormNotes('');
  };

  // Quick Billing Creator Link
  const handleQuickBilling = (customer: Customer) => {
    navigate(`/billing?customerId=${customer.id}`);
  };

  // Dynamic summary calculations
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const repeatCustomers = customers.filter(c => c.ordersCount > 1).length;
  const newCustomers = customers.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const todaysCustomers = customers.filter(c => {
    const d = new Date(c.lastVisit || c.createdAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6 font-sans text-[#111827] text-sm select-none antialiased">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-slate-200">
        <h1 className="text-[24px] font-semibold text-[#000000] tracking-tight">
          Customer Management
        </h1>

        <button
          onClick={() => {
            resetForm();
            setShowAddEditModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all border border-emerald-650 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* TOP SUMMARY BAR */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-[14px] font-normal text-[#111827] shadow-sm">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-slate-100 font-semibold text-black border border-slate-300' : 'text-slate-550 hover:bg-slate-50'}`}
        >
          <span>Total Customers:</span>
          <strong className="text-[#000000] font-semibold">{totalCustomers}</strong>
        </button>
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
        <button
          type="button"
          onClick={() => setFilterType('active')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'active' ? 'bg-slate-100 font-semibold text-black border border-slate-300' : 'text-slate-550 hover:bg-slate-50'}`}
        >
          <span>Active Customers:</span>
          <strong className="text-[#000000] font-semibold">{activeCustomers}</strong>
        </button>
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
        <button
          type="button"
          onClick={() => setFilterType('repeat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'repeat' ? 'bg-slate-100 font-semibold text-black border border-slate-300' : 'text-slate-550 hover:bg-slate-50'}`}
        >
          <span>Repeat Customers:</span>
          <strong className="text-[#000000] font-semibold">{repeatCustomers}</strong>
        </button>
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
        <button
          type="button"
          onClick={() => setFilterType('new')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'new' ? 'bg-slate-100 font-semibold text-black border border-slate-300' : 'text-slate-550 hover:bg-slate-50'}`}
        >
          <span>New Customers:</span>
          <strong className="text-[#000000] font-semibold">{newCustomers}</strong>
        </button>
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
        <button
          type="button"
          onClick={() => setFilterType('today')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'today' ? 'bg-slate-100 font-semibold text-black border border-slate-300' : 'text-slate-550 hover:bg-slate-50'}`}
        >
          <span>Today's Customers:</span>
          <strong className="text-[#000000] font-semibold">{todaysCustomers}</strong>
        </button>
      </div>

      {/* FULL WIDTH ERP WORKSPACE LAYOUT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
        <h2 className="text-[18px] font-semibold text-[#000000]">Customer Directory</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold bg-slate-50">
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left w-[120px] whitespace-nowrap">Mobile</th>
                <th className="px-4 py-4 text-center w-[80px] whitespace-nowrap">Orders</th>
                <th className="px-4 py-4 text-right w-[110px] whitespace-nowrap">Total Spend</th>
                <th className="px-4 py-4 text-left w-[120px] whitespace-nowrap">Last Purchase</th>
                <th className="px-4 py-4 text-center w-[100px] whitespace-nowrap">Status</th>
                <th className="px-4 py-4 text-right w-[180px] whitespace-nowrap pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-350">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    Loading customer database...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    No matching customer files found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isVIP = customer.customerType === 'VIP' || customer.lifetimeSpend >= 5000;
                  const isFreq = customer.ordersCount >= 10;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-black dark:text-white flex items-center gap-1.5">
                            {customer.name}
                            {isVIP && (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-250 font-semibold uppercase">VIP</span>
                            )}
                            {isFreq && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded border border-indigo-250 font-semibold uppercase">⭐ Freq</span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500 mt-1 block font-medium">CUS-{customer.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{customer.phone || 'No Mobile'}</td>
                      <td className="px-4 py-4 text-center">{customer.ordersCount}</td>
                      <td className="px-4 py-4 text-right font-extrabold text-black dark:text-white">₹{customer.lifetimeSpend.toLocaleString()}</td>
                      <td className="px-4 py-4 text-left">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('en-IN') : 'No purchases'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickBilling(customer)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg hover:bg-emerald-100 transition border border-emerald-200/50"
                          >
                            Create Bill
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete"
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

      {/* ADD/EDIT CUSTOMER MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl p-5 text-left space-y-4 overflow-y-auto max-h-[90vh]">

            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-black">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-3">

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter mobile number"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address Details</label>
                  <input
                    type="text"
                    placeholder="Address details"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer text-[#111827]"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Internal Notes</label>
                  <textarea
                    placeholder="Staff notes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 h-16 resize-none text-[#111827]"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-all border border-emerald-650 cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* BILL DETAILS MODAL / DRAWER */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-2xl p-5 text-left space-y-4">

            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-semibold text-black">Invoice Details</h3>
                <span className="text-[10px] font-medium text-slate-400 block mt-0.5">{selectedInvoice.invoiceNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-[14px] text-[#111827]">
              <div className="flex justify-between border-b pb-1.5 text-slate-500">
                <span>Date: {new Date(selectedInvoice.createdAt).toLocaleString()}</span>
                <span>Payment: {selectedInvoice.paymentMethod}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Products</span>
                <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto pr-1">
                  {selectedInvoice.items && selectedInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1.5">
                      <div>
                        <span className="block font-medium text-black">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400">{item.quantity} Qty @ ₹{item.unitPrice}</span>
                      </div>
                      <span className="font-semibold text-black">₹{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-2 space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="text-rose-600">-₹{selectedInvoice.discount}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax:</span>
                  <span>₹{selectedInvoice.tax}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-black border-t pt-1.5 mt-1">
                  <span>Total Payable:</span>
                  <span className="text-emerald-700">₹{selectedInvoice.totalPayable}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition border border-emerald-650 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}



    </div>
  );
};

export default Customers;
