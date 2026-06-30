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

interface SidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const getEffectiveRole = (user: any) => {
  if (!user) return 'ADMIN';
  if (user.employee?.role) {
    const r = user.employee.role.toLowerCase();
    if (r.includes('admin')) return 'ADMIN';
    if (r.includes('manager')) return 'MANAGER';
    if (r.includes('waiter') || r.includes('captain')) return 'WAITER';
    if (r.includes('chef')) return 'CHEF';
    if (r.includes('kitchen') || r.includes('helper')) return 'KITCHEN';
    if (r.includes('inventory') || r.includes('keeper')) return 'INVENTORY';
    if (r.includes('cashier') || r.includes('billing')) return 'CASHIER';
    return 'EMPLOYEE';
  }
  return user.role;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRestaurant = user?.businessType === 'Restaurant' || user?.businessType === 'Cafe';
  const role = getEffectiveRole(user);

  const retailNavItems = [
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
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Customers', path: '/customers', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const restaurantNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Active Tables', path: '/restaurant/active-tables', icon: Layers },
    { name: 'Take Order', path: '/restaurant/take-order', icon: Calculator },
    { name: 'Kitchen Dashboard', path: '/restaurant/kitchen-dashboard', icon: LayoutDashboard },
    { name: 'Kitchen Orders', path: '/restaurant/kitchen', icon: Archive },
    { name: 'Recipe Management', path: '/restaurant/recipes', icon: Package },
    { name: 'Inventory Requests', path: '/restaurant/inventory-requests', icon: FileText },
    { name: 'Waiter Console', path: '/restaurant/waiter-dashboard', icon: UserCheck },
    { name: 'Digital Menu', path: '/restaurant/menu', icon: Layers },
    { name: 'Employee Management', path: '/restaurant/employees', icon: Users },
    { name: 'Reservations', path: '/restaurant/reservations', icon: UserCheck },
    { name: 'Inventory', path: '/restaurant/inventory', icon: Archive },
    { name: 'Suppliers', path: '/restaurant/suppliers', icon: Users },
    { name: 'Online Channels', path: '/restaurant/online-orders', icon: ShoppingBag },
    { name: 'Restaurant Reports', path: '/restaurant/reports', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getNavItems = () => {
    if (!isRestaurant) return retailNavItems;

    if (role === 'WAITER') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Active Tables', path: '/restaurant/active-tables', icon: Layers },
        { name: 'Take Order', path: '/restaurant/take-order', icon: Calculator },
        { name: 'Waiter Console', path: '/restaurant/waiter-dashboard', icon: UserCheck },
        { name: 'Tables', path: '/restaurant/tables', icon: Archive },
        { name: 'Reservations', path: '/restaurant/reservations', icon: UserCheck },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'KITCHEN') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Kitchen Orders', path: '/restaurant/kitchen', icon: Archive },
        { name: 'Inventory Requests', path: '/restaurant/inventory-requests', icon: FileText },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'CHEF') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Kitchen Dashboard', path: '/restaurant/kitchen-dashboard', icon: LayoutDashboard },
        { name: 'Kitchen Orders', path: '/restaurant/kitchen', icon: Archive },
        { name: 'Recipes', path: '/restaurant/recipes', icon: Package },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'CASHIER') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Active Tables', path: '/restaurant/active-tables', icon: Layers },
        { name: 'Take Order', path: '/restaurant/take-order', icon: Calculator },
        { name: 'Tables', path: '/restaurant/tables', icon: Archive },
        { name: 'Reservations', path: '/restaurant/reservations', icon: UserCheck },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'INVENTORY') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Inventory', path: '/restaurant/inventory', icon: Archive },
        { name: 'Suppliers', path: '/restaurant/suppliers', icon: Users },
        { name: 'Inventory Requests', path: '/restaurant/inventory-requests', icon: FileText },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'EMPLOYEE') {
      return [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Self Service', path: '/restaurant/employees', icon: Users },
      ];
    }

    if (role === 'MANAGER') {
      return restaurantNavItems.filter(item => item.name !== 'Settings');
    }

    return restaurantNavItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/60 transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 z-40 flex flex-col border-r border-slate-800/40 bg-[#090d1f] text-slate-400 select-none transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'left-0 w-64' : '-left-64 lg:left-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/40 gap-3 shrink-0 overflow-hidden">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-left transition-opacity duration-300">
              <h1 className="font-extrabold text-white text-lg tracking-tight leading-none font-sans">POS</h1>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-sans mt-0.5 whitespace-nowrap">
                Inventory System
              </span>
            </div>
          )}
        </div>

        {/* Nav List - Custom Scrollbar and Smooth Scroll */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group w-full ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-4 py-2.5'
                } ${isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-900/30 font-semibold'
                  : 'hover:bg-slate-800/40 hover:text-slate-200 hover:translate-x-0.5'
                }`
              }
            >
              <div className={`flex items-center gap-3.5 ${isCollapsed ? 'justify-center' : 'w-full'}`}>
                <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105 shrink-0 text-inherit" />
                {!isCollapsed && <span className="truncate text-left">{item.name}</span>}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/40 bg-[#070a18] shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl hover:bg-slate-800/40 transition-colors duration-200 cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-extrabold text-sm ring-2 ring-slate-800 shrink-0">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'JD'}
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-white tracking-tight leading-none truncate max-w-[110px]">
                    {user?.name || 'John Doe'}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium capitalize mt-1 block leading-none">
                    {user?.employee?.role || user?.role?.toLowerCase() || 'admin'}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-500 transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
