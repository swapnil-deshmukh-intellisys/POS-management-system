import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Products } from './pages/Products';
import { POSBilling } from './pages/POSBilling';
import { Invoices } from './pages/Invoices';
import { Inventory } from './pages/Inventory';
import { ProductSalesHistory } from './pages/ProductSalesHistory';
import { Purchases } from './pages/Purchases';
import { Suppliers } from './pages/Suppliers';
import { Sales } from './pages/Sales';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Payments } from './pages/Payments';
import { Reports, Settings } from './pages/ReportsSettings';

// New POS routes
import { SalesHistory } from './pages/SalesHistory.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { ReturnsRefunds } from './pages/ReturnsRefunds.tsx';
import { PaymentsPage } from './pages/PaymentsPage.tsx';
import { InvoiceCenter } from './pages/InvoiceCenter.tsx';
import { ProductExchange } from './pages/ProductExchange.tsx';
import { PublicInvoiceView } from './pages/PublicInvoiceView.tsx';

// Restaurant Specific Pages
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { TableManagement } from './pages/TableManagement';
import { KitchenDisplay } from './pages/KitchenDisplay';
import { DigitalMenuBuilder } from './pages/DigitalMenuBuilder';
import { WaiterManagement } from './pages/WaiterManagement';
import { Reservations } from './pages/Reservations';
import { RecipeManagement } from './pages/RecipeManagement';
import { OnlineOrders } from './pages/OnlineOrders';
import { RestaurantReports } from './pages/RestaurantReports';
import { RestaurantInventory } from './pages/RestaurantInventory';
import { PublicQRMenu } from './pages/PublicQRMenu';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { TakeOrder } from './pages/TakeOrder';
import { GenerateBill } from './pages/GenerateBill';


// Private Route Guard Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const isRestaurant = user?.businessType === 'Restaurant' || user?.businessType === 'Cafe';
  return isRestaurant ? <RestaurantDashboard /> : <Dashboard />;
};

// Main Layout Wrapper
const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] flex">
      {/* Sidebar Panel Left */}
      <Sidebar />

      {/* Main Core View Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 lg:w-[calc(100%-16rem)]">
        {/* Navbar Header Top */}
        <Navbar />

        {/* Dynamic Pages Area */}
        <main className="min-w-0 flex-grow overflow-x-hidden overflow-y-auto px-4 pb-8 pt-20 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<MainDashboard />} />
            <Route path="/billing" element={<POSBilling />} />
            <Route path="/sales-history" element={<SalesHistory />} />
            <Route path="/exchanges" element={<ProductExchange />} />
            <Route path="/orders-page" element={<OrdersPage />} />
            <Route path="/returns-refunds" element={<ReturnsRefunds />} />
            <Route path="/payments-page" element={<PaymentsPage />} />
            <Route path="/invoice" element={<InvoiceCenter />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/product-sales-history" element={<ProductSalesHistory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />

            {/* Restaurant routes */}
            <Route path="/restaurant/take-order" element={<TakeOrder />} />
            <Route path="/take-order" element={<TakeOrder />} />
            <Route path="/restaurant/generate-bill" element={<GenerateBill />} />
            <Route path="/generate-bill" element={<GenerateBill />} />
            <Route path="/restaurant/tables" element={<TableManagement />} />
            <Route path="/restaurant/kitchen" element={<KitchenDisplay />} />
            <Route path="/restaurant/menu" element={<DigitalMenuBuilder />} />
            <Route path="/restaurant/waiters" element={<WaiterManagement />} />
            <Route path="/restaurant/reservations" element={<Reservations />} />
            <Route path="/restaurant/recipes" element={<RecipeManagement />} />
            <Route path="/restaurant/online-orders" element={<OnlineOrders />} />
            <Route path="/restaurant/waiter-dashboard" element={<WaiterDashboard />} />
            <Route path="/restaurant/reports" element={<RestaurantReports />} />
            <Route path="/restaurant/inventory" element={<RestaurantInventory />} />
            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login & Register Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/invoice/:invoiceNumber" element={<PublicInvoiceView />} />
          <Route path="/public/menu/:qrToken" element={<PublicQRMenu />} />

          {/* Secure Private System Routes */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
