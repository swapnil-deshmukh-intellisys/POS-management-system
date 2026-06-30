import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Check,
  Bell,
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  RotateCcw
} from 'lucide-react';

// Define Interfaces
interface MenuItem {
  name: string;
  price: number;
}

interface KitchenOrderItem {
  id: string;
  quantity: number;
  status: 'PENDING' | 'PREPARING' | 'READY';
  notes?: string | null;
  menuItem?: MenuItem;
}

interface Table {
  tableNumber: string;
}

interface Waiter {
  name: string;
}

interface KitchenOrder {
  id: string;
  source?: string;
  table?: Table | null;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'PARTIALLY_READY' | 'READY' | 'COMPLETED' | 'SERVED';
  createdAt: string;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  waiter?: Waiter | null;
  notes?: string | null;
  items: KitchenOrderItem[];
}

const INITIAL_MOCK_ORDERS: KitchenOrder[] = [
  {
    id: 'ko-1045',
    source: 'POS',
    table: { tableNumber: 'Table T-05' },
    status: 'PREPARING',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    waiter: { name: 'Rahul' },
    notes: 'No Onion in Burger',
    items: [
      { id: 'koi-1', quantity: 2, status: 'PREPARING', menuItem: { name: 'Veg Burger', price: 140 } },
      { id: 'koi-2', quantity: 1, status: 'READY', menuItem: { name: 'French Fries', price: 90 } },
      { id: 'koi-3', quantity: 2, status: 'PREPARING', menuItem: { name: 'Cold Coffee', price: 120 } }
    ]
  },
  {
    id: 'ko-102',
    source: 'QR',
    table: { tableNumber: 'Table T-02' },
    status: 'NEW',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    waiter: { name: 'Rahul' },
    items: [
      { id: 'koi-4', quantity: 1, status: 'PENDING', menuItem: { name: 'Paneer Tikka', price: 199 } },
      { id: 'koi-5', quantity: 3, status: 'PENDING', menuItem: { name: 'Butter Naan', price: 40 } }
    ]
  },
  {
    id: 'ko-103',
    source: 'QR',
    table: { tableNumber: 'Table T-08' },
    status: 'NEW',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    waiter: { name: 'Akshay' },
    items: [
      { id: 'koi-6', quantity: 2, status: 'PENDING', menuItem: { name: 'Chicken Biryani', price: 250 } },
      { id: 'koi-7', quantity: 2, status: 'PENDING', menuItem: { name: 'Coke', price: 40 } }
    ]
  }
];

