import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Trash2, Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Suppliers: React.FC = () => {
  const auth = useAuth();
  
  // State variables
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    whatsapp: '',
    email: '',
    gstNumber: '',
    address: '',
    city: 'City',
    state: 'State',
    pincode: '400001',
    notes: '',
    status: 'Active'
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await auth.apiRequest('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        companyName: form.companyName || form.name,
        contactPerson: form.contactPerson || 'Contact Person',
        mobile: form.mobile,
        whatsapp: form.whatsapp || form.mobile,
        email: form.email || `${form.name.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
        gstNumber: form.gstNumber || 'GST-PENDING',
        address: form.address || 'Address Details',
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        notes: form.notes,
        status: form.status
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

      setShowModal(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      alert(error.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      companyName: supplier.companyName || '',
      contactPerson: supplier.contactPerson || '',
      mobile: supplier.mobile || '',
      whatsapp: supplier.whatsapp || '',
      email: supplier.email || '',
      gstNumber: supplier.gstNumber || '',
      address: supplier.address || '',
      city: supplier.city || 'City',
      state: supplier.state || 'State',
      pincode: supplier.pincode || '400001',
      notes: supplier.notes || '',
      status: supplier.status || 'Active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this supplier?')) return;
    try {
      await auth.apiRequest(`/suppliers/${id}`, {
        method: 'DELETE'
      });
      fetchSuppliers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete supplier');
    }
  };

  const toggleStatus = async (supplier: any) => {
    try {
      const nextStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
      await auth.apiRequest(`/suppliers/${supplier.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...supplier, status: nextStatus })
      });
      fetchSuppliers();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Filtered List
  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.companyName.toLowerCase().includes(search.toLowerCase()) || 
        (s.gstNumber && s.gstNumber.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 text-left font-['Outfit',sans-serif] antialiased text-black p-4 select-none">
      
      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-4xl font-extrabold text-black tracking-tight uppercase">Suppliers</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">Manage kitchen procurement partners and active agreements</p>
        </div>
        <div>
          <button
            onClick={() => {
              setForm({
                name: '',
                companyName: '',
                contactPerson: '',
                mobile: '',
                whatsapp: '',
                email: '',
                gstNumber: '',
                address: '',
                city: 'City',
                state: 'State',
                pincode: '400001',
                notes: '',
                status: 'Active'
              });
              setEditingSupplier(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-xl text-sm transition-all shadow-sm border border-emerald-600 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> [ Register Supplier ]
          </button>
        </div>
      </div>

      {/* Directory Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition cursor-pointer ${statusFilter === 'All' ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
          >
            All Partners
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition cursor-pointer ${statusFilter === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('Inactive')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition cursor-pointer ${statusFilter === 'Inactive' ? 'bg-red-50 text-red-850 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
          >
            Inactive
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-450 italic">Loading partners directory...</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 text-slate-450 italic bg-white rounded-2xl border border-slate-200">No suppliers registered.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(s => {
            const productsSuppliedCount = s.products?.length || 0;
            const lastOrderDate = s.orders?.[0]?.orderDate 
              ? new Date(s.orders[0].orderDate).toLocaleDateString('en-IN')
              : 'No orders yet';
            
            return (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b pb-3 border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-black text-base uppercase leading-snug">{s.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.companyName}</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(s)}
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border cursor-pointer ${
                        s.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-750 border-red-200'
                      }`}
                    >
                      {s.status}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs pt-3 text-slate-700 font-semibold">
                    {s.gstNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-bold">GSTIN Number:</span>
                        <span className="text-black font-mono">{s.gstNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">WhatsApp / Mobile:</span>
                      <span className="text-black">{s.whatsapp || s.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Products Supplied:</span>
                      <span className="text-black">{productsSuppliedCount} raw items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Last Sourced:</span>
                      <span className="text-black">{lastOrderDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleEdit(s)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-[10px] text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Details
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="bg-slate-50 hover:bg-red-50 text-red-600 font-bold p-2 rounded-lg border border-slate-200 hover:border-red-200 transition cursor-pointer"
                    title="Delete supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supplier Register / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6">
            <h3 className="font-extrabold text-black text-lg uppercase tracking-wider mb-4 border-b pb-2">
              {editingSupplier ? 'Edit Partner Details' : 'Register Sourcing Partner'}
            </h3>
            
            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs font-semibold text-slate-700">
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Poultry Traders"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Poultry Farm Private Limited"
                  value={form.companyName}
                  onChange={(e) => setForm({...form, companyName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Mobile Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.mobile}
                    onChange={(e) => setForm({...form, mobile: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={form.whatsapp}
                    onChange={(e) => setForm({...form, whatsapp: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="GSTIN Code"
                    value={form.gstNumber}
                    onChange={(e) => setForm({...form, gstNumber: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. order@poultry.com"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Partner Address</label>
                <input
                  type="text"
                  placeholder="Street and area info"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Additional Sourcing Notes</label>
                <textarea
                  placeholder="e.g. Payment terms Net 30, Friday delivery only"
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-black hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer"
                >
                  Save Partner
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer"
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
