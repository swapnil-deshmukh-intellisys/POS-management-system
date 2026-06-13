import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  Package,
  Layers,
  Archive,
  ShoppingBag,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  BarChart2,
  Settings,
  LogOut,
  History,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'POS Billing', path: '/billing', icon: Calculator },
    { name: 'Sales History', path: '/sales-history', icon: History },
    { name: 'Product Exchange', path: '/exchanges', icon: RefreshCw },
    { name: 'Orders', path: '/orders-page', icon: ShoppingBag },
    { name: 'Returns & Refunds', path: '/returns-refunds', icon: RotateCcw },
    { name: 'Payments', path: '/payments-page', icon: CreditCard },
    { name: 'Invoice', path: '/invoice', icon: FileText },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Inventory', path: '/inventory', icon: Archive },
    { name: 'Purchases', path: '/purchases', icon: ShoppingBag },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Customers', path: '/customers', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];


  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-slate-800/40 bg-[#090d1f] text-slate-400 lg:flex">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/40 gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
          </svg>
        </div>
        <div>
          <h1 className="font-extrabold text-white text-lg tracking-tight leading-none font-sans">POS</h1>
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-sans">Inventory System</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 select-none">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 font-semibold'
                  : 'hover:bg-slate-800/40 hover:text-slate-200'
              }`
            }
          >
            <div className="flex items-center gap-3.5">
              <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
              <span>{item.name}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/40 bg-[#070a18]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-colors duration-200 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-extrabold text-sm ring-2 ring-slate-800">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'JD'}
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-white tracking-tight leading-none">
                {user?.name || 'John Doe'}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium capitalize">
                {user?.role?.toLowerCase() || 'admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
