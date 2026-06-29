import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';


export const RestaurantReports: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await apiRequest(`/restaurant/reports?restaurantId=${user?.restaurantId || 'mock-id'}`);
      setReports(data);
    } catch (err) {
      console.warn('Utilizing mock reports dataset.');
      setReports({
        totalSales: 3420.50,
        tableRevenue: {
          'Table 1': 420.00,
          'Table 2': 1250.90,
          'Table 3': 850.20,
          'Table 4': 900.00
        },
        popularDishes: [
          { name: 'Cheese Burger', quantity: 42, revenue: 377.58 },
          { name: 'Margherita Pizza', quantity: 30, revenue: 359.70 },
          { name: 'Garlic Bread with Cheese', quantity: 24, revenue: 143.76 }
        ],
        swiggyRevenue: 980.20,
        zomatoRevenue: 850.50,
        waiters: [
          { name: 'David Smith', orders: 18, sales: 242.50 },
          { name: 'Sarah Jones', orders: 24, sales: 385.90 },
          { name: 'Alex Miller', orders: 12, sales: 154.20 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // P&L calculation
  const totalSales = reports?.totalSales || 0;
  const foodCost = totalSales * 0.32; // simulated 32% food cost
  const operationalCosts = 450.00; // simulated rent, electricity
  const netProfit = totalSales - foodCost - operationalCosts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Restaurant Performance Reports</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5 font-sans">Live business audits, table revenues, P&L ratios, and channel metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
          ) : (
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">₹{totalSales?.toFixed(2)}</span>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Cost of Goods</span>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
          ) : (
            <span className="text-xl font-extrabold text-orange-600 mt-1 block">₹{foodCost?.toFixed(2)}</span>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fixed Operating Costs</span>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
          ) : (
            <span className="text-xl font-extrabold text-slate-500 mt-1 block">₹{operationalCosts?.toFixed(2)}</span>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Profit Margin</span>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1"></div>
          ) : (
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block">₹{netProfit?.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Table revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Table Revenue Distribution</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-8 bg-slate-100 rounded animate-pulse w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reports && Object.entries(reports.tableRevenue || {}).map(([table, revenue]: any) => (
                <div key={table} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{table}</span>
                    <span>₹{revenue?.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (revenue / totalSales) * 100)}%` }}
                      className="bg-emerald-600 h-full rounded-full"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Popular Dishes sold</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-10 bg-slate-100 rounded animate-pulse w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reports?.popularDishes?.map((dish: any) => (
                <div key={dish.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{dish.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400">Qty: {dish.quantity} sold</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">₹{dish.revenue?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiter Stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Waitstaff contributions</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-8 bg-slate-100 rounded animate-pulse w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reports?.waiters?.map((w: any) => (
                <div key={w.name} className="flex justify-between items-center p-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{w.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400">{w.orders} orders processed</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-700">₹{w.sales?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Splits */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Third-Party Channels Net Shares</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div key={n} className="h-12 bg-slate-100 rounded animate-pulse w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-orange-50/20 border border-orange-100 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 font-sans">Swiggy Net Channel Sales</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">15% commission subtracted</p>
                </div>
                <span className="text-sm font-extrabold text-orange-600">₹{reports?.swiggyRevenue?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-rose-50/20 border border-rose-100 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 font-sans">Zomato Net Channel Sales</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">18% commission subtracted</p>
                </div>
                <span className="text-sm font-extrabold text-rose-600">₹{reports?.zomatoRevenue?.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default RestaurantReports;
