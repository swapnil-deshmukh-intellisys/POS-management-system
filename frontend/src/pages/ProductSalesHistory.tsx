import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, ChevronDown, History, Package, Tag, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fallbackHistory = {
  summary: {
    totalTrackedProducts: 48,
    bestCategory: 'Beverages',
    growth: '+18%',
    stockMovement: '2,840 units',
  },
  previousTopProducts: [
    { name: 'Cold Drinks', sales: 920, change: '+38%', stock: 42, lowStockPeriod: '2 days', expiryMovement: 'Stable', offerActivity: 'Summer refill offer', seasonalDemand: 'Summer +38%' },
    { name: 'Milk 1L', sales: 884, change: '+16%', stock: 60, lowStockPeriod: 'Tomorrow risk', expiryMovement: 'Fast expiry rotation', offerActivity: 'Morning dairy bundle', seasonalDemand: 'Daily staple' },
    { name: 'Umbrella', sales: 884, change: '+240%', stock: 18, lowStockPeriod: '4 days', expiryMovement: 'No expiry', offerActivity: 'No offer needed', seasonalDemand: 'Rainy +240%' },
    { name: 'Snacks', sales: 730, change: '+27%', stock: 50, lowStockPeriod: '6 days', expiryMovement: 'Stable', offerActivity: 'Weekend combo', seasonalDemand: 'Weekend +27%' },
  ],
  charts: [
    { label: 'Sales increase', value: 78 },
    { label: 'Stock movement', value: 64 },
    { label: 'Offer impact', value: 52 },
    { label: 'Seasonal demand', value: 86 },
  ],
  timeline: [
    { title: 'Previous top selling products', detail: 'Cold Drinks, Milk 1L, and Umbrella shared the highest demand window.', type: 'sales' },
    { title: 'Stock movement history', detail: 'Umbrella stock dropped from 72 to 18 units after rainy demand.', type: 'stock' },
    { title: 'Offer activity history', detail: 'Snacks bundle increased night purchases by 27%.', type: 'offer' },
    { title: 'Expiry movement history', detail: 'Milk was moved faster through morning sales to reduce expiry risk.', type: 'expiry' },
  ],
};

export const ProductSalesHistory: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [historyData, setHistoryData] = useState<any>(fallbackHistory);
  const [expandedProduct, setExpandedProduct] = useState<string | null>('Cold Drinks');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await auth.apiRequest('/analytics/product-history/');
        setHistoryData({
          ...fallbackHistory,
          ...response,
          previousTopProducts: response?.previousTopProducts?.map((product: any) => ({
            lowStockPeriod: product.stock <= 25 ? '4 days' : 'Stable',
            expiryMovement: product.name?.includes('Milk') ? 'Fast expiry rotation' : 'Stable',
            offerActivity: product.name?.includes('Snacks') ? 'Weekend combo' : 'Review pricing',
            seasonalDemand: product.change,
            ...product,
          })) || fallbackHistory.previousTopProducts,
        });
      } catch {
        setHistoryData(fallbackHistory);
      }
    };

    loadHistory();
  }, [auth]);

  const compactStats = useMemo(() => [
    { label: 'Tracked', value: historyData.summary?.totalTrackedProducts || 0, icon: Package, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Best Category', value: historyData.summary?.bestCategory || 'Beverages', icon: TrendingUp, color: 'text-sky-700 bg-sky-50' },
    { label: 'Sales Change', value: historyData.summary?.growth || '+0%', icon: BarChart3, color: 'text-amber-700 bg-amber-50' },
    { label: 'Stock Movement', value: historyData.summary?.stockMovement || '0 units', icon: History, color: 'text-violet-700 bg-violet-50' },
  ], [historyData]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </button>
          <p className="text-xs font-medium text-emerald-700">Product Analytics</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Product Sales History</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
            Timeline, sales history, stock movement, offers, seasonal demand, low stock periods, and expiry movement.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {compactStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex min-w-[190px] items-center gap-3 border-r border-slate-100 pr-4 last:border-r-0">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-base font-semibold text-slate-950">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Analytics Table</h2>
            <p className="text-sm font-medium text-slate-500">Expandable rows for product sales and stock history.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {(historyData.previousTopProducts || []).map((product: any) => {
              const isOpen = expandedProduct === product.name;
              const isPositive = String(product.change || '').startsWith('+');
              return (
                <div key={product.name}>
                  <button
                    type="button"
                    onClick={() => setExpandedProduct(isOpen ? null : product.name)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_72px_72px_34px] items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_100px_90px_90px_34px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
                      <p className="truncate text-xs font-medium text-slate-500">{product.offerActivity || 'Offer history available'}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{product.sales} sold</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {product.change}
                    </span>
                    <span className="hidden text-xs font-semibold text-slate-700 sm:inline">{product.stock} stock</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen ? (
                    <div className="grid gap-3 bg-slate-50/70 px-5 py-4 text-xs font-medium text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                      <div><span className="text-slate-500">Stock movement:</span> {product.stock} units remaining</div>
                      <div><span className="text-slate-500">Low stock period:</span> {product.lowStockPeriod}</div>
                      <div><span className="text-slate-500">Expiry movement:</span> {product.expiryMovement}</div>
                      <div><span className="text-slate-500">Offer activity:</span> {product.offerActivity}</div>
                      <div><span className="text-slate-500">Seasonal demand:</span> {product.seasonalDemand}</div>
                      <div><span className="text-slate-500">Recommendation:</span> Refill and watch demand curve</div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Compact Graphs</h2>
            <p className="mb-4 text-sm font-medium text-slate-500">Values animate only when data changes.</p>
            <div className="space-y-4">
              {(historyData.charts || []).map((chart: any) => (
                <div key={chart.label}>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{chart.label}</span>
                    <span className="text-slate-950">{chart.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${chart.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Activity Feed</h2>
            <div className="mt-4 space-y-4">
              {(historyData.timeline || []).map((event: any, index: number) => (
                <div key={`${event.title}-${index}`} className="flex gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    {event.type === 'offer' ? <Tag className="h-4 w-4" /> : <History className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSalesHistory;
