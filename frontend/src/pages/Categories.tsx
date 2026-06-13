import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const Categories: React.FC = () => {
  const auth = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form input state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatSortOrder, setNewCatSortOrder] = useState('1');
  const [newCatStatus, setNewCatStatus] = useState('Active');
  const [newCatParent, setNewCatParent] = useState('');
  const [parentCategoryInput, setParentCategoryInput] = useState('');
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatSortOrder('1');
    setNewCatStatus('Active');
    setNewCatParent('');
    setParentCategoryInput('');
    setShowParentSuggestions(false);
  };

  const fetchCategories = async (status = statusFilter, searchQuery = search, parentId = parentFilter) => {
    setIsLoading(true);
    try {
      const queryParams = [];
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
      if (parentId) queryParams.push(`parentCategoryId=${encodeURIComponent(parentId)}`);
      const url = queryParams.length ? `/categories?${queryParams.join('&')}` : '/categories';

      const data = await auth.apiRequest(url);
      setCategories(data);
      if (url === '/categories') {
        setAllCategories(data);
      } else {
        const allData = await auth.apiRequest('/categories');
        setAllCategories(allData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter, parentFilter]);

  const applyStatusFilter = (status: string) => {
    setStatusFilter(status);
    setSearch('');
    setParentFilter('');
    fetchCategories(status, '', '');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const parentName = parentCategoryInput.trim();
      let resolvedParentCategoryId = newCatParent || null;

      if (parentName && !resolvedParentCategoryId) {
        const matchingParent = allCategories.find((category) =>
          category.id !== editingCategory?.id && category.name.toLowerCase() === parentName.toLowerCase()
        );

        if (matchingParent) {
          resolvedParentCategoryId = matchingParent.id;
        } else {
          const createdParent = await auth.apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({
              name: parentName,
              description: '',
              sortOrder: allCategories.length + 1,
              status: 'Active',
              parentCategoryId: null,
            }),
          });
          resolvedParentCategoryId = createdParent.id;
        }
      }

      await auth.apiRequest(editingCategory ? `/categories/${editingCategory.id}` : '/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
          sortOrder: newCatSortOrder,
          status: newCatStatus,
          parentCategoryId: resolvedParentCategoryId,
        }),
      });
      notifyCategoryChange(editingCategory ? 'Category Updated' : 'Category Added', newCatName);

      resetCategoryForm();
      setShowAddModal(false);
      setSearch('');
      setStatusFilter('');
      setParentFilter('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleParentCategoryInputChange = (value: string) => {
    setParentCategoryInput(value);
    setShowParentSuggestions(true);
    const existingCategory = allCategories.find((category) =>
      category.id !== editingCategory?.id && category.name.toLowerCase() === value.trim().toLowerCase()
    );
    setNewCatParent(existingCategory?.id || '');
  };

  const selectParentCategory = (category: any) => {
    setParentCategoryInput(category.name);
    setNewCatParent(category.id);
    setShowParentSuggestions(false);
  };

  const notifyCategoryChange = (action: string, categoryName: string) => {
    const notification = {
      id: `category-${Date.now()}`,
      action,
      categoryName,
      message: `${action}: ${categoryName}`,
      createdAt: new Date().toISOString(),
    };
    const currentNotifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
    const nextNotifications = [notification, ...currentNotifications].slice(0, 10);
    localStorage.setItem('categoryNotifications', JSON.stringify(nextNotifications));
    window.dispatchEvent(new CustomEvent('category-notification-added'));
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCatName(category.name || '');
    setNewCatDesc(category.description || '');
    setNewCatSortOrder(String(category.sortOrder || 1));
    setNewCatStatus(category.status || 'Active');
    setNewCatParent(category.parentCategory?.id || '');
    setParentCategoryInput(category.parentCategory?.name || '');
    setShowParentSuggestions(false);
    setShowAddModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await auth.apiRequest(`/categories/${id}`, {
        method: 'DELETE',
      });
      const deletedCategory = allCategories.find((category) => category.id === id);
      notifyCategoryChange('Category Deleted', deletedCategory?.name || 'Category');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics for categories KPI cards
  const totalCategories = allCategories.length;
  const activeCategories = allCategories.filter((c) => c.status === 'Active').length;
  const inactiveCategories = allCategories.filter((c) => c.status === 'Inactive').length;
  const totalProductsCount = allCategories.reduce((sum, c) => sum + (c.productsCount || 0), 0);
  const todayKey = new Date().toDateString();
  const createdToday = allCategories.filter((category) =>
    category.createdAt && new Date(category.createdAt).toDateString() === todayKey
  ).length;
  const updatedToday = allCategories.filter((category) =>
    category.updatedAt
    && category.createdAt
    && new Date(category.updatedAt).toDateString() === todayKey
    && new Date(category.updatedAt).getTime() !== new Date(category.createdAt).getTime()
  ).length;

  // Donut chart logic for Category Insights
  const pieData = [
    { name: 'Active', value: activeCategories > 0 ? activeCategories : 20, color: '#10b981' },
    { name: 'Inactive', value: inactiveCategories > 0 ? inactiveCategories : 4, color: '#f43f5e' },
  ];
  const totalInsightsVal = activeCategories + inactiveCategories;
  const activePercent = totalInsightsVal > 0 ? ((activeCategories / totalInsightsVal) * 100).toFixed(1) : '83.3';
  const inactivePercent = totalInsightsVal > 0 ? ((inactiveCategories / totalInsightsVal) * 100).toFixed(1) : '16.7';
  const visibleParentSuggestions = allCategories
    .filter((category) => category.id !== editingCategory?.id && category.name.toLowerCase().includes(parentCategoryInput.trim().toLowerCase()))
    .slice(0, 5);

  return (
    <div className="space-y-8 select-none font-['Segoe_UI'] text-[15px]">

      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
        <div className="text-left">
          <h1 className="text-3xl font-semibold text-black tracking-tight leading-none">
            Categories
          </h1>

          <nav className="text-sm font-bold text-slate-600 mt-2 block tracking-wide">
            <Link to="/" className="hover:text-emerald-600 transition-colors">
              Dashboard
            </Link>
            &nbsp;&gt;&nbsp;
            <span className="text-slate-700">Categories</span>
          </nav>
        </div>

        <div className="flex items-center justify-center gap-5 flex-1 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              resetCategoryForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Category
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-5">
        {/* Total Categories */}
        <button
          type="button"
          onClick={() => applyStatusFilter('')}
          className={`bg-white border rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer w-full text-left ${!statusFilter ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-100/80'}`}
        >
          <div className="text-left space-y-1">
            <span className="text-[13px] font-bold text-black-400 tracking-wider block">Total Categories</span>
            <h3 className="text-xl font-semibold text-slate-800 leading-none">{totalCategories > 0 ? totalCategories : 24}</h3>
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">All categories</span>
          </div>
        </button>

        {/* Active Categories */}
        <button
          type="button"
          onClick={() => applyStatusFilter('Active')}
          className={`bg-white border rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer w-full text-left ${statusFilter === 'Active' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-100/80'}`}
        >
          <div className="text-left space-y-1">
            <span className="text-[13px] font-bold text-black-400 tracking-wider block">Active Categories</span>
            <h3 className="text-xl font-semibold text-slate-800 leading-none">{activeCategories > 0 ? activeCategories : 20}</h3>
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Active now</span>
          </div>
        </button>

        {/* Inactive Categories */}
        <button
          type="button"
          onClick={() => applyStatusFilter('Inactive')}
          className={`bg-white border rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer w-full text-left ${statusFilter === 'Inactive' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-100/80'}`}
        >
          <div className="text-left space-y-1">
            <span className="text-[13px] font-bold text-black-400 tracking-wider block">Inactive Categories</span>
            <h3 className="text-xl font-semibold text-slate-800 leading-none">{inactiveCategories > 0 ? inactiveCategories : 4}</h3>
            <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">Not in use</span>
          </div>
        </button>

        {/* Total Products */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer w-full text-left">
          <div className="text-left space-y-1">
            <span className="text-[13px] font-bold text-black-400 tracking-wider block">Total Products</span>
            <h3 className="text-xl font-semibold text-slate-800 leading-none">{(totalProductsCount > 0 ? totalProductsCount : 2350).toLocaleString()}</h3>
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Under all categories</span>
          </div>
        </div>
      </div>

      {/* Main Core Layout Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Data Table List */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-100/80 rounded-2xl p-4 sm:p-6 shadow-sm flex lg:h-[calc(100vh-8rem)] flex-col justify-start gap-6 overflow-y-auto font-['Trebuchet_MS'] text-base [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* Controls Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 w-full">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Parent Categories</option>
                <option value="null">No Parent (Main Categories)</option>
              </select>

            </div>

          {/* TABLE */}
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-black text-sm font-extrabold uppercase tracking-wider">
                  <th className="pb-3 text-left">Category</th>
                  <th className="pb-3 text-left">Parent Category</th>
                  <th className="pb-3 text-right">Products</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Sort Order</th>
                  <th className="pb-3 text-left">Created At</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                      Loading categories data...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat: any) => (
                    <tr key={cat.id} className="text-base font-semibold text-slate-700 hover:bg-emerald-50/70 transition-colors">
                      <td className="py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                            {cat.name.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-black leading-none">{cat.name}</h5>
                            <span className="text-sm text-slate-600 mt-1 block font-medium max-w-[180px] truncate">{cat.description || 'No description'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-700 text-left font-medium">
                        {(cat.parentCategory?.name && cat.parentCategory.name !== 'No Parent Category') ? cat.parentCategory.name : '-'}
                      </td>
                      <td className="py-4 text-right font-extrabold text-black">
                        <Link
                          to={`/products?categoryId=${cat.id}`}
                          className="hover:text-emerald-600 transition-colors underline cursor-pointer"
                        >
                          {cat.productsCount || 0}
                        </Link>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${cat.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                          }`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="py-4 text-center font-extrabold text-black">
                        {cat.sortOrder}
                      </td>
                      <td className="py-4 text-slate-700 text-left font-medium">
                        {new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCategory(cat)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

         
        </div>

        {/* RIGHT COLUMN: Insights Panel */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] self-start">

          {/* Category Insights Donut Card */}
          <div className="bg-white border border-slate-100/80 rounded-2xl p-6 shadow-sm text-left h-full">
            <h3 className="text-base font-extrabold text-black tracking-tight leading-none mb-1">Category Insights</h3>
            <p className="text-xs font-semibold text-slate-600 mb-4">Visual status breakdown ratio.</p>

            <div className="h-40 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-lg font-black text-black">{totalCategories > 0 ? totalCategories : 24}</span>
                <span className="text-[9px] text-slate-600 font-bold block mt-0.5">Total</span>
              </div>
            </div>

            <div className="space-y-2 mt-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">
                  <span className="text-[11px] font-bold text-emerald-700">Created Today</span>
                  <strong className="block text-lg text-slate-900">{createdToday}</strong>
                </div>
                <div className="rounded-xl bg-sky-50 border border-sky-100 p-2">
                  <span className="text-[11px] font-bold text-sky-700">Updated Today</span>
                  <strong className="block text-lg text-slate-900">{updatedToday}</strong>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-500">Active ({activeCategories > 0 ? activeCategories : 20})</span>
                </div>
                <span className="text-slate-700 font-bold">{activePercent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-500">Inactive ({inactiveCategories > 0 ? inactiveCategories : 4})</span>
                </div>
                <span className="text-slate-700 font-bold">{inactivePercent}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-3 pt-6 backdrop-blur-sm sm:p-4 sm:pt-10 select-none">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-black">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Store category details in the backend for products, POS selection, and catalog organization.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetCategoryForm();
                  setShowAddModal(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-black"
                aria-label="Close add category"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 overflow-y-auto p-4 [scrollbar-width:none] sm:p-5 [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medicines"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="relative">
                  <label className="mb-1.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black">Parent Category</label>
                  <input
                    type="text"
                    placeholder="parent category"
                    value={parentCategoryInput}
                    onChange={(e) => handleParentCategoryInputChange(e.target.value)}
                    onFocus={() => setShowParentSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowParentSuggestions(false), 120)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  {showParentSuggestions && parentCategoryInput.trim() && visibleParentSuggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {visibleParentSuggestions.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectParentCategory(category)}
                          className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black">Description</label>
                <textarea
                  placeholder="e.g. Tablets, syrups, medical supplies"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={editingCategory ? "" : "sm:col-span-2"}>
                  <label className="mb-1.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black">Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={newCatSortOrder}
                    onChange={(e) => setNewCatSortOrder(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {editingCategory ? (
                  <div>
                    <label className="mb-1.5 block whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black">Status</label>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setNewCatStatus('Active')}
                        className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${newCatStatus === 'Active'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                          : 'bg-white text-emerald-700 hover:bg-emerald-50'
                          }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatStatus('Inactive')}
                        className={`rounded-lg px-3 py-2 text-sm font-bold transition-all ${newCatStatus === 'Inactive'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                          : 'bg-white text-rose-700 hover:bg-rose-50'
                          }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

             

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetCategoryForm();
                    setShowAddModal(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-colors hover:bg-emerald-700"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Categories;
