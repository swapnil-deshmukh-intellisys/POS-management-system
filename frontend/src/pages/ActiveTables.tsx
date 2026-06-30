import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Clock,
  UserCheck,
  Calculator,
  MoveRight,
  Printer,
  Receipt,
  AlertCircle
} from 'lucide-react';

export const ActiveTables: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transfer Table State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [targetTableId, setTargetTableId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // KOT Print Preview State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTable, setPrintTable] = useState<any>(null);

  const fetchTables = async () => {
    try {
      const data = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setTables(data || []);
    } catch (err) {
      console.warn('Utilizing mock active tables data.');
      // Premium mock data matching DB relations
      setTables([
        {
          id: 't-1',
          tableNumber: 'Table 01',
          capacity: 2,
          status: 'OCCUPIED',
          waiter: { name: 'Rahul' },
          kitchenOrders: [
            {
              id: 'ko-201',
              createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
              totalAmount: 480,
              items: [
                { id: 'koi-1', quantity: 2, menuItem: { name: 'Fish Fry', price: 220 } },
                { id: 'koi-2', quantity: 4, menuItem: { name: 'Butter Naan', price: 40 } }
              ]
            }
          ]
        },
        {
          id: 't-2',
          tableNumber: 'Table 02',
          capacity: 4,
          status: 'COOKING',
          waiter: { name: 'Akshay' },
          kitchenOrders: [
            {
              id: 'ko-202',
              createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
              totalAmount: 319,
              items: [
                { id: 'koi-4', quantity: 1, menuItem: { name: 'Paneer Tikka', price: 199 } },
                { id: 'koi-5', quantity: 3, menuItem: { name: 'Butter Naan', price: 40 } }
              ]
            }
          ]
        },
        {
          id: 't-5',
          tableNumber: 'Table 05',
          capacity: 8,
          status: 'READY',
          waiter: { name: 'Ritesh' },
          kitchenOrders: [
            {
              id: 'ko-203',
              createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
              totalAmount: 580,
              items: [
                { id: 'koi-6', quantity: 2, menuItem: { name: 'Chicken Biryani', price: 250 } },
                { id: 'koi-7', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
              ]
            }
          ]
        },
        {
          id: 't-8',
          tableNumber: 'Table 08',
          capacity: 4,
          status: 'AVAILABLE',
          kitchenOrders: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // Poll every 10 seconds for real-time changes
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTransferTable = async () => {
    if (!selectedTable || !targetTableId) return;
    try {
      setTransferring(true);
      await apiRequest('/restaurant/tables/transfer', {
        method: 'POST',
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId
        })
      });
      setShowTransferModal(false);
      setSelectedTable(null);
      setTargetTableId('');
      fetchTables();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer table');
    } finally {
      setTransferring(false);
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'COOKING': case 'PREPARING': return 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'READY': return 'bg-sky-50 text-sky-750 border-sky-200/60 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
      case 'SERVED': return 'bg-teal-50 text-teal-750 border-teal-200/60 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
      case 'BILLING_PENDING': return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'CLEANING': return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/60 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800/50';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-emerald-500';
      case 'COOKING': case 'PREPARING': return 'bg-orange-500';
      case 'READY': return 'bg-sky-500';
      case 'SERVED': return 'bg-teal-500';
      case 'BILLING_PENDING': return 'bg-rose-500';
      case 'CLEANING': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  // Filter to show only active tables (non-AVAILABLE, or tables containing active order)
  const activeTables = tables.filter(t => 
    t.status !== 'AVAILABLE' && 
    t.status !== 'CLEANING' &&
    (t.kitchenOrders && t.kitchenOrders.length > 0)
  );

  const availableTables = tables.filter(t => t.status === 'AVAILABLE');

  const calculateRunningTime = (occupiedSince: string) => {
    if (!occupiedSince) return '0m';
    const diffMs = Date.now() - new Date(occupiedSince).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const handlePrintKOT = (table: any) => {
    setPrintTable(table);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 text-left select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">Active Dining Tables</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Real-time overview and management of all tables currently in service</p>
        </div>
        <button
          onClick={() => navigate('/restaurant/take-order')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/10 text-sm transition-all cursor-pointer"
        >
          <Calculator className="w-4.5 h-4.5" />
          <span>New Order POS</span>
        </button>
      </div>

      {loading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#0c1024] p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-5 w-16 bg-slate-250 dark:bg-slate-800 rounded-full"></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-850 rounded"></div>
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-850 rounded"></div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex gap-2">
                <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-850 rounded-xl"></div>
                <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-850 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTables.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#0c1024] border border-slate-200/60 dark:border-slate-800/50 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 text-slate-450 dark:text-slate-550 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Active Tables</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are currently no dining tables in service. Click "New Order POS" above to seat a guest and take an order.
          </p>
        </div>
      ) : (
        /* Active Tables Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTables.map(table => {
            const activeOrder = table.kitchenOrders?.[0];
            const orderItemsCount = activeOrder?.items?.reduce((acc: number, it: any) => acc + it.quantity, 0) || 0;
            const runningTime = calculateRunningTime(activeOrder?.createdAt);

            return (
              <div
                key={table.id}
                className="bg-white dark:bg-[#0c1024] rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/45 dark:bg-slate-900/10">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(table.status)}`} />
                    <span className="font-extrabold text-base text-slate-800 dark:text-white">
                      {table.tableNumber}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadgeStyles(table.status)}`}>
                    {table.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-grow space-y-4">
                  {/* Waiter & Guests */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>Waiter: <strong className="text-slate-800 dark:text-slate-200">{table.waiter?.name || 'Assigned'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Capacity: <strong className="text-slate-800 dark:text-slate-200">{table.capacity} Guests</strong></span>
                    </div>
                  </div>

                  {/* Order Details & Running Time */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Running: <strong className="text-slate-800 dark:text-slate-200">{runningTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-slate-400" />
                      <span>Total: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{activeOrder?.totalAmount?.toFixed(2) || '0.00'}</strong></span>
                    </div>
                  </div>

                  {/* Ordered Items Preview */}
                  {activeOrder?.items && activeOrder.items.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 rounded-xl p-3.5 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Running KOT ({orderItemsCount} Items)
                      </span>
                      <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {activeOrder.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between font-medium">
                            <span className="text-slate-755 dark:text-slate-350">{it.menuItem?.name || 'Unknown Item'}</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Activity Stamp */}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1">
                    <span>ID: #{activeOrder?.id?.slice(-6).toUpperCase() || 'N/A'}</span>
                    <span>Last Active: {activeOrder?.updatedAt ? new Date(activeOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-900 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/restaurant/take-order?tableId=${table.id}`)}
                    className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-600/5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Update Order</span>
                  </button>

                  <button
                    onClick={() => handlePrintKOT(table)}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold p-2 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Print KOT"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowTransferModal(true);
                    }}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold p-2 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Transfer Table"
                  >
                    <MoveRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/restaurant/generate-bill?tableId=${table.id}`)}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-100/5 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Bill</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TRANSFER TABLE MODAL --- */}
      {showTransferModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0c1024] w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/60 p-6 animate-[fadeIn_0.15s_ease-out] text-left">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-lg mb-2">Transfer Table Session</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Select the destination table to transfer the active dining session and orders of <strong>{selectedTable.tableNumber}</strong>:
            </p>
            <div className="space-y-4">
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-black dark:text-white bg-slate-50/50 dark:bg-slate-900 cursor-pointer focus:outline-none focus:border-emerald-600"
              >
                <option value="" className="dark:bg-[#0c1024]">-- Choose Available Table --</option>
                {availableTables.map(t => (
                  <option key={t.id} value={t.id} className="dark:bg-[#0c1024]">
                    {t.tableNumber} (Capacity: {t.capacity} Guests)
                  </option>
                ))}
              </select>

              {availableTables.length === 0 && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-3 rounded-xl border border-amber-200/50">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No empty tables available for transfer. All tables are currently occupied.</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={handleTransferTable}
                  disabled={!targetTableId || transferring}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  {transferring ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Confirm Transfer'}
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedTable(null);
                    setTargetTableId('');
                  }}
                  className="bg-slate-100 dark:bg-slate-850 text-slate-750 dark:text-slate-300 font-bold px-4.5 py-2.5 rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- KOT PRINT PREVIEW MODAL --- */}
      {showPrintModal && printTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0c1024] w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-850 p-6 animate-[fadeIn_0.15s_ease-out] text-left flex flex-col space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-slate-100 dark:border-slate-900">
              <h2 className="text-lg font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">Kitchen Order Ticket</h2>
              <p className="text-xs text-slate-500 font-semibold">{printTable.tableNumber} | KOT Receipt</p>
            </div>

            {/* Simulated Receipt Details */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-3">
              <div className="flex justify-between">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/65 dark:border-slate-850 pb-2">
                <span>Waiter: {printTable.waiter?.name || 'Staff'}</span>
                <span>Order: #{printTable.kitchenOrders?.[0]?.id?.slice(-6).toUpperCase()}</span>
              </div>

              {/* Items Table */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between font-bold border-b border-slate-200/50 dark:border-slate-850/50 pb-1">
                  <span>Item Description</span>
                  <span>Qty</span>
                </div>
                {printTable.kitchenOrders?.[0]?.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.menuItem?.name}</span>
                    <span className="font-bold">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-900 text-xs font-bold">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Ticket
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintTable(null);
                }}
                className="flex-grow bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white py-2.5 rounded-xl text-center cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveTables;
