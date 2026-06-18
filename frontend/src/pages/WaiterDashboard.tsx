import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Clock,
  CheckCircle,
  Loader2,
  Utensils,
  User,
  Navigation,
  CheckSquare
} from 'lucide-react';

export const WaiterDashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(() => {
    return localStorage.getItem('active_waiter_id') || '';
  });
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReadyNotification, setNewReadyNotification] = useState<string | null>(null);

  // Realtime connection URL
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  // Ringing bell sound for ready orders
  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First strike
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.85);

      // Harmonious second pitch (chime effect)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime); // E6
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 1.25);
      }, 150);
    } catch (e) {
      console.warn('Audio play blocked or unsupported by browser policies');
    }
  };

  const fetchData = async () => {
    try {
      // Fetch active orders (excludes SERVED)
      const activeData = await apiRequest(`/restaurant/orders?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setOrders(activeData);

      // Fetch completed orders (only today's SERVED orders)
      const allData = await apiRequest(`/restaurant/orders?restaurantId=${user?.restaurantId || 'mock-id'}&includeServed=true`);
      const servedToday = allData.filter((o: any) => o.status === 'SERVED');
      setCompletedOrders(servedToday);

      // Fetch waiters
      const waiterData = await apiRequest(`/restaurant/waiters?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setWaiters(waiterData);
    } catch (err) {
      console.warn('Using Waiter mock fallback data.');
      // Mock Fallbacks
      setWaiters([
        { id: 'w-1', name: 'Rahul Sharma' },
        { id: 'w-2', name: 'Priya Patel' },
        { id: 'w-3', name: 'Amit Kumar' }
      ]);
      setOrders([
        {
          id: 'ko-104',
          source: 'QR',
          table: { tableNumber: 'Table 1' },
          status: 'READY',
          totalAmount: 180,
          createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
          items: [{ id: 'koi-6', quantity: 1, menuItem: { name: 'Cheese Burger' } }]
        },
        {
          id: 'ko-105',
          source: 'QR',
          table: { tableNumber: 'Table 5' },
          status: 'SERVING',
          waiterId: 'w-1',
          waiterStatus: 'SERVING',
          totalAmount: 350,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          items: [{ id: 'koi-8', quantity: 1, menuItem: { name: 'Farmhouse Pizza' } }]
        }
      ]);
      setCompletedOrders([
        {
          id: 'ko-100',
          source: 'QR',
          table: { tableNumber: 'Table 3' },
          status: 'SERVED',
          waiterId: 'w-1',
          waiterStatus: 'SERVED',
          totalAmount: 150,
          createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          servedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          items: [{ id: 'koi-7', quantity: 1, menuItem: { name: 'Classic Veg Burger' } }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    console.log('[Waiter SSE] Connecting to', sseUrl);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('[Waiter SSE] Event received:', payload);

        if (payload.type === 'NEW_ORDER') {
          const newOrder = payload.data;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (payload.type === 'ORDER_STATUS_UPDATE') {
          const { id, status, estimatedPrepTime, acceptedAt, preparingAt, readyAt, pickedUpAt, servedAt, waiterStatus, waiterId } = payload.data;
          
          if (status === 'READY') {
            playBellSound();
            const matched = orders.find(o => o.id === id);
            const tbl = matched?.table?.tableNumber || 'Takeaway';
            setNewReadyNotification(`Order ready for ${tbl}!`);
            setTimeout(() => setNewReadyNotification(null), 5000);
          }

          setOrders(prev => {
            if (status === 'SERVED') {
              const matchedOrder = prev.find(o => o.id === id);
              if (matchedOrder) {
                setCompletedOrders(comp => [{ ...matchedOrder, status, servedAt, pickedUpAt, waiterStatus, waiterId }, ...comp]);
              }
              return prev.filter(o => o.id !== id);
            }
            return prev.map(o => o.id === id ? { ...o, status, estimatedPrepTime, acceptedAt, preparingAt, readyAt, pickedUpAt, servedAt, waiterStatus, waiterId } : o);
          });
        } else if (payload.type === 'NOTIFICATION' && payload.data.type === 'ORDER_READY') {
          playBellSound();
          setNewReadyNotification(payload.data.message);
          setTimeout(() => setNewReadyNotification(null), 6000);
        }
      } catch (err) {
        console.error('[Waiter SSE] Error handling message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[Waiter SSE] Connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [orders]);

  const handleSelectWaiter = (id: string) => {
    setSelectedWaiterId(id);
    if (id) {
      localStorage.setItem('active_waiter_id', id);
    } else {
      localStorage.removeItem('active_waiter_id');
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const bodyPayload: any = { status: nextStatus };
      if (nextStatus === 'SERVING' && selectedWaiterId) {
        bodyPayload.waiterId = selectedWaiterId;
        bodyPayload.waiterStatus = 'SERVING';
      } else if (nextStatus === 'SERVED' && selectedWaiterId) {
        bodyPayload.waiterStatus = 'SERVED';
      }

      await apiRequest(`/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(bodyPayload)
      });
      // SSE will sync the local state automatically
    } catch (err) {
      // Fallback
      setOrders(prev => {
        if (nextStatus === 'SERVED') {
          const matched = prev.find(o => o.id === orderId);
          if (matched) setCompletedOrders(comp => [{ ...matched, status: 'SERVED', waiterStatus: 'SERVED', waiterId: selectedWaiterId }, ...comp]);
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => o.id === orderId ? { ...o, status: nextStatus, waiterStatus: nextStatus === 'SERVING' ? 'SERVING' : o.waiterStatus, waiterId: selectedWaiterId || o.waiterId } : o);
      });
    }
  };

  const readyToServe = orders.filter(o => o.status === 'READY');
  const serving = orders.filter(o => o.status === 'SERVING');

  const getElapsedTime = (createdTime: string) => {
    const elapsed = Date.now() - new Date(createdTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return `${minutes}m ago`;
  };

  const renderOrderCard = (order: any, isServingSection: boolean = false) => {
    const assignedWaiter = waiters.find(w => w.id === order.waiterId);
    return (
      <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {order.table?.tableNumber || 'Takeaway'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block">
                ORDER #{order.id.slice(-4).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-end text-[9px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{getElapsedTime(order.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            {order.items.map((it: any) => (
              <div key={it.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">
                  {it.quantity} x {it.menuItem?.name || 'Dish'}
                </span>
              </div>
            ))}
          </div>

          {order.notes && !order.notes.startsWith('Cust:') && (
            <p className="text-[10px] text-amber-600 italic bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/30 mb-3">
              "{order.notes}"
            </p>
          )}

          {assignedWaiter && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Waiter: {assignedWaiter.name}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
          {!isServingSection ? (
            <button
              onClick={() => handleUpdateStatus(order.id, 'SERVING')}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Mark Picked Up</span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus(order.id, 'SERVED')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Mark Served</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sound notification popup banner */}
      {newReadyNotification && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white py-3 px-5 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-emerald-500 animate-bounce">
          <Bell className="w-5 h-5 animate-pulse text-white fill-white" />
          <div>
            <span className="font-extrabold text-xs block uppercase tracking-wider">Food Ready Alert!</span>
            <span className="text-[10px] font-bold opacity-90">{newReadyNotification}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
            <h1 className="text-xl font-black tracking-tight">Waiter Service Console</h1>
          </div>
          <p className="text-slate-400 text-[10px] mt-0.5">Track, assign, and complete tableside food deliveries in real-time.</p>
        </div>
        
        {/* Waiter Selection Profile Panel */}
        <div className="flex items-center gap-2 bg-slate-850 p-1.5 rounded-xl border border-slate-700">
          <User className="w-4 h-4 text-purple-400 ml-1.5" />
          <select
            value={selectedWaiterId}
            onChange={(e) => handleSelectWaiter(e.target.value)}
            className="bg-slate-800 text-xs font-bold text-slate-200 border-none outline-none pr-6 rounded-lg p-1"
          >
            <option value="">Choose Your Profile...</option>
            {waiters.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedWaiterId && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-left flex items-start gap-2.5">
          <Bell className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold">Please select your waiter profile in the top-right corner.</p>
            <p className="text-[10px] mt-0.5 opacity-90">Doing so links your profile to orders you pick up and serve to track your table delivery efficiency.</p>
          </div>
        </div>
      )}

      {/* Waiter Kanban Columns */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Ready To Serve */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[50vh] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                Ready to Serve
              </h2>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                {readyToServe.length}
              </span>
            </div>
            <div className="space-y-3 flex-1">
              {readyToServe.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <Utensils className="w-6 h-6 mb-2 stroke-[1.5]" />
                  <span className="text-[10px] font-bold">Nothing ready to serve yet</span>
                </div>
              ) : (
                readyToServe.map(o => renderOrderCard(o, false))
              )}
            </div>
          </div>

          {/* Column 2: Serving */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[50vh] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Serving (Picked Up)
              </h2>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                {serving.length}
              </span>
            </div>
            <div className="space-y-3 flex-1">
              {serving.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <Navigation className="w-6 h-6 mb-2 stroke-[1.5]" />
                  <span className="text-[10px] font-bold">No orders currently being served</span>
                </div>
              ) : (
                serving.map(o => renderOrderCard(o, true))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[50vh] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                Completed Today
              </h2>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                {completedOrders.length}
              </span>
            </div>
            <div className="space-y-3 flex-1">
              {completedOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <CheckCircle className="w-6 h-6 mb-2 stroke-[1.5]" />
                  <span className="text-[10px] font-bold">No completed orders today</span>
                </div>
              ) : (
                completedOrders.map(order => {
                  const assignedWaiter = waiters.find(w => w.id === order.waiterId);
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left opacity-75">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                            {order.table?.tableNumber || 'Takeaway'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            ORDER #{order.id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Served
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        {order.items.map((it: any) => (
                          <div key={it.id}>
                            {it.quantity} x {it.menuItem?.name}
                          </div>
                        ))}
                      </div>
                      {assignedWaiter && (
                        <div className="mt-3 text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Served by: {assignedWaiter.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
