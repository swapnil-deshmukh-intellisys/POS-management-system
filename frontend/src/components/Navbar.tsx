import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, AlignLeft } from 'lucide-react';

interface NavbarProps {
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange }) => {
  const { apiRequest, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [categoryNotifications, setCategoryNotifications] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
    } catch {
      return [];
    }
  });
  const [seenAlertIds, setSeenAlertIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('seenInventoryAlerts') || '[]');
    } catch {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const previousAlertCountRef = useRef<number | null>(null);
  const totalNotificationCount = unreadCount + categoryNotifications.length;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    sessionStorage.setItem('globalSearchQuery', val);
    window.dispatchEvent(new CustomEvent('global-search', { detail: val }));
    if (onSearchChange) {
      onSearchChange(val);
    }
  };


  const playNotificationSound = () => {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioContext = new AudioContextCtor();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Browser may block sound until user interaction.
    }
  };

  const fetchInventoryAlerts = async () => {
    if (!isAuthenticated) return;
    try {
      const products = await apiRequest('/products');
      const inventoryInsights = await apiRequest('/dashboard/inventory-insights');

      // 1. Low stock alerts
      const stockAlerts = products
        .filter((product: any) => Number(product.quantity || 0) <= 10)
        .map((product: any) => {
          const quantity = Number(product.quantity || 0);
          const type = quantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
          return {
            id: product.id,
            name: product.name,
            quantity,
            unit: product.unit || 'PCS',
            type,
            status: type === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock',
            message: type === 'OUT_OF_STOCK' ? 'Product not available' : 'Low stock alert',
          };
        });

      // 2. Expiry alerts
      const now = Date.now();
      const expiryAlerts = products
        .filter((p: any) => p.expiryDate && !p.resolvedAt && !p.actionTaken)
        .map((p: any) => {
          const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30) {
            let urgency = 'INFO';
            let message = `Expires in ${daysLeft} days`;
            if (daysLeft < 0) {
              urgency = 'URGENT';
              message = `Expired ${Math.abs(daysLeft)} days ago`;
            } else if (daysLeft <= 3) {
              urgency = 'PERSISTENT';
              message = `Expires in ${daysLeft} days (Urgent)`;
            } else if (daysLeft <= 7) {
              urgency = 'HIGH';
              message = `Expires in ${daysLeft} days (High Priority)`;
            } else if (daysLeft <= 15) {
              urgency = 'DAILY';
              message = `Expires in ${daysLeft} days`;
            }
            return {
              id: p.id,
              name: p.name,
              type: 'EXPIRY',
              urgency,
              message,
              quantity: p.quantity,
              unit: p.unit || 'PCS',
            };
          }
          return null;
        })
        .filter(Boolean);

      const predictiveAlerts = (inventoryInsights?.smartInventoryAnalytics?.predictiveAlerts || [])
        .slice(0, 4)
        .map((message: string, index: number) => ({
          id: `smart-inventory-${index}`,
          name: 'Inventory Forecast',
          type: 'INVENTORY_INTELLIGENCE',
          urgency: index === 0 ? 'HIGH' : 'INFO',
          message,
          quantity: null,
          unit: '',
        }));

      const allAlerts = [...stockAlerts, ...expiryAlerts, ...predictiveAlerts].filter((alert: any) => !seenAlertIds.includes(alert.id));

      if (previousAlertCountRef.current !== null && allAlerts.length > previousAlertCountRef.current) {
        playNotificationSound();
      }

      previousAlertCountRef.current = allAlerts.length;
      setInventoryAlerts(allAlerts);
      setUnreadCount(allAlerts.length);
    } catch (error) {
      console.error('Failed to load inventory alerts:', error);
    }
  };

  useEffect(() => {
    fetchInventoryAlerts();
    const interval = window.setInterval(fetchInventoryAlerts, 30000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, seenAlertIds]);

  useEffect(() => {
    const loadCategoryNotifications = () => {
      try {
        setCategoryNotifications(JSON.parse(localStorage.getItem('categoryNotifications') || '[]'));
      } catch {
        setCategoryNotifications([]);
      }
    };

    window.addEventListener('storage', loadCategoryNotifications);
    window.addEventListener('category-notification-added', loadCategoryNotifications);
    return () => {
      window.removeEventListener('storage', loadCategoryNotifications);
      window.removeEventListener('category-notification-added', loadCategoryNotifications);
    };
  }, []);

  const openNotifications = () => {
    setShowNotifications((current) => !current);
  };

  const goToAlert = (alert: any) => {
    if (alert.type === 'EXPIRY' || alert.type === 'INVENTORY_INTELLIGENCE') {
      setShowNotifications(false);
      navigate(alert.type === 'EXPIRY' ? `/inventory?openExpiryId=${alert.id}` : '/inventory');
      return;
    }
    const viewedAlertIds = inventoryAlerts
      .filter((item) => item.type === alert.type)
      .map((item) => item.id);
    const nextSeenAlertIds = Array.from(new Set([...seenAlertIds, ...viewedAlertIds]));
    setSeenAlertIds(nextSeenAlertIds);
    localStorage.setItem('seenInventoryAlerts', JSON.stringify(nextSeenAlertIds));
    const remainingAlerts = inventoryAlerts.filter((item) => item.type !== alert.type);
    setInventoryAlerts(remainingAlerts);
    setShowNotifications(false);
    setUnreadCount(remainingAlerts.length);
    navigate(`/products?status=${alert.type}`);
  };

  const goToCategoryNotification = (notificationId: string) => {
    const nextNotifications = categoryNotifications.filter((notification) => notification.id !== notificationId);
    setCategoryNotifications(nextNotifications);
    localStorage.setItem('categoryNotifications', JSON.stringify(nextNotifications));
    setShowNotifications(false);
    navigate('/categories');
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 lg:left-64 lg:px-8">
      {/* Search Input bar & Menu */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6 lg:max-w-xl">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <AlignLeft className="w-5 h-5" />
        </button>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search for products, invoices, customers..."
            value={searchValue}
            onChange={handleSearch}
            className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl pl-12 pr-4 py-2.5 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600/50 focus:bg-white transition-all-300 font-sans"
          />
        </div>
      </div>
      {/* Control Widgets & profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={openNotifications}
            className="relative w-10 h-10 bg-[#f8fafc] border border-slate-200/80 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {totalNotificationCount > 0 ? (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse-subtle">
                {totalNotificationCount}
              </span>
            ) : null}
          </button>

          {showNotifications && totalNotificationCount > 0 ? (
            <div className="absolute right-0 top-[calc(100%+0.7rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
              <div className="max-h-80 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => goToCategoryNotification(notification.id)}
                    className="block w-full border-l-4 border-l-emerald-500 bg-white px-4 py-2.5 text-left transition-colors hover:bg-emerald-50"
                  >
                    <div className="text-sm font-bold text-slate-800">{notification.action}</div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-500">{notification.categoryName}</div>
                  </button>
                ))}
                {inventoryAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => goToAlert(alert)}
                    className={`block w-full bg-white px-4 py-2.5 text-left transition-colors hover:bg-slate-50 border-b border-slate-50 ${alert.type === 'INVENTORY_INTELLIGENCE'
                        ? 'border-l-4 border-l-emerald-500'
                        : alert.type === 'OUT_OF_STOCK'
                          ? 'border-l-4 border-l-red-600'
                          : alert.type === 'EXPIRY'
                            ? alert.urgency === 'URGENT'
                              ? 'border-l-4 border-l-red-800'
                              : alert.urgency === 'PERSISTENT'
                                ? 'border-l-4 border-l-red-500'
                                : alert.urgency === 'HIGH'
                                  ? 'border-l-4 border-l-orange-500'
                                  : 'border-l-4 border-l-amber-500'
                            : 'border-l-4 border-l-amber-500'
                      }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-slate-800">
                          {alert.name}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate mt-0.5">
                          {alert.message}
                        </span>
                      </div>
                      {alert.type !== 'EXPIRY' && alert.type !== 'INVENTORY_INTELLIGENCE' && (
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                          {alert.quantity} {alert.unit}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