export const KitchenDisplay: React.FC = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<KitchenOrder[]>(INITIAL_MOCK_ORDERS);
  const [loading, setLoading] = useState(true);
  const [newOrderAnimationIds, setNewOrderAnimationIds] = useState<string[]>([]);
  const [nowTime, setNowTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('filter');
    if (tabParam === 'PREPARING' || tabParam === 'ACCEPTED' || tabParam === 'PARTIALLY_READY') return 'PREPARING';
    if (tabParam === 'READY') return 'READY';
    if (tabParam === 'COMPLETED') return 'COMPLETED';
    return 'NEW';
  });

  // Compact 3s toast notifications in top-right corner
  const [toasts, setToasts] = useState<{ id: string; table: string; kotNumber: string }[]>([]);
  const [lastNewCount, setLastNewCount] = useState(0);

  // Counts for each tab
  const newCount = orders.filter(o => o.status === 'NEW').length;
  const preparingCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'PARTIALLY_READY').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED' || o.status === 'SERVED').length;

  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.22);
      }, 150);
    } catch (e) {
      console.warn('Audio play blocked or unsupported by browser policies');
    }
  };

  const getOrderPrepTime = (order: KitchenOrder) => {
    if (!order.items || order.items.length === 0) return 15;
    const times = order.items.map((it: any) => {
      const name = (it.menuItem?.name || '').toLowerCase();
      if (name.includes('pomfret') || name.includes('masala')) return 20;
      if (name.includes('paneer') || name.includes('biryani') || name.includes('dal')) return 15;
      if (name.includes('pizza') || name.includes('manchurian') || name.includes('rice')) return 12;
      if (name.includes('crispy') || name.includes('raita') || name.includes('noodles') || name.includes('burger')) return 10;
      if (name.includes('roti') || name.includes('naan')) return 5;
      if (name.includes('drink') || name.includes('coke') || name.includes('pepsi') || name.includes('sprite') || name.includes('water') || name.includes('lassi') || name.includes('soda')) return 2;
      return 15; // default fallback
    });
    return Math.max(...times);
  };

  const fetchOrders = async () => {
    try {
      const data = await apiRequest('/restaurant/orders');
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('Failed to fetch kitchen orders from API, using mock fallback.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDummyOrders = async () => {
    try {
      await apiRequest('/restaurant/seed-ready-orders', { method: 'POST' });
      fetchOrders();
    } catch (err) {
      console.warn('Failed to seed dummy data.');
    }
  };

  // Update overall order status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const updatedOrder = await apiRequest(`/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

      if (nextStatus === 'READY') {
        triggerReadyNotification(updatedOrder);
      }
    } catch (err) {
      console.warn('API update failed, updating local state.');
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const nextItems = o.items.map(it => ({
            ...it,
            status: (nextStatus === 'READY' ? 'READY' : nextStatus === 'PREPARING' ? 'PREPARING' : 'PENDING') as any
          }));
          const updated: KitchenOrder = {
            ...o,
            status: nextStatus as any,
            items: nextItems,
            readyAt: nextStatus === 'READY' ? new Date().toISOString() : o.readyAt,
            preparingAt: nextStatus === 'PREPARING' ? new Date().toISOString() : o.preparingAt
          };
          if (nextStatus === 'READY') {
            triggerReadyNotification(updated);
          }
          return updated;
        }
        return o;
      }));
    }
  };

  // Update item-wise preparation status
  const handleUpdateItemStatus = async (itemId: string, nextItemStatus: 'PENDING' | 'PREPARING' | 'READY') => {
    try {
      const updatedOrder = await apiRequest(`/restaurant/orders/items/${itemId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextItemStatus })
      });

      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

      if (updatedOrder.status === 'READY') {
        triggerReadyNotification(updatedOrder);
      }
    } catch (err) {
      console.warn('API item update failed, updating local state.');
      setOrders(prev => {
        return prev.map(o => {
          const hasItem = o.items.some(it => it.id === itemId);
          if (!hasItem) return o;

          const updatedItems = o.items.map(it => it.id === itemId ? { ...it, status: nextItemStatus } : it);

          // Calculate overall status
          let nextOrderStatus: KitchenOrder['status'] = 'NEW';
          const isAllPending = updatedItems.every(it => it.status === 'PENDING');
          const isAllReady = updatedItems.every(it => it.status === 'READY');
          const hasAnyPreparing = updatedItems.some(it => it.status === 'PREPARING');
          const hasAnyReady = updatedItems.some(it => it.status === 'READY');

          if (isAllReady) {
            nextOrderStatus = 'READY';
          } else if (hasAnyPreparing && hasAnyReady) {
            nextOrderStatus = 'PARTIALLY_READY';
          } else if (hasAnyPreparing) {
            nextOrderStatus = 'PREPARING';
          } else if (hasAnyReady) {
            nextOrderStatus = 'PARTIALLY_READY';
          } else if (isAllPending) {
            nextOrderStatus = 'NEW';
          } else {
            nextOrderStatus = 'PREPARING';
          }

          const updated: KitchenOrder = {
            ...o,
            items: updatedItems,
            status: nextOrderStatus,
            readyAt: nextOrderStatus === 'READY' ? new Date().toISOString() : o.readyAt
          };

          if (nextOrderStatus === 'READY') {
            triggerReadyNotification(updated);
          }

          return updated;
        });
      });
    }
  };

  const triggerReadyNotification = (order: KitchenOrder) => {
    playAlertSound();
    const id = Date.now().toString() + Math.random().toString();
    const tableStr = order.table?.tableNumber || 'Takeaway';
    const kotShort = order.id.slice(-4).toUpperCase();

    // Add compact 3-second toast
    setToasts(prev => {
      if (prev.some(t => t.kotNumber === kotShort)) return prev;
      return [...prev, { id, table: tableStr, kotNumber: kotShort }];
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // SSE Sync
  useEffect(() => {
    fetchOrders();

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_ORDER' || payload.type === 'ORDER_STATUS_UPDATE') {
          const orderData = payload.data || payload;
          setOrders(prev => {
            const exists = prev.some(o => o.id === orderData.id);
            if (exists) {
              return prev.map(o => o.id === orderData.id ? orderData : o);
            }
            // Trigger animation for new incoming order
            setNewOrderAnimationIds(ani => [...ani, orderData.id]);
            setTimeout(() => {
              setNewOrderAnimationIds(ani => ani.filter(id => id !== orderData.id));
            }, 6000);
            return [orderData, ...prev];
          });

          if (orderData.status === 'READY') {
            triggerReadyNotification(orderData);
          }
        }
      } catch (err) {
        console.error('[KDS SSE] Parse error:', err);
      }
    };

    const timer = setInterval(() => setNowTime(Date.now()), 1000);

    return () => {
      eventSource.close();
      clearInterval(timer);
    };
  }, []);

  // Alert reminder loop for new un-accepted orders
  useEffect(() => {
    if (newCount > lastNewCount) {
      playAlertSound();
    }
    setLastNewCount(newCount);
  }, [newCount]);

  useEffect(() => {
    if (newCount > 0) {
      const soundInterval = setInterval(() => {
        playAlertSound();
      }, 60000);
      return () => clearInterval(soundInterval);
    }
  }, [newCount]);

  const isOrderDelayed = (order: KitchenOrder) => {
    if (order.status === 'READY' || order.status === 'COMPLETED' || order.status === 'SERVED') return false;
    const start = order.preparingAt || order.acceptedAt || order.createdAt;
    const diffMs = nowTime - new Date(start).getTime();
    const expectedMins = getOrderPrepTime(order);
    return diffMs > expectedMins * 60 * 1000;
  };

  const getTimingDetails = (order: KitchenOrder) => {
    const start = order.preparingAt || order.acceptedAt || order.createdAt;
    const diffMs = nowTime - new Date(start).getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let label = 'Waiting';
    if (order.status === 'PREPARING' || order.status === 'ACCEPTED' || order.status === 'PARTIALLY_READY') {
      label = 'Cooking';
    } else if (order.status === 'READY') {
      label = 'Ready';
    }

    return {
      label,
      timeString,
      minutesElapsed: mins
    };
  };

  // Color Mapping
  const getOrderCardStyles = (order: KitchenOrder) => {
    const isDelayed = isOrderDelayed(order);
    if (isDelayed) {
      return {
        borderClass: 'border-rose-500/80 shadow-rose-100 dark:shadow-rose-950/20',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50',
        badgeText: 'DELAYED'
      };
    }
    switch (order.status) {
      case 'NEW':
        return {
          borderClass: 'border-slate-200 dark:border-slate-800 shadow-slate-100/50 dark:shadow-slate-900/20',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          badgeText: 'PENDING'
        };
      case 'ACCEPTED':
        return {
          borderClass: 'border-blue-300 dark:border-blue-800/80 shadow-blue-50/50 dark:shadow-blue-950/10',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
          badgeText: 'ACCEPTED'
        };
      case 'PREPARING':
        return {
          borderClass: 'border-orange-300 dark:border-orange-850/80 shadow-orange-50/50 dark:shadow-orange-950/10',
          badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-955/30 dark:text-orange-400 dark:border-orange-900/50',
          badgeText: 'PREPARING'
        };
      case 'PARTIALLY_READY':
        return {
          borderClass: 'border-amber-400/80 dark:border-amber-800 shadow-amber-50/40 dark:shadow-amber-950/10',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-250 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
          badgeText: 'PARTIALLY READY'
        };
      case 'READY':
        return {
          borderClass: 'border-emerald-400 dark:border-emerald-800 shadow-emerald-50 dark:shadow-emerald-950/10',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
          badgeText: 'READY TO SERVE'
        };
      default:
        return {
          borderClass: 'border-slate-200 dark:border-slate-800 shadow-sm',
          badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          badgeText: 'SERVED'
        };
    }
  };

  const getFilteredOrders = () => {
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    switch (activeTab) {
      case 'NEW':
        return sorted.filter(o => o.status === 'NEW');
      case 'PREPARING':
        return sorted.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'PARTIALLY_READY');
      case 'READY':
        return sorted.filter(o => o.status === 'READY');
      case 'COMPLETED':
        return sorted.filter(o => o.status === 'COMPLETED' || o.status === 'SERVED');
      default:
        return [];
    }
  };

  const displayedOrders = getFilteredOrders();

  return (
    <div className="space-y-6 text-slate-850 dark:text-slate-100 max-w-7xl mx-auto p-4 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notifications Container (Compact, Top-Right Corner, Stacking) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-xs w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-xl shadow-xl border border-emerald-500/35 flex items-start gap-3 pointer-events-auto transition-all duration-300 animate-slide-in w-72"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              🍽
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-extrabold text-xs text-emerald-400 tracking-wider uppercase">Order Ready</div>
              <div className="font-extrabold text-sm mt-0.5 text-white leading-tight">{toast.table}</div>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">KOT #{toast.kotNumber}</div>
              <div className="text-[11px] text-slate-355 font-medium mt-1">Ready for Serving</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern KDS Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0c1024] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ChefHat className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
              Kitchen Workspace
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Real-time KOT dispatching & item-wise preparation workflow</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/restaurant/inventory-requests')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Stock Request</span>
          </button>
          <button
            onClick={playAlertSound}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Bell Test</span>
          </button>
          <button
            onClick={handleSeedDummyOrders}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Seed dummy orders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Seed KOTs</span>
          </button>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="flex bg-slate-100/70 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-855">
        {[
          { tabId: 'NEW', label: 'New Orders', count: newCount, activeText: 'text-blue-600 dark:text-blue-400 border-blue-600' },
          { tabId: 'PREPARING', label: 'Preparing', count: preparingCount, activeText: 'text-orange-600 dark:text-orange-400 border-orange-500' },
          { tabId: 'READY', label: 'Ready to Serve', count: readyCount, activeText: 'text-emerald-600 dark:text-emerald-400 border-emerald-500' },
          { tabId: 'COMPLETED', label: 'Completed', count: completedCount, activeText: 'text-slate-700 dark:text-slate-300 border-slate-600' }
        ].map(t => (
          <button
            key={t.tabId}
            onClick={() => setActiveTab(t.tabId as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === t.tabId
                ? 'bg-white dark:bg-[#0c1024] shadow-sm text-slate-900 dark:text-white border-b-2 ' + t.activeText
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-250/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* KDS Active Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#0c1024] border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl shadow-sm animate-pulse space-y-4">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="space-y-2 py-4">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-850 rounded"></div>
                <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-855 rounded"></div>
              </div>
              <div className="h-9 w-full bg-slate-200 dark:bg-slate-850 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0c1024] border border-slate-200/60 dark:border-slate-850 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
            <ChefHat className="w-6.5 h-6.5" />
          </div>
          <h3 className="text-md font-bold text-slate-850 dark:text-slate-200">No Orders in this Section</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            There are currently no orders under the "{activeTab.toLowerCase()}" filter. New orders placed will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedOrders.map(order => {
            const { borderClass, badgeClass, badgeText } = getOrderCardStyles(order);
            const isNew = newOrderAnimationIds.includes(order.id);
            const prepTimeMins = getOrderPrepTime(order);
            const timing = getTimingDetails(order);
            const isDelayed = isOrderDelayed(order);

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-[#0c1024] rounded-2xl border-2 ${borderClass} shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden text-left relative ${isNew ? 'animate-bounce-in' : ''
                  }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[13px] text-slate-900 dark:text-white font-mono">
                      KOT #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1 font-bold text-slate-855 dark:text-slate-200">
                      <span>🍽</span>
                      <span>{order.table?.tableNumber || 'Takeaway'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Waiter: {order.waiter?.name || 'Staff'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`font-bold uppercase ${isDelayed ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-400'}`}>
                      Priority: {isDelayed ? 'High' : 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Card Body - Ordered Items */}
                <div className="p-4 flex-grow space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Ordered Items ({order.items.length})
                    </span>
                    <div className="space-y-0.5">
                      {order.items.map((it) => (
                        <div key={it.id} className="py-2.5 border-b border-slate-100/70 dark:border-slate-900 last:border-0 flex flex-col gap-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-[13px] text-slate-800 dark:text-slate-100 leading-tight">
                              {it.menuItem?.name || 'Dish'} <strong className="text-slate-900 dark:text-white font-extrabold text-[14px]">×{it.quantity}</strong>
                            </span>
                          </div>

                          {it.notes && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                              ↳ "{it.notes}"
                            </span>
                          )}

                          {/* Segmented Status Selector */}
                          <div className="flex rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-0.5 shrink-0 text-[10px] font-extrabold w-fit mt-1 select-none">
                            {[
                              { status: 'PENDING', label: 'Pending', activeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                              { status: 'PREPARING', label: 'Cooking', activeClass: 'bg-orange-500 text-white shadow-sm' },
                              { status: 'READY', label: 'Ready', activeClass: 'bg-emerald-500 text-white shadow-sm' }
                            ].map(btn => (
                              <button
                                key={btn.status}
                                onClick={() => handleUpdateItemStatus(it.id, btn.status as any)}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${it.status === btn.status
                                    ? btn.activeClass
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-455'
                                  }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kitchen Note */}
                  {order.notes && (
                    <div className="bg-amber-50/40 dark:bg-amber-955/15 border border-amber-100/50 dark:border-amber-900/30 p-2.5 rounded-xl text-xs space-y-0.5">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Kitchen Instruction
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        "{order.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/5 space-y-3 text-xs">
                  {/* Estimated Time Indicator */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {timing.label}: <strong className="font-mono text-slate-855 dark:text-white font-extrabold">{timing.timeString}</strong>
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${isDelayed ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                      {isDelayed && <AlertTriangle className="w-3.5 h-3.5" />}
                      {prepTimeMins} Min Limit
                    </span>
                  </div>

                  {/* Quick Global Action Button */}
                  {order.status === 'NEW' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-600/10 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {(order.status === 'PREPARING' || order.status === 'ACCEPTED' || order.status === 'PARTIALLY_READY') && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/10 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark All Ready</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                      className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-black text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Serve Order</span>
                    </button>
                  )}

                  {(order.status === 'COMPLETED' || order.status === 'SERVED') && (
                    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold py-2 px-3 rounded-xl text-center">
                      ✓ Served to Table
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Styled Micro-Animations Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-in-right {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes bounce-in-pop {
          0% { transform: scale(0.92); opacity: 0; }
          60% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
        }
      `}} />
    </div>
  );
};

export default KitchenDisplay;
