import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileDown,
  Filter,
  Plus,
  Search,
  Settings2,
  Upload,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export type Metric = {
  label: string;
  value: string;
  note: string;
  color: string;
};

export type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

export type PageConfig = {
  title: string;
  primaryAction: string;
  tabs: string[];
  metrics: Metric[];
  columns: TableColumn[];
  rows: Record<string, any>[];
  rightTitle: string;
  rightItems: Array<{ label: string; value: string; color?: string }>;
  bottomTitle: string;
};

export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

const badgeClass = (value: string) => {
  const text = String(value).toLowerCase();
  if (text.includes('active') || text.includes('completed') || text.includes('stock')) return 'bg-emerald-50 text-emerald-700';
  if (text.includes('pending') || text.includes('partial') || text.includes('medium')) return 'bg-amber-50 text-amber-700';
  if (text.includes('low') || text.includes('refund') || text.includes('overdue')) return 'bg-rose-50 text-rose-700';
  if (text.includes('vip')) return 'bg-violet-50 text-violet-700';
  return 'bg-slate-100 text-slate-700';
};

const metricColorClass: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
};

const alignClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};

export const BusinessPageLayout: React.FC<{ config: PageConfig }> = ({ config }) => {
  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [search, setSearch] = useState('');
  const rows = config.rows.filter((row) =>
    Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase())
  );
  const pieData = config.rightItems.map((item, index) => ({
    name: item.label,
    value: Number(String(item.value).replace(/[^0-9.]/g, '')) || (index + 1) * 10,
    color: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
  }));

  return (
    <div className="space-y-6 select-none font-['Trebuchet_MS']">
      <div className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">{config.title}</h1>
          <nav className="mt-2 text-sm font-bold text-slate-500">Dashboard &nbsp;&gt;&nbsp; {config.title}</nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            {config.primaryAction}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {config.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${metricColorClass[metric.color] || metricColorClass.blue}`}>
              <FileDown className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-500">{metric.label}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-950">{metric.value}</h3>
            <span className="mt-1 block text-xs font-bold text-slate-500">{metric.note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-9 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex gap-6 overflow-x-auto border-b border-slate-100 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {config.tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-2 py-4 text-sm font-extrabold ${
                    activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${config.title.toLowerCase()}...`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['All Status', 'All Categories', 'More Filters'].map((filter) => (
                  <button key={filter} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    {filter === 'More Filters' ? <Filter className="h-4 w-4 text-blue-600" /> : null}
                    {filter}
                  </button>
                ))}
                <button className="rounded-xl border border-slate-200 bg-white p-2.5 text-blue-600 hover:bg-blue-50">
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[850px] border-collapse">
                <thead>
                  <tr className="border-y border-slate-100 text-sm font-extrabold uppercase tracking-wide text-slate-950">
                    {config.columns.map((column) => (
                      <th key={column.key} className={`px-5 py-4 ${alignClass(column.align)}`}>{column.label}</th>
                    ))}
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={`${config.title}-${index}`} className="text-sm font-semibold text-slate-700 hover:bg-blue-50/40">
                      {config.columns.map((column) => {
                        const value = row[column.key];
                        const isStatus = column.key === 'status' || column.key === 'method';
                        return (
                          <td key={column.key} className={`px-5 py-4 ${alignClass(column.align)}`}>
                            {isStatus ? (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${badgeClass(value)}`}>{value}</span>
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {['Trend', 'Category Mix', config.bottomTitle].map((title, index) => (
              <div key={title} className="min-h-44 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
                <h3 className="text-base font-extrabold text-slate-950">{index === 2 ? title : `${config.title} ${title}`}</h3>
                <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-blue-50 via-white to-emerald-50" />
              </div>
            ))}
          </div>
        </div>

        <aside className="xl:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
            <h3 className="text-base font-extrabold text-slate-950">{config.rightTitle}</h3>
            <div className="mt-4 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={3}>
                    {pieData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {config.rightItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
            <h3 className="text-base font-extrabold text-slate-950">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              {[config.primaryAction, `View ${config.title}`, 'Recent Activities', 'Full Report'].map((action) => (
                <button key={action} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                  {action}
                  <span>&gt;</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
