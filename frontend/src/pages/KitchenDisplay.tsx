import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Check,
  Bell,
  Loader2,
  ChevronDown,
  ChevronUp,
  Server
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { apiRequest } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAnimationIds, setNewOrderAnimationIds] = useState<string[]>([]);
  const [nowTime, setNowTime] = useState(Date.now());
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY'>('NEW');
  const [activeReadyAlert, setActiveReadyAlert] = useState<{ table: string; orderId: string } | null>(null);
  const [delayedUploadedIds, setDelayedUploadedIds] = useState<string[]>([]);
  const [lastNewCount, setLastNewCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' }[]>([]);

  const showToast = (title: string, message: string, type: 'info' | 'success' = 'info', duration = 6000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // Counts for each tab
  const newCount = orders.filter(o => o.status === 'NEW').length;
  const preparingCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;

  // Realtime connection URL
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  // Play alert sound for new orders or ready waiter calls
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.25);
      }, 180);
    } catch (e) {
      console.warn('Audio play blocked or unsupported by browser policies');
    }
  };

  const getOrderPrepTime = (order: any) => {
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

  const fetchOrders = () => {
    const mockActive = [
      // NEW ORDERS (8)
      {
        id: 'ko-101',
        source: 'QR',
        table: { tableNumber: 'Table 7' },
        status: 'NEW',
        notes: 'Spice: Medium',
        createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-1', quantity: 1, menuItem: { name: 'Pomfret Fry', price: 320 } },
          { id: 'koi-2', quantity: 4, menuItem: { name: 'Butter Roti', price: 20 } },
          { id: 'koi-3', quantity: 1, menuItem: { name: 'Jeera Rice (Half)', price: 120 } },
          { id: 'koi-4', quantity: 1, menuItem: { name: 'Mineral Water', price: 30 } },
          { id: 'koi-5', quantity: 1, menuItem: { name: 'Chicken Masala', price: 240 } }
        ]
      },
      {
        id: 'ko-102',
        source: 'QR',
        table: { tableNumber: 'Table 10' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-6', quantity: 2, menuItem: { name: 'Veg Crispy', price: 160 } },
          { id: 'koi-7', quantity: 1, menuItem: { name: 'Manchurian', price: 150 } },
          { id: 'koi-8', quantity: 2, menuItem: { name: 'Fried Rice', price: 140 } },
          { id: 'koi-9', quantity: 3, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-103',
        source: 'QR',
        table: { tableNumber: 'Table 12' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-10', quantity: 1, menuItem: { name: 'Chicken Kadai', price: 250 } },
          { id: 'koi-11', quantity: 3, menuItem: { name: 'Butter Roti', price: 20 } },
          { id: 'koi-12', quantity: 1, menuItem: { name: 'Soda', price: 30 } }
        ]
      },
      {
        id: 'ko-104',
        source: 'QR',
        table: { tableNumber: 'Table 15' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-13', quantity: 1, menuItem: { name: 'Fish Fry', price: 220 } },
          { id: 'koi-14', quantity: 1, menuItem: { name: 'Steam Rice', price: 90 } },
          { id: 'koi-15', quantity: 1, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-105',
        source: 'QR',
        table: { tableNumber: 'Table 16' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-16', quantity: 2, menuItem: { name: 'Garlic Bread', price: 99 } },
          { id: 'koi-17', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-106',
        source: 'QR',
        table: { tableNumber: 'Table 19' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-18', quantity: 1, menuItem: { name: 'Paneer Butter Masala', price: 260 } },
          { id: 'koi-19', quantity: 4, menuItem: { name: 'Butter Roti', price: 20 } }
        ]
      },
      {
        id: 'ko-107',
        source: 'QR',
        table: { tableNumber: 'Table 20' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-20', quantity: 1, menuItem: { name: 'French Fries', price: 90 } },
          { id: 'koi-21', quantity: 1, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-108',
        source: 'QR',
        table: { tableNumber: 'Table 21' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-22', quantity: 2, menuItem: { name: 'Cold Drink', price: 40 } }
        ]
      },

      // PREPARING ORDERS (8)
      {
        id: 'ko-109',
        source: 'QR',
        table: { tableNumber: 'Table 2' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-23', quantity: 2, menuItem: { name: 'Paneer Butter Masala', price: 260 } },
          { id: 'koi-24', quantity: 4, menuItem: { name: 'Butter Naan', price: 50 } },
          { id: 'koi-25', quantity: 2, menuItem: { name: 'Cold Drink', price: 40 } }
        ]
      },
      {
        id: 'ko-110',
        source: 'QR',
        table: { tableNumber: 'Table 3' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-26', quantity: 2, menuItem: { name: 'Chicken Biryani (Half)', price: 280 } },
          { id: 'koi-27', quantity: 2, menuItem: { name: 'Raita', price: 50 } },
          { id: 'koi-28', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-111',
        source: 'QR',
        table: { tableNumber: 'Table 5' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-29', quantity: 1, menuItem: { name: 'Margherita Pizza', price: 299 } },
          { id: 'koi-30', quantity: 1, menuItem: { name: 'Garlic Bread', price: 99 } },
          { id: 'koi-31', quantity: 1, menuItem: { name: 'Pepsi', price: 40 } }
        ]
      },
      {
        id: 'ko-112',
        source: 'QR',
        table: { tableNumber: 'Table 6' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-32', quantity: 2, menuItem: { name: 'Veg Crispy', price: 160 } },
          { id: 'koi-33', quantity: 1, menuItem: { name: 'Manchurian', price: 150 } },
          { id: 'koi-34', quantity: 1, menuItem: { name: 'Fried Rice', price: 140 } }
        ]
      },
      {
        id: 'ko-113',
        source: 'QR',
        table: { tableNumber: 'Table 11' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-35', quantity: 1, menuItem: { name: 'Veg Pulao', price: 180 } },
          { id: 'koi-36', quantity: 1, menuItem: { name: 'Raita', price: 50 } },
          { id: 'koi-37', quantity: 1, menuItem: { name: 'Sprite', price: 40 } }
        ]
      },
      {
        id: 'ko-114',
        source: 'QR',
        table: { tableNumber: 'Table 13' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-38', quantity: 1, menuItem: { name: 'Veg Noodles', price: 160 } },
          { id: 'koi-39', quantity: 2, menuItem: { name: 'Spring Roll', price: 90 } },
          { id: 'koi-40', quantity: 1, menuItem: { name: 'Pepsi', price: 40 } }
        ]
      },
      {
        id: 'ko-115',
        source: 'QR',
        table: { tableNumber: 'Table 14' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-41', quantity: 1, menuItem: { name: 'Paneer Kadai', price: 240 } },
          { id: 'koi-42', quantity: 2, menuItem: { name: 'Butter Naan', price: 50 } },
          { id: 'koi-43', quantity: 1, menuItem: { name: 'Lassi', price: 60 } }
        ]
      },
      {
        id: 'ko-116',
        source: 'QR',
        table: { tableNumber: 'Table 18' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-44', quantity: 2, menuItem: { name: 'Margherita Pizza', price: 299 } },
          { id: 'koi-45', quantity: 3, menuItem: { name: 'Coke', price: 40 } }
        ]
      },

      // READY ORDERS (4)
      {
        id: 'ko-117',
        source: 'QR',
        table: { tableNumber: 'Table 4' },
        status: 'READY',
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-46', quantity: 2, menuItem: { name: 'Chicken Biryani (Full)', price: 280 } },
          { id: 'koi-47', quantity: 2, menuItem: { name: 'Raita', price: 50 } },
          { id: 'koi-48', quantity: 2, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      },
      {
        id: 'ko-118',
        source: 'QR',
        table: { tableNumber: 'Table 8' },
        status: 'READY',
        createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-49', quantity: 1, menuItem: { name: 'Chicken Handi (Full)', price: 240 } },
          { id: 'koi-50', quantity: 1, menuItem: { name: 'Jeera Rice (Full)', price: 120 } },
          { id: 'koi-51', quantity: 1, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      },
      {
        id: 'ko-119',
        source: 'QR',
        table: { tableNumber: 'Table 9' },
        status: 'READY',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-52', quantity: 2, menuItem: { name: 'Cheese Burger', price: 140 } },
          { id: 'koi-53', quantity: 2, menuItem: { name: 'French Fries', price: 90 } },
          { id: 'koi-54', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-120',
        source: 'QR',
        table: { tableNumber: 'Table 17' },
        status: 'READY',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        items: [
          { id: 'koi-55', quantity: 1, menuItem: { name: 'Chicken Biryani (Half)', price: 280 } },
          { id: 'koi-56', quantity: 1, menuItem: { name: 'Salan', price: 40 } },
          { id: 'koi-57', quantity: 1, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      }
    ];
    setOrders(mockActive);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string, estTime?: number) => {
    try {
      await apiRequest(`/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus,
          estimatedPrepTime: estTime
        })
      });
    } catch (err) {
      console.warn('API sync failed, using frontend state update.');
    }

    // Instantly transition local React state
    setOrders(prev => {
      const matched = prev.find(o => o.id === orderId);
      if (!matched) return prev;

      if (nextStatus === 'READY') {
        playAlertSound();
        const table = matched.table?.tableNumber || 'Takeaway';
        const orderShort = orderId.slice(-4).toUpperCase();
        setActiveReadyAlert({ table, orderId: orderShort });
        setTimeout(() => setActiveReadyAlert(null), 4000); // Disappear after 4 seconds
      }

      return prev.map(o => {
        if (o.id === orderId) {
          const updated: any = {
            ...o,
            status: nextStatus,
            estimatedPrepTime: estTime || o.estimatedPrepTime
          };
          if (nextStatus === 'ACCEPTED') {
            updated.acceptedAt = new Date().toISOString();
          } else if (nextStatus === 'PREPARING') {
            updated.preparingAt = new Date().toISOString();
          } else if (nextStatus === 'READY') {
            updated.readyAt = new Date().toISOString();
          }
          return updated;
        }
        return o;
      });
    });
  };

  // SSE Realtime Updates Handler
  useEffect(() => {
    fetchOrders();

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    console.log('[KDS SSE] Connecting to', sseUrl);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('[KDS SSE] Event received:', payload);

        if (payload.type === 'NEW_ORDER') {
          const newOrder = payload.data;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            playAlertSound();
            // Highlight row and trigger banner
            setNewOrderBanner(newOrder);
            setNewOrderAnimationIds(ani => [...ani, newOrder.id]);
            setTimeout(() => {
              setNewOrderAnimationIds(ani => ani.filter(id => id !== newOrder.id));
            }, 6000);
            return [newOrder, ...prev];
          });
        }
      } catch (err) {
        console.error('[KDS SSE] Error handling message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[KDS SSE] Connection error:', err);
    };

    // Live update cooking timer (McDonald's style ticks every second)
    const intervalId = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);

    return () => {
      eventSource.close();
      clearInterval(intervalId);
    };
  }, []);

  // Play sound ONCE immediately and show toast only when a new order arrives
  useEffect(() => {
    if (newCount > lastNewCount) {
      playAlertSound();
      showToast('New Orders Waiting', `${newCount} Orders Awaiting Cooking`, 'info', 7000);
    }
    setLastNewCount(newCount);
  }, [newCount, lastNewCount]);

  // Persistent new order audio alert reminder loop (plays reminder every 1 minute if not accepted)
  useEffect(() => {
    if (newCount > 0) {
      const soundInterval = setInterval(() => {
        playAlertSound();
        showToast('New Orders Waiting', `${newCount} Orders Awaiting Cooking`, 'info', 7000);
      }, 60000); // 1 minute
      return () => clearInterval(soundInterval);
    }
  }, [newCount]);

  // Automatically check for newly delayed orders and send DB updates
  useEffect(() => {
    orders.forEach(order => {
      if (order.status === 'ACCEPTED' || order.status === 'PREPARING') {
        const start = order.preparingAt || order.acceptedAt || order.createdAt;
        const diffMs = nowTime - new Date(start).getTime();
        const expectedMins = getOrderPrepTime(order);
        const isDelayed = diffMs > expectedMins * 60 * 1000;

        if (isDelayed && !delayedUploadedIds.includes(order.id)) {
          setDelayedUploadedIds(prev => [...prev, order.id]);
          const elapsedMins = Math.floor(diffMs / 60000);
          const updatedPrepTime = elapsedMins + 7;
          console.log(`[KDS] Order ${order.id} is delayed! Automatically updating estimated prep time to ${updatedPrepTime} Min`);
          handleUpdateStatus(order.id, order.status, updatedPrepTime);
        }
      }
    });
  }, [nowTime, orders, delayedUploadedIds]);


  // Cooking time format MM:SS
  const getCookingDurationString = (order: any) => {
    if (order.status !== 'PREPARING' && order.status !== 'ACCEPTED') return '--:--';
    const start = order.preparingAt || order.acceptedAt || order.createdAt;
    const diffMs = nowTime - new Date(start).getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOrderDelayed = (order: any) => {
    if (order.status === 'READY' || order.status === 'SERVED' || order.status === 'CANCELLED') return false;
    const start = order.preparingAt || order.acceptedAt || order.createdAt;
    const diffMs = nowTime - new Date(start).getTime();
    const expectedMins = getOrderPrepTime(order);
    return diffMs > expectedMins * 60 * 1000;
  };

  // Toggle expanded row state
  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Contextual live timer labels
  const getTimingLabel = (order: any) => {
    let timeDiff = 0;
    let label = 'Waiting Since';
    if (order.status === 'NEW') {
      timeDiff = nowTime - new Date(order.createdAt).getTime();
      label = 'Waiting Since';
    } else if (order.status === 'ACCEPTED' || order.status === 'PREPARING') {
      const start = order.preparingAt || order.acceptedAt || order.createdAt;
      timeDiff = nowTime - new Date(start).getTime();
      label = 'Cooking Since';
    } else if (order.status === 'READY') {
      const start = order.readyAt || order.preparingAt || order.acceptedAt || order.createdAt;
      timeDiff = nowTime - new Date(start).getTime();
      label = 'Ready Since';
    }
    const minutes = Math.max(0, Math.floor(timeDiff / 60000));
    return `${label}: ${minutes} Min`;
  };

  // Status badges & indicators matching the specific color guidelines
  const getStatusIndicator = (order: any) => {
    const isDelayed = isOrderDelayed(order);
    if (isDelayed) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-655 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/30 px-2.5 py-0.5 rounded-md">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          DELAYED
        </span>
      );
    }
    switch (order.status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-605 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/30 px-2.5 py-0.5 rounded-md">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            NEW
          </span>
        );
      case 'ACCEPTED':
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-955/40 border border-amber-200/60 dark:border-amber-900/30 px-2.5 py-0.5 rounded-md">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            PREPARING
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-md">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            READY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2.5 py-0.5 rounded-md">
            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
            SERVED
          </span>
        );
    }
  };

  const renderActionButtons = (order: any) => {
    switch (order.status) {
      case 'NEW':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(order.id, 'PREPARING');
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black py-2 px-3 rounded-lg text-xs tracking-wider transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1 w-full"
          >
            <Play className="w-3.5 h-3.5" />
            <span>START COOKING</span>
          </button>
        );
      case 'ACCEPTED':
      case 'PREPARING':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(order.id, 'READY');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-lg text-xs tracking-wider transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1 w-full"
          >
            <Check className="w-3.5 h-3.5" />
            <span>READY</span>
          </button>
        );
      default:
        return (
          <span className="text-slate-400 dark:text-slate-500 font-extrabold text-xs">COMPLETED</span>
        );
    }
  };

  // Grouping orders by tab status - newest orders always on top (descending created time)
  const filterOrdersByTab = () => {
    const sortedActive = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    switch (activeTab) {
      case 'NEW':
        return sortedActive.filter(o => o.status === 'NEW');
      case 'PREPARING':
        return sortedActive.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING');
      case 'READY':
        return sortedActive.filter(o => o.status === 'READY');
      default:
        return [];
    }
  };

  const displayedOrders = filterOrdersByTab();

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100 relative" style={{ fontFamily: "'Trebuchet MS', 'Inter', sans-serif" }}>
      {stylesInject}

      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border transition-all duration-350 transform translate-y-0 scale-100 flex flex-col gap-1.5 animate-bounce-in ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-orange-600 text-white border-orange-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[10px] uppercase tracking-wider opacity-90">
                {toast.type === 'success' ? 'Ready Alert' : 'New Order Alert'}
              </span>
              <span className="text-sm">🔔</span>
            </div>
            <div className="font-black text-sm">{toast.title}</div>
            <div className="text-xs opacity-90">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Flashing Ready Waiter Alert Overlay */}
      {activeReadyAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-emerald-600 text-white p-8 rounded-2xl shadow-2xl border border-emerald-400/50 text-center animate-bounce-in max-w-sm w-full space-y-4">
            <span className="text-5xl animate-bounce block">🛎️</span>
            <h2 className="text-2xl font-black uppercase tracking-tight">Order Ready</h2>
            <div className="border-t border-dashed border-emerald-400/50 my-2"></div>
            <p className="text-2xl font-black">{activeReadyAlert.table}</p>
            <p className="text-lg font-bold">Order #{activeReadyAlert.orderId}</p>
            <p className="text-sm text-emerald-100 font-semibold mt-2">Waiter Notified Successfully</p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-extrabold tracking-tight">KITCHEN WORKSPACE</h1>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
        </div>

        {/* KPI Insight Chips Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-slate-800 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-bold text-blue-400">
            New: {newCount}
          </span>
          <span className="bg-slate-800 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-bold text-amber-400">
            Preparing: {preparingCount}
          </span>
          <span className="bg-slate-800 border border-slate-700/60 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
            Ready: {readyCount}
          </span>
          <button
            onClick={playAlertSound}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1 rounded-lg text-xs font-black transition-all active:scale-[0.96] flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>BELL TEST</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors - Black Bold Titles */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
        {[
          { tabId: 'NEW', label: 'NEW', count: newCount },
          { tabId: 'PREPARING', label: 'PREPARING', count: preparingCount },
          { tabId: 'READY', label: 'READY', count: readyCount }
        ].map(t => (
          <button
            key={t.tabId}
            onClick={() => setActiveTab(t.tabId as any)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg text-base tracking-wider transition-all ${activeTab === t.tabId
                ? 'bg-white dark:bg-slate-700 shadow-sm text-black dark:text-white font-extrabold border-b-2 border-black dark:border-white'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-300 font-bold'
              }`}
          >
            <span className="text-black dark:text-white">{t.label}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-200 dark:bg-slate-800 text-black dark:text-white">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Kitchen Order Board */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {/* Table Header: Perfect Column Alignment, Bold Black Headers, Emojis removed */}
        <div className="grid grid-cols-[140px_130px_2.5fr_1.5fr_140px_160px] gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-extrabold uppercase text-slate-955 dark:text-white tracking-wider">
          <div>TABLE NUMBER</div>
          <div>ORDER NUMBER</div>
          <div>ORDERED ITEMS</div>
          <div>PREPARATION TIME</div>
          <div>STATUS</div>
          <div className="text-right font-extrabold">ACTION</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] p-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-850 dark:text-white" />
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">
            No orders currently in this section
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-750">
            {displayedOrders.map(order => {
              const isDelayed = isOrderDelayed(order);
              const isNew = newOrderAnimationIds.includes(order.id);
              const prepTimeVal = getOrderPrepTime(order);
              const isCooking = order.status === 'ACCEPTED' || order.status === 'PREPARING';

              return (
                <div
                  key={order.id}
                  className={`transition-all border-b border-slate-100 dark:border-slate-750 ${
                    isNew ? 'flash-row bg-blue-50/10 dark:bg-blue-900/5' : ''
                  } ${isDelayed ? 'delayed-border bg-red-50/5 dark:bg-red-950/5' : ''} ${
                    order.status === 'READY' ? 'ready-glow bg-emerald-50/5 dark:bg-emerald-950/5' : ''
                  } hover:bg-slate-50/50 dark:hover:bg-slate-800/30`}
                >
                  {/* Compact Main Row: Fixed Width Column Grid, Regular Data Weight */}
                  <div className="grid grid-cols-[140px_130px_2.5fr_1.5fr_140px_160px] gap-4 p-4 items-center text-slate-900 dark:text-slate-100 font-normal">
                    {/* TABLE NUMBER - Medium font size, Regular weight, Black color */}
                    <div className="text-base text-slate-900 dark:text-white">
                      {order.table?.tableNumber || 'Takeaway'}
                    </div>

                    {/* ORDER NUMBER - Regular weight, Black color */}
                    <div className="text-sm text-slate-900 dark:text-slate-355 font-mono">
                      #{order.id.slice(-4).toUpperCase()}
                    </div>

                    {/* ORDERED ITEMS - Items directly shown with proper format: Dish Name – Qty X */}
                    <div className="text-sm text-slate-900 dark:text-slate-200 space-y-1.5">
                      {order.items.map((it: any, index: number) => (
                        <div key={it.id || index} className="font-semibold text-slate-800 dark:text-slate-200">
                          {it.menuItem?.name || 'Dish'} – Qty {it.quantity}
                          {it.notes && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold italic ml-2 block">
                              ↳ Notes: "{it.notes}"
                            </span>
                          )}
                        </div>
                      ))}
                      {order.notes && (
                        <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-100/35 dark:border-amber-900/20 p-2 rounded-lg mt-1 text-xs">
                          <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Special Instructions:
                          </span>
                          <p className="font-semibold text-amber-855 dark:text-amber-300">
                            "{order.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* PREPARATION TIME / TIMER STATUS */}
                    <div className="text-xs text-slate-900 dark:text-slate-350 space-y-0.5">
                      <div>{getTimingLabel(order)}</div>
                      {isCooking && (
                        <div className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                          Cooking: {getCookingDurationString(order)}
                        </div>
                      )}
                      {order.status !== 'READY' && (
                        <div className={isDelayed ? 'text-red-650 dark:text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
                          Expected: {prepTimeVal} Min
                        </div>
                      )}
                    </div>

                    {/* STATUS */}
                    <div>
                      {getStatusIndicator(order)}
                    </div>

                    {/* ACTION */}
                    <div className="text-right flex items-center justify-end">
                      {renderActionButtons(order)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const stylesInject = (
  <style dangerouslySetInnerHTML={{
    __html: `
    @keyframes flash-highlight {
      0% { background-color: rgba(59, 130, 246, 0.25); }
      100% { background-color: transparent; }
    }
    .flash-row {
      animation: flash-highlight 3s ease-out forwards;
    }
    @keyframes bounce-in-pop {
      0% { transform: scale(0.9); opacity: 0; }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-bounce-in {
      animation: bounce-in-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes blink-border {
      0% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 4px rgba(239, 68, 68, 0.1); }
      50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 12px rgba(239, 68, 68, 0.3); }
      100% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 4px rgba(239, 68, 68, 0.1); }
    }
    .delayed-border {
      animation: blink-border 2s infinite;
      border: 2px solid rgb(239, 68, 68) !important;
    }
    @keyframes ready-soft-glow {
      0% { box-shadow: 0 0 6px rgba(16, 185, 129, 0.1); }
      50% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
      100% { box-shadow: 0 0 6px rgba(16, 185, 129, 0.1); }
    }
    .ready-glow {
      animation: ready-soft-glow 3s infinite;
      border-left: 4px solid rgb(16, 185, 129) !important;
    }
    @keyframes slide-banner-in {
      0% { transform: translate(-50%, -40px); opacity: 0; }
      100% { transform: translate(-50%, 0); opacity: 1; }
    }
    .animate-banner-slide-persistent {
      animation: slide-banner-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}} />
);

export default KitchenDisplay;
