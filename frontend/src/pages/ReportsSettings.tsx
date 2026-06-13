import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Building2,
  Download,
  FileText,
  Globe2,
  Printer,
  Database,
  Save,
  ShieldCheck,
  UploadCloud,
  Users,
  // Custom BI Icons
  ShoppingBag,
  Percent,
  Package,
  Truck,
  ClipboardList,
  CreditCard,
  Activity,
  Calendar,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

// Structured Mock Data for ERP Reporting Engine
const mockSalesReports = {
  Today: [
    { id: 'TXN-9081', date: '2026-06-10', customer: 'Ananya Sharma', items: 3, total: 1250, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-9082', date: '2026-06-10', customer: 'Rajesh Patel', items: 1, total: 120, status: 'Completed', mode: 'Cash' },
    { id: 'TXN-9083', date: '2026-06-10', customer: 'Vijay Kumar', items: 5, total: 3200, status: 'Completed', mode: 'Card' },
  ],
  Yesterday: [
    { id: 'TXN-9071', date: '2026-06-09', customer: 'Sunita Rao', items: 2, total: 840, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-9072', date: '2026-06-09', customer: 'Amit Mishra', items: 4, total: 1100, status: 'Completed', mode: 'Wallet' },
  ],
  'Last 7 Days': [
    { id: 'TXN-9051', date: '2026-06-07', customer: 'Kunal Sen', items: 2, total: 950, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-9052', date: '2026-06-06', customer: 'Nisha Gupta', items: 3, total: 1450, status: 'Completed', mode: 'Card' },
    { id: 'TXN-9053', date: '2026-06-05', customer: 'Rahul Verma', items: 6, total: 4200, status: 'Completed', mode: 'Net Banking' },
  ],
  'Last 30 Days': [
    { id: 'TXN-9011', date: '2026-05-20', customer: 'Sneha Reddy', items: 4, total: 1950, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-9012', date: '2026-05-22', customer: 'Karan Malhotra', items: 8, total: 6400, status: 'Completed', mode: 'Card' },
    { id: 'TXN-9013', date: '2026-05-25', customer: 'Aditi Rao', items: 2, total: 720, status: 'Completed', mode: 'Cash' },
  ],
  'This Month': [
    { id: 'TXN-9041', date: '2026-06-02', customer: 'Rohan Joshi', items: 3, total: 1550, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-9042', date: '2026-06-04', customer: 'Pooja Hegde', items: 5, total: 2800, status: 'Completed', mode: 'Cash' },
  ],
  'Last Month': [
    { id: 'TXN-8991', date: '2026-05-10', customer: 'Vikram Seth', items: 4, total: 3100, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-8992', date: '2026-05-15', customer: 'Deepa Nair', items: 2, total: 950, status: 'Completed', mode: 'Card' },
  ],
  Quarter: [
    { id: 'TXN-8901', date: '2026-04-12', customer: 'Sanjay Dutt', items: 10, total: 12500, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-8902', date: '2026-04-18', customer: 'Rita Sen', items: 3, total: 1800, status: 'Completed', mode: 'Cash' },
  ],
  Year: [
    { id: 'TXN-8501', date: '2026-01-15', customer: 'Arjun Kapoor', items: 15, total: 24500, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-8502', date: '2026-02-20', customer: 'Kriti Sanon', items: 5, total: 5400, status: 'Completed', mode: 'Card' },
  ],
  'Custom Date Range': [
    { id: 'TXN-CUST1', date: '2026-06-08', customer: 'Custom User 1', items: 4, total: 2100, status: 'Completed', mode: 'UPI' },
    { id: 'TXN-CUST2', date: '2026-06-09', customer: 'Custom User 2', items: 2, total: 850, status: 'Completed', mode: 'Cash' },
  ]
};

const mockProfitLoss = {
  Today: { revenue: 4570, cogs: 2950, discount: 150, gst: 822.60, profit: 1470, margin: 32 },
  Yesterday: { revenue: 1940, cogs: 1210, discount: 60, gst: 349.20, profit: 670, margin: 35 },
  'Last 7 Days': { revenue: 6600, cogs: 4160, discount: 210, gst: 1188.00, profit: 2230, margin: 34 },
  'Last 30 Days': { revenue: 9070, cogs: 5800, discount: 410, gst: 1632.60, profit: 2860, margin: 32 },
  'This Month': { revenue: 4350, cogs: 2710, discount: 180, gst: 783.00, profit: 1460, margin: 34 },
  'Last Month': { revenue: 4050, cogs: 2510, discount: 230, gst: 729.00, profit: 1310, margin: 32 },
  Quarter: { revenue: 14300, cogs: 9100, discount: 800, gst: 2574.00, profit: 4400, margin: 31 },
  Year: { revenue: 29900, cogs: 18500, discount: 1800, gst: 5382.00, profit: 9600, margin: 32 },
  'Custom Date Range': { revenue: 2950, cogs: 1850, discount: 110, gst: 531.00, profit: 990, margin: 34 },
};

const mockInventoryReports = [
  { name: 'Coca Cola 500ml', stock: 95, purchasePrice: 28, sellingPrice: 40, value: 2660, lastSale: '2026-06-10', status: 'In Stock', movement: 'Fast Moving', category: 'Beverages' },
  { name: "Lay's Classic", stock: 5, purchasePrice: 15, sellingPrice: 20, value: 75, lastSale: '2026-06-10', status: 'Low Stock', movement: 'Fast Moving', category: 'Snacks & Chips' },
  { name: 'Milk 1L', stock: 60, purchasePrice: 45, sellingPrice: 60, value: 2700, lastSale: '2026-06-09', status: 'In Stock', movement: 'Fast Moving', category: 'Dairy Products' },
  { name: 'Eggs (12pcs)', stock: 8, purchasePrice: 60, sellingPrice: 80, value: 480, lastSale: '2026-06-10', status: 'Low Stock', movement: 'Slow Moving', category: 'Dairy Products' },
  { name: 'Bread', stock: 0, purchasePrice: 28, sellingPrice: 40, value: 0, lastSale: '2026-06-08', status: 'Out Of Stock', movement: 'Fast Moving', category: 'Bakery' },
  { name: 'Imported Chocolates', stock: 94, purchasePrice: 120, sellingPrice: 180, value: 11280, lastSale: '2026-06-05', status: 'Dead Stock', movement: 'Slow Moving', category: 'Confectionery' },
];

const mockSupplierReports = [
  { name: 'GlaxoSmithKline Ltd.', orders: 12, value: 145000, outstanding: 25000, lastDate: '2026-06-08', rating: '4.8 ★', returns: 1 },
  { name: 'Premium Poultry Farm', orders: 28, value: 89000, outstanding: 4500, lastDate: '2026-06-10', rating: '4.6 ★', returns: 0 },
  { name: 'Mother Dairy Co.', orders: 42, value: 312000, outstanding: 0, lastDate: '2026-06-10', rating: '4.9 ★', returns: 2 },
  { name: 'Global Foods Supplier', orders: 8, value: 72000, outstanding: 12000, lastDate: '2026-06-01', rating: '4.2 ★', returns: 0 },
];

const mockCustomerReports = [
  { name: 'Ananya Sharma', orders: 18, spent: 24500, returns: 0, outstanding: 0, lastDate: '2026-06-10', tier: 'Platinum' },
  { name: 'Vijay Kumar', orders: 24, spent: 48000, returns: 1, outstanding: 1500, lastDate: '2026-06-10', tier: 'Elite' },
  { name: 'Rahul Verma', orders: 15, spent: 19500, returns: 0, outstanding: 0, lastDate: '2026-06-05', tier: 'Gold' },
  { name: 'Nisha Gupta', orders: 11, spent: 14200, returns: 0, outstanding: 350, lastDate: '2026-06-06', tier: 'Gold' },
];

const mockGSTReports = [
  { invoice: 'INV-2026-0091', date: '2026-06-10', taxable: 1059.32, cgst: 95.34, sgst: 95.34, igst: 0, total: 190.68 },
  { invoice: 'INV-2026-0092', date: '2026-06-10', taxable: 101.69, cgst: 9.15, sgst: 9.15, igst: 0, total: 18.30 },
  { invoice: 'INV-2026-0093', date: '2026-06-10', taxable: 2711.86, cgst: 244.07, sgst: 244.07, igst: 0, total: 488.14 },
];

const mockPurchaseReports = [
  { id: 'PO-3081', date: '2026-06-10', supplier: 'Premium Poultry Farm', qty: 240, cost: 4800, status: 'Received', itemsCount: 4 },
  { id: 'PO-3082', date: '2026-06-10', supplier: 'Mother Dairy Co.', qty: 150, cost: 9000, status: 'Received', itemsCount: 8 },
  { id: 'PO-3083', date: '2026-06-09', supplier: 'Global Foods Supplier', qty: 100, cost: 12000, status: 'Pending', itemsCount: 2 },
];

const mockPaymentReports = [
  { mode: 'UPI / QR Scan', count: 182, revenue: 142500, share: '45%', speed: 'Instant' },
  { mode: 'Physical Cash', count: 245, revenue: 110800, share: '35%', speed: 'Cash Drawer' },
  { mode: 'Credit/Debit Card', count: 88, revenue: 47400, share: '15%', speed: 'T+1 Settlement' },
  { mode: 'Mobile Wallets', count: 24, revenue: 9500, share: '3%', speed: 'Instant' },
  { mode: 'Net Banking', count: 12, revenue: 6300, share: '2%', speed: 'Instant' },
];

const mockOfferUnsoldProducts = [
  {
    id: 'prod-mock-1',
    name: 'Cadbury Celebrations Pack',
    sku: 'CON-CAD-102',
    category: { name: 'Confectionery' },
    sellingPrice: 250,
    quantity: 150,
    isUnsold: true,
    isOnOffer: true,
    offerPrice: 199,
    offerStartDate: '2026-06-01T00:00:00.000Z',
    offerEndDate: '2026-06-30T23:59:59.000Z',
    lastSoldDate: '2026-04-10T12:00:00.000Z',
    totalSalesQuantity: 45
  },
  {
    id: 'prod-mock-2',
    name: 'Tata Salt 1kg',
    sku: 'GRO-TAT-001',
    category: { name: 'Grocery' },
    sellingPrice: 28,
    quantity: 300,
    isUnsold: false,
    isOnOffer: true,
    offerPrice: 24,
    offerStartDate: '2026-06-01T00:00:00.000Z',
    offerEndDate: '2026-06-25T23:59:59.000Z',
    lastSoldDate: '2026-06-12T08:30:00.000Z',
    totalSalesQuantity: 120
  },
  {
    id: 'prod-mock-3',
    name: 'Fortune Mustard Oil 1L',
    sku: 'GRO-FOR-009',
    category: { name: 'Grocery' },
    sellingPrice: 175,
    quantity: 85,
    isUnsold: false,
    isOnOffer: true,
    offerPrice: 159,
    offerStartDate: '2026-06-05T00:00:00.000Z',
    offerEndDate: '2026-06-20T23:59:59.000Z',
    lastSoldDate: '2026-06-11T17:10:00.000Z',
    totalSalesQuantity: 65
  },
  {
    id: 'prod-mock-4',
    name: 'Dettol Liquid Handwash 200ml',
    sku: 'HC-DET-004',
    category: { name: 'Personal Care' },
    sellingPrice: 99,
    quantity: 40,
    isUnsold: true,
    isOnOffer: false,
    lastSoldDate: '2026-03-20T11:45:00.000Z',
    totalSalesQuantity: 0
  },
  {
    id: 'prod-mock-5',
    name: 'Britannia Marie Gold 250g',
    sku: 'SNK-BRI-204',
    category: { name: 'Snacks & Biscuits' },
    sellingPrice: 35,
    quantity: 110,
    isUnsold: true,
    isOnOffer: false,
    lastSoldDate: '2026-04-01T15:00:00.000Z',
    totalSalesQuantity: 8
  }
];

const dateFilters = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Last Month',
  'Quarter',
  'Year',
  'Custom Date Range',
];
const KpiCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  borderColorClass?: string;
}> = ({ title, value, icon, footer, borderColorClass = 'hover:border-blue-500' }) => {
  return (
    <div className={`bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 group flex flex-col justify-between min-w-0 ${borderColorClass}`}>
      {/* Top: Icon + Title */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider truncate block">{title}</span>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0">
          {icon}
        </div>
      </div>
      {/* Middle: Main Value */}
      <div className="mb-3 min-w-0">
        <span
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 block truncate"
          title={value}
        >
          {value}
        </span>
      </div>
      {/* Bottom: Additional Info */}
      <div className="text-xs text-slate-500 font-bold truncate mt-auto border-t border-slate-50 pt-2 w-full">
        {footer}
      </div>
    </div>
  );
};

export const Reports: React.FC = () => {
  const auth = useAuth();
  const [activeCategory, setActiveCategory] = useState('Sales Reports');
  const [salesSubTab, setSalesSubTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom'>('Daily');
  const [activeFilter, setActiveFilter] = useState('Today');
  const [customStart, setCustomStart] = useState('2026-06-01');
  const [customEnd, setCustomEnd] = useState('2026-06-10');

  // Custom Interactive Filters (instant update, no page refreshes)
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedSupplierName, setSelectedSupplierName] = useState('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('All');
  const [selectedPOStatus, setSelectedPOStatus] = useState('All');

  // Sidebar height dynamic matching state
  const sidebarRef = useRef<HTMLElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState<number | string>('auto');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sidebarRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setSidebarHeight(entry.target.clientHeight);
        }
      });
      resizeObserver.observe(sidebarRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [activeCategory]);

  // Live Database Report Data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    auth.apiRequest('/products')
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(err => console.error('Failed to load products for reports:', err));
  }, []);

  // Sidebar toggle state for small/tablet devices
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync activeFilter when changing activeCategory & salesSubTab
  useEffect(() => {
    if (activeCategory === 'Sales Reports') {
      if (salesSubTab === 'Daily') {
        setActiveFilter('Today');
      } else if (salesSubTab === 'Weekly') {
        setActiveFilter('Last 7 Days');
      } else if (salesSubTab === 'Monthly') {
        setActiveFilter('Last 30 Days');
      } else if (salesSubTab === 'Quarterly') {
        setActiveFilter('Quarter');
      } else if (salesSubTab === 'Yearly') {
        setActiveFilter('Year');
      } else if (salesSubTab === 'Custom') {
        setActiveFilter('Custom Date Range');
      }
    }
  }, [salesSubTab, activeCategory]);

  // Fetch reports from the backend on date range filter changes
  useEffect(() => {
    let active = true;
    const fetchLiveReports = async () => {
      setLoading(true);
      try {
        const url = `/analytics/reports?filter=${encodeURIComponent(activeFilter)}` +
          `&startDate=${encodeURIComponent(customStart)}` +
          `&endDate=${encodeURIComponent(customEnd)}`;
        const data = await auth.apiRequest(url);
        if (active) {
          setReportData(data);
        }
      } catch (error) {
        console.warn('Backend reporting API offline or returned error. Falling back to local state ledger.', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLiveReports();
    return () => { active = false; };
  }, [activeFilter, customStart, customEnd]);

  // Safe accessor helper for mock data calculations when database is empty
  const getSalesData = () => {
    const list = (reportData?.salesReport && reportData.salesReport.length > 0)
      ? reportData.salesReport
      : (mockSalesReports[activeFilter as keyof typeof mockSalesReports] || mockSalesReports['Last 7 Days']);
    if (selectedPaymentMode !== 'All') {
      return list.filter((item: any) => item.mode === selectedPaymentMode);
    }
    return list;
  };

  const getPLData = () => {
    const hasData = reportData?.profitAndLoss && (reportData.profitAndLoss.revenue > 0 || reportData.profitAndLoss.profit > 0);
    return hasData ? reportData.profitAndLoss : (mockProfitLoss[activeFilter as keyof typeof mockProfitLoss] || mockProfitLoss['Last 7 Days']);
  };

  const getInventoryData = () => {
    let list = (reportData?.inventoryReport && reportData.inventoryReport.length > 0)
      ? reportData.inventoryReport
      : mockInventoryReports;
    if (selectedStockStatus !== 'All') {
      list = list.filter((item: any) => item.status === selectedStockStatus || item.movement === selectedStockStatus);
    }
    return list;
  };

  const getSupplierData = () => {
    let list = (reportData?.supplierReport && reportData.supplierReport.length > 0)
      ? reportData.supplierReport
      : mockSupplierReports;
    if (selectedSupplierName !== 'All') {
      list = list.filter((item: any) => item.name === selectedSupplierName);
    }
    return list;
  };

  const getCustomerData = () => {
    return (reportData?.customerReport && reportData.customerReport.length > 0)
      ? reportData.customerReport
      : mockCustomerReports;
  };

  const getGSTData = () => {
    return (reportData?.gstReport && reportData.gstReport.length > 0)
      ? reportData.gstReport
      : mockGSTReports;
  };

  const getPurchaseData = () => {
    let list = (reportData?.purchaseReport && reportData.purchaseReport.length > 0)
      ? reportData.purchaseReport
      : mockPurchaseReports;
    if (selectedPOStatus !== 'All') {
      list = list.filter((item: any) => item.status === selectedPOStatus);
    }
    return list;
  };

  const getPaymentData = () => {
    return (reportData?.paymentReport && reportData.paymentReport.length > 0)
      ? reportData.paymentReport
      : mockPaymentReports;
  };

  const getOfferUnsoldProducts = () => {
    if (products.length === 0) {
      return mockOfferUnsoldProducts;
    }
    const hasUnsoldOrOffers = products.some(p => p.isUnsold || p.isOnOffer);
    if (!hasUnsoldOrOffers) {
      return [...products, ...mockOfferUnsoldProducts];
    }
    return products;
  };

  // Dynamic calculations for Sales Reports Sub-views
  const salesList = getSalesData();
  const plData = getPLData();
  const inventoryList = getInventoryData();

  const totalSalesVal = salesList.reduce((sum: number, item: any) => sum + item.total, 0);
  const totalItemsSold = salesList.reduce((sum: number, item: any) => sum + item.items, 0);
  const totalProfitVal = plData.profit;
  const totalRevenueVal = plData.revenue;

  // Payment method calculations
  const paymentBreakdown = salesList.reduce((acc: any, curr: any) => {
    const m = curr.mode || 'UPI';
    if (!acc[m]) acc[m] = { count: 0, revenue: 0 };
    acc[m].count += 1;
    acc[m].revenue += curr.total;
    return acc;
  }, {});

  // Top products calculated from soldQty
  const topProducts = [...inventoryList]
    .filter((p: any) => (p.soldQty || 0) > 0)
    .sort((a: any, b: any) => (b.soldQty || 0) - (a.soldQty || 0))
    .slice(0, 5);

  // Unique customers active
  const uniqueCustomersCount = new Set(salesList.map((s: any) => s.customer)).size;

  // Day of week sales trend for weekly
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daySalesMap = salesList.reduce((acc: any, curr: any) => {
    const dayName = daysOfWeek[new Date(curr.date).getDay()];
    acc[dayName] = (acc[dayName] || 0) + curr.total;
    return acc;
  }, {});

  // Month-by-month sales trend for quarterly
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthSalesMap = salesList.reduce((acc: any, curr: any) => {
    const mName = monthNames[new Date(curr.date).getMonth()];
    acc[mName] = (acc[mName] || 0) + curr.total;
    return acc;
  }, {});

  const quarterlyComparisonList = Object.keys(monthSalesMap).map(mName => ({
    month: mName,
    revenue: monthSalesMap[mName]
  }));

  const bestMonth = quarterlyComparisonList.sort((a, b) => b.revenue - a.revenue)[0]?.month || 'N/A';

  // Instant direct downloads generator
  const triggerFileDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (format: string) => {
    let filename = `${activeCategory.replace(/\s+/g, '_')}_${activeFilter}_Report.${format.toLowerCase()}`;
    let csvContent = "";

    if (activeCategory === 'Sales Reports') {
      csvContent = "Invoice #,Date,Customer,Items,Mode,Total (INR)\n" +
        getSalesData().map((r: any) => `"${r.id}","${r.date}","${r.customer}",${r.items},"${r.mode}",${r.total}`).join("\n");
    } else if (activeCategory === 'Profit & Loss') {
      const pl = getPLData();
      csvContent = "Metric,Value (INR)\n" +
        `"Sales Revenue",${pl.revenue}\n` +
        `"Purchase Cost (COGS)",${pl.cogs}\n` +
        `"Profit",${pl.profit}\n` +
        `"Profit Margin %",${pl.margin}\n` +
        `"GST Tax Collected",${pl.gst}\n` +
        `"Discount Given",${pl.discount}\n` +
        `"Net Earnings",${pl.revenue - pl.cogs - pl.discount}`;
    } else if (activeCategory === 'Inventory Reports') {
      csvContent = "Product Name,Stock,Purchase Price,Selling Price,Inventory Value,Status,Movement,Category\n" +
        getInventoryData().map((r: any) => `"${r.name}",${r.stock},${r.purchasePrice},${r.sellingPrice},${r.value},"${r.status}","${r.movement}","${r.category}"`).join("\n");
    } else if (activeCategory === 'Supplier Reports') {
      csvContent = "Supplier,Orders,Total Purchases,Outstanding,Last Purchase,Rating,Returns\n" +
        getSupplierData().map((r: any) => `"${r.name}",${r.orders},${r.value},${r.outstanding},"${r.lastDate}","${r.rating}",${r.returns}`).join("\n");
    } else if (activeCategory === 'Customer Reports') {
      csvContent = "Customer,Transactions,Spent,Outstanding,Last Date,Tier\n" +
        getCustomerData().map((r: any) => `"${r.name}",${r.orders},${r.spent},${r.outstanding},"${r.lastDate}","${r.tier}"`).join("\n");
    } else if (activeCategory === 'GST Reports') {
      csvContent = "Invoice,Date,Taxable,CGST,SGST,IGST,Total Tax\n" +
        getGSTData().map((r: any) => `"${r.invoice}","${r.date}",${r.taxable},${r.cgst},${r.sgst},${r.igst},${r.total}`).join("\n");
    } else if (activeCategory === 'Purchase Reports') {
      csvContent = "PO #,Date,Supplier,Quantity,Status,Items Count,Purchase Cost\n" +
        getPurchaseData().map((r: any) => `"${r.id}","${r.date}","${r.supplier}",${r.qty},"${r.status}",${r.itemsCount},${r.cost}`).join("\n");
    } else {
      csvContent = "Mode,TransactionsCount,Revenue,Share,Settlement\n" +
        getPaymentData().map((r: any) => `"${r.mode}",${r.count},${r.revenue},"${r.share}","${r.speed}"`).join("\n");
    }

    triggerFileDownload(filename, csvContent);
  };

  const reportCategories = [
    { label: 'Sales Reports', desc: 'Real-time sales, tickets, modes & volume', theme: 'blue', color: 'border-l-blue-600 bg-blue-50/40 text-blue-700', activeClass: 'border-blue-500 bg-blue-50/90 text-blue-700 shadow-md shadow-blue-100/40', icon: ShoppingBag },
    { label: 'Profit & Loss', desc: 'Net gains, margins & balance metrics', theme: 'green', color: 'border-l-emerald-600 bg-emerald-50/40 text-emerald-700', activeClass: 'border-emerald-500 bg-emerald-50/90 text-emerald-700 shadow-md shadow-emerald-100/40', icon: Activity },
    { label: 'Inventory Reports', desc: 'Dead stocks, alerts & valuation', theme: 'orange', color: 'border-l-orange-600 bg-orange-50/40 text-orange-700', activeClass: 'border-orange-500 bg-orange-50/90 text-orange-700 shadow-md shadow-orange-100/40', icon: Package },
    { label: 'Supplier Reports', desc: 'Vendor orders, returns & payables', theme: 'purple', color: 'border-l-purple-600 bg-purple-50/40 text-purple-700', activeClass: 'border-purple-500 bg-purple-50/90 text-purple-700 shadow-md shadow-purple-100/40', icon: Truck },
    { label: 'Customer Reports', desc: 'Elite cohorts & outstanding dues', theme: 'cyan', color: 'border-l-cyan-600 bg-cyan-50/40 text-cyan-700', activeClass: 'border-cyan-500 bg-cyan-50/90 text-cyan-700 shadow-md shadow-cyan-100/40', icon: Users },
    { label: 'GST Reports', desc: 'SGST/CGST invoice collections breakdown', theme: 'red', color: 'border-l-red-600 bg-red-50/40 text-red-700', activeClass: 'border-red-500 bg-red-50/90 text-red-700 shadow-md shadow-red-100/40', icon: Percent },
    { label: 'Purchase Reports', desc: 'Intake orders & procurement records', theme: 'amber', color: 'border-l-amber-600 bg-amber-50/40 text-amber-700', activeClass: 'border-amber-500 bg-amber-50/90 text-amber-700 shadow-md shadow-amber-100/40', icon: ClipboardList },
    { label: 'Payment Reports', desc: 'UPI shares, cash count & settlements', theme: 'indigo', color: 'border-l-indigo-600 bg-indigo-50/40 text-indigo-700', activeClass: 'border-indigo-500 bg-indigo-50/90 text-indigo-700 shadow-md shadow-indigo-100/40', icon: CreditCard },
    { label: 'Offer & Unsold', desc: 'Active offers, unsold products & performance', theme: 'purple', color: 'border-l-purple-600 bg-purple-50/40 text-purple-700', activeClass: 'border-purple-500 bg-purple-50/90 text-purple-700 shadow-md shadow-purple-100/40', icon: Percent },
  ];

  return (
    <div className="space-y-6 select-none font-['Trebuchet_MS'] text-[16px] text-black text-left">

      {/* Page Header */}
      <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 shrink-0">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-xl text-black">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-black uppercase tracking-tight">BI Reporting Hub</h1>
              <p className="mt-0.5 text-sm font-bold text-black">POS Analytics &nbsp;&gt;&nbsp; Business Intelligence Workspace</p>
            </div>
          </div>
        </div>

        {/* Global Controls Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Colorful Dropdown Selector */}
          <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-600 px-3 py-1.5 rounded-xl shadow-sm hover:border-emerald-700 transition-colors">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <select
              value={activeFilter}
              onChange={(e) => {
                const val = e.target.value;
                setActiveFilter(val);
                // Sync Sales Reports subtab if applicable
                if (activeCategory === 'Sales Reports') {
                  if (val === 'Today') setSalesSubTab('Daily');
                  else if (val === 'Last 7 Days') setSalesSubTab('Weekly');
                  else if (val === 'Last 30 Days') setSalesSubTab('Monthly');
                  else if (val === 'Quarter') setSalesSubTab('Quarterly');
                  else if (val === 'Year') setSalesSubTab('Yearly');
                  else if (val === 'Custom Date Range') setSalesSubTab('Custom');
                }
              }}
              className="bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer text-emerald-700 pr-2"
            >
              {dateFilters.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Export Actions Trigger */}
          <div className="flex gap-1.5 bg-white border-2 border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => handleExport('CSV')}
              title="Export to CSV"
              className="p-1.5 text-black hover:bg-slate-50 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('Excel')}
              title="Export to Excel"
              className="p-1.5 text-black hover:bg-slate-50 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              title="Print Page"
              className="p-1.5 text-black hover:bg-slate-50 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          {/* Drawer trigger for tablets */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-black transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Custom range calendar inputs if custom range selected */}
      {activeFilter === 'Custom Date Range' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-black focus:border-emerald-600 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-black uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-black focus:border-emerald-600 outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">

        {/* LEFT SIDE: Modern Large Nav Cards */}
        {/* Desktop sidebar */}
        <aside ref={sidebarRef} className="hidden lg:flex lg:col-span-4 flex-col gap-3 lg:sticky lg:top-24 h-fit shrink-0">
          <span className="block text-xs font-extrabold text-black uppercase tracking-widest px-1">Reports Category Ledger</span>
          {reportCategories.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveCategory(tab.label);
                  if (tab.label === 'Sales Reports') {
                    setSalesSubTab('Daily');
                    setActiveFilter('Today');
                  }
                }}
                className={`group flex items-start gap-4 rounded-2xl p-4 text-left transition-all border border-slate-200/60 bg-white hover:bg-slate-50/80 hover:border-slate-300 hover:translate-x-1 duration-200 cursor-pointer ${isActive ? `!border-l-4 ${tab.activeClass}` : 'text-black'
                  }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${isActive
                    ? `bg-${tab.theme}-100 text-${tab.theme}-700`
                    : 'bg-slate-100 text-black group-hover:bg-slate-200 group-hover:text-black'
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className={`block text-xs uppercase tracking-wide font-extrabold ${isActive ? 'text-black' : 'text-black'}`}>
                    {tab.label}
                  </span>
                  <span className="block text-xs text-black leading-normal mt-0.5">
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Responsive mobile categories horizontal scroll */}
        <div className="lg:hidden flex overflow-x-auto gap-2.5 pb-2.5 px-0.5 scrollbar-thin scrollbar-thumb-slate-200">
          {reportCategories.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveCategory(tab.label);
                  if (tab.label === 'Sales Reports') {
                    setSalesSubTab('Daily');
                    setActiveFilter('Today');
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap border border-slate-200/80 transition-all cursor-pointer ${isActive ? `${tab.activeClass} !border-l-2` : 'bg-white text-black'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible tablet side drawer overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
            <div className="w-80 bg-white h-full p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-extrabold uppercase text-black">Select Report Type</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {reportCategories.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCategory === tab.label;
                  return (
                    <button
                      key={tab.label}
                      onClick={() => {
                        setActiveCategory(tab.label);
                        if (tab.label === 'Sales Reports') {
                          setSalesSubTab('Daily');
                          setActiveFilter('Today');
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 rounded-xl p-3 text-left border border-slate-200/80 transition-all cursor-pointer ${isActive ? `${tab.activeClass} !border-l-4` : 'bg-slate-50 text-black'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div>
                        <span className="block text-xs font-bold uppercase">{tab.label}</span>
                        <span className="block text-xs text-black">{tab.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT SIDE: Dynamic ERP Workspace Content */}
        <div
          className="lg:col-span-8 space-y-6 lg:overflow-y-auto pt-3 px-1 pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={isDesktop && typeof sidebarHeight === 'number' ? { height: `${sidebarHeight}px` } : undefined}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
              <span className="mt-3 text-xs font-extrabold text-black uppercase tracking-wider">Syncing Database Ledger...</span>
            </div>
          ) : (
            <>
              {/* DYNAMIC CONTENT PANELS */}

              {/* 1. SALES REPORTS VIEW */}
              {activeCategory === 'Sales Reports' && (
                <div className="space-y-6">

                  {/* 6 Large KPI Cards - Main Business Focus */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard
                      title="Total Sales"
                      value={`₹${totalSalesVal.toLocaleString()}`}
                      icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
                      footer={<span>Gross checkout volume</span>}
                      borderColorClass="hover:border-blue-500"
                    />
                    <KpiCard
                      title="Total Revenue"
                      value={`₹${totalRevenueVal.toLocaleString()}`}
                      icon={<Activity className="w-6 h-6 text-indigo-600" />}
                      footer={<span>Taxable + tax collected</span>}
                      borderColorClass="hover:border-indigo-500"
                    />
                    <KpiCard
                      title="Total Profit"
                      value={`₹${totalProfitVal.toLocaleString()}`}
                      icon={<Percent className="w-6 h-6 text-emerald-600" />}
                      footer={<span>Profit surplus margin</span>}
                      borderColorClass="hover:border-emerald-500"
                    />
                    <KpiCard
                      title="Total Orders"
                      value={`${salesList.length} Orders`}
                      icon={<FileText className="w-6 h-6 text-purple-600" />}
                      footer={<span>Completed billing tickets</span>}
                      borderColorClass="hover:border-purple-500"
                    />
                    <KpiCard
                      title="Average Bill Value"
                      value={`₹${salesList.length ? Math.round(totalSalesVal / salesList.length).toLocaleString() : 0}`}
                      icon={<CreditCard className="w-6 h-6 text-cyan-600" />}
                      footer={<span>Average bill size ticket</span>}
                      borderColorClass="hover:border-cyan-500"
                    />
                    <KpiCard
                      title="Products Sold"
                      value={`${totalItemsSold} Units`}
                      icon={<Package className="w-6 h-6 text-orange-600" />}
                      footer={<span>Dispensed inventory units</span>}
                      borderColorClass="hover:border-orange-500"
                    />
                  </div>

                  {/* Sales Report Filters (tabs) */}
                  <div className="bg-white border-2 border-slate-100 p-2 rounded-2xl shadow-sm flex flex-wrap gap-2">
                    {[
                      { id: 'Daily', label: 'Daily Sales', filter: 'Today' },
                      { id: 'Weekly', label: 'Weekly Sales', filter: 'Last 7 Days' },
                      { id: 'Monthly', label: 'Monthly Sales', filter: 'Last 30 Days' },
                      { id: 'Quarterly', label: 'Quarterly Sales', filter: 'Quarter' },
                      { id: 'Yearly', label: 'Yearly Sales', filter: 'Year' },
                      { id: 'Custom', label: 'Custom Date Range', filter: 'Custom Date Range' }
                    ].map(tab => {
                      const isActive = salesSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSalesSubTab(tab.id as any);
                            setActiveFilter(tab.filter);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sales Analytics Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Top Selling Products */}
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm">
                      <span className="text-xs font-extrabold text-black uppercase tracking-wider block mb-4">Top Selling Products</span>
                      {topProducts.length === 0 ? (
                        <div className="text-xs text-slate-400 font-bold py-10 text-center">No products sold in this period.</div>
                      ) : (
                        <div className="space-y-4">
                          {topProducts.map((p, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span>{p.name} ({p.category})</span>
                                <span>{p.soldQty} units</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min((p.soldQty / Math.max(...topProducts.map(tp => tp.soldQty), 1)) * 100, 100)}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Breakdown */}
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm">
                      <span className="text-xs font-extrabold text-black uppercase tracking-wider block mb-4">Payment Breakdown</span>
                      {Object.keys(paymentBreakdown).length === 0 ? (
                        <div className="text-xs text-slate-400 font-bold py-10 text-center">No payment distributions.</div>
                      ) : (
                        <div className="space-y-4">
                          {Object.keys(paymentBreakdown).map(mode => {
                            const pct = totalSalesVal > 0 ? Math.round((paymentBreakdown[mode].revenue / totalSalesVal) * 100) : 0;
                            return (
                              <div key={mode} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                  <span>{mode} ({paymentBreakdown[mode].count} bills)</span>
                                  <span>₹{paymentBreakdown[mode].revenue.toLocaleString()} ({pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sales Trends */}
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm">
                      <span className="text-xs font-extrabold text-black uppercase tracking-wider block mb-4">Sales Trends</span>
                      {salesList.length === 0 ? (
                        <div className="text-xs text-slate-400 font-bold py-10 text-center">No trend data available for this range.</div>
                      ) : (
                        <div className="space-y-3">
                          {salesSubTab === 'Quarterly' || salesSubTab === 'Yearly' ? (
                            // Month-by-month list
                            quarterlyComparisonList.map((mItem, idx) => {
                              const maxRev = Math.max(...quarterlyComparisonList.map(item => item.revenue), 1);
                              const pct = Math.round((mItem.revenue / maxRev) * 100);
                              return (
                                <div key={idx} className="flex items-center gap-4 text-xs font-bold">
                                  <span className="w-24 text-slate-700 truncate">{mItem.month}</span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <span className="w-20 text-right text-slate-900">₹{mItem.revenue.toLocaleString()}</span>
                                </div>
                              );
                            })
                          ) : (
                            // Day of week list
                            daysOfWeek.map(day => {
                              const val = daySalesMap[day] || 0;
                              const maxVal = Math.max(...Object.values(daySalesMap) as number[], 1);
                              const pct = Math.round((val / maxVal) * 100);
                              return (
                                <div key={day} className="flex items-center gap-4 text-xs font-bold">
                                  <span className="w-24 text-slate-700 truncate">{day}</span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <span className="w-20 text-right text-slate-900">₹{val.toLocaleString()}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Customer Statistics & Growth Metrics */}
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm">
                      <span className="text-xs font-extrabold text-black uppercase tracking-wider block mb-4">Customer Statistics & Growth Metrics</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <span className="block text-[10px] uppercase font-bold text-slate-500">Unique Buyers</span>
                          <span className="text-base font-black text-slate-800">{uniqueCustomersCount} Active</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <span className="block text-[10px] uppercase font-bold text-slate-500">Avg Items/Order</span>
                          <span className="text-base font-black text-slate-800">
                            {salesList.length ? (totalItemsSold / salesList.length).toFixed(1) : 0} units
                          </span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <span className="block text-[10px] uppercase font-bold text-slate-500">Peak Month</span>
                          <span className="text-base font-black text-slate-800">{bestMonth}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <span className="block text-[10px] uppercase font-bold text-slate-500">Growth Margin</span>
                          <span className="text-base font-black text-emerald-600">+14.2% YoY</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Dynamic Dropdowns & Interactive filters */}
                  <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase text-black">Filter by Payment Channel</span>
                    <div className="flex gap-2">
                      {['All', 'UPI', 'CASH', 'CARD'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setSelectedPaymentMode(mode)}
                          className={`px-4 py-1.5 text-xs rounded-xl font-extrabold border-2 transition-all cursor-pointer ${selectedPaymentMode === mode
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-black'
                            }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Detailed Sales Ledger</span>
                      <span className="text-xs font-bold text-black">{salesList.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Invoice ID</th>
                            <th className="px-5 py-3.5">Date</th>
                            <th className="px-5 py-3.5">Customer Name</th>
                            <th className="px-5 py-3.5 text-center">Qty</th>
                            <th className="px-5 py-3.5">Payment Mode</th>
                            <th className="px-5 py-3.5 text-right">Invoice Value</th>
                            <th className="px-5 py-3.5 text-right">Profit Contribution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {salesList.map((row: any, idx: number) => {
                            // Calculate profit contribution (roughly matching 30% surplus or dynamic margin)
                            const profitEst = parseFloat((row.total * 0.35).toFixed(2));
                            return (
                              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-5 py-3 font-bold text-black">{row.id}</td>
                                <td className="px-5 py-3 font-normal">{row.date}</td>
                                <td className="px-5 py-3 font-normal">{row.customer || 'Walk-in Customer'}</td>
                                <td className="px-5 py-3 text-center font-normal">{row.items} items</td>
                                <td className="px-5 py-3 font-normal">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold whitespace-nowrap inline-block ${row.mode === 'UPI' ? 'bg-blue-50 text-blue-700' : row.mode === 'CASH' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                                    }`}>
                                    {row.mode}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right font-bold text-black">₹{row.total}</td>
                                <td className="px-5 py-3 text-right font-bold text-emerald-600">₹{profitEst}</td>
                              </tr>
                            );
                          })}
                          {salesList.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-bold">
                                <div className="flex flex-col items-center justify-center py-6">
                                  <span className="text-sm uppercase tracking-wider block font-bold text-slate-400 mb-1">No transaction records found</span>
                                  <span className="text-xs text-slate-400 font-normal">Please adjust the active report date filters.</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PROFIT & LOSS VIEW */}
              {activeCategory === 'Profit & Loss' && (
                <div className="space-y-6">

                  {/* Financial Margin Trend Gauge */}
                  <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold text-black tracking-wider">Performance Gauge</h4>
                      <span className="text-3xl font-black text-emerald-650 text-emerald-600 block mt-1">{getPLData().margin}% Operating Margin</span>
                      <p className="text-xs text-black font-bold mt-1">Calculated Net Earnings over Gross Billing volume.</p>
                    </div>
                    <div className="flex-1 max-w-xs space-y-1">
                      <div className="flex justify-between text-xs font-bold text-black uppercase">
                        <span>Safety Margin</span>
                        <span>Target: 30%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${getPLData().margin}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Simplified Financial Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <KpiCard
                      title="Sales Revenue"
                      value={`₹${getPLData().revenue}`}
                      icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
                      footer={<span>Total checkout billing</span>}
                      borderColorClass="hover:border-blue-500"
                    />
                    <KpiCard
                      title="Purchase Cost"
                      value={`₹${getPLData().cogs}`}
                      icon={<Package className="w-5 h-5 text-red-500" />}
                      footer={<span>Base sourcing value</span>}
                      borderColorClass="hover:border-red-500"
                    />
                    <KpiCard
                      title="Profit Earned"
                      value={`₹${getPLData().profit}`}
                      icon={<Percent className="w-5 h-5 text-emerald-700" />}
                      footer={<span>Gross surplus balance</span>}
                      borderColorClass="hover:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl">
                      <span className="text-xs font-bold text-black uppercase block">GST Collected</span>
                      <span className="text-lg font-bold text-black mt-1 block">₹{getPLData().gst}</span>
                    </div>
                    <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl">
                      <span className="text-xs font-bold text-black uppercase block">Discount Given</span>
                      <span className="text-lg font-bold text-black mt-1 block">₹{getPLData().discount}</span>
                    </div>
                    <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <span className="text-xs font-bold text-emerald-100 uppercase block">Net Earnings</span>
                      <span className="text-2xl font-black mt-1 block">₹{(getPLData().revenue - getPLData().cogs - getPLData().discount).toFixed(2)}</span>
                      <span className="text-xs text-emerald-200 block mt-1">Surplus liquid capital</span>
                    </div>
                  </div>

                  {/* Simplified P&L Ledger */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Business Statement Overview</span>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-black">Gross Sales Revenue</span>
                        <span className="font-bold text-black">₹{getPLData().revenue}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-black">Less: Sourcing Sourcing Costs</span>
                        <span className="font-bold text-red-600">-₹{getPLData().cogs}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-black">Less: Direct Discounts Given</span>
                        <span className="font-bold text-red-600">-₹{getPLData().discount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                        <span className="font-semibold text-black">GST Output Balance Symmetrics</span>
                        <span className="font-bold text-black">₹{getPLData().gst}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2">
                        <span className="font-extrabold text-emerald-700 uppercase tracking-wider">Net Surplus Balance</span>
                        <span className="font-black text-emerald-600">₹{(getPLData().revenue - getPLData().cogs - getPLData().discount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* 3. INVENTORY REPORTS VIEW */}
              {activeCategory === 'Inventory Reports' && (
                <div className="space-y-6">
                  {/* Inventory Health Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                      title="Total Valuation"
                      value={`₹${getInventoryData().reduce((a: any, b: any) => a + (b.value || 0), 0).toLocaleString()}`}
                      icon={<ShoppingBag className="w-5 h-5 text-orange-500" />}
                      footer={<span>{getInventoryData().reduce((a: any, b: any) => a + (b.stock || 0), 0)} total units</span>}
                      borderColorClass="hover:border-orange-500"
                    />
                    <KpiCard
                      title="Out of Stock"
                      value={`${getInventoryData().filter((i: any) => i.status === 'Out Of Stock').length} products`}
                      icon={<Package className="w-5 h-5 text-red-550 text-red-600" />}
                      footer={<span>Immediate action required</span>}
                      borderColorClass="hover:border-red-500"
                    />
                    <KpiCard
                      title="Low Stock"
                      value={`${getInventoryData().filter((i: any) => i.status === 'Low Stock').length} items`}
                      icon={<Activity className="w-5 h-5 text-amber-500" />}
                      footer={<span>Restock triggers active</span>}
                      borderColorClass="hover:border-amber-500"
                    />
                    <KpiCard
                      title="Dead Stock"
                      value={`${getInventoryData().filter((i: any) => i.status === 'Dead Stock').length} items`}
                      icon={<Percent className="w-5 h-5 text-orange-700" />}
                      footer={<span>No movement last 30d</span>}
                      borderColorClass="hover:border-orange-500"
                    />
                  </div>

                  {/* Dynamic stock status filters */}
                  <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase text-black">Stock Status Filters</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['All', 'In Stock', 'Low Stock', 'Out Of Stock', 'Dead Stock', 'Fast Moving', 'Slow Moving'].map(st => (
                        <button
                          key={st}
                          onClick={() => setSelectedStockStatus(st)}
                          className={`px-3 py-1.5 text-xs rounded-xl font-extrabold border-2 transition-all cursor-pointer ${selectedStockStatus === st
                              ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-black'
                            }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table details */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Inventory Metrics Ledger</span>
                      <span className="text-xs font-bold text-black">{getInventoryData().length} catalog items</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Product Name</th>
                            <th className="px-5 py-3.5">Category</th>
                            <th className="px-5 py-3.5 text-center">Stock</th>
                            <th className="px-5 py-3.5 text-right">Cost Rate</th>
                            <th className="px-5 py-3.5 text-right">Valuation</th>
                            <th className="px-5 py-3.5">Velocity</th>
                            <th className="px-5 py-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getInventoryData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                              <td className="px-5 py-3 font-normal">{row.category}</td>
                              <td className="px-5 py-3 text-center font-normal">{row.stock} units</td>
                              <td className="px-5 py-3 text-right font-normal">₹{row.purchasePrice}</td>
                              <td className="px-5 py-3 text-right font-bold text-black">₹{row.value}</td>
                              <td className="px-5 py-3 font-normal text-xs">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.movement === 'Fast Moving' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {row.movement}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center font-normal">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold whitespace-nowrap inline-block ${row.status === 'In Stock'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : row.status === 'Low Stock'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SUPPLIER REPORTS VIEW */}
              {activeCategory === 'Supplier Reports' && (
                <div className="space-y-6">

                  {/* Supplier Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard
                      title="Top Supplier"
                      value={getSupplierData().sort((a: any, b: any) => b.orders - a.orders)[0]?.name || 'No Data'}
                      icon={<Truck className="w-5 h-5 text-purple-500" />}
                      borderColorClass="hover:border-purple-500"
                      footer={<span>{getSupplierData().sort((a: any, b: any) => b.orders - a.orders)[0]?.orders || 0} batches total</span>}
                    />
                    <KpiCard
                      title="Pending Payables"
                      value={`₹${getSupplierData().reduce((a: any, b: any) => a + (b.outstanding || 0), 0).toLocaleString()}`}
                      icon={<Activity className="w-5 h-5 text-red-650 text-red-600" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>Across {getSupplierData().filter((s: any) => s.outstanding > 0).length} partners</span>}
                    />
                    <KpiCard
                      title="Returns Registered"
                      value={`${getSupplierData().reduce((a: any, b: any) => a + (b.returns || 0), 0)} instances`}
                      icon={<Percent className="w-5 h-5 text-purple-500" />}
                      borderColorClass="hover:border-purple-500"
                      footer={<span>Within return SLA policy</span>}
                    />
                  </div>

                  {/* Supplier Filter dropdown */}
                  <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase text-black">Filter Sourcing Partner</span>
                    <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-600 px-3 py-1.5 rounded-xl shadow-sm hover:border-emerald-700 transition-colors">
                      <select
                        value={selectedSupplierName}
                        onChange={(e) => setSelectedSupplierName(e.target.value)}
                        className="bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer text-emerald-700 pr-2"
                      >
                        <option value="All">All Suppliers</option>
                        {mockSupplierReports.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Supplier Procurement Ledger</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Supplier Name</th>
                            <th className="px-5 py-3.5 text-center">Orders Count</th>
                            <th className="px-5 py-3.5 text-right">Procured Value</th>
                            <th className="px-5 py-3.5 text-right">Dues/Outstanding</th>
                            <th className="px-5 py-3.5 text-center">Score Card</th>
                            <th className="px-5 py-3.5">Last Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getSupplierData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                              <td className="px-5 py-3 text-center font-normal">{row.orders} batches</td>
                              <td className="px-5 py-3 text-right font-normal font-semibold text-black font-semibold">₹{row.value}</td>
                              <td className="px-5 py-3 text-right font-bold text-red-650 text-red-600">₹{row.outstanding}</td>
                              <td className="px-5 py-3 text-center font-normal text-xs text-amber-600 font-bold">{row.rating}</td>
                              <td className="px-5 py-3 font-normal">{row.lastDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CUSTOMER REPORTS VIEW */}
              {activeCategory === 'Customer Reports' && (
                <div className="space-y-6">
                  {/* Customer Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                      title="Total Customer Spend"
                      value={`₹${getCustomerData().reduce((a: any, b: any) => a + (b.spent || 0), 0).toLocaleString()}`}
                      icon={<Users className="w-5 h-5 text-cyan-500" />}
                      borderColorClass="hover:border-cyan-500"
                      footer={<span>Accumulated cohort spent</span>}
                    />
                    <KpiCard
                      title="Average Spend"
                      value={`₹${getCustomerData().length > 0 ? Math.round(getCustomerData().reduce((a: any, b: any) => a + (b.spent || 0), 0) / getCustomerData().length).toLocaleString() : 0}`}
                      icon={<Activity className="w-5 h-5 text-cyan-500" />}
                      borderColorClass="hover:border-cyan-500"
                      footer={<span>Per customer lifetime spend</span>}
                    />
                    <KpiCard
                      title="Unpaid Customer Credits"
                      value={`₹${getCustomerData().reduce((a: any, b: any) => a + (b.outstanding || 0), 0).toLocaleString()}`}
                      icon={<Percent className="w-5 h-5 text-red-500" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>Total outstanding credit dues</span>}
                    />
                    <KpiCard
                      title="Returns Rate"
                      value="< 1%"
                      icon={<Package className="w-5 h-5 text-cyan-500" />}
                      borderColorClass="hover:border-cyan-500"
                      footer={<span>Extremely low return incidence</span>}
                    />
                  </div>

                  {/* Table */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Customer Engagement Ledger</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Customer Name</th>
                            <th className="px-5 py-3.5 text-center">Visits/Orders</th>
                            <th className="px-5 py-3.5 text-right">Lifetime Sourced</th>
                            <th className="px-5 py-3.5 text-right">Outstanding Balance</th>
                            <th className="px-5 py-3.5 text-center">Cohort Tier</th>
                            <th className="px-5 py-3.5">Last Transaction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getCustomerData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                              <td className="px-5 py-3 text-center font-normal">{row.orders} visits</td>
                              <td className="px-5 py-3 text-right font-bold text-black font-semibold">₹{row.spent}</td>
                              <td className="px-5 py-3 text-right font-bold text-red-650 text-red-600">₹{row.outstanding}</td>
                              <td className="px-5 py-3 text-center font-normal">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${row.tier === 'Platinum' ? 'bg-indigo-50 text-indigo-700' : row.tier === 'Elite' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-750'
                                  }`}>
                                  {row.tier}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-normal">{row.lastDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. GST REPORTS VIEW */}
              {activeCategory === 'GST Reports' && (
                <div className="space-y-6">

                  {/* GST Totals cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                      title="Taxable Total"
                      value={`₹${getGSTData().reduce((a: any, b: any) => a + (b.taxable || 0), 0).toFixed(2)}`}
                      icon={<ShoppingBag className="w-5 h-5 text-red-500" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>GST core net base</span>}
                    />
                    <KpiCard
                      title="CGST Output"
                      value={`₹${getGSTData().reduce((a: any, b: any) => a + (b.cgst || 0), 0).toFixed(2)}`}
                      icon={<Percent className="w-5 h-5 text-red-500" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>Central GST share (9%)</span>}
                    />
                    <KpiCard
                      title="SGST Output"
                      value={`₹${getGSTData().reduce((a: any, b: any) => a + (b.sgst || 0), 0).toFixed(2)}`}
                      icon={<Percent className="w-5 h-5 text-red-500" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>State GST share (9%)</span>}
                    />
                    <KpiCard
                      title="Combined Tax Liability"
                      value={`₹${getGSTData().reduce((a: any, b: any) => a + (b.total || 0), 0).toFixed(2)}`}
                      icon={<Activity className="w-5 h-5 text-red-700" />}
                      borderColorClass="hover:border-red-500"
                      footer={<span>Total outward tax liability</span>}
                    />
                  </div>

                  {/* Table */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">GST Output Tax Invoice Ledger</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Invoice ID</th>
                            <th className="px-5 py-3.5">Billing Date</th>
                            <th className="px-5 py-3.5 text-right">Taxable Net</th>
                            <th className="px-5 py-3.5 text-right">CGST (9%)</th>
                            <th className="px-5 py-3.5 text-right">SGST (9%)</th>
                            <th className="px-5 py-3.5 text-right">IGST (0%)</th>
                            <th className="px-5 py-3.5 text-right">Total Tax Outward</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getGSTData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.invoice}</td>
                              <td className="px-5 py-3 font-normal">{row.date}</td>
                              <td className="px-5 py-3 text-right font-normal font-semibold text-black">₹{row.taxable}</td>
                              <td className="px-5 py-3 text-right font-normal">₹{row.cgst}</td>
                              <td className="px-5 py-3 text-right font-normal">₹{row.sgst}</td>
                              <td className="px-5 py-3 text-right font-normal">₹{row.igst}</td>
                              <td className="px-5 py-3 text-right font-bold text-red-650 text-red-600">₹{row.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. PURCHASE REPORTS VIEW */}
              {activeCategory === 'Purchase Reports' && (
                <div className="space-y-6">

                  {/* Purchase statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                      title="Procurement Capital"
                      value={`₹${getPurchaseData().reduce((a: any, b: any) => a + (b.cost || 0), 0).toLocaleString()}`}
                      icon={<ShoppingBag className="w-5 h-5 text-amber-500" />}
                      borderColorClass="hover:border-amber-500"
                      footer={<span>Direct cost commitment</span>}
                    />
                    <KpiCard
                      title="Quantity Procured"
                      value={`${getPurchaseData().reduce((a: any, b: any) => a + (b.qty || 0), 0)} items`}
                      icon={<Package className="w-5 h-5 text-amber-500" />}
                      borderColorClass="hover:border-amber-500"
                      footer={<span>Intake units volume</span>}
                    />
                    <KpiCard
                      title="Received Orders"
                      value={`${getPurchaseData().filter((p: any) => p.status === 'Received').length} POs`}
                      icon={<Activity className="w-5 h-5 text-emerald-500" />}
                      borderColorClass="hover:border-emerald-500"
                      footer={<span>Completed procurements</span>}
                    />
                    <KpiCard
                      title="Pending Intake"
                      value={`${getPurchaseData().filter((p: any) => p.status === 'Pending').length} POs`}
                      icon={<Percent className="w-5 h-5 text-amber-700" />}
                      borderColorClass="hover:border-amber-500"
                      footer={<span>Awaiting stock arrivals</span>}
                    />
                  </div>

                  {/* PO status selectors */}
                  <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-extrabold uppercase text-black">Order Intake State</span>
                    <div className="flex gap-2">
                      {['All', 'Received', 'Pending'].map(st => (
                        <button
                          key={st}
                          onClick={() => setSelectedPOStatus(st)}
                          className={`px-3 py-1.5 text-xs rounded-xl font-extrabold border-2 transition-all cursor-pointer ${selectedPOStatus === st
                              ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-black'
                            }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Purchase Order Intake Ledger</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">PO Number</th>
                            <th className="px-5 py-3.5">Order Date</th>
                            <th className="px-5 py-3.5">Supplier Partner</th>
                            <th className="px-5 py-3.5 text-center">Batch Items</th>
                            <th className="px-5 py-3.5 text-center">Net Count</th>
                            <th className="px-5 py-3.5 text-center">Status</th>
                            <th className="px-5 py-3.5 text-right">Cost Commitment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getPurchaseData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.id}</td>
                              <td className="px-5 py-3 font-normal">{row.date}</td>
                              <td className="px-5 py-3 font-normal">{row.supplier}</td>
                              <td className="px-5 py-3 text-center font-normal">{row.itemsCount} lines</td>
                              <td className="px-5 py-3 text-center font-normal">{row.qty} units</td>
                              <td className="px-5 py-3 text-center font-normal">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.status === 'Received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-black">₹{row.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. PAYMENT REPORTS VIEW */}
              {activeCategory === 'Payment Reports' && (
                <div className="space-y-6">

                  {/* Payment Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard
                      title="Total Collections"
                      value={`₹${getPaymentData().reduce((a: any, b: any) => a + (b.revenue || 0), 0).toLocaleString()}`}
                      icon={<CreditCard className="w-5 h-5 text-indigo-500" />}
                      borderColorClass="hover:border-indigo-500"
                      footer={<span>Accumulated checkouts</span>}
                    />
                    <KpiCard
                      title="UPI & Card Volume"
                      value={`₹${getPaymentData().filter((p: any) => p.mode.includes('UPI') || p.mode.includes('Card')).reduce((a: any, b: any) => a + (b.revenue || 0), 0).toLocaleString()}`}
                      icon={<Activity className="w-5 h-5 text-indigo-700" />}
                      borderColorClass="hover:border-indigo-550 hover:border-indigo-500"
                      footer={<span>Digital payment pathways</span>}
                    />
                    <KpiCard
                      title="Cash Box Total"
                      value={`₹${getPaymentData().filter((p: any) => p.mode.includes('Cash')).reduce((a: any, b: any) => a + (b.revenue || 0), 0).toLocaleString()}`}
                      icon={<ShoppingBag className="w-5 h-5 text-indigo-500" />}
                      borderColorClass="hover:border-indigo-500"
                      footer={<span>Total paper cash drawer balance</span>}
                    />
                  </div>

                  {/* Table */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <span className="text-sm font-extrabold text-black uppercase tracking-wider">Settlement Mode Outflow Share</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                            <th className="px-5 py-3.5">Payment Method</th>
                            <th className="px-5 py-3.5 text-center">Transaction Count</th>
                            <th className="px-5 py-3.5 text-right font-semibold">Total Revenue Collected</th>
                            <th className="px-5 py-3.5 text-center">SLA Settlement</th>
                            <th className="px-5 py-3.5 text-right">Contribution Ratio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-black">
                          {getPaymentData().map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-black">{row.mode}</td>
                              <td className="px-5 py-3 text-center font-normal">{row.count} bills</td>
                              <td className="px-5 py-3 text-right font-normal font-semibold text-black font-semibold">₹{row.revenue}</td>
                              <td className="px-5 py-3 text-center font-normal text-xs text-slate-500 font-bold">{row.speed}</td>
                              <td className="px-5 py-3 text-right font-bold text-indigo-600">{row.share}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. OFFER & UNSOLD REPORTS VIEW */}
              {activeCategory === 'Offer & Unsold' && (() => {
                const promoProducts = getOfferUnsoldProducts();
                const unsoldProductsList = promoProducts.filter(p => p.isUnsold);
                const activeOffersList = promoProducts.filter(p => p.isOnOffer);
                return (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <KpiCard
                        title="Unsold Products"
                        value={`${unsoldProductsList.length} Items`}
                        icon={<Package className="w-5 h-5 text-amber-500" />}
                        borderColorClass="hover:border-amber-500"
                        footer={<span>No sales activity in 30+ days</span>}
                      />
                      <KpiCard
                        title="Active Offers"
                        value={`${activeOffersList.length} Items`}
                        icon={<Percent className="w-5 h-5 text-emerald-500" />}
                        borderColorClass="hover:border-emerald-500"
                        footer={<span>Discount pricing currently active</span>}
                      />
                      <KpiCard
                        title="Total Sales under Offers"
                        value={`${activeOffersList.reduce((acc, p) => acc + (p.totalSalesQuantity || 0), 0)} Units`}
                        icon={<Activity className="w-5 h-5 text-purple-500" />}
                        borderColorClass="hover:border-purple-500"
                        footer={<span>Accumulated promotional sales</span>}
                      />
                    </div>

                    {/* Unsold Products Table */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-sm font-extrabold text-black uppercase tracking-wider">Unsold Products List</span>
                        <span className="text-xs text-slate-550 font-medium">Idle for 30+ days</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                              <th className="px-5 py-3.5">Product Name</th>
                              <th className="px-5 py-3.5">SKU</th>
                              <th className="px-5 py-3.5">Category</th>
                              <th className="px-5 py-3.5 text-right">Selling Price</th>
                              <th className="px-5 py-3.5 text-center">Current Stock</th>
                              <th className="px-5 py-3.5">Last Sold Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-black">
                            {unsoldProductsList.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                                <td className="px-5 py-3 font-normal">{row.sku}</td>
                                <td className="px-5 py-3 font-normal">{row.category?.name || 'General'}</td>
                                <td className="px-5 py-3 text-right font-semibold">₹{Number(row.sellingPrice).toFixed(2)}</td>
                                <td className="px-5 py-3 text-center">{row.quantity || 0}</td>
                                <td className="px-5 py-3 text-slate-500">{row.lastSoldDate ? new Date(row.lastSoldDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never Sold'}</td>
                              </tr>
                            ))}
                            {unsoldProductsList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-500">No unsold products found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Active Offers Table */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <span className="text-sm font-extrabold text-black uppercase tracking-wider">Active Promotional Offers</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                              <th className="px-5 py-3.5">Product Name</th>
                              <th className="px-5 py-3.5">SKU</th>
                              <th className="px-5 py-3.5 text-right">MRP (₹)</th>
                              <th className="px-5 py-3.5 text-right">Offer Price (₹)</th>
                              <th className="px-5 py-3.5 text-right">Savings (₹)</th>
                              <th className="px-5 py-3.5 text-center">Active Period</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-black">
                            {activeOffersList.map((row: any, idx: number) => {
                              const original = Number(row.sellingPrice || 0);
                              const offerPriceVal = Number(row.offerPrice || original);
                              const savingsVal = Math.max(0, original - offerPriceVal);
                              const startStr = row.offerStartDate ? new Date(row.offerStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Always';
                              const endStr = row.offerEndDate ? new Date(row.offerEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Always';
                              return (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                                  <td className="px-5 py-3 font-normal">{row.sku}</td>
                                  <td className="px-5 py-3 text-right">₹{original.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-right text-emerald-600 font-semibold">₹{offerPriceVal.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-right text-purple-600 font-semibold">₹{savingsVal.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-center text-slate-500">{startStr} - {endStr}</td>
                                </tr>
                              );
                            })}
                            {activeOffersList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-500">No active offers found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Offer Performance Table */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <span className="text-sm font-extrabold text-black uppercase tracking-wider">Offer Performance & Sales Tracker</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-xs tracking-wider font-black text-black">
                              <th className="px-5 py-3.5">Product Name</th>
                              <th className="px-5 py-3.5 text-center">Units Sold under Offer</th>
                              <th className="px-5 py-3.5 text-right">Total Revenue Generated</th>
                              <th className="px-5 py-3.5 text-right">Total Customer Savings</th>
                              <th className="px-5 py-3.5">Performance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-black">
                            {activeOffersList.map((row: any, idx: number) => {
                              const soldUnits = Number(row.totalSalesQuantity || 0);
                              const original = Number(row.sellingPrice || 0);
                              const offerPriceVal = Number(row.offerPrice || original);
                              const revenue = soldUnits * offerPriceVal;
                              const totalSavings = soldUnits * Math.max(0, original - offerPriceVal);
                              const status = soldUnits > 50 ? 'Excellent' : soldUnits > 10 ? 'Good' : 'Slow Moving';
                              const badgeColor = status === 'Excellent' ? 'bg-emerald-50 text-emerald-700' : status === 'Good' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600';
                              return (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                                  <td className="px-5 py-3 text-center">{soldUnits} units</td>
                                  <td className="px-5 py-3 text-right font-semibold">₹{revenue.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-right font-semibold text-purple-600">₹{totalSavings.toFixed(2)}</td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${badgeColor}`}>
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {activeOffersList.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center py-6 text-slate-500">No promo campaign data available.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

        </div>

      </div>

    </div>
  );
};


const settingsTabs: Array<[string, string, React.ElementType, string]> = [
  ['Store Info', 'Store & Business profiles', Building2, 'text-blue-600 bg-blue-50'],
  ['Billing Settings', 'Auto-gen, prefixes & discounts', FileText, 'text-emerald-600 bg-emerald-50'],
  ['GST & Tax', 'GST rates, CGST, SGST, IGST rules', ShieldCheck, 'text-amber-600 bg-amber-50'],
  ['Inventory Settings', 'Low stock & negative stock controls', Globe2, 'text-rose-600 bg-rose-50'],
  ['User & Cashier', 'Admin, manager, cashier roles access', Users, 'text-teal-600 bg-teal-50'],
  ['Printer Settings', 'Thermal & A4 printing formats', Printer, 'text-indigo-600 bg-indigo-50'],
  ['Notification Rules', 'Low stock, sales & customer alerts', Bell, 'text-orange-600 bg-orange-50'],
  ['Backup & Security', 'System backups, database & logs', UploadCloud, 'text-cyan-600 bg-cyan-50'],
  ['System Info', 'Version, health, storage & metrics', Database, 'text-red-600 bg-red-50'],
];

export const Settings: React.FC = () => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('Store Info');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // 1. Store Information States
  const [shopName, setShopName] = useState('SOCIETY SUPERMARKET');
  const [businessName, setBusinessName] = useState('SOCIETY SUPERMARKET RETAIL PVT. LTD.');
  const [gstNumber, setGstNumber] = useState('29AAAAA1111A1Z1');
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [shopAddress, setShopAddress] = useState('Sector 15, HSR Layout');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('560102');
  const [country, setCountry] = useState('India');
  const [shopEmail, setShopEmail] = useState('info@societysupermarket.com');
  const [mobileNumber, setMobileNumber] = useState('+91 99999 88888');
  const [website, setWebsite] = useState('https://societysupermarket.com');
  const [shopLogo, setShopLogo] = useState('');
  const [shopBanner, setShopBanner] = useState('');

  // 2. Billing States
  const [autoGenInvoice, setAutoGenInvoice] = useState(true);
  const [autoGenBill, setAutoGenBill] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [billPrefix, setBillPrefix] = useState('BILL-');
  const [defaultTaxMode, setDefaultTaxMode] = useState('Exclusive');
  const [defaultCustomerType, setDefaultCustomerType] = useState('Retail');
  const [roundOffSetting, setRoundOffSetting] = useState(true);
  const [enableCustomerDiscount, setEnableCustomerDiscount] = useState(true);
  const [enableProductDiscount, setEnableProductDiscount] = useState(true);

  // 3. GST & Tax States
  const [gstRate, setGstRate] = useState('18%');
  const [cgst, setCgst] = useState('9%');
  const [sgst, setSgst] = useState('9%');
  const [igst, setIgst] = useState('0%');
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxCalculationRules, setTaxCalculationRules] = useState('Destination-based tax computation matching GST CGST/SGST splits.');
  const [gstVerified, setGstVerified] = useState(true);

  // 4. Payment States
  const [enableCash, setEnableCash] = useState(true);
  const [enableUpi, setEnableUpi] = useState(true);
  const [enableCard, setEnableCard] = useState(true);
  const [enableNetBanking, setEnableNetBanking] = useState(false);
  const [enableWallet, setEnableWallet] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_abc123');
  const [razorpaySecret, setRazorpaySecret] = useState('••••••••••••••••••••••••');

  // 5. WhatsApp API States
  const [whatsappBusinessNumber, setWhatsappBusinessNumber] = useState('+91 99999 88888');
  const [whatsappTemplateId, setWhatsappTemplateId] = useState('invoice_delivery_v2');
  const [whatsappApiProvider, setWhatsappApiProvider] = useState('Twilio');
  const [whatsappApiKey, setWhatsappApiKey] = useState('••••••••••••••••••••••••');
  const [whatsappMessageFormat, setWhatsappMessageFormat] = useState('Dear Customer, thank you for shopping with us. Your invoice {{invoice}} for {{amount}} is ready. Download here: {{link}}');
  const [whatsappAutoMsgEnabled, setWhatsappAutoMsgEnabled] = useState(true);
  const [whatsappSenderConfig, setWhatsappSenderConfig] = useState('Verified Business Channel');

  // 6. Printer States
  const [printerSettings, setPrinterSettings] = useState('Thermal 80mm');
  const [a4Printer, setA4Printer] = useState('DeskJet A4 Standard');
  const [defaultPrintFormat, setDefaultPrintFormat] = useState('80mm Roll');
  const [autoPrintAfterBilling, setAutoPrintAfterBilling] = useState(true);
  const [printLogo, setPrintLogo] = useState(true);
  const [printGst, setPrintGst] = useState(true);
  const [printQr, setPrintQr] = useState(true);

  // 7. Inventory Rule States
  const [lowStockLimit, setLowStockLimit] = useState(10);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [barcodeSettings, setBarcodeSettings] = useState('EAN-13 Standard');
  const [skuGenerationRules, setSkuGenerationRules] = useState('[CAT]-[BRAND]-[RANDOM_4]');
  const [productCodeRules, setProductCodeRules] = useState('Numeric Autoincrement');

  // 8. User Permissions States (Matrix)
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    admin: { billing: true, inventory: true, reports: true, settings: true },
    manager: { billing: true, inventory: true, reports: true, settings: false },
    cashier: { billing: true, inventory: false, reports: false, settings: false },
  });

  // 9. Notifications States
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [invoiceAlerts, setInvoiceAlerts] = useState(true);
  const [customerAlerts, setCustomerAlerts] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState(true);

  // 10. Backup & Security
  const [autoBackupSchedule, setAutoBackupSchedule] = useState('Daily 02:00 AM');
  const [systemLogs] = useState([
    { time: '2026-06-10 14:15:22', type: 'INFO', msg: 'System initialized successfully.' },
    { time: '2026-06-10 14:16:05', type: 'INFO', msg: 'Database connection pools created.' },
    { time: '2026-06-10 14:18:40', type: 'WARNING', msg: 'High memory usage detected on server.' },
    { time: '2026-06-10 14:22:11', type: 'INFO', msg: 'WhatsApp API Gateway check passed.' },
    { time: '2026-06-10 14:25:00', type: 'INFO', msg: 'Cron auto-backup task executed.' },
  ]);
  const [securityLogs] = useState([
    { time: '2026-06-10 13:02:15', type: 'AUTH', msg: 'Admin user login successful from IP 192.168.1.5' },
    { time: '2026-06-10 13:15:44', type: 'PRIVILEGE', msg: 'Manager permissions modified by Admin.' },
    { time: '2026-06-10 13:45:10', type: 'AUTH', msg: 'Failed login attempt for user "cashier2" from IP 192.168.1.12' },
    { time: '2026-06-10 14:00:02', type: 'SECURITY', msg: 'SSL Handshake successful with payment gateway.' },
  ]);

  // System counts fallbacks
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    // Load local settings
    try {
      const saved = localStorage.getItem('shopSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.gstNumber) setGstNumber(parsed.gstNumber);
        if (parsed.panNumber) setPanNumber(parsed.panNumber);
        if (parsed.shopAddress) setShopAddress(parsed.shopAddress);
        if (parsed.city) setCity(parsed.city);
        if (parsed.stateName) setStateName(parsed.stateName);
        if (parsed.pincode) setPincode(parsed.pincode);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.shopEmail) setShopEmail(parsed.shopEmail);
        if (parsed.mobileNumber) setMobileNumber(parsed.mobileNumber);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.shopLogo) setShopLogo(parsed.shopLogo);
        if (parsed.shopBanner) setShopBanner(parsed.shopBanner);
        if (parsed.printerSettings) setPrinterSettings(parsed.printerSettings);
        if (parsed.taxSettings) setGstRate(parsed.taxSettings);

        // Load new values if present
        if (parsed.autoGenInvoice !== undefined) setAutoGenInvoice(parsed.autoGenInvoice);
        if (parsed.autoGenBill !== undefined) setAutoGenBill(parsed.autoGenBill);
        if (parsed.invoicePrefix) setInvoicePrefix(parsed.invoicePrefix);
        if (parsed.billPrefix) setBillPrefix(parsed.billPrefix);
        if (parsed.defaultTaxMode) setDefaultTaxMode(parsed.defaultTaxMode);
        if (parsed.defaultCustomerType) setDefaultCustomerType(parsed.defaultCustomerType);
        if (parsed.roundOffSetting !== undefined) setRoundOffSetting(parsed.roundOffSetting);
        if (parsed.enableCustomerDiscount !== undefined) setEnableCustomerDiscount(parsed.enableCustomerDiscount);
        if (parsed.enableProductDiscount !== undefined) setEnableProductDiscount(parsed.enableProductDiscount);

        if (parsed.cgst) setCgst(parsed.cgst);
        if (parsed.sgst) setSgst(parsed.sgst);
        if (parsed.igst) setIgst(parsed.igst);
        if (parsed.taxIncluded !== undefined) setTaxIncluded(parsed.taxIncluded);
        if (parsed.taxCalculationRules) setTaxCalculationRules(parsed.taxCalculationRules);
        if (parsed.gstVerified !== undefined) setGstVerified(parsed.gstVerified);

        if (parsed.enableCash !== undefined) setEnableCash(parsed.enableCash);
        if (parsed.enableUpi !== undefined) setEnableUpi(parsed.enableUpi);
        if (parsed.enableCard !== undefined) setEnableCard(parsed.enableCard);
        if (parsed.enableNetBanking !== undefined) setEnableNetBanking(parsed.enableNetBanking);
        if (parsed.enableWallet !== undefined) setEnableWallet(parsed.enableWallet);
        if (parsed.razorpayKeyId) setRazorpayKeyId(parsed.razorpayKeyId);
        if (parsed.razorpaySecret) setRazorpaySecret(parsed.razorpaySecret);

        if (parsed.whatsappBusinessNumber) setWhatsappBusinessNumber(parsed.whatsappBusinessNumber);
        if (parsed.whatsappApiProvider) setWhatsappApiProvider(parsed.whatsappApiProvider);
        if (parsed.whatsappApiKey) setWhatsappApiKey(parsed.whatsappApiKey);
        if (parsed.whatsappTemplateId) setWhatsappTemplateId(parsed.whatsappTemplateId);
        if (parsed.whatsappMessageFormat) setWhatsappMessageFormat(parsed.whatsappMessageFormat);
        if (parsed.whatsappAutoMsgEnabled !== undefined) setWhatsappAutoMsgEnabled(parsed.whatsappAutoMsgEnabled);
        if (parsed.whatsappSenderConfig) setWhatsappSenderConfig(parsed.whatsappSenderConfig);

        if (parsed.a4Printer) setA4Printer(parsed.a4Printer);
        if (parsed.defaultPrintFormat) setDefaultPrintFormat(parsed.defaultPrintFormat);
        if (parsed.autoPrintAfterBilling !== undefined) setAutoPrintAfterBilling(parsed.autoPrintAfterBilling);
        if (parsed.printLogo !== undefined) setPrintLogo(parsed.printLogo);
        if (parsed.printGst !== undefined) setPrintGst(parsed.printGst);
        if (parsed.printQr !== undefined) setPrintQr(parsed.printQr);

        if (parsed.lowStockLimit !== undefined) setLowStockLimit(parsed.lowStockLimit);
        if (parsed.stockAlerts !== undefined) setStockAlerts(parsed.stockAlerts);
        if (parsed.allowNegativeStock !== undefined) setAllowNegativeStock(parsed.allowNegativeStock);
        if (parsed.barcodeSettings) setBarcodeSettings(parsed.barcodeSettings);
        if (parsed.skuGenerationRules) setSkuGenerationRules(parsed.skuGenerationRules);
        if (parsed.productCodeRules) setProductCodeRules(parsed.productCodeRules);

        if (parsed.permissions) setPermissions(parsed.permissions);

        if (parsed.salesAlerts !== undefined) setSalesAlerts(parsed.salesAlerts);
        if (parsed.invoiceAlerts !== undefined) setInvoiceAlerts(parsed.invoiceAlerts);
        if (parsed.customerAlerts !== undefined) setCustomerAlerts(parsed.customerAlerts);
        if (parsed.systemNotifications !== undefined) setSystemNotifications(parsed.systemNotifications);

        if (parsed.autoBackupSchedule) setAutoBackupSchedule(parsed.autoBackupSchedule);
      }
    } catch (e) {
      console.warn('Local settings parse issue', e);
    }

    // Load dynamic dashboard records & settings from api
    Promise.all([
      auth.apiRequest('/settings').catch(() => null),
      auth.apiRequest('/products').catch(() => []),
      auth.apiRequest('/customers').catch(() => []),
      auth.apiRequest('/billing/history').catch(() => []),
    ]).then(([settingsData, productsData, customersData, ordersData]) => {
      if (settingsData) {
        setShopName(settingsData.shopName || 'SOCIETY SUPERMARKET');
        setShopAddress(settingsData.shopAddress || 'Sector 15, HSR Layout');
        setGstNumber(settingsData.gstNumber || '29AAAAA1111A1Z1');
        setMobileNumber(settingsData.mobile || '+91 99999 88888');
        setShopEmail(settingsData.email || 'info@societysupermarket.com');
        setShopLogo(settingsData.logo || '');
        setWhatsappBusinessNumber(settingsData.whatsappBusinessNumber || '');
        setWhatsappApiProvider(settingsData.whatsappApiProvider || 'Twilio');
        setWhatsappApiKey(settingsData.whatsappApiKey || '');
        setWhatsappTemplateId(settingsData.whatsappTemplateId || '');
        setWhatsappAutoMsgEnabled(settingsData.whatsappAutoMsgEnabled ?? false);
      }
      if (Array.isArray(productsData)) setTotalProducts(productsData.length);
      if (Array.isArray(customersData)) setTotalCustomers(customersData.length);
      if (Array.isArray(ordersData)) setTotalOrders(ordersData.length);
    }).catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    const config = {
      shopName,
      shopAddress,
      gstNumber,
      mobile: mobileNumber,
      email: shopEmail,
      logo: shopLogo,
      footerMessage: 'Thank you for visiting our store',
      whatsappNumber: whatsappBusinessNumber,
      theme: 'light',
      printerSettings,
      taxSettings: gstRate,
      whatsappBusinessNumber,
      whatsappApiProvider,
      whatsappApiKey,
      whatsappTemplateId,
      whatsappAutoMsgEnabled
    };

    try {
      const saved = await auth.apiRequest('/settings', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      const localStoreData = {
        shopName: saved.shopName || shopName,
        businessName,
        gstNumber: saved.gstNumber || gstNumber,
        panNumber,
        shopAddress: saved.shopAddress || shopAddress,
        city,
        stateName,
        pincode,
        country,
        shopEmail: saved.email || shopEmail,
        mobileNumber: saved.mobile || mobileNumber,
        website,
        shopLogo: saved.logo || shopLogo,
        shopBanner,

        autoGenInvoice,
        autoGenBill,
        invoicePrefix,
        billPrefix,
        defaultTaxMode,
        defaultCustomerType,
        roundOffSetting,
        enableCustomerDiscount,
        enableProductDiscount,

        gstRate,
        cgst,
        sgst,
        igst,
        taxIncluded,
        taxCalculationRules,
        gstVerified,

        enableCash,
        enableUpi,
        enableCard,
        enableNetBanking,
        enableWallet,
        razorpayKeyId,
        razorpaySecret,

        whatsappBusinessNumber: saved.whatsappBusinessNumber || whatsappBusinessNumber,
        whatsappApiProvider: saved.whatsappApiProvider || whatsappApiProvider,
        whatsappApiKey: saved.whatsappApiKey || whatsappApiKey,
        whatsappTemplateId: saved.whatsappTemplateId || whatsappTemplateId,
        whatsappMessageFormat,
        whatsappAutoMsgEnabled: saved.whatsappAutoMsgEnabled ?? whatsappAutoMsgEnabled,
        whatsappSenderConfig,

        printerSettings: saved.printerSettings || printerSettings,
        a4Printer,
        defaultPrintFormat,
        autoPrintAfterBilling,
        printLogo,
        printGst,
        printQr,

        lowStockLimit,
        stockAlerts,
        allowNegativeStock,
        barcodeSettings,
        skuGenerationRules,
        productCodeRules,

        permissions,
        salesAlerts,
        invoiceAlerts,
        customerAlerts,
        systemNotifications,
        autoBackupSchedule
      };

      localStorage.setItem('shopSettings', JSON.stringify(localStoreData));
      window.dispatchEvent(new Event('shopSettingsUpdated'));
      setSaveStatus('Settings Saved Successfully');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      alert('Failed to save settings to database.');
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const togglePermission = (role: string, module: string) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: !prev[role][module]
      }
    }));
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 select-none font-['Trebuchet_MS'] text-[15px] text-black text-left relative">

      {/* Save confirmation toast */}
      {saveStatus && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg border border-emerald-500 z-[999] transition-all duration-300 flex items-center gap-2">
          <span>✓</span> {saveStatus}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-black uppercase tracking-tight">Settings</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Manage your store, billing, invoice, tax, users and system preferences.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
          <div className="text-xs text-slate-500 font-bold">
            Last synced: <span className="text-black font-extrabold">Today at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      {/* Responsive Layout container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Navigation Sidebar Panel */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1">
          {settingsTabs.map(([label, desc, Icon, colorClass]) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left transition-colors ${activeTab === label
                  ? 'bg-slate-100 text-black border-l-4 border-l-emerald-600 font-bold'
                  : 'text-black/75 hover:bg-slate-50 font-normal'
                }`}
            >
              <span className={`p-1.5 rounded-lg shrink-0 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 whitespace-normal">
                <span className="block text-xs uppercase tracking-wider font-bold text-black">{label}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5 leading-normal">{desc}</span>
              </div>
            </button>
          ))}
        </aside>

        {/* Dynamic configuration options panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">

            {/* Store Info */}
            {activeTab === 'Store Info' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Store Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Store Name</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">GST Registration Number</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left lg:col-span-2">
                    <label className="text-xs font-bold text-black block mb-1">Shop Address</label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">State</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Store Email</label>
                    <input
                      type="email"
                      value={shopEmail}
                      onChange={(e) => setShopEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Store Mobile</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left lg:col-span-3">
                    <label className="text-xs font-bold text-black block mb-1">Website (Optional)</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Store Logo URL</label>
                    <input
                      type="text"
                      value={shopLogo}
                      onChange={(e) => setShopLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                    {shopLogo && (
                      <div className="mt-2.5 p-2 border border-slate-200 rounded-xl inline-block bg-white">
                        <img src={shopLogo} alt="Store Logo Preview" className="h-12 w-auto object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Store Banner URL</label>
                    <input
                      type="text"
                      value={shopBanner}
                      onChange={(e) => setShopBanner(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                    {shopBanner && (
                      <div className="mt-2.5 p-2 border border-slate-200 rounded-xl inline-block bg-white w-full">
                        <img src={shopBanner} alt="Store Banner Preview" className="h-16 w-full object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'Billing Settings' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Billing Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Auto Generate Invoice Number</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Enable automatic sequence increments for invoices</span>
                    </div>
                    <Toggle checked={autoGenInvoice} onChange={() => setAutoGenInvoice(!autoGenInvoice)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Auto Generate Bill Number</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Enable automatic sequence increments for bill codes</span>
                    </div>
                    <Toggle checked={autoGenBill} onChange={() => setAutoGenBill(!autoGenBill)} />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Invoice Prefix</label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Bill Prefix</label>
                    <input
                      type="text"
                      value={billPrefix}
                      onChange={(e) => setBillPrefix(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Default Tax Mode</label>
                    <select
                      value={defaultTaxMode}
                      onChange={(e) => setDefaultTaxMode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="Exclusive">Tax Exclusive (Calculated extra)</option>
                      <option value="Inclusive">Tax Inclusive (Included in rate)</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Default Customer Type</label>
                    <input
                      type="text"
                      value={defaultCustomerType}
                      onChange={(e) => setDefaultCustomerType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Round Off Total Amount</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Round off grand total value to nearest whole integer</span>
                    </div>
                    <Toggle checked={roundOffSetting} onChange={() => setRoundOffSetting(!roundOffSetting)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Enable Customer Discount</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Allow flat customer bill discounts</span>
                    </div>
                    <Toggle checked={enableCustomerDiscount} onChange={() => setEnableCustomerDiscount(!enableCustomerDiscount)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl md:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-black block">Enable Product Discount</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Enable individual item discount values on billing</span>
                    </div>
                    <Toggle checked={enableProductDiscount} onChange={() => setEnableProductDiscount(!enableProductDiscount)} />
                  </div>
                </div>
              </div>
            )}

            {/* GST & Tax */}
            {activeTab === 'GST & Tax' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">GST & Tax Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">GST Rate Configuration</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="18%">Standard Retail GST (18%)</option>
                      <option value="12%">Reduced GST (12%)</option>
                      <option value="5%">Essential Food GST (5%)</option>
                      <option value="0%">Zero Tax / Exempted</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Central GST (CGST)</label>
                    <input
                      type="text"
                      value={cgst}
                      onChange={(e) => setCgst(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">State GST (SGST)</label>
                    <input
                      type="text"
                      value={sgst}
                      onChange={(e) => setSgst(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Integrated GST (IGST)</label>
                    <input
                      type="text"
                      value={igst}
                      onChange={(e) => setIgst(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Tax Included Options</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Base product rates include GST automatically</span>
                    </div>
                    <Toggle checked={taxIncluded} onChange={() => setTaxIncluded(!taxIncluded)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">GSTIN Online Verification</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Autodetect business details on customer GSTIN</span>
                    </div>
                    <Toggle checked={gstVerified} onChange={() => setGstVerified(!gstVerified)} />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-xs font-bold text-black block mb-1">Tax Calculation Rules</label>
                    <textarea
                      value={taxCalculationRules}
                      onChange={(e) => setTaxCalculationRules(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Printer Settings */}
            {activeTab === 'Printer Settings' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Printer Configuration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Thermal Printer Selection</label>
                    <select
                      value={printerSettings}
                      onChange={(e) => setPrinterSettings(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="Thermal 80mm">Thermal 80mm Roll (Auto-cutter)</option>
                      <option value="Thermal 58mm">Thermal 58mm Roll (Receipt)</option>
                      <option value="Thermal Label 50mm">Thermal Label 50mm (Barcode)</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">A4 Printer Selection</label>
                    <input
                      type="text"
                      value={a4Printer}
                      onChange={(e) => setA4Printer(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Default Print Format</label>
                    <select
                      value={defaultPrintFormat}
                      onChange={(e) => setDefaultPrintFormat(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="80mm Roll">80mm POS Roll Format</option>
                      <option value="58mm Roll">58mm Mini Roll Format</option>
                      <option value="A4 Portrait">A4 Invoice PDF Portrait</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Auto Print After Billing</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Trigger print dialog immediately upon transaction success</span>
                    </div>
                    <Toggle checked={autoPrintAfterBilling} onChange={() => setAutoPrintAfterBilling(!autoPrintAfterBilling)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Print Store Logo</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Include shop logo at the top of receipts</span>
                    </div>
                    <Toggle checked={printLogo} onChange={() => setPrintLogo(!printLogo)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Print GST Breakdown</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Include tax matrix tables on invoices</span>
                    </div>
                    <Toggle checked={printGst} onChange={() => setPrintGst(!printGst)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl md:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-black block">Print Pay QR Code</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Generate UPI QR at footer of receipt</span>
                    </div>
                    <Toggle checked={printQr} onChange={() => setPrintQr(!printQr)} />
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Settings */}
            {activeTab === 'Inventory Settings' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Inventory Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Low Stock Alert Limit</label>
                    <input
                      type="number"
                      value={lowStockLimit}
                      onChange={(e) => setLowStockLimit(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Out Of Stock Alerts</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Notify users when items hit zero quantity</span>
                    </div>
                    <Toggle checked={stockAlerts} onChange={() => setStockAlerts(!stockAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl md:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-black block">Negative Stock Rules</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Allow invoicing products below zero inventory</span>
                    </div>
                    <Toggle checked={allowNegativeStock} onChange={() => setAllowNegativeStock(!allowNegativeStock)} />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Barcode Standard Settings</label>
                    <select
                      value={barcodeSettings}
                      onChange={(e) => setBarcodeSettings(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="EAN-13 Standard">EAN-13 Standard Barcode</option>
                      <option value="UPC-A Format">UPC-A Format</option>
                      <option value="Code 128">Code 128 (Alphanumeric)</option>
                      <option value="QR Code Format">QR Code Matrix</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">SKU Generation Rules</label>
                    <input
                      type="text"
                      value={skuGenerationRules}
                      onChange={(e) => setSkuGenerationRules(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-xs font-bold text-black block mb-1">Product Code Rules</label>
                    <input
                      type="text"
                      value={productCodeRules}
                      onChange={(e) => setProductCodeRules(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* User & Cashier */}
            {activeTab === 'User & Cashier' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">User & Cashier Settings</h2>

                <p className="text-xs font-normal text-black/60">
                  Configure role access and module access control matrix tables for POS cashier accounts.
                </p>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50">
                        <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Module Access Control</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-900 dark:text-white text-sm">Admin</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-900 dark:text-white text-sm">Manager</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-900 dark:text-white text-sm">Cashier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-black">
                      {[
                        { id: 'billing', label: 'POS Billing Page' },
                        { id: 'inventory', label: 'Inventory & Product Catalog' },
                        { id: 'reports', label: 'Reports & BI Analytics' },
                        { id: 'settings', label: 'System Configuration Settings' }
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white text-sm">{item.label}</td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions.admin[item.id]}
                              onChange={() => togglePermission('admin', item.id)}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions.manager[item.id]}
                              onChange={() => togglePermission('manager', item.id)}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions.cashier[item.id]}
                              onChange={() => togglePermission('cashier', item.id)}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notification Rules */}
            {activeTab === 'Notification Rules' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Notification Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Low Stock Alerts</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Alert system notifications when stock limits are hit</span>
                    </div>
                    <Toggle checked={stockAlerts} onChange={() => setStockAlerts(!stockAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Sales Alerts</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Trigger messages upon consolidated sales summaries</span>
                    </div>
                    <Toggle checked={salesAlerts} onChange={() => setSalesAlerts(!salesAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Invoice Alerts</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Notify when client invoices are delivered</span>
                    </div>
                    <Toggle checked={invoiceAlerts} onChange={() => setInvoiceAlerts(!invoiceAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-black block">Customer Alerts</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Alert cashier of special customer notes or birthdays</span>
                    </div>
                    <Toggle checked={customerAlerts} onChange={() => setCustomerAlerts(!customerAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200 rounded-2xl md:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-black block">System Notifications</span>
                      <span className="text-[10px] text-black/50 font-normal mt-0.5 block">Notify on service interruptions or security audit warning logs</span>
                    </div>
                    <Toggle checked={systemNotifications} onChange={() => setSystemNotifications(!systemNotifications)} />
                  </div>
                </div>
              </div>
            )}

            {/* Backup & Security */}
            {activeTab === 'Backup & Security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">Backup & Security</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-black block mb-1">Auto Backup Schedule</label>
                    <select
                      value={autoBackupSchedule}
                      onChange={(e) => setAutoBackupSchedule(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black transition"
                    >
                      <option value="Daily 02:00 AM">Daily 02:00 AM</option>
                      <option value="Weekly Sunday">Weekly Sunday</option>
                      <option value="Manual Only">Manual Backups Only</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <button
                      onClick={() => {
                        setSaveStatus('Database Backup Initialized...');
                        setTimeout(() => {
                          setSaveStatus('Database Backup Created Successfully');
                          setTimeout(() => setSaveStatus(null), 2500);
                        }, 1200);
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" /> Create Database Backup
                    </button>
                  </div>

                  <div className="flex flex-col justify-end gap-2 md:col-span-2">
                    <button
                      onClick={() => {
                        alert('Downloading database backup.sql...');
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-emerald-600 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Backup File (.SQL)
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl md:col-span-2">
                    <span className="text-xs font-bold text-black block mb-2">Restore Backup File</span>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="file"
                        className="text-xs text-black/60 bg-white border border-slate-200 rounded-xl p-2 focus:outline-none w-full"
                      />
                      <button
                        onClick={() => {
                          setSaveStatus('Restoring system database backup...');
                          setTimeout(() => {
                            setSaveStatus('System Restored Successfully');
                            setTimeout(() => setSaveStatus(null), 3000);
                          }, 1500);
                        }}
                        className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer shrink-0"
                      >
                        Restore Backup
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Logs Viewer */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <span className="text-xs font-bold text-black uppercase tracking-wider block">System Activity & Security Audit Logs</span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-black/60 uppercase block">System Logs</span>
                      <div className="bg-black p-4 rounded-2xl h-48 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {systemLogs.map((log, idx) => (
                          <div key={idx} className="leading-4">
                            <span className="text-slate-500 font-semibold">[{log.time}]</span>{' '}
                            <span className={log.type === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}>
                              {log.type}:
                            </span>{' '}
                            <span className="text-slate-350 text-slate-300">{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-black/60 uppercase block">Security Logs</span>
                      <div className="bg-black p-4 rounded-2xl h-48 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {securityLogs.map((log, idx) => (
                          <div key={idx} className="leading-4">
                            <span className="text-slate-500 font-semibold">[{log.time}]</span>{' '}
                            <span className={log.type === 'SECURITY' ? 'text-blue-400' : log.type === 'PRIVILEGE' ? 'text-violet-400' : 'text-red-400'}>
                              {log.type}:
                            </span>{' '}
                            <span className="text-slate-350 text-slate-300">{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Info */}
            {activeTab === 'System Info' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-black uppercase tracking-wider border-b border-slate-200 pb-2">System Information</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">System Version</span>
                    <span className="text-sm font-bold text-black block mt-1">v3.2.0 Stable</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Database Status</span>
                    <span className="text-sm font-bold text-emerald-600 block mt-1">Connected</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Server Status</span>
                    <span className="text-sm font-bold text-emerald-600 block mt-1">Online</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Storage Usage</span>
                    <span className="text-sm font-bold text-black block mt-1">1.82 GB / 50 GB</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Total Products</span>
                    <span className="text-sm font-bold text-black block mt-1">{totalProducts} SKUs</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Total Customers</span>
                    <span className="text-sm font-bold text-black block mt-1">{totalCustomers} Profiles</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Total Orders</span>
                    <span className="text-sm font-bold text-black block mt-1">{totalOrders} Processed</span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-black/65 uppercase tracking-wider block">Last Backup Date</span>
                    <span className="text-sm font-bold text-black block mt-1">June 10, 2026</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;

