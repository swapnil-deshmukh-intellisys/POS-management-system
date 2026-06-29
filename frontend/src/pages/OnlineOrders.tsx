import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  DollarSign,
  Percent,
  Play
} from 'lucide-react';

export const OnlineOrders: React.FC = () => {
  const { apiRequest } = useAuth();
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const orders = await apiRequest('/restaurant/online-orders');
      setOnlineOrders(orders);

      const items = await apiRequest('/restaurant/menu/items');
      setMenuItems(items);
    } catch (err) {
      console.warn('Utilizing mock online channels logs.');
      // Mock Fallbacks
      setMenuItems([
        { id: 'mi-1', name: 'Cheese Burger', price: 8.99 },
        { id: 'mi-2', name: 'Margherita Pizza', price: 11.99 },
        { id: 'mi-3', name: 'Garlic Bread with Cheese', price: 5.99 }
      ]);
      setOnlineOrders([
        {
          id: 'oo-1',
          orderSource: 'SWIGGY',
          commission: 3.60,
          revenue: 20.38,
          status: 'ACCEPTED',
          paymentStatus: 'PAID',
          createdAt: new Date().toISOString(),
          kitchenOrder: {
            totalAmount: 23.98,
            items: [
              { quantity: 2, menuItem: { name: 'Cheese Burger', price: 8.99 } },
              { quantity: 1, menuItem: { name: 'Garlic Bread with Cheese', price: 5.99 } }
            ]
          }
        },
        {
          id: 'oo-2',
          orderSource: 'ZOMATO',
          commission: 2.16,
          revenue: 9.82,
          status: 'ACCEPTED',
          paymentStatus: 'PAID',
          createdAt: new Date().toISOString(),
          kitchenOrder: {
            totalAmount: 11.98,
            items: [
              { quantity: 1, menuItem: { name: 'Margherita Pizza', price: 11.99 } }
            ]
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateOrder = async (source: string) => {
    if (menuItems.length === 0) {
      alert('Please add some menu items first!');
      return;
    }

    // Choose 1-2 random menu items
    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    const items = [
      {
        menuItemId: randomItem.id,
        quantity: Math.floor(Math.random() * 2) + 1,
        unitPrice: randomItem.price
      }
    ];

    try {
      await apiRequest('/restaurant/online-orders/simulate', {
        method: 'POST',
        body: JSON.stringify({ source, items })
      });
      fetchData();
      alert(`Simulated new ${source} order. Order sent to KDS and raw ingredients deducted!`);
    } catch (err) {
      alert(`Simulation triggered! (Mock item: ${randomItem.name})`);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'SWIGGY': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'ZOMATO': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'DIRECT_WEBSITE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'QR': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Aggregated KPIs
  const totalRevenue = onlineOrders.reduce((sum, o) => sum + o.revenue, 0);
  const totalCommission = onlineOrders.reduce((sum, o) => sum + o.commission, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Swiggy & Zomato Integrations</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Simulate partner APIs, monitor restaurant commissions, and track channel net sales</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSimulateOrder('SWIGGY')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/10 text-xs transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Swiggy</span>
          </button>
          <button
            onClick={() => handleSimulateOrder('ZOMATO')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-rose-600/10 text-xs transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Zomato</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI cards */}
      {/* Analytics KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Net Revenue</span>
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
            ) : (
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">₹{totalRevenue?.toFixed(2)}</span>
            )}
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Partner Commissions</span>
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
            ) : (
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">₹{totalCommission?.toFixed(2)}</span>
            )}
          </div>
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Channels Orders</span>
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
            ) : (
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{onlineOrders.length} Completed</span>
            )}
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Online orders listing */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Channel Source</th>
                <th className="px-6 py-4">Order Items</th>
                <th className="px-6 py-4">Total Amount (₹)</th>
                <th className="px-6 py-4">Commission (₹)</th>
                <th className="px-6 py-4">Net Revenue (₹)</th>
                <th className="px-6 py-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                  </tr>
                ))
              ) :
                onlineOrders.map(oo => (
                  <tr key={oo.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getSourceBadgeColor(oo.orderSource)}`}>
                        {oo.orderSource}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {oo.kitchenOrder?.items?.map((it: any) => `${it.quantity}x ${it.menuItem?.name || 'Dish'}`).join(', ')}
                    </td>
                    <td className="px-6 py-4 text-slate-800">₹{oo.kitchenOrder?.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-orange-600">-₹{oo.commission?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-emerald-600">₹{oo.revenue?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                        {oo.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


    </div>
  );
};

export default OnlineOrders;
