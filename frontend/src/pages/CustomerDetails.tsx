import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Send,
  Printer,
  Trash2,
  Edit2
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
  cashier?: {
    name: string;
  };
}

interface ReturnItem {
  returnNumber: string;
  invoiceNumber: string;
  product: string;
  quantity: number;
  refundAmount: number;
  returnDate: string;
  status: string;
}

interface CustomerDetail {
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
  averageOrderValue: number;
  lastVisit: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  notesList?: CustomerNote[];
  timelineList?: CustomerTimeline[];
  returnsList?: ReturnItem[];
  favoriteCategory?: string;
  favoriteProduct?: string;
  preferredPaymentMethod?: string;
  visitFrequency?: string;
}

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'returns' | 'notes' | 'activity'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  // Form Fields State for editing
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formType, setFormType] = useState('Regular');
  const [formNotes, setFormNotes] = useState('');

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const detail = await auth.apiRequest(`/customers/${id}`);
      setCustomer(detail);
      if (detail) {
        setFormName(detail.name);
        setFormMobile(detail.phone || '');
        setFormEmail(detail.email || '');
        setFormDob(detail.dob ? detail.dob.split('T')[0] : '');
        setFormAddress(detail.address || '');
        setFormType(detail.customerType);
        setFormNotes(detail.notes || '');
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

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
      status: customer?.status || 'Active'
    };

    try {
      await auth.apiRequest(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setShowAddEditModal(false);
      await fetchCustomerDetails();
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      alert(err.message || 'Error occurred while saving customer profile.');
    }
  };

  const handleAddStaffNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      const added = await auth.apiRequest(`/customers/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNoteText })
      });

      if (added) {
        setNewNoteText('');
        await fetchCustomerDetails();
      }
    } catch (err: any) {
      console.error('Failed to append notes:', err);
      alert('Failed to append staff note.');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? All linked notes and history will be permanently deleted.')) return;
    try {
      await auth.apiRequest(`/customers/${id}`, {
        method: 'DELETE'
      });
      navigate('/customers');
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert(err.message || 'Failed to delete customer.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 font-medium text-sm">Loading customer file...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center text-slate-400 font-medium space-y-4">
        <p>Customer file not found.</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isVIP = customer.customerType === 'VIP' || customer.lifetimeSpend >= 5000;

  return (
    <div className="space-y-6 font-sans text-[#111827] text-sm select-none antialiased text-left">

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            title="Back to Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[24px] font-semibold text-[#000000] tracking-tight flex items-center gap-2">
              {customer.name}
              {isVIP && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-250 font-semibold uppercase">VIP</span>
              )}
            </h1>
            <span className="text-xs text-slate-450 block mt-0.5">CUS-{customer.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setShowAddEditModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => navigate(`/billing?customerId=${customer.id}`)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition shadow-sm border border-emerald-650"
          >
            Create Bill
          </button>
          <button
            onClick={handleDeleteCustomer}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg font-medium text-sm transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Customer
          </button>
        </div>
      </div>

      {/* WORKSPACE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PROFILE SUMMARY CARD */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 self-start">
          <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold text-2xl border border-emerald-200">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#000000] leading-tight">{customer.name}</h3>
              <span className="text-[11px] text-slate-400 block mt-1 uppercase tracking-wider font-semibold">{customer.customerType} Member</span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-black">{customer.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-black">{customer.email || '—'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">DOB:</span>
              <span className="font-semibold text-black">{customer.dob ? new Date(customer.dob).toLocaleDateString('en-IN') : '—'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Address:</span>
              <span className="font-semibold text-black text-right max-w-[180px] truncate" title={customer.address || ''}>
                {customer.address || '—'}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-t pt-3.5">
              <span className="text-slate-500">Customer Since:</span>
              <span className="font-semibold text-black">
                {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Loyalty Points:</span>
              <span className="font-semibold text-emerald-700">{customer.loyaltyPoints} points</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Total Spend:</span>
              <span className="font-semibold text-black">₹{customer.lifetimeSpend.toLocaleString()}</span>
            </div>
            {customer.balance > 0 && (
              <div className="flex justify-between py-1.5 border-t border-rose-100 bg-rose-50/30 p-2.5 rounded-lg text-xs mt-2">
                <span className="text-rose-700 font-semibold">Outstanding Balance:</span>
                <span className="font-bold text-rose-600">₹{customer.balance.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT TABS CONTENT AREA */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">

          {/* TAB BUTTONS */}
          <div className="flex border-b gap-2 text-xs font-semibold pb-1 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'purchases', label: 'Purchases' },
              { key: 'returns', label: 'Returns' },
              { key: 'notes', label: 'Notes' },
              { key: 'activity', label: 'Activity' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 border-b-2 whitespace-nowrap transition-all ${activeTab === tab.key ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent text-slate-450 hover:text-slate-805'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB PANELS */}
          <div className="min-h-[300px]">

            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div className="space-y-6 text-sm">
                <h3 className="text-[18px] font-semibold text-[#000000]">Performance metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Customer Name:</span>
                    <span className="font-semibold text-black">{customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Mobile:</span>
                    <span className="font-semibold text-black">{customer.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-black">{customer.email || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Customer Since:</span>
                    <span className="font-semibold text-black">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Total Orders:</span>
                    <span className="font-semibold text-black">{customer.ordersCount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Total Spend:</span>
                    <span className="font-semibold text-black">₹{customer.lifetimeSpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Average Bill Value:</span>
                    <span className="font-semibold text-black">₹{Math.round(customer.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Current Loyalty Points:</span>
                    <span className="font-semibold text-emerald-700">{customer.loyaltyPoints} points</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Favorite Category:</span>
                    <span className="font-semibold text-black">{customer.favoriteCategory || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-105">
                    <span className="text-slate-500">Preferred Payment:</span>
                    <span className="font-semibold text-indigo-700">{customer.preferredPaymentMethod || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 border p-4 rounded-xl">
                    <span className="text-slate-450 block text-[10px] font-semibold uppercase tracking-wider">Visit Frequency</span>
                    <strong className="text-base font-semibold text-black mt-1 block">{customer.visitFrequency || 'New Profile'}</strong>
                  </div>
                  <div className="bg-slate-50 border p-4 rounded-xl">
                    <span className="text-slate-450 block text-[10px] font-semibold uppercase tracking-wider">Favorite Product</span>
                    <strong className="text-base font-semibold text-black mt-1 block truncate px-1" title={customer.favoriteProduct || ''}>
                      {customer.favoriteProduct || '—'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 border p-4 rounded-xl">
                    <span className="text-slate-450 block text-[10px] font-semibold uppercase tracking-wider">Outstanding Balance</span>
                    <strong className="text-base font-semibold text-rose-600 mt-1 block">₹{customer.balance.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* PURCHASES PANEL */}
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-semibold text-[#000000]">Invoice list</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-[#000000] text-[13px] font-semibold text-left">
                        <th className="p-3 pl-4">Invoice Number</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Products</th>
                        <th className="p-3 text-center">Quantity</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-center">Payment Method</th>
                        <th className="p-3 text-left">Cashier</th>
                        <th className="p-3 text-center pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[14px]">
                      {customer.orders && customer.orders.length > 0 ? (
                        customer.orders.map((o) => {
                          const productNames = o.items.map(i => i.product.name).join(', ');
                          const totalQty = o.items.reduce((acc, i) => acc + i.quantity, 0);
                          return (
                            <tr key={o.id} className="hover:bg-slate-50">
                              <td className="p-3 pl-4 font-semibold text-[#000000]">{o.invoiceNumber}</td>
                              <td className="p-3 text-slate-600">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="p-3 text-slate-650 max-w-[200px] truncate" title={productNames}>{productNames}</td>
                              <td className="p-3 text-center">{totalQty} units</td>
                              <td className="p-3 text-right font-semibold">₹{o.totalPayable.toLocaleString()}</td>
                              <td className="p-3 text-center uppercase font-semibold text-xs">{o.paymentMethod}</td>
                              <td className="p-3 text-slate-600">{o.cashier?.name || 'Cashier'}</td>
                              <td className="p-3 text-center pr-4">
                                <button
                                  onClick={() => setSelectedInvoice(o)}
                                  className="bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-xs font-semibold text-slate-700 border transition"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 italic">No invoice records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RETURNS PANEL */}
            {activeTab === 'returns' && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-semibold text-[#000000]">Return register</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-[#000000] text-[13px] font-semibold text-left">
                        <th className="p-3 pl-4">Return Number</th>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Refund Amount</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[14px]">
                      {customer.returnsList && customer.returnsList.length > 0 ? (
                        customer.returnsList.map((r, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-semibold text-[#000000]">{r.returnNumber}</td>
                            <td className="p-3">{r.product}</td>
                            <td className="p-3 text-right font-semibold text-rose-600">₹{r.refundAmount.toFixed(2)}</td>
                            <td className="p-3 text-slate-600">{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
                            <td className="p-3 text-center pr-4">
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 italic">No return requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NOTES PANEL */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-semibold text-[#000000]">Internal ledger & instructions</h3>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {customer.notesList && customer.notesList.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                      <p className="text-[#111827] leading-relaxed">{n.note}</p>
                      <span className="text-[10px] text-slate-400 block text-right font-bold">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {(!customer.notesList || customer.notesList.length === 0) && (
                    <div className="text-center py-6 text-slate-450 italic">
                      No internal notes recorded. Use the input below to add staff notes.
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddStaffNote} className="flex gap-2 border-t pt-4">
                  <input
                    type="text"
                    placeholder="Enter customer preference, staff notes, or special instructions..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm border border-emerald-650 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Save Note
                  </button>
                </form>
              </div>
            )}

            {/* ACTIVITY PANEL */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-semibold text-[#000000]">History Timeline Log</h3>
                <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-5 py-2">
                  {customer.timelineList && customer.timelineList.map((t) => (
                    <div key={t.id} className="relative text-left">
                      <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <strong className="text-[#000000] font-semibold text-sm">{t.eventType}</strong>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(t.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1 leading-normal">{t.details}</p>
                    </div>
                  ))}
                  {(!customer.timelineList || customer.timelineList.length === 0) && (
                    <div className="text-center py-6 text-slate-400 italic">No timeline events recorded.</div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* EDIT MODAL Overlay */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl p-5 text-left space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-black">Edit Customer Profile</h3>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="p-1 text-slate-450 hover:bg-slate-100 rounded transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Name *</label>
                  <input
                    type="text"
                    required
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
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-900 text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL DETAILS MODAL */}
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
                ✕
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
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-xs transition flex items-center gap-1 cursor-pointer border"
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

export default CustomerDetails;
