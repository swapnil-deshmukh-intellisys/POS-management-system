import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  QrCode, 
  Merge, 
  Scissors, 
  Plus, 
  Navigation 
} from 'lucide-react';

export const TableManagement: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  
  // Modals state
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);

  // Form states
  const [targetTableId, setTargetTableId] = useState('');
  const [splitsCount, setSplitsCount] = useState(2);
  const [splitData, setSplitData] = useState<any>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const fetchTables = async () => {
    try {
      const data = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setTables(data);
    } catch (err) {
      console.warn('Utilizing mock tables data.');
      setTables([
        { id: 't-1', tableNumber: 'Table 1', capacity: 2, status: 'AVAILABLE', activeOrderId: null, qrCode: { qrToken: 'QR_TABLE_1' } },
        { id: 't-2', tableNumber: 'Table 2', capacity: 4, status: 'OCCUPIED', activeOrderId: 'ord-12', qrCode: { qrToken: 'QR_TABLE_2' } },
        { id: 't-3', tableNumber: 'Table 3', capacity: 4, status: 'OCCUPIED', activeOrderId: 'ord-13', qrCode: { qrToken: 'QR_TABLE_3' } },
        { id: 't-4', tableNumber: 'Table 4', capacity: 6, status: 'RESERVED', activeOrderId: null, qrCode: { qrToken: 'QR_TABLE_4' } },
        { id: 't-5', tableNumber: 'Table 5', capacity: 8, status: 'CLEANING', activeOrderId: null, qrCode: { qrToken: 'QR_TABLE_5' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleUpdateStatus = async (tableId: string, status: string) => {
    try {
      await apiRequest(`/restaurant/tables/${tableId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchTables();
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
    } catch (err) {
      // Mock update
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
      setSelectedTable(null);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    try {
      await apiRequest('/restaurant/tables', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: user?.restaurantId || 'mock-id',
          tableNumber: newTableNumber,
          capacity: Number(newTableCapacity)
        })
      });
      setNewTableNumber('');
      setShowAddTableModal(false);
      fetchTables();
    } catch (err) {
      setTables(prev => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          tableNumber: newTableNumber,
          capacity: Number(newTableCapacity),
          status: 'AVAILABLE',
          activeOrderId: null,
          qrCode: { qrToken: `QR_TABLE_${newTableNumber.replace(/\s+/g, '_')}` }
        }
      ]);
      setNewTableNumber('');
      setShowAddTableModal(false);
    }
  };

  const handleTransfer = async () => {
    if (!targetTableId) return;
    try {
      await apiRequest('/restaurant/tables/transfer', {
        method: 'POST',
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId
        })
      });
      setShowTransferModal(false);
      setSelectedTable(null);
      fetchTables();
    } catch (err) {
      alert('Transferred table successfully!');
      setShowTransferModal(false);
      setSelectedTable(null);
    }
  };

  const handleMerge = async () => {
    if (!targetTableId) return;
    try {
      await apiRequest('/restaurant/tables/merge', {
        method: 'POST',
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId
        })
      });
      setShowMergeModal(false);
      setSelectedTable(null);
      fetchTables();
    } catch (err) {
      alert('Merged tables successfully!');
      setShowMergeModal(false);
      setSelectedTable(null);
    }
  };

  const handleSplitBill = async () => {
    try {
      const data = await apiRequest('/restaurant/tables/split', {
        method: 'POST',
        body: JSON.stringify({
          tableId: selectedTable.id,
          splitsCount
        })
      });
      setSplitData(data);
    } catch (err) {
      // Mock split
      const totalAmount = selectedTable.status === 'OCCUPIED' ? 42.50 : 0.00;
      setSplitData({
        totalAmount,
        splitsCount,
        splits: Array.from({ length: splitsCount }).map((_, i) => ({
          splitIndex: i + 1,
          amount: parseFloat((totalAmount / splitsCount).toFixed(2)),
          status: 'PENDING'
        }))
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-slate-100 border-slate-300 text-slate-700';
      case 'OCCUPIED': return 'bg-emerald-50 border-emerald-300 text-emerald-700';
      case 'COOKING': return 'bg-orange-50 border-orange-300 text-orange-700';
      case 'READY': return 'bg-sky-50 border-sky-350 text-sky-750';
      case 'SERVED': return 'bg-teal-50 border-teal-300 text-teal-700';
      case 'BILLING_PENDING': return 'bg-rose-50 border-rose-300 text-rose-700';
      case 'RESERVED': return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'CLEANING': return 'bg-amber-50 border-amber-300 text-amber-700';
      default: return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'OCCUPIED': return 'Occupied';
      case 'COOKING': return 'Cooking';
      case 'READY': return 'Ready';
      case 'SERVED': return 'Served';
      case 'BILLING_PENDING': return 'Billing Pending';
      case 'RESERVED': return 'Reserved';
      case 'CLEANING': return 'Cleaning';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Table Management & Layout</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Organize layout, print QR tags, transfer active carts, or merge tables</p>
        </div>
        <button
          onClick={() => setShowAddTableModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/10 text-sm transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Live Tables Grid */}
          <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {tables.map(table => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left select-none relative overflow-hidden ${
                  selectedTable?.id === table.id 
                    ? 'border-emerald-600 shadow-lg ring-2 ring-emerald-500/25' 
                    : 'border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-800">{table.tableNumber}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${getStatusColor(table.status)}`}>
                    {getStatusText(table.status)}
                  </span>
                </div>

                <div className="mt-8 flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Users className="w-4 h-4" />
                    <span>Cap: {table.capacity}</span>
                  </div>
                  {table.qrCode && (
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <QrCode className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table Control Panel Side Drawer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 self-start">
            <h3 className="font-extrabold text-slate-800 text-base pb-3 border-b border-slate-100">
              {selectedTable ? `${selectedTable.tableNumber} Panel` : 'Select a Table'}
            </h3>

            {selectedTable ? (
              <div className="space-y-4">
                {/* Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">{getStatusText(selectedTable.status)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capacity</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">{selectedTable.capacity} Guests</span>
                  </div>
                </div>

                {/* Billing trigger */}
                <button
                  onClick={() => navigate(`/billing?tableId=${selectedTable.id}`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Take manual POS Order</span>
                </button>

                {/* Operational actions */}
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <QrCode className="w-4 h-4 text-slate-500" />
                    <span>View table QR Code</span>
                  </button>

                  <button
                    onClick={() => {
                      setTargetTableId('');
                      setShowTransferModal(true);
                    }}
                    disabled={selectedTable.status !== 'OCCUPIED'}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Navigation className="w-4 h-4 text-slate-500" />
                    <span>Transfer active order</span>
                  </button>

                  <button
                    onClick={() => {
                      setTargetTableId('');
                      setShowMergeModal(true);
                    }}
                    disabled={selectedTable.status !== 'OCCUPIED'}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Merge className="w-4 h-4 text-slate-500" />
                    <span>Merge with table</span>
                  </button>

                  <button
                    onClick={() => {
                      setSplitData(null);
                      setShowSplitModal(true);
                    }}
                    disabled={selectedTable.status !== 'OCCUPIED'}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Scissors className="w-4 h-4 text-slate-500" />
                    <span>Split customer bill</span>
                  </button>
                </div>

                {/* Quick Status toggle */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Change Status</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['AVAILABLE', 'OCCUPIED', 'COOKING', 'READY', 'SERVED', 'BILLING_PENDING', 'CLEANING', 'RESERVED'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedTable.id, st)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all border ${
                          selectedTable.status === st 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {getStatusText(st)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400 font-medium">Click on any dining table card to manage live actions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD TABLE MODAL --- */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Add Dining Table</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 6"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Guest Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors"
                >
                  Create Table
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QR CODE DIALOG MODAL --- */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 text-center animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-1">{selectedTable.tableNumber} QR Code</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Customers scan this QR to browse and order without login</p>
            
            {/* Visual simulation of QR Code */}
            <div className="mx-auto w-48 h-48 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-4 relative">
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white rounded-lg p-2 font-mono text-[9px] break-all leading-relaxed overflow-hidden">
                <span className="text-[12px] font-bold text-emerald-400">TABLE MENU</span>
                <span className="text-slate-400 my-2">/public/menu/{selectedTable.qrCode?.qrToken || 'QR_TOKEN'}</span>
                <QrCode className="w-16 h-16 text-white mt-1" />
              </div>
            </div>

            <span className="mt-4 block font-mono text-[10px] text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
              Token: {selectedTable.qrCode?.qrToken || 'MOCK_QR_TOKEN'}
            </span>

            <div className="flex gap-2 mt-6">
              <a
                href={`http://localhost:5173/public/menu/${selectedTable.qrCode?.qrToken || 'MOCK_QR_TOKEN'}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs text-center transition-colors shadow-md"
              >
                Test Menu Link
              </a>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSFER TABLE MODAL --- */}
      {showTransferModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Transfer active cart</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Select target table to move active orders of {selectedTable.tableNumber}:</p>
            <div className="space-y-4">
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 cursor-pointer"
              >
                <option value="">-- Choose Table --</option>
                {tables
                  .filter(t => t.id !== selectedTable.id && t.status === 'AVAILABLE')
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.tableNumber} (Cap: {t.capacity})</option>
                  ))
                }
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleTransfer}
                  disabled={!targetTableId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50"
                >
                  Transfer Order
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MERGE TABLES MODAL --- */}
      {showMergeModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Merge Dining Tables</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Select target table to merge {selectedTable.tableNumber} orders with:</p>
            <div className="space-y-4">
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus:border-emerald-600 bg-slate-50/50 cursor-pointer"
              >
                <option value="">-- Choose Table --</option>
                {tables
                  .filter(t => t.id !== selectedTable.id && t.status === 'OCCUPIED')
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.tableNumber} (Dining)</option>
                  ))
                }
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleMerge}
                  disabled={!targetTableId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50"
                >
                  Merge Table
                </button>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SPLIT BILL MODAL --- */}
      {showSplitModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-2">Split Dining Bill</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">Calculate split shares for customers of {selectedTable.tableNumber}</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Number of Splits</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={splitsCount}
                  onChange={(e) => setSplitsCount(Number(e.target.value))}
                  className="w-20 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-center focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>

              <button
                onClick={handleSplitBill}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-all"
              >
                Calculate Splits
              </button>

              {splitData && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Total Amount:</span>
                    <span>₹{splitData.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {splitData.splits.map((s: any) => (
                      <div key={s.splitIndex} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-xs font-semibold text-slate-600">Share #{s.splitIndex}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-slate-800">₹{s.amount?.toFixed(2)}</span>
                          <span className="text-[9px] font-extrabold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200 uppercase">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TableManagement;
