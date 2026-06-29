import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Play,
  Check,
  Bell,
  Server,
  Plus
} from 'lucide-react';

// Define Interfaces
interface RequestItem {
  productName: string;
  quantity: number | string;
  unit: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  rating?: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: 'Draft' | 'Pending' | 'Sent' | 'Confirmed' | 'Delivered' | 'Received';
  expectedDeliveryDate: string;
  totalAmount: number;
  paymentStatus: string;
  whatsappSentAt?: string;
  emailSentAt?: string;
  createdAt: string;
  items?: any;
  supplier?: Supplier;
}

interface StockRequest {
  id: string;
  requestNo: string;
  requestedBy: string;
  status: 'Pending' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted';
  createdAt: string;
  items: RequestItem[];
  approvedAt?: string;
  convertedAt?: string;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  createdBy?: string;
}

export const KitchenDisplay: React.FC = () => {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAnimationIds, setNewOrderAnimationIds] = useState<string[]>([]);
  const [nowTime, setNowTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('filter');
    if (tabParam === 'PREPARING' || tabParam === 'ACCEPTED') return 'PREPARING';
    if (tabParam === 'READY') return 'READY';
    if (tabParam === 'COMPLETED') return 'COMPLETED';
    return 'NEW';
  });
  const [activeReadyAlert, setActiveReadyAlert] = useState<{ table: string; orderId: string } | null>(null);
  const [delayedUploadedIds, setDelayedUploadedIds] = useState<string[]>([]);
  const [lastNewCount, setLastNewCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' }[]>([]);
  const [stockRequests, setStockRequests] = useState<any[]>([]);
  if (false) {
    console.log(stockRequests.length);
  }

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
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

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

  const handleSeedDummyOrders = async () => {
    try {
      await apiRequest('/restaurant/seed-ready-orders', {
        method: 'POST'
      });
      fetchOrders();
      showToast('Dummy Data Seeded', 'Seeded ready orders & new orders.', 'success');
    } catch (err) {
      console.warn('Failed to seed dummy data.');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await apiRequest('/restaurant/orders');
      if (Array.isArray(data) && data.length > 0) {
        setOrders(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch kitchen orders from API, using mock fallback data.');
    }

    const mockActive = [
      {
        id: 'ko-101',
        source: 'QR',
        table: { tableNumber: 'Table 1' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        waiter: { name: 'Rahul' },
        items: [
          { id: 'koi-1', quantity: 2, menuItem: { name: 'Fish Fry', price: 220 } },
          { id: 'koi-2', quantity: 4, menuItem: { name: 'Roti', price: 15 } },
          { id: 'koi-3', quantity: 1, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      },
      {
        id: 'ko-102',
        source: 'QR',
        table: { tableNumber: 'Table 2' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        waiter: { name: 'Rahul' },
        items: [
          { id: 'koi-4', quantity: 1, menuItem: { name: 'Paneer Tikka', price: 199 } },
          { id: 'koi-5', quantity: 3, menuItem: { name: 'Butter Naan', price: 40 } }
        ]
      },
      {
        id: 'ko-103',
        source: 'QR',
        table: { tableNumber: 'Table 3' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-6', quantity: 2, menuItem: { name: 'Chicken Biryani', price: 250 } },
          { id: 'koi-7', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-104',
        source: 'QR',
        table: { tableNumber: 'Table 4' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-8', quantity: 1, menuItem: { name: 'Veg Crispy', price: 160 } },
          { id: 'koi-9', quantity: 1, menuItem: { name: 'Manchurian', price: 150 } },
          { id: 'koi-10', quantity: 1, menuItem: { name: 'Veg Fried Rice', price: 140 } }
        ]
      },
      {
        id: 'ko-105',
        source: 'QR',
        table: { tableNumber: 'Table 5' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-11', quantity: 2, menuItem: { name: 'Pomfret Fry', price: 320 } },
          { id: 'koi-12', quantity: 1, menuItem: { name: 'Jeera Rice Full', price: 120 } }
        ]
      },
      {
        id: 'ko-106',
        source: 'QR',
        table: { tableNumber: 'Table 6' },
        status: 'NEW',
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-13', quantity: 2, menuItem: { name: 'Garlic Bread', price: 99 } },
          { id: 'koi-14', quantity: 2, menuItem: { name: 'Sprite', price: 40 } }
        ]
      },
      {
        id: 'ko-107',
        source: 'QR',
        table: { tableNumber: 'Table 7' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-15', quantity: 1, menuItem: { name: 'Chicken Kadai', price: 240 } },
          { id: 'koi-16', quantity: 4, menuItem: { name: 'Butter Roti', price: 20 } },
          { id: 'koi-17', quantity: 2, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      },
      {
        id: 'ko-108',
        source: 'QR',
        table: { tableNumber: 'Table 8' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-18', quantity: 2, menuItem: { name: 'Veg Fried Rice', price: 140 } },
          { id: 'koi-19', quantity: 2, menuItem: { name: 'Sprite', price: 40 } }
        ]
      },
      {
        id: 'ko-109',
        source: 'QR',
        table: { tableNumber: 'Table 9' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        waiter: { name: 'Rahul' },
        items: [
          { id: 'koi-20', quantity: 1, menuItem: { name: 'Margherita Pizza', price: 299 } },
          { id: 'koi-21', quantity: 2, menuItem: { name: 'Pepsi', price: 40 } }
        ]
      },
      {
        id: 'ko-110',
        source: 'QR',
        table: { tableNumber: 'Table 10' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-22', quantity: 1, menuItem: { name: 'Paneer Butter Masala', price: 220 } },
          { id: 'koi-23', quantity: 3, menuItem: { name: 'Butter Naan', price: 40 } },
          { id: 'koi-24', quantity: 1, menuItem: { name: 'Lassi', price: 60 } }
        ]
      },
      {
        id: 'ko-111',
        source: 'QR',
        table: { tableNumber: 'Table 11' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-25', quantity: 2, menuItem: { name: 'Hakka Noodles', price: 150 } },
          { id: 'koi-26', quantity: 2, menuItem: { name: 'Sprite', price: 40 } }
        ]
      },
      {
        id: 'ko-112',
        source: 'QR',
        table: { tableNumber: 'Table 12' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        waiter: { name: 'Adesh' },
        items: [
          { id: 'koi-27', quantity: 2, menuItem: { name: 'Cheese Burger', price: 140 } },
          { id: 'koi-28', quantity: 2, menuItem: { name: 'French Fries', price: 90 } },
          { id: 'koi-29', quantity: 2, menuItem: { name: 'Coke', price: 40 } }
        ]
      },
      {
        id: 'ko-113',
        source: 'QR',
        table: { tableNumber: 'Table 13' },
        status: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        waiter: { name: 'Rahul' },
        items: [
          { id: 'koi-30', quantity: 1, menuItem: { name: 'Prawns Masala', price: 280 } },
          { id: 'koi-31', quantity: 2, menuItem: { name: 'Butter Naan', price: 40 } }
        ]
      },
      {
        id: 'ko-114',
        source: 'QR',
        table: { tableNumber: 'Table 14' },
        status: 'READY',
        createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-32', quantity: 1, menuItem: { name: 'Hakka Noodles', price: 150 } },
          { id: 'koi-33', quantity: 1, menuItem: { name: 'Manchurian', price: 150 } }
        ]
      },
      {
        id: 'ko-115',
        source: 'QR',
        table: { tableNumber: 'Table 15' },
        status: 'READY',
        createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-34', quantity: 1, menuItem: { name: 'Paneer Tikka', price: 199 } },
          { id: 'koi-35', quantity: 2, menuItem: { name: 'Lassi', price: 60 } }
        ]
      },
      {
        id: 'ko-116',
        source: 'QR',
        table: { tableNumber: 'Table 16' },
        status: 'READY',
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        waiter: { name: 'Adesh' },
        items: [
          { id: 'koi-36', quantity: 2, menuItem: { name: 'Chicken Burger', price: 160 } },
          { id: 'koi-37', quantity: 1, menuItem: { name: 'French Fries', price: 90 } },
          { id: 'koi-38', quantity: 1, menuItem: { name: 'Pepsi', price: 40 } }
        ]
      },
      {
        id: 'ko-117',
        source: 'QR',
        table: { tableNumber: 'Table 17' },
        status: 'READY',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        waiter: { name: 'Rahul' },
        items: [
          { id: 'koi-39', quantity: 1, menuItem: { name: 'Veg Fried Rice', price: 140 } },
          { id: 'koi-40', quantity: 1, menuItem: { name: 'Manchurian', price: 150 } }
        ]
      },
      {
        id: 'ko-118',
        source: 'QR',
        table: { tableNumber: 'Table 18' },
        status: 'READY',
        createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        waiter: { name: 'Akshay' },
        items: [
          { id: 'koi-41', quantity: 1, menuItem: { name: 'Margherita Pizza', price: 299 } },
          { id: 'koi-42', quantity: 1, menuItem: { name: 'Garlic Bread', price: 99 } },
          { id: 'koi-43', quantity: 1, menuItem: { name: 'Sprite', price: 40 } }
        ]
      },
      {
        id: 'ko-119',
        source: 'QR',
        table: { tableNumber: 'Table 19' },
        status: 'READY',
        createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        waiter: { name: 'Ritesh' },
        items: [
          { id: 'koi-44', quantity: 1, menuItem: { name: 'Pomfret Fry', price: 320 } },
          { id: 'koi-45', quantity: 1, menuItem: { name: 'Jeera Rice Full', price: 120 } }
        ]
      },
      {
        id: 'ko-120',
        source: 'QR',
        table: { tableNumber: 'Table 20' },
        status: 'READY',
        createdAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
        waiter: { name: 'Adesh' },
        items: [
          { id: 'koi-46', quantity: 1, menuItem: { name: 'Chicken Kadai', price: 240 } },
          { id: 'koi-47', quantity: 2, menuItem: { name: 'Butter Naan', price: 40 } },
          { id: 'koi-48', quantity: 1, menuItem: { name: 'Water Bottle', price: 20 } }
        ]
      }
    ];
    setOrders(mockActive);
    setLoading(false);
  };

  // Generate 25 realistic dummy requests
  const generateDummyRequests = (): StockRequest[] => {
    const itemsPool = [
      { name: 'Tomato', unit: 'Kg' },
      { name: 'Onion', unit: 'Kg' },
      { name: 'Cheese', unit: 'Kg' },
      { name: 'Paneer', unit: 'Kg' },
      { name: 'Oil', unit: 'Liter' },
      { name: 'Milk', unit: 'Liter' },
      { name: 'Butter', unit: 'Kg' },
      { name: 'Rice', unit: 'Kg' },
      { name: 'Garlic', unit: 'Kg' },
      { name: 'Ginger', unit: 'Kg' },
      { name: 'Capsicum', unit: 'Kg' },
      { name: 'Salt', unit: 'Kg' }
    ];

    const roles = ['Kitchen Manager', 'Chef Adesh', 'Kitchen Staff', 'Sous Chef Rohan'];
    const statuses: ('Pending Approval' | 'Approved' | 'Converted')[] = ['Pending Approval', 'Approved', 'Converted'];
    const baseRequests: StockRequest[] = [];

    const now = new Date();

    for (let i = 1; i <= 25; i++) {
      const status = statuses[i % 3];
      const dateOffsetDays = i;
      const createdAt = new Date(now.getTime() - dateOffsetDays * 6 * 3600 * 1000);
      
      const itemsCount = 1 + (i % 4);
      const itemsList: RequestItem[] = [];
      for (let j = 0; j < itemsCount; j++) {
        const itemObj = itemsPool[(i + j) % itemsPool.length];
        const qty = 5 + ((i * j * 3) % 45);
        itemsList.push({
          productName: itemObj.name,
          quantity: qty,
          unit: itemObj.unit,
          notes: j === 0 ? 'Urgent reorder for weekend rush.' : ''
        });
      }

      baseRequests.push({
        id: `dummy-req-${i}`,
        requestNo: `KR-2026-${String(100 + i).padStart(3, '0')}`,
        requestedBy: roles[i % roles.length],
        status,
        createdAt: createdAt.toISOString(),
        items: itemsList,
        approvedAt: status !== 'Pending Approval' ? new Date(createdAt.getTime() + 45 * 60 * 1000).toISOString() : undefined,
        convertedAt: status === 'Converted' ? new Date(createdAt.getTime() + 2 * 3600 * 1000).toISOString() : undefined,
        purchaseOrder: status === 'Converted' ? {
          id: `dummy-po-${i}`,
          orderNumber: `PO-2026-${String(200 + i).padStart(3, '0')}`,
          status: i % 2 === 0 ? 'Sent' : 'Delivered',
          expectedDeliveryDate: new Date(createdAt.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
          totalAmount: 1500 + (i * 250),
          paymentStatus: i % 2 === 0 ? 'Pending' : 'Paid',
          whatsappSentAt: new Date(createdAt.getTime() + 3 * 3600 * 1000).toISOString(),
          emailSentAt: new Date(createdAt.getTime() + 3.5 * 3600 * 1000).toISOString(),
          createdAt: new Date(createdAt.getTime() + 2 * 3600 * 1000).toISOString(),
          items: itemsList.map(it => ({ ...it, purchasePrice: 120 })),
          supplier: {
            id: `dummy-sup-${i}`,
            name: i % 2 === 0 ? 'ABC Traders' : 'XYZ Foods',
            contactPerson: i % 2 === 0 ? 'Amit Patel' : 'Rahul Sharma',
            mobile: i % 2 === 0 ? '9123456789' : '9876543210',
            email: i % 2 === 0 ? 'orders@abctraders.com' : 'sales@xyzfoods.com',
            rating: i % 2 === 0 ? 4.8 : 4.2
          }
        } : undefined
      });
    }

    return baseRequests;
  };

  // Fetch Stock Requests list
  const fetchStockRequests = async () => {
    try {
      const res = await apiRequest('/suppliers/kitchen-requests');
      const dbRequests = Array.isArray(res) ? res : [];
      const dbRequestNos = new Set(dbRequests.map(r => r.requestNo));
      const dummyRequests = generateDummyRequests().filter(r => !dbRequestNos.has(r.requestNo));
      
      const finalRequests = [...dbRequests, ...dummyRequests];
      finalRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setStockRequests(finalRequests);
    } catch (e) {
      console.warn('Failed to fetch stock requests list.');
      const dummyRequests = generateDummyRequests();
      dummyRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setStockRequests(dummyRequests);
    }
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

  // Listen to URL search parameters for tab selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('filter') || params.get('status');
    if (tabParam === 'PREPARING' || tabParam === 'ACCEPTED') {
      setActiveTab('PREPARING');
    } else if (tabParam === 'READY') {
      setActiveTab('READY');
    } else if (tabParam === 'COMPLETED') {
      setActiveTab('COMPLETED');
    } else if (tabParam === 'NEW') {
      setActiveTab('NEW');
    }
  }, [window.location.search]);

  // SSE Realtime Updates Handler
  useEffect(() => {
    fetchOrders();
    fetchStockRequests();

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    console.log('[KDS SSE] Connecting to', sseUrl);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('[KDS SSE] Event received:', payload);
        fetchOrders();
        fetchStockRequests();

        if (payload.type === 'NEW_ORDER') {
          const newOrder = payload.data;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            playAlertSound();
            showToast('New Order Arrived', `Table: ${newOrder.table?.tableNumber || 'Takeaway'}`, 'info');
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

  // Listen to mutation event
  useEffect(() => {
    const handleMutation = () => {
      fetchStockRequests();
    };
    window.addEventListener('stock-request-mutated', handleMutation);
    return () => {
      window.removeEventListener('stock-request-mutated', handleMutation);
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
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-[36px] px-4 rounded-xl text-[14px] tracking-wider transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 w-full cursor-pointer"
          >
            <Play className="w-4 h-4" />
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-[36px] px-4 rounded-xl text-[14px] tracking-wider transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 w-full cursor-pointer"
          >
            <Check className="w-4 h-4" />
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
      case 'COMPLETED':
        return sortedActive.filter(o => o.status === 'COMPLETED');
      default:
        return [];
    }
  };

  const displayedOrders = filterOrdersByTab();

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 relative max-w-7xl mx-auto p-4 select-none" style={{ fontFamily: "'Trebuchet MS', 'Inter', sans-serif" }}>
      {stylesInject}

      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border transition-all duration-350 transform translate-y-0 scale-100 flex flex-col gap-1.5 animate-bounce-in ${toast.type === 'success'
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

      {/* SECTION 1: Kitchen Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-extrabold tracking-tight">KITCHEN WORKSPACE</h1>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/restaurant/inventory-requests')}
            className="bg-emerald-650 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition-all active:scale-[0.96] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CREATE REQUEST</span>
          </button>
          <button
            onClick={() => navigate('/restaurant/suppliers?tab=requests')}
            className="bg-purple-650 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition-all active:scale-[0.96] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>VIEW SOURCING REQUESTS</span>
          </button>
          <button
            onClick={playAlertSound}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition-all active:scale-[0.96] flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>BELL TEST</span>
          </button>
          <button
            onClick={handleSeedDummyOrders}
            className="bg-blue-650 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-black transition-all active:scale-[0.96] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>SEED DATA</span>
          </button>
        </div>
      </div>


      {/* SECTION 3: Kitchen Orders Area */}
      <div className="space-y-4">
        <h2 className="text-[18px] font-medium text-black dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Kitchen Orders</h2>
        
        {/* Tab Selectors - Black Bold Titles */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
          {[
            { tabId: 'NEW', label: 'NEW', count: newCount },
            { tabId: 'PREPARING', label: 'PREPARING', count: preparingCount },
            { tabId: 'READY', label: 'READY', count: readyCount },
            { tabId: 'COMPLETED', label: 'COMPLETED', count: completedCount }
          ].map(t => (
            <button
              key={t.tabId}
              onClick={() => setActiveTab(t.tabId as any)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg text-base tracking-wider transition-all cursor-pointer ${activeTab === t.tabId
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
            <div className="divide-y divide-slate-100 dark:divide-slate-750">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[140px_130px_2.5fr_1.5fr_140px_160px] gap-4 p-4 items-center animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4.5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                  <div className="text-right flex justify-end">
                    <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold">
              No orders currently in this section
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-750 text-left">
              {displayedOrders.map(order => {
                const isDelayed = isOrderDelayed(order);
                const isNew = newOrderAnimationIds.includes(order.id);
                const prepTimeVal = getOrderPrepTime(order);
                const isCooking = order.status === 'ACCEPTED' || order.status === 'PREPARING';

                return (
                  <div
                    key={order.id}
                    className={`transition-all border-b border-slate-100 dark:border-slate-750 ${isNew ? 'flash-row bg-blue-50/10 dark:bg-blue-900/5' : ''
                      } ${isDelayed ? 'delayed-border bg-red-50/5 dark:bg-red-950/5' : ''} ${order.status === 'READY' ? 'ready-glow bg-emerald-50/5 dark:bg-emerald-950/5' : ''
                      } hover:bg-slate-50/50 dark:hover:bg-slate-800/30`}
                  >
                    {/* Compact Main Row */}
                    <div className="grid grid-cols-[140px_130px_2.5fr_1.5fr_140px_160px] gap-4 p-4 items-center text-slate-900 dark:text-slate-100 font-normal">
                      
                      <div className="text-base text-black font-extrabold">
                        <div className="text-black uppercase">
                          TABLE T{order.table?.tableNumber ? order.table.tableNumber.replace(/\D/g, '') : 'Takeaway'}
                        </div>
                        <div className="text-xs text-black font-bold mt-1 uppercase">
                          WAITER: {order.waiter?.name ? order.waiter.name.toUpperCase() : 'UNASSIGNED'}
                        </div>
                      </div>

                      <div className="text-[16px] text-black font-mono font-bold">
                        #{order.id.slice(-4).toUpperCase()}
                      </div>

                      <div className="text-[14px] text-black space-y-1.5 font-semibold">
                        {order.items.map((it: any, index: number) => {
                          const match = it.notes?.match(/^\[(KOT-\d+)\]/);
                          const kotBadge = match ? match[1] : null;
                          const cleanNotes = match ? it.notes.replace(/^\[KOT-\d+\]\s*/, '') : it.notes;
                          return (
                            <div key={it.id || index} className="text-black font-extrabold text-[14px] flex flex-col">
                              <div className="flex items-center gap-2">
                                {kotBadge && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {kotBadge}
                                  </span>
                                )}
                                <span>{it.menuItem?.name || 'Dish'} Qty {it.quantity}</span>
                              </div>
                              {cleanNotes && (
                                <span className="text-xs text-amber-605 font-bold italic ml-2 block">
                                  ↳ Notes: "{cleanNotes}"
                                </span>
                              )}
                            </div>
                          );
                        })}
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

                      <div>
                        {getStatusIndicator(order)}
                      </div>

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
    @keyframes slide-in-right {
      0% { transform: translateX(100%); }
      100% { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 5px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
  `}} />
);

export default KitchenDisplay;
