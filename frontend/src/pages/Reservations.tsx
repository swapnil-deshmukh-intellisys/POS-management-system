import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, Clock, Users, User } from 'lucide-react';

export const Reservations: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [tableId, setTableId] = useState('');

  const fetchReservationsAndTables = async () => {
    try {
      const resvs = await apiRequest(`/restaurant/reservations?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setReservations(resvs);
      
      const tbs = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setTables(tbs);
    } catch (err) {
      console.warn('Utilizing mock reservations data.');
      setTables([
        { id: 't-1', tableNumber: 'Table 1', capacity: 2 },
        { id: 't-2', tableNumber: 'Table 2', capacity: 4 },
        { id: 't-3', tableNumber: 'Table 3', capacity: 4 }
      ]);
      setReservations([
        { id: 'r-1', customerName: 'Robert Dow', mobileNumber: '9988554422', date: '2026-06-16', time: '19:30', guests: 4, status: 'RESERVED', table: { tableNumber: 'Table 2' } },
        { id: 'r-2', customerName: 'Emily Clark', mobileNumber: '9988554433', date: '2026-06-16', time: '20:00', guests: 2, status: 'CHECKED_IN', table: { tableNumber: 'Table 1' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservationsAndTables();
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobileNumber || !date || !time || !tableId) return;

    const body = {
      customerName,
      mobileNumber,
      date,
      time,
      guests: Number(guests),
      tableId
    };

    try {
      await apiRequest('/restaurant/reservations', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setShowAddModal(false);
      // reset
      setCustomerName('');
      setMobileNumber('');
      setDate('');
      setTime('');
      setGuests(2);
      setTableId('');
      fetchReservationsAndTables();
    } catch (err) {
      const selectedTable = tables.find(t => t.id === tableId);
      setReservations(prev => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          customerName,
          mobileNumber,
          date,
          time,
          guests,
          status: 'RESERVED',
          table: selectedTable || { tableNumber: 'Table' }
        }
      ]);
      setShowAddModal(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/restaurant/reservations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchReservationsAndTables();
    } catch (err) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'CHECKED_IN': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'COMPLETED': return 'bg-slate-100 border-slate-200 text-slate-600';
      case 'CANCELLED': return 'bg-red-50 border-red-200 text-red-600';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Table Reservations Book</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Track upcoming bookings, manage guest seats, and process check-in arrivals</p>
        </div>
        <button
          onClick={() => {
            if (tables.length > 0) setTableId(tables[0].id);
            setShowAddModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/10 text-sm transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Book a Table</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Seats & Table</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 w-16 bg-slate-200 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) :
                reservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-slate-800">{res.customerName}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{res.mobileNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{res.date}</span>
                        <Clock className="w-4 h-4 text-slate-400 ml-2" />
                        <span>{res.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{res.guests} Guests</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 ml-2">
                          {res.table?.tableNumber || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      {res.status === 'RESERVED' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'CHECKED_IN')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-xs transition-colors"
                          >
                            Check-in
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                            className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-1 px-2.5 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {res.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'COMPLETED')}
                          className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-1 px-2.5 rounded-lg text-xs transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* --- ADD RESERVATION MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Book Seat / Table</h3>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Dow"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  required
                  placeholder="9888554422"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Table</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 bg-slate-50/50 cursor-pointer"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.tableNumber} (Cap: {t.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors"
                >
                  Save Booking
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
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

export default Reservations;
