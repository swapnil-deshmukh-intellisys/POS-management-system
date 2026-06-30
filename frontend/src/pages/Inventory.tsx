import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Package, X, CircleDollarSign, Calendar, Percent, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inventoryRows = [
  { product: 'Coca Cola 500ml', sku: 'CCD-004', category: 'Beverages', warehouse: 'Mumbai Warehouse', stock: '95 PCS', expiry: '2025-07-10', status: 'In Stock', soldCount: 240, isUnsold: false, isOnOffer: false },
  { product: "Lay's Classic", sku: 'LAY-005', category: 'Snacks & Chips', warehouse: 'Pune Warehouse', stock: '50 PCS', expiry: '2025-06-25', status: 'Low Stock', soldCount: 180, isUnsold: false, isOnOffer: false },
  { product: 'Milk 1L', sku: 'MLK-003', category: 'Dairy Products', warehouse: 'Main Warehouse', stock: '60 PCS', expiry: '2025-06-12', status: 'In Stock', soldCount: 0, isUnsold: true, isOnOffer: false },
  { product: 'Eggs (12pcs)', sku: 'EGG-007', category: 'Dairy Products', warehouse: 'Cold Storage', stock: '30 Tray', expiry: '2025-06-18', status: 'Low Stock', soldCount: 0, isUnsold: true, isOnOffer: false },
  { product: 'Bread', sku: 'BRD-006', category: 'Bakery', warehouse: 'Main Warehouse', stock: '40 PCS', expiry: '2025-06-20', status: 'Low Stock', soldCount: 22, isUnsold: false, isOnOffer: false },
  { product: 'Glass Bottle Water', sku: 'GLS-012', category: 'Beverages', warehouse: 'Mumbai Warehouse', stock: '240 PCS', expiry: '2025-08-15', status: 'In Stock', soldCount: 94, isUnsold: false, isOnOffer: false },
  { product: 'Imported Chocolates', sku: 'CHO-027', category: 'Confectionery', warehouse: 'Pune Warehouse', stock: '94 PCS', expiry: '2025-09-01', status: 'In Stock', soldCount: 0, isUnsold: true, isOnOffer: true, offerLabel: '20% off slow-moving stock', offerDiscount: 20 },
];

const glassStyle = 'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-700/30';

const getStockStatus = (product: any) => {
  const quantity = Number(product?.quantity ?? product?.stock ?? 0);
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= 10) return 'LOW_STOCK';
  return 'IN_STOCK';
};

const getStatusLabel = (status: string) => {
  if (status === 'OUT_OF_STOCK') return 'Out of Stock';
  if (status === 'LOW_STOCK') return 'Low Stock';
  return 'In Stock';
};

const getStatusClass = (status: string) => {
  if (status === 'OUT_OF_STOCK') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'LOW_STOCK') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';

const getDaysToExpiry = (expiryDate: string) => {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
};

const getExpiryStatusInfo = (expiryDate: string) => {
  if (!expiryDate) {
    return {
      daysLeft: 999,
      countdownText: 'Not Set',
      riskText: 'Low Priority Alert',
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40',
      lineColor: '#10b981' // soft emerald
    };
  }
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      daysLeft: days,
      countdownText: absDays === 1 ? 'Expired Yesterday' : `Expired ${absDays} Days Ago`,
      riskText: 'Expired Product',
      colorClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40',
      lineColor: '#991b1b' // dark red
    };
  } else if (days === 0) {
    return {
      daysLeft: days,
      countdownText: 'Action Required Today',
      riskText: 'Critical Alert',
      colorClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40',
      lineColor: '#ef4444' // soft red
    };
  } else if (days <= 3) {
    return {
      daysLeft: days,
      countdownText: `Expires In ${days} Days`,
      riskText: 'Critical Alert',
      colorClass: 'bg-red-55 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40',
      lineColor: '#ef4444' // soft red
    };
  } else if (days <= 7) {
    return {
      daysLeft: days,
      countdownText: `Expires In ${days} Days`,
      riskText: 'High Priority',
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40',
      lineColor: '#f97316' // soft orange
    };
  } else if (days <= 15) {
    return {
      daysLeft: days,
      countdownText: `Expires In ${days} Days`,
      riskText: 'Medium Priority',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
      lineColor: '#f59e0b' // soft amber
    };
  } else {
    return {
      daysLeft: days,
      countdownText: `Expires In ${days} Days`,
      riskText: 'Low Priority Alert',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40',
      lineColor: '#10b981' // soft emerald
    };
  }
};

export const Inventory: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productRows, setProductRows] = useState<any[]>([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    product: null as any,
    offerType: 'discount' as 'discount' | 'bogo' | 'bundle',
    offerLabel: '',
    offerDiscount: '0',
    buyQuantity: '1',
    freeQuantity: '1',
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [resolvedProductIds, setResolvedProductIds] = useState<string[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedExpiryProduct, setSelectedExpiryProduct] = useState<any | null>(null);
  const [selectedSeasonalProduct, setSelectedSeasonalProduct] = useState<any | null>(null);
  const [selectedDemandMetric, setSelectedDemandMetric] = useState<any | null>(null);

  const [tableFilter, setTableFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'draft'>(() => {
    const s = searchParams.get('status');
    if (s === 'low_stock' || s === 'out_of_stock' || s === 'draft') return s;
    return 'all';
  });

  const [expiryFilter, setExpiryFilter] = useState<'all' | '7_days' | '30_days' | 'expired'>('all');
  const [expirySort, setExpirySort] = useState<'none' | 'value'>('none');
  const [promoFilter, setPromoFilter] = useState<'all' | 'active' | 'upcoming' | 'expired'>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    productName: '',
    productId: '',
    sourceWarehouse: 'Main Warehouse',
    destinationWarehouse: 'Secondary Storage',
    availableStock: 0,
    transferQty: 0,
    transferReason: ''
  });

  const [selectedDeadProduct, setSelectedDeadProduct] = useState<any | null>(null);
  const [selectedSalesPeriod, setSelectedSalesPeriod] = useState('today');
  const [salesSlideIndex, setSalesSlideIndex] = useState(0);
  const [seasonalSlideIndex, setSeasonalSlideIndex] = useState(0);

  const [topSellers, setTopSellers] = useState<{
    daily: any[];
    weekly: any[];
    monthly: any[];
  }>({
    daily: [
      { id: 'd1', name: 'Fresh Orange Juice', sold: 320, revenue: 16800, growth: 22, image: '' },
      { id: 'd2', name: 'Croissant', sold: 280, revenue: 14000, growth: 15, image: '' }
    ],
    weekly: [
      { id: 'w1', name: 'Premium Coffee', sold: 1890, revenue: 94500, growth: 28, image: '' },
      { id: 'w2', name: 'Burger Combo', sold: 1260, revenue: 75600, growth: 18, image: '' },
      { id: 'w3', name: 'Milk 1L', sold: 950, revenue: 47500, growth: 8, image: '' }
    ],
    monthly: [
      { id: 'm1', name: 'Signature Pizza', sold: 7200, revenue: 432000, growth: 35, image: '' },
      { id: 'm2', name: 'Family Meal Box', sold: 5890, revenue: 353400, growth: 26, image: '' }
    ]
  });

  const [manualOffers, setManualOffers] = useState<any[]>([
    { id: 'mo1', productId: 'p1', productName: 'Fresh Orange Juice', productImage: '', offerTitle: 'Summer Refresh Special', offerType: 'Percentage Discount', discountPercentage: 20, startDate: '2025-06-01', endDate: '2025-06-30', description: 'Beat the heat with 20% off!', isActive: true },
    { id: 'mo2', productId: 'p2', productName: 'Premium Coffee', productImage: '', offerTitle: 'Coffee Lover Bundle', offerType: 'Buy X Get Y', buyQuantity: 2, freeQuantity: 1, startDate: '2025-06-05', endDate: '2025-06-25', description: 'Buy 2 get 1 free on our premium coffee!', isActive: true }
  ]);

  const [showManualOfferModal, setShowManualOfferModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [manualOfferForm, setManualOfferForm] = useState({
    product: null as any,
    offerTitle: '',
    offerType: 'Percentage Discount' as 'Percentage Discount' | 'Flat Discount' | 'Buy X Get Y' | 'Bundle Offer' | 'Seasonal Offer',
    discountPercentage: '',
    flatDiscountAmount: '',
    buyQuantity: '',
    freeQuantity: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: '',
    isActive: true
  });

  const [rotationIndexes, setRotationIndexes] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

  useEffect(() => {
    const s = searchParams.get('status');
    if (s === 'low_stock' || s === 'out_of_stock' || s === 'draft') {
      setTableFilter(s);
    } else if (s === 'all') {
      setTableFilter('all');
    }
  }, [searchParams]);

  const handleSetTableFilter = (filter: 'all' | 'low_stock' | 'out_of_stock' | 'draft') => {
    setTableFilter(filter);
    const newParams = new URLSearchParams(searchParams);
    if (filter === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', filter);
    }
    setSearchParams(newParams);
  };

  const getQty = (item: any) => {
    const q = item.quantity !== undefined ? item.quantity : item.stock;
    if (typeof q === 'number') return q;
    if (typeof q === 'string') return parseInt(q, 10) || 0;
    return 0;
  };

  const getStockStatusLocal = (product: any) => {
    const quantity = getQty(product);
    if (quantity <= 0) return 'OUT_OF_STOCK';
    if (quantity <= 10) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const totalInventoryValue = useMemo(() => {
    const items = productRows.length ? productRows : inventoryRows;
    return items.reduce((sum, item) => {
      return sum + (getQty(item) * Number(item.costPrice || item.purchasePrice || 15));
    }, 0);
  }, [productRows]);

  const lowStockCount = useMemo(() => {
    const items = productRows.length ? productRows : inventoryRows;
    return items.filter(item => getStockStatusLocal(item) === 'LOW_STOCK').length;
  }, [productRows]);

  const outOfStockCount = useMemo(() => {
    const items = productRows.length ? productRows : inventoryRows;
    return items.filter(item => getStockStatusLocal(item) === 'OUT_OF_STOCK').length;
  }, [productRows]);


  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderKpiSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-start">
            <div className="h-3 bg-slate-200 rounded-md w-24"></div>
            <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
          </div>
          <div>
            <div className="h-6 bg-slate-200 rounded-md w-16 mt-2"></div>
            <div className="h-2 bg-slate-200 rounded-md w-32 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const expiringSoonCount = useMemo(() => {
    return liveAlerts.filter(alert => {
      const days = Math.ceil((new Date(alert.expiryDate || alert.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    }).length;
  }, [liveAlerts]);



  const deadStockData = useMemo(() => {
    const rawList = insights?.deadStock || [
      { id: 'ds1', name: "Lay's Classic XL", sku: 'LAY-005', categoryName: 'Snacks & Chips', brand: "Lay's", quantity: 150, daysWithoutSales: 65, warehouse: 'Pune Warehouse', lastSoldDate: '25 Apr 2026', costPrice: 30, recommendation: 'Promotional Offer', supplier: 'PepsiCo Distributors' },
      { id: 'ds2', name: 'Amul Gold Milk 1L', sku: 'MLK-003', categoryName: 'Dairy Products', brand: 'Amul', quantity: 60, daysWithoutSales: 35, warehouse: 'Main Warehouse', lastSoldDate: '25 May 2026', costPrice: 66, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Amul Dairy Co.' },
      { id: 'ds3', name: 'Premium Winter Jacket', sku: 'JKT-702', categoryName: 'Clothing & Apparel', brand: 'Columbia', quantity: 74, daysWithoutSales: 95, warehouse: 'Pune Warehouse', lastSoldDate: '26 Mar 2026', costPrice: 2500, recommendation: 'Clearance Sale', supplier: 'Columbia Sportswear' },
      { id: 'ds4', name: 'DeLonghi Espresso Maker', sku: 'ESP-991', categoryName: 'Kitchen Appliances', brand: 'DeLonghi', quantity: 15, daysWithoutSales: 110, warehouse: 'Main Warehouse', lastSoldDate: '11 Mar 2026', costPrice: 12500, recommendation: 'Return to Supplier', supplier: 'DeLonghi Appliances Ltd.' },
      { id: 'ds5', name: 'Philips LED Bulbs Multipack', sku: 'BLB-033', categoryName: 'Electronics & Home', brand: 'Philips', quantity: 120, daysWithoutSales: 40, warehouse: 'Mumbai Warehouse', lastSoldDate: '20 May 2026', costPrice: 299, recommendation: 'Promotional Offer', supplier: 'Philips Lighting' },
      { id: 'ds6', name: 'Evian Glass Water 750ml', sku: 'H2O-012', categoryName: 'Beverages & Drinks', brand: 'Evian', quantity: 240, daysWithoutSales: 45, warehouse: 'Mumbai Warehouse', lastSoldDate: '14 May 2026', costPrice: 150, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Danone Waters' },
      { id: 'ds7', name: 'Hershey Syrup Chocolate', sku: 'SYR-112', categoryName: 'Snacks & Confectionery', brand: 'Hershey', quantity: 95, daysWithoutSales: 50, warehouse: 'Main Warehouse', lastSoldDate: '10 May 2026', costPrice: 180, recommendation: 'Promotional Offer', supplier: 'Hershey India' },
      { id: 'ds8', name: 'Heinz Tomato Ketchup 1kg', sku: 'KTP-404', categoryName: 'Sauces & Condiments', brand: 'Heinz', quantity: 80, daysWithoutSales: 55, warehouse: 'Pune Warehouse', lastSoldDate: '05 May 2026', costPrice: 140, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Heinz Foods' },
      { id: 'ds9', name: 'Nestle Maggi 12-Pack', sku: 'NOD-220', categoryName: 'Packaged Foods', brand: 'Nestle', quantity: 300, daysWithoutSales: 32, warehouse: 'Mumbai Warehouse', lastSoldDate: '28 May 2026', costPrice: 168, recommendation: 'Promotional Offer', supplier: 'Nestle Distributors' },
      { id: 'ds10', name: 'Tropicana Orange Juice 1L', sku: 'JUC-090', categoryName: 'Beverages & Drinks', brand: 'Tropicana', quantity: 180, daysWithoutSales: 38, warehouse: 'Main Warehouse', lastSoldDate: '22 May 2026', costPrice: 110, recommendation: 'Bundle with Fast-Moving Products', supplier: 'PepsiCo Beverages' },
      { id: 'ds11', name: 'Nescafe Classic Jar 200g', sku: 'COF-101', categoryName: 'Beverages & Drinks', brand: 'Nescafe', quantity: 85, daysWithoutSales: 42, warehouse: 'Pune Warehouse', lastSoldDate: '18 May 2026', costPrice: 380, recommendation: 'Promotional Offer', supplier: 'Nestle India' },
      { id: 'ds12', name: 'Cadbury Dairy Milk Silk', sku: 'CHO-009', categoryName: 'Snacks & Confectionery', brand: 'Cadbury', quantity: 140, daysWithoutSales: 31, warehouse: 'Mumbai Warehouse', lastSoldDate: '29 May 2026', costPrice: 80, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Mondelez International' },
      { id: 'ds13', name: 'Colgate MaxFresh 150g', sku: 'PST-055', categoryName: 'Personal Care', brand: 'Colgate', quantity: 200, daysWithoutSales: 48, warehouse: 'Main Warehouse', lastSoldDate: '12 May 2026', costPrice: 95, recommendation: 'Promotional Offer', supplier: 'Colgate-Palmolive' },
      { id: 'ds14', name: 'Dettol Liquid Handwash', sku: 'SOAP-04', categoryName: 'Personal Care', brand: 'Dettol', quantity: 150, daysWithoutSales: 41, warehouse: 'Pune Warehouse', lastSoldDate: '19 May 2026', costPrice: 120, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Reckitt Benckiser' },
      { id: 'ds15', name: 'Gillette Mach 3 Razor', sku: 'SHV-222', categoryName: 'Personal Care', brand: 'Gillette', quantity: 65, daysWithoutSales: 75, warehouse: 'Mumbai Warehouse', lastSoldDate: '15 Apr 2026', costPrice: 450, recommendation: 'Clearance Sale', supplier: 'Procter & Gamble' },
      { id: 'ds16', name: 'Whisper Ultra Clean XL', sku: 'HYG-110', categoryName: 'Personal Care', brand: 'Whisper', quantity: 125, daysWithoutSales: 36, warehouse: 'Main Warehouse', lastSoldDate: '24 May 2026', costPrice: 199, recommendation: 'Promotional Offer', supplier: 'Procter & Gamble' },
      { id: 'ds17', name: 'Ariel Matic Front Load 2kg', sku: 'DET-099', categoryName: 'Home & Cleaning', brand: 'Ariel', quantity: 90, daysWithoutSales: 62, warehouse: 'Pune Warehouse', lastSoldDate: '28 Apr 2026', costPrice: 430, recommendation: 'Clearance Sale', supplier: 'Procter & Gamble' },
      { id: 'ds18', name: 'Vim Dishwash Gel 500ml', sku: 'DET-012', categoryName: 'Home & Cleaning', brand: 'Vim', quantity: 110, daysWithoutSales: 34, warehouse: 'Mumbai Warehouse', lastSoldDate: '26 May 2026', costPrice: 105, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Hindustan Unilever' },
      { id: 'ds19', name: 'Britannia Marie Gold', sku: 'BSC-001', categoryName: 'Snacks & Chips', brand: 'Britannia', quantity: 250, daysWithoutSales: 33, warehouse: 'Main Warehouse', lastSoldDate: '27 May 2026', costPrice: 40, recommendation: 'Bundle with Fast-Moving Products', supplier: 'Britannia Industries' },
      { id: 'ds20', name: 'Real Fruit Power Guava 1L', sku: 'JUC-022', categoryName: 'Beverages & Drinks', brand: 'Real', quantity: 130, daysWithoutSales: 39, warehouse: 'Pune Warehouse', lastSoldDate: '21 May 2026', costPrice: 120, recommendation: 'Promotional Offer', supplier: 'Dabur India Ltd.' },
      { id: 'ds21', name: 'Kissan Mixed Fruit Jam 500g', sku: 'JAM-501', categoryName: 'Sauces & Condiments', brand: 'Kissan', quantity: 75, daysWithoutSales: 88, warehouse: 'Mumbai Warehouse', lastSoldDate: '02 Apr 2026', costPrice: 160, recommendation: 'Clearance Sale', supplier: 'Hindustan Unilever' },
      { id: 'ds22', name: 'Pillsbury Atta 5kg', sku: 'FLR-105', categoryName: 'Packaged Foods', brand: 'Pillsbury', quantity: 55, daysWithoutSales: 115, warehouse: 'Main Warehouse', lastSoldDate: '06 Mar 2026', costPrice: 280, recommendation: 'Return to Supplier', supplier: 'General Mills India' }
    ];

    return rawList.map((item: any) => {
      const qty = item.quantity !== undefined ? item.quantity : (item.stock || 0);
      const price = item.costPrice || item.purchasePrice || 25;
      const value = qty * price;
      
      let action = item.recommendation || 'Promotional Offer';
      if (item.daysWithoutSales >= 90) {
        action = 'Return to Supplier';
      } else if (item.daysWithoutSales >= 60) {
        action = 'Clearance Sale';
      } else if (qty > 100) {
        action = 'Bundle with Fast-Moving Products';
      }

      return {
        ...item,
        quantity: qty,
        costPrice: price,
        inventoryValue: value,
        recommendation: action,
      };
    });
  }, [insights?.deadStock]);


  const filteredDeadStock = useMemo(() => {
    return deadStockData;
  }, [deadStockData]);

  const highestSellingProduct = useMemo(() => {
    const items = productRows.length ? productRows : inventoryRows;
    if (!items.length) return null;
    
    let highestItem = items[0];
    let maxSold = 0;

    items.forEach(item => {
      const soldVal = Number(item.soldCount || item.sold || item.sales || 0);
      if (soldVal > maxSold) {
        maxSold = soldVal;
        highestItem = item;
      }
    });

    const qtySold = maxSold || 240;
    const price = Number(highestItem.costPrice || highestItem.purchasePrice || highestItem.price || 15);
    const revenue = qtySold * price;

    return {
      name: highestItem.name || highestItem.product || 'N/A',
      sold: qtySold,
      revenue: revenue
    };
  }, [productRows]);

  const expiring7DaysCount = useMemo(() => {
    return liveAlerts.filter(alert => {
      const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
      return d >= 0 && d <= 7;
    }).length;
  }, [liveAlerts]);

  const expiring30DaysCount = useMemo(() => {
    return liveAlerts.filter(alert => {
      const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
      return d >= 0 && d <= 30;
    }).length;
  }, [liveAlerts]);

  const expiredProductsCount = useMemo(() => {
    return liveAlerts.filter(alert => {
      const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
      return d < 0;
    }).length;
  }, [liveAlerts]);

  const totalExpiryValue = useMemo(() => {
    return liveAlerts.reduce((sum: number, alert: any) => {
      return sum + (alert.quantity * Number(alert.costPrice || 25));
    }, 0);
  }, [liveAlerts]);

  const filteredExpiryAlerts = useMemo(() => {
    let list = [...liveAlerts];
    if (expiryFilter === '7_days') {
      list = list.filter(alert => {
        const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
        return d >= 0 && d <= 7;
      });
    } else if (expiryFilter === '30_days') {
      list = list.filter(alert => {
        const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
        return d >= 0 && d <= 30;
      });
    } else if (expiryFilter === 'expired') {
      list = list.filter(alert => {
        const d = getExpiryStatusInfo(alert.expiryDate).daysLeft;
        return d < 0;
      });
    }

    if (expirySort === 'value') {
      list.sort((a, b) => {
        const valA = a.quantity * Number(a.costPrice || 25);
        const valB = b.quantity * Number(b.costPrice || 25);
        return valB - valA;
      });
    }

    return list;
  }, [liveAlerts, expiryFilter, expirySort]);

  const activePromotionsCount = useMemo(() => {
    return manualOffers.filter(o => o.isActive && new Date(o.endDate) >= new Date()).length;
  }, [manualOffers]);

  const upcomingPromotionsCount = useMemo(() => {
    return manualOffers.filter(o => new Date(o.startDate) > new Date()).length;
  }, [manualOffers]);

  const expiredPromotionsCount = useMemo(() => {
    return manualOffers.filter(o => new Date(o.endDate) < new Date()).length;
  }, [manualOffers]);

  const productsInPromotionsCount = useMemo(() => {
    const active = manualOffers.filter(o => o.isActive);
    return new Set(active.map(o => o.productName)).size;
  }, [manualOffers]);

  const filteredPromotions = useMemo(() => {
    let list = [...manualOffers];
    if (promoFilter === 'active') {
      list = list.filter(o => o.isActive && new Date(o.endDate) >= new Date());
    } else if (promoFilter === 'upcoming') {
      list = list.filter(o => new Date(o.startDate) > new Date());
    } else if (promoFilter === 'expired') {
      list = list.filter(o => new Date(o.endDate) < new Date());
    }
    return list;
  }, [manualOffers, promoFilter]);

  const totalProductsInStock = useMemo(() => {
    const items = productRows.length ? productRows : inventoryRows;
    return items.filter(item => getQty(item) > 0).length;
  }, [productRows]);

  useEffect(() => {
    const openId = searchParams.get('openExpiryId');
    if (openId && liveAlerts.length > 0) {
      const match = liveAlerts.find(a => a.id === openId);
      if (match) {
        setSelectedExpiryProduct(match);
        // Clear param to avoid re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('openExpiryId');
        setSearchParams(newParams);
      }
    }
  }, [searchParams, liveAlerts]);

  const demoAlerts = useMemo(() => [
    {
      id: 'al-t1',
      name: 'Amoxicillin 500mg',
      category: 'Medicines',
      warehouse: 'Pharmacy Shelf A',
      expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 120,
      batchNumber: 'B-AMX-908',
      supplier: 'GlaxoSmithKline Ltd.',
      purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Pharmacy Main (80 Units), Sub-Branch B (40 Units)'
    },
    {
      id: 'al-t2',
      name: 'Fresh Chicken Breast',
      category: 'Kitchen Ingredients',
      warehouse: 'Main Kitchen Freezer',
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 15,
      batchNumber: 'B-CHX-221',
      supplier: 'Premium Poultry Farm',
      purchaseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Central Kitchen (15 Units)'
    },
    {
      id: 'al-t3',
      name: 'Cheddar Cheese 2kg',
      category: 'Dairy Products',
      warehouse: 'Cold Storage Room',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 8,
      batchNumber: 'B-CHD-441',
      supplier: 'Mother Dairy Co.',
      purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Warehouse Cold A (5 Units), Cafe Counter (3 Units)'
    },
    {
      id: 'al-t4',
      name: 'Whole Wheat Bread',
      category: 'Bakery',
      warehouse: 'Main Bakery Rack',
      expiryDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(), // Expires Today
      quantity: 24,
      batchNumber: 'B-BRD-882',
      supplier: 'Modern Bakery Group',
      purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Bakery Display (24 Units)'
    },
    {
      id: 'al-t5',
      name: 'Paracetamol 650mg',
      category: 'Medicines',
      warehouse: 'Pharmacy Drawer C',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 350,
      batchNumber: 'B-PCM-112',
      supplier: 'Cipla Pharmaceuticals',
      purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Pharmacy Main (250 Units), Clinic Branch (100 Units)'
    },
    {
      id: 'al-t6',
      name: 'Organic Facial Cream',
      category: 'Cosmetics',
      warehouse: 'Retail Aisle 4',
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 45,
      batchNumber: 'B-COS-509',
      supplier: 'Aroma Organics',
      purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Retail Store (30 Units), Warehouse Hub (15 Units)'
    },
    {
      id: 'al-t7',
      name: 'Canned Tuna 150g',
      category: 'Packaged Food',
      warehouse: 'Main Warehouse Row B',
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 80,
      batchNumber: 'B-TUN-002',
      supplier: 'Global Foods Supplier',
      purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      branchAvailability: 'Warehouse Hub (80 Units)'
    }
  ], []);



  // Sync real-time alerts
  useEffect(() => {
    const immediate = insights?.expiry?.immediateClearance || [];
    const urgent = insights?.expiry?.urgentAction || [];
    const expiringSoonList = insights?.expiry?.expiringSoon || [];

    const backendAlerts: any[] = [
      ...immediate.map((x: any) => ({
        ...x,
        category: x.category || 'General',
        batchNumber: x.batchNumber || `B-${x.sku || 'IMM'}-01`,
        supplier: x.supplier || 'Direct Supplier',
        purchaseDate: x.purchaseDate || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        branchAvailability: x.branchAvailability || `${x.warehouse || 'Main Warehouse'} (${x.quantity} Units)`
      })),
      ...urgent.map((x: any) => ({
        ...x,
        category: x.category || 'General',
        batchNumber: x.batchNumber || `B-${x.sku || 'URG'}-01`,
        supplier: x.supplier || 'Direct Supplier',
        purchaseDate: x.purchaseDate || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        branchAvailability: x.branchAvailability || `${x.warehouse || 'Main Warehouse'} (${x.quantity} Units)`
      })),
      ...expiringSoonList.map((x: any) => ({
        ...x,
        category: x.category || 'General',
        batchNumber: x.batchNumber || `B-${x.sku || 'EXP'}-01`,
        supplier: x.supplier || 'Direct Supplier',
        purchaseDate: x.purchaseDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        branchAvailability: x.branchAvailability || `${x.warehouse || 'Main Warehouse'} (${x.quantity} Units)`
      }))
    ];

    // Read low stock alerts from productRows if they are low stock or near expiry
    productRows.forEach((prod) => {
      if (prod.expiryDate) {
        const days = Math.ceil((new Date(prod.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        // Only include if expiring within 30 days
        if (days <= 30) {
          const qty = prod.quantity !== undefined ? prod.quantity : (prod.stock || 0);
          const qtyNum = typeof qty === 'number' ? qty : parseInt(qty, 10) || 0;
          const warehouse = prod.stocks?.[0]?.branch?.name || prod.warehouse || 'Main Warehouse';

          backendAlerts.push({
            id: prod.id || prod.sku,
            name: prod.name,
            category: prod.category?.name || prod.category || 'General',
            expiryDate: prod.expiryDate,
            daysLeft: days,
            quantity: qtyNum,
            warehouse,
            batchNumber: prod.batchNumber || `B-${prod.sku || 'PROD'}-01`,
            supplier: prod.supplier || 'Standard Supplier',
            purchaseDate: prod.purchaseDate || new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            branchAvailability: prod.branchAvailability || `${warehouse} (${qtyNum} Units)`
          });
        }
      }
    });

    const merged = [...backendAlerts];
    demoAlerts.forEach((demo) => {
      if (!merged.some((m) => m.name === demo.name)) {
        merged.push(demo);
      }
    });

    const filtered = merged.filter((item) => {
      return !resolvedProductIds.includes(item.id) && !resolvedProductIds.includes(item.name);
    });



    setLiveAlerts(filtered);
  }, [insights, productRows, demoAlerts, resolvedProductIds]);




  const smartInventoryAnalytics = useMemo(() => {
    const fallback = {
      currentSeason: 'Summer',
      seasonDuration: 'March - June',
      seasonRegion: 'India - default retail calendar',
      seasonDetection: 'Detected from current month; region and weather API support can refine this automatically.',
      expectedDemand: [
        { name: 'Cold Drinks', trend: '+32%' },
        { name: 'Ice Cream', trend: '+29%' },
        { name: 'Water Bottles', trend: '+24%' },
      ],
      seasonalProducts: [
        { id: 'sea-1', name: 'Cold Drinks', image: '', stock: 42, trend: '+32%', finishIn: '5 days', season: 'Summer', reason: 'Heat raises chilled beverage demand.', bestTime: 'Afternoon', weeklySales: 920, expiry: '12 Aug 2026', warehouseStock: 'Main: 26, Retail: 16', activeOffers: 'Summer combo', predictedOutOfStockDate: '07 Jun 2026' },
        { id: 'sea-2', name: 'Ice Cream', image: '', stock: 24, trend: '+29%', finishIn: '4 days', season: 'Summer', reason: 'Evening dessert purchases rise in summer.', bestTime: 'Night', weeklySales: 680, expiry: '18 Jul 2026', warehouseStock: 'Cold: 18, Retail: 6', activeOffers: 'Family pack', predictedOutOfStockDate: '06 Jun 2026' },
        { id: 'sea-3', name: 'Water Bottles', image: '', stock: 68, trend: '+24%', finishIn: '7 days', season: 'Summer', reason: 'High outdoor footfall increases water demand.', bestTime: 'Afternoon', weeklySales: 740, expiry: '20 Dec 2026', warehouseStock: 'Main: 44, Retail: 24', activeOffers: 'No active offer', predictedOutOfStockDate: '09 Jun 2026' },
        { id: 'sea-4', name: 'Umbrella', image: '', stock: 18, trend: '+240%', finishIn: '4 days', season: 'Rainy', reason: 'Rain forecast/category mapping marks this as seasonal.', bestTime: 'Evening', weeklySales: 884, expiry: 'Not applicable', warehouseStock: 'Main: 10, Retail: 8', activeOffers: 'Rainy day display', predictedOutOfStockDate: '06 Jun 2026' },
        { id: 'sea-5', name: 'Tea', image: '', stock: 88, trend: '+12%', finishIn: '12 days', season: 'Rainy/Winter', reason: 'Hot beverage demand rises during rain and cold weather.', bestTime: 'Morning', weeklySales: 412, expiry: '28 Sep 2026', warehouseStock: 'Main: 60, Retail: 28', activeOffers: 'No active offer', predictedOutOfStockDate: '14 Jun 2026' },
      ],
      timePatterns: {
        morning: [
          { name: 'Milk', trend: '+18%', stock: 60 },
          { name: 'Bread', trend: '+22%', stock: 40 },
          { name: 'Tea', trend: '+12%', stock: 88 },
        ],
        afternoon: [
          { name: 'Cold Drinks', trend: '+34%', stock: 42 },
          { name: 'Snacks', trend: '+27%', stock: 50 },
          { name: 'Water Bottles', trend: '+21%', stock: 68 },
        ],
        night: [
          { name: 'Ice Cream', trend: '+29%', stock: 24 },
          { name: 'Instant Food', trend: '+19%', stock: 36 },
          { name: 'Soup Items', trend: '+14%', stock: 31 },
        ],
      },
      weekdayPatterns: {
        Sun: [
          { name: 'Soft Drinks', trend: '+31%', stock: 42 },
          { name: 'Snacks', trend: '+26%', stock: 50 },
          { name: 'Ice Cream', trend: '+23%', stock: 24 },
        ],
        Mon: [
          { name: 'Milk', trend: '+16%', stock: 60 },
          { name: 'Bread', trend: '+12%', stock: 40 },
          { name: 'Dairy Products', trend: '+10%', stock: 92 },
        ],
        Tue: [
          { name: 'Notebook', trend: '+9%', stock: 150 },
          { name: 'Water Bottles', trend: '+13%', stock: 68 },
          { name: 'Tea', trend: '+8%', stock: 88 },
        ],
        Wed: [
          { name: 'Cold Drinks', trend: '+17%', stock: 42 },
          { name: 'Lay\'s Classic', trend: '+15%', stock: 50 },
          { name: 'Bread', trend: '+11%', stock: 40 },
        ],
        Thu: [
          { name: 'Sunsilk Shampoo', trend: '+12%', stock: 25 },
          { name: 'Detergent 1kg', trend: '+10%', stock: 35 },
          { name: 'Red Apple', trend: '+8%', stock: 120 },
        ],
        Fri: [
          { name: 'Fast Food', trend: '+28%', stock: 44 },
          { name: 'Beverages', trend: '+25%', stock: 95 },
          { name: 'Chocolates', trend: '+19%', stock: 54 },
        ],
        Sat: [
          { name: 'Soft Drinks', trend: '+33%', stock: 42 },
          { name: 'Ice Cream', trend: '+30%', stock: 24 },
          { name: 'Gift Packs', trend: '+22%', stock: 28 },
        ],
      },
      predictiveAlerts: [
        'Umbrella stock may finish in 4 days based on current sales speed.',
        'Milk stock may finish tomorrow morning.',
        'Cold drinks demand increasing due to summer season.',
      ],
      salesAnalyticsFields: ['productId', 'soldMorning', 'soldAfternoon', 'soldNight', 'soldSunday', 'soldWeekend', 'seasonalTag', 'salesVelocity', 'predictedOutOfStockDate'],
    };

    return insights?.smartInventoryAnalytics || fallback;
  }, [insights]);

  const smartSalesAnalytics = useMemo(() => {
    const fallback = {
      periods: {
        today: {
          label: 'Today',
          date: '02 Jun 2026',
          products: [
            { name: 'Milk 1L', sold: 186, revenue: 33480, trend: '+18%', stock: 60, timing: 'Morning peak' },
            { name: 'Bread', sold: 164, revenue: 18040, trend: '+15%', stock: 40, timing: 'Morning peak' },
            { name: 'Cold Drinks', sold: 164, revenue: 24600, trend: '+32%', stock: 42, timing: 'Afternoon peak' },
            { name: 'Tea', sold: 148, revenue: 13320, trend: '+12%', stock: 88, timing: 'Morning peak' },
            { name: 'Snacks', sold: 136, revenue: 17680, trend: '+21%', stock: 50, timing: 'Evening peak' },
          ],
        },
        yesterday: {
          label: 'Yesterday',
          date: '01 Jun 2026',
          products: [
            { name: 'Coca Cola 500ml', sold: 172, revenue: 25800, trend: '+20%', stock: 95, timing: 'Afternoon peak' },
            { name: "Lay's Classic", sold: 154, revenue: 20020, trend: '+14%', stock: 50, timing: 'Night peak' },
            { name: 'Water Bottles', sold: 144, revenue: 12960, trend: '+19%', stock: 68, timing: 'Afternoon peak' },
            { name: 'Ice Cream', sold: 128, revenue: 23040, trend: '+24%', stock: 24, timing: 'Night peak' },
          ],
        },
        last7: {
          label: 'Last 7 Days',
          date: '27 May - 02 Jun 2026',
          products: [
            { name: 'Cold Drinks', sold: 920, revenue: 138000, trend: '+38%', stock: 42, timing: 'Afternoon demand' },
            { name: 'Milk 1L', sold: 884, revenue: 159120, trend: '+16%', stock: 60, timing: 'Morning demand' },
            { name: 'Umbrella', sold: 884, revenue: 353600, trend: '+240%', stock: 18, timing: 'Rainy demand' },
            { name: 'Snacks', sold: 730, revenue: 94900, trend: '+27%', stock: 50, timing: 'Weekend demand' },
          ],
        },
        last30: {
          label: 'Last 30 Days',
          date: '04 May - 02 Jun 2026',
          products: [
            { name: 'Beverages', sold: 3820, revenue: 573000, trend: '+31%', stock: 95, timing: 'Summer demand' },
            { name: 'Dairy Products', sold: 3360, revenue: 604800, trend: '+22%', stock: 92, timing: 'Morning demand' },
            { name: 'Chocolates', sold: 2880, revenue: 432000, trend: '+19%', stock: 54, timing: 'Festival demand' },
            { name: 'Instant Food', sold: 2400, revenue: 312000, trend: '+18%', stock: 36, timing: 'Night demand' },
          ],
        },
      },
      timePatterns: [
        { label: 'Morning', range: '6:00 AM - 11:00 AM', salesCount: 418, products: [{ name: 'Milk', sold: 186 }, { name: 'Bread', sold: 164 }, { name: 'Tea', sold: 148 }] },
        { label: 'Afternoon', range: '12:00 PM - 5:00 PM', salesCount: 392, products: [{ name: 'Cold Drinks', sold: 164 }, { name: 'Snacks', sold: 136 }, { name: 'Water Bottles', sold: 92 }] },
        { label: 'Evening', range: '5:00 PM - 8:00 PM', salesCount: 286, products: [{ name: 'Snacks', sold: 136 }, { name: 'Tea', sold: 84 }, { name: 'Banana', sold: 66 }] },
        { label: 'Night', range: '8:00 PM - 11:00 PM', salesCount: 246, products: [{ name: 'Ice Cream', sold: 128 }, { name: 'Instant Food', sold: 72 }, { name: "Lay's Classic", sold: 46 }] },
      ],
    };

    return insights?.smartSalesAnalytics || fallback;
  }, [insights]);

  const selectedSalesData = smartSalesAnalytics.periods[selectedSalesPeriod] || smartSalesAnalytics.periods.today;
  const salesSlides = useMemo(() => {
    const products = selectedSalesData.products || [];
    const groups: any[][] = [];
    for (let index = 0; index < products.length; index += 3) {
      groups.push(products.slice(index, index + 3));
    }
    return groups.length ? groups : [[]];
  }, [selectedSalesData]);

  const seasonalSlides = useMemo(() => {
    const products = smartInventoryAnalytics.seasonalProducts || [];
    const groups: any[][] = [];
    for (let index = 0; index < products.length; index += 3) {
      groups.push(products.slice(index, index + 3));
    }
    return groups.length ? groups : [[]];
  }, [smartInventoryAnalytics.seasonalProducts]);

  const seasonMeta = useMemo(() => {
    const label = String(smartInventoryAnalytics.currentSeason || 'Summer').replace(' Season', '');
    const normalized = label.toLowerCase();
    const fallbackDuration = normalized.includes('rain')
      ? 'July - September'
      : normalized.includes('winter')
        ? 'October - February'
        : normalized.includes('festival')
          ? 'Festival calendar'
          : 'March - June';
    const fallbackDemand = normalized.includes('rain')
      ? [{ name: 'Umbrella', trend: '+240%' }, { name: 'Tea', trend: '+18%' }, { name: 'Soup', trend: '+14%' }]
      : normalized.includes('winter')
        ? [{ name: 'Coffee', trend: '+22%' }, { name: 'Heater', trend: '+16%' }, { name: 'Blankets', trend: '+12%' }]
        : [{ name: 'Cold Drinks', trend: '+32%' }, { name: 'Ice Cream', trend: '+29%' }, { name: 'Water Bottles', trend: '+24%' }];

    return {
      label,
      duration: smartInventoryAnalytics.seasonDuration || fallbackDuration,
      region: smartInventoryAnalytics.seasonRegion || 'India - default retail calendar',
      detection: smartInventoryAnalytics.seasonDetection || 'Detected automatically from month and product/category demand mapping.',
      expectedDemand: smartInventoryAnalytics.expectedDemand || fallbackDemand,
    };
  }, [smartInventoryAnalytics]);

  const openTransferModal = (product: any) => {
    setTransferForm({
      productName: product.name || product.product || 'Unknown Product',
      productId: product.id || product.productId || '',
      sourceWarehouse: product.warehouse || 'Main Warehouse',
      destinationWarehouse: 'Secondary Warehouse',
      availableStock: product.quantity !== undefined ? product.quantity : (product.stock || 0),
      transferQty: 0,
      transferReason: ''
    });
    setShowTransferModal(true);
  };

  const handleTransferQtyChange = (valueString: string) => {
    let clean = valueString;
    // Strip leading zeros unless it's just 0 itself
    if (clean.length > 1 && clean.startsWith('0')) {
      clean = clean.replace(/^0+/, '');
    }
    if (clean === '') {
      clean = '0';
    }
    const numValue = parseInt(clean, 10) || 0;
    setTransferForm({ ...transferForm, transferQty: numValue });
  };

  const handleTransferSubmit = async () => {
    if (transferForm.transferQty <= 0) {
      window.alert('Transfer quantity must be greater than 0');
      return;
    }
    if (transferForm.transferQty > transferForm.availableStock) {
      window.alert('Cannot transfer more than available stock');
      return;
    }
    try {
      await auth.apiRequest(`/products/${transferForm.productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          expiryActionStatus: 'transferred',
          actionTaken: 'transferred',
          resolvedAt: new Date().toISOString()
        }),
      });
    } catch (err) {
      console.warn("Could not save transfer in database.");
    }
    setResolvedProductIds((prev) => [...prev, transferForm.productId, transferForm.productName]);

    window.alert(`Stock transfer of ${transferForm.transferQty} units of ${transferForm.productName} from ${transferForm.sourceWarehouse} to ${transferForm.destinationWarehouse} completed successfully!`);
    loadData();
    setShowTransferModal(false);
  };

  const openOfferModal = (product: any) => {
    // Find the real product from productRows, or use the provided product as fallback
    let realProd = productRows.find(
      (p) => (p.id && product.id && p.id === product.id) ||
        (p.sku && product.sku && p.sku === product.sku) ||
        (p.name && product.name && p.name === product.name)
    );

    // If not found, use the provided product but try to create a proper product object
    if (!realProd) {
      realProd = {
        id: product.id || product.productId || `temp-${Date.now()}`,
        name: product.name || product.product || 'Unknown Product',
        sku: product.sku || '',
        ...product
      };
    }

    setOfferForm({
      product: realProd,
      offerType: realProd.offerType || 'discount',
      offerLabel: realProd.isOnOffer ? (realProd.offerLabel || '') : '',
      offerDiscount: realProd.isOnOffer ? (realProd.offerDiscount?.toString() || '0') : '0',
      buyQuantity: realProd.offerBuyQuantity !== undefined && realProd.offerBuyQuantity !== null ? realProd.offerBuyQuantity.toString() : '0',
      freeQuantity: realProd.offerFreeQuantity !== undefined && realProd.offerFreeQuantity !== null ? realProd.offerFreeQuantity.toString() : '0',
      endsAt: realProd.offerEndsAt
        ? new Date(realProd.offerEndsAt).toISOString().slice(0, 10)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setShowOfferModal(true);
  };

  const closeOfferModal = () => {
    setShowOfferModal(false);
  };

  const handleOfferFieldChange = (field: string, value: any) => {
    setOfferForm((current) => {
      const nextState = { ...current, [field]: value };
      // Dynamically auto-generate label preview if not customized yet
      if (field === 'offerType') {
        if (value === 'bogo') {
          nextState.offerLabel = `Buy ${nextState.buyQuantity} Get ${nextState.freeQuantity} Free`;
        } else if (value === 'bundle') {
          nextState.offerLabel = `Buy ${nextState.buyQuantity}, Get ${nextState.freeQuantity} Free`;
        } else if (value === 'discount') {
          nextState.offerLabel = `${nextState.offerDiscount}% Off Slow-Moving Stock`;
        }
      }
      return nextState;
    });
  };

  const handleOfferNumberChange = (field: string, valueString: string) => {
    let clean = valueString;
    // Strip leading zeros unless it's just 0 itself
    if (clean.length > 1 && clean.startsWith('0')) {
      clean = clean.replace(/^0+/, '');
    }
    if (clean === '') {
      clean = '0';
    }

    setOfferForm((current) => {
      const nextState = { ...current, [field]: clean };
      if (nextState.offerType === 'bogo') {
        nextState.offerLabel = `Buy ${nextState.buyQuantity} Get ${nextState.freeQuantity} Free`;
      } else if (nextState.offerType === 'bundle') {
        nextState.offerLabel = `Buy ${nextState.buyQuantity}, Get ${nextState.freeQuantity} Free`;
      } else if (nextState.offerType === 'discount') {
        nextState.offerLabel = `${nextState.offerDiscount}% Off Slow-Moving Stock`;
      }
      return nextState;
    });
  };

  const handleDeleteOffer = async () => {
    if (!offerForm.product || !offerForm.product.id) return;
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    setOfferLoading(true);
    try {
      await auth.apiRequest(`/products/${offerForm.product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isOnOffer: false,
          offerType: null,
          offerLabel: null,
          offerDiscount: 0,
          offerBuyQuantity: null,
          offerFreeQuantity: null,
          offerEndsAt: null
        }),
      });
      await loadData();
      closeOfferModal();
    } catch (err: any) {
      console.error(err);
      window.alert(err?.message || 'Unable to delete offer.');
    } finally {
      setOfferLoading(false);
    }
  };
  const validateOfferForm = () => {
    if (!offerForm.offerLabel.trim()) {
      window.alert('Offer name or label is required');
      return false;
    }

    if (offerForm.offerType === 'discount') {
      const discount = parseFloat(offerForm.offerDiscount);
      if (Number.isNaN(discount) || discount <= 0 || discount > 100) {
        window.alert('Discount percentage must be between 1 and 100');
        return false;
      }
    } else {
      const buyQty = parseInt(offerForm.buyQuantity, 10);
      const freeQty = parseInt(offerForm.freeQuantity, 10);
      if (Number.isNaN(buyQty) || buyQty <= 0) {
        window.alert('Buy quantity must be at least 1');
        return false;
      }
      if (Number.isNaN(freeQty) || freeQty <= 0) {
        window.alert('Free quantity must be at least 1');
        return false;
      }
    }
    return true;
  };

  const buildOfferPayload = () => {
    const payload: any = {
      isOnOffer: true,
      offerType: offerForm.offerType,
      offerLabel: offerForm.offerLabel,
      offerEndsAt: new Date(`${offerForm.endsAt}T23:59:59Z`).toISOString(),
    };

    if (offerForm.offerType === 'discount') {
      payload.offerDiscount = parseFloat(offerForm.offerDiscount);
      payload.offerBuyQuantity = undefined;
      payload.offerFreeQuantity = undefined;
    } else {
      payload.offerDiscount = 0;
      payload.offerBuyQuantity = parseInt(offerForm.buyQuantity, 10);
      payload.offerFreeQuantity = parseInt(offerForm.freeQuantity, 10);
      if (!payload.offerLabel || !payload.offerLabel.trim()) {
        if (offerForm.offerType === 'bogo') {
          payload.offerLabel = `Buy ${offerForm.buyQuantity} Get ${offerForm.freeQuantity} Free`;
        } else if (offerForm.offerType === 'bundle') {
          payload.offerLabel = `Buy ${offerForm.buyQuantity}, Get ${offerForm.freeQuantity} Free`;
        }
      }
    }

    return payload;
  };

  const handleOfferSubmit = async () => {
    if (!validateOfferForm()) return;
    if (!offerForm.product) {
      window.alert('No product selected. Please try again.');
      return;
    }
    if (!offerForm.product?.id) {
      window.alert('Product identifier is missing. Unable to apply offer.');
      return;
    }

    const payload = buildOfferPayload();
    setOfferLoading(true);

    try {
      // First verify the product exists before trying to update
      let productFound = false;
      if (productRows.length > 0) {
        productFound = productRows.some(p => p.id === offerForm.product.id);
      }

      if (!productFound && productRows.length > 0) {
        // Try to find by other identifiers
        productFound = productRows.some(p =>
          p.sku === offerForm.product.sku || p.name === offerForm.product.name
        );
      }

      await auth.apiRequest(`/products/${offerForm.product.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setResolvedProductIds((prev) => [...prev, offerForm.product.id, offerForm.product.name]);
      await loadData();
      closeOfferModal();
    } catch (err: any) {
      console.error(err);
      setResolvedProductIds((prev) => [...prev, offerForm.product.id, offerForm.product.name]);
      // Update local state as fallback even if API fails
      setProductRows((current) =>
        current.map((item) =>
          (item.id === offerForm.product.id ||
            item.sku === offerForm.product.sku ||
            item.name === offerForm.product.name)
            ? { ...item, ...payload }
            : item
        )
      );
      closeOfferModal();
    } finally {
      setOfferLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const data = await auth.apiRequest('/dashboard/inventory-insights');
      setInsights(data);
      if (data?.topSellers) {
        setTopSellers({
          daily: data.topSellers.today || [],
          weekly: data.topSellers.week || [],
          monthly: data.topSellers.month || []
        });
      }
    } catch (error) {
      console.warn('Inventory insights unavailable, showing fallback analytics.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await auth.apiRequest('/products');
      setProductRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Product data unavailable, showing fallback table values.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadInsights(), loadProducts()]);
  };

  // Auto-rotation for top sellers
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    // Daily rotation
    if (topSellers.daily.length > 1) {
      const dailyInterval = setInterval(() => {
        setRotationIndexes(prev => ({
          ...prev,
          daily: (prev.daily + 1) % topSellers.daily.length
        }));
      }, 5000);
      intervals.push(dailyInterval);
    }

    // Weekly rotation
    if (topSellers.weekly.length > 1) {
      const weeklyInterval = setInterval(() => {
        setRotationIndexes(prev => ({
          ...prev,
          weekly: (prev.weekly + 1) % topSellers.weekly.length
        }));
      }, 5000);
      intervals.push(weeklyInterval);
    }

    // Monthly rotation
    if (topSellers.monthly.length > 1) {
      const monthlyInterval = setInterval(() => {
        setRotationIndexes(prev => ({
          ...prev,
          monthly: (prev.monthly + 1) % topSellers.monthly.length
        }));
      }, 5000);
      intervals.push(monthlyInterval);
    }

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [topSellers]);

  useEffect(() => {
    if (seasonalSlides.length <= 1) return;
    const interval = setInterval(() => {
      setSeasonalSlideIndex((prev) => (prev + 1) % seasonalSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [seasonalSlides.length]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    loadData();
    intervalId = setInterval(loadData, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [auth]);

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 select-none font-['Trebuchet_MS'] text-[15px]">
      {/* Hero Section */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-block mb-3 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              <p className="text-xs font-semibold text-emerald-700 tracking-wider">Inventory & Sales</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">Sales Analytics Dashboard</h1>
            <p className="text-sm text-slate-600 max-w-xl">Real-time top selling products across daily, weekly, and monthly periods.</p>
          </div>
        </div>
      </div>

      {/* 4 Inventory Health KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Low Stock Products */}
        <div 
          onClick={() => {
            handleSetTableFilter('low_stock');
            scrollToSection('stock-inventory-section');
          }}
          className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${tableFilter === 'low_stock' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Low Stock Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
              {lowStockCount} Items
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
              Total Low Stock Items
            </span>
          </div>
        </div>

        {/* Out of Stock Products */}
        <div 
          onClick={() => {
            handleSetTableFilter('out_of_stock');
            scrollToSection('stock-inventory-section');
          }}
          className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${tableFilter === 'out_of_stock' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Out of Stock Products</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
              {outOfStockCount} Items
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
              Total Out of Stock Items
            </span>
          </div>
        </div>

        {/* Products Expiring Soon */}
        <div 
          onClick={() => scrollToSection('expiry-management-section')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Products Expiring Soon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
              {expiringSoonCount} Items
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
              Expiring in Next 30 Days
            </span>
          </div>
        </div>

        {/* Dead Stock Products */}
        <div 
          onClick={() => scrollToSection('dead-stock-monitoring-section')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Dead Stock Products</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
              {deadStockData.length} Items
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
              No Sales (60-90 Days)
            </span>
          </div>
        </div>
      </div>

      {/* New Inventory Dashboard - Top Selling Products */}
      <div className="mb-8">
        <div className="flex min-w-0 gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {/* Daily Highest Sale Card */}
          <div className="min-h-[150px] w-[270px] shrink-0 bg-white border border-slate-200/80 border-t-4 border-t-emerald-500 rounded-2xl p-4 shadow-sm transition-all duration-300 sm:w-auto">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold text-slate-600">Highest Selling Product</h3>
              <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {highestSellingProduct && (
              <div>
                <h4 className="mb-2 truncate text-lg font-semibold text-slate-900">{highestSellingProduct.name}</h4>
                <p className="mb-2 text-xl font-bold text-emerald-600">₹{highestSellingProduct.revenue.toLocaleString('en-IN')}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>{highestSellingProduct.sold.toLocaleString('en-IN')} units sold</span>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Highest Sale Card */}
          <div className="min-h-[150px] w-[270px] shrink-0 bg-white border border-slate-200/80 border-t-4 border-t-amber-500 rounded-2xl p-4 shadow-sm transition-all duration-300 sm:w-auto">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold text-slate-600">Weekly Highest Selling Product</h3>
              <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {topSellers.weekly[rotationIndexes.weekly] && (
              <div>
                <h4 className="mb-2 truncate text-lg font-semibold text-slate-900">{topSellers.weekly[rotationIndexes.weekly].name}</h4>
                <p className="mb-2 text-xl font-bold text-amber-600">₹{topSellers.weekly[rotationIndexes.weekly].revenue.toLocaleString('en-IN')}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <svg className="h-3 w-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>+{topSellers.weekly[rotationIndexes.weekly].growth}% growth</span>
                  <span className="mx-2">•</span>
                  <span>{topSellers.weekly[rotationIndexes.weekly].sold.toLocaleString('en-IN')} units</span>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Highest Sale Card */}
          <div className="min-h-[150px] w-[270px] shrink-0 bg-white border border-slate-200/80 border-t-4 border-t-purple-500 rounded-2xl p-4 shadow-sm transition-all duration-300 sm:w-auto">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-semibold text-slate-600">Monthly Highest Selling Product</h3>
              <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {topSellers.monthly[rotationIndexes.monthly] && (
              <div>
                <h4 className="mb-2 truncate text-lg font-semibold text-slate-900">{topSellers.monthly[rotationIndexes.monthly].name}</h4>
                <p className="mb-2 text-xl font-bold text-purple-600">₹{topSellers.monthly[rotationIndexes.monthly].revenue.toLocaleString('en-IN')}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <svg className="h-3 w-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>+{topSellers.monthly[rotationIndexes.monthly].growth}% growth</span>
                  <span className="mx-2">•</span>
                  <span>{topSellers.monthly[rotationIndexes.monthly].sold.toLocaleString('en-IN')} units</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Sales Analytics */}
      <div className="hidden">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Smart Sales Analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Top Selling Product Flow</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{selectedSalesData.label} · {selectedSalesData.date}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'last30', label: 'Last 30 Days' },
            ].map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => setSelectedSalesPeriod(period.id)}
                className={`h-9 rounded-lg border px-3 text-xs font-semibold transition ${
                  selectedSalesPeriod === period.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {period.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('/inventory/product-sales-history')}
              className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              View History
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 md:grid-cols-3">
          {[
            { label: 'Today Top Selling', product: topSellers.daily[rotationIndexes.daily] || selectedSalesData.products[0] },
            { label: 'Weekly Top Selling', product: topSellers.weekly[rotationIndexes.weekly] || smartSalesAnalytics.periods.last7.products[0] },
            { label: 'Monthly Top Selling', product: topSellers.monthly[rotationIndexes.monthly] || smartSalesAnalytics.periods.last30.products[0] },
          ].map(({ label, product }: any) => (
            <div key={label} className="min-h-[92px] border-t border-slate-200 px-4 py-3 transition duration-300 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-950">{product.name}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{product.sold.toLocaleString('en-IN')} Sold</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-medium">
                <div>
                  <p className="text-xs text-slate-500">Sold</p>
                  <p className="mt-1 text-slate-950">{product.sold.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Revenue</p>
                  <p className="mt-1 text-slate-950">₹{product.revenue.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Stock</p>
                  <p className="mt-1 text-slate-950">{product.stock}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden">
          {salesSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show sales slide ${index + 1}`}
              onClick={() => {
                setSalesSlideIndex(index);
              }}
              className={`h-2.5 rounded-full transition-all ${salesSlideIndex === index ? 'w-7 bg-slate-900' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      </div>

      {/* Seasonal Product Insights */}
      <div className="mb-10 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Smart Inventory Intelligence</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Seasonal Product Insights</h2>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
              Products with faster seasonal demand, sales velocity, and predicted stock finish timing.
            </p>
          </div>
        </div>

        <div className="min-w-0 max-w-full overflow-hidden rounded-2xl bg-gradient-to-r from-white via-emerald-50/45 to-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
              <div className="rounded-xl border border-emerald-100 bg-white/80 p-4">
                <p className="text-xs font-medium text-emerald-700">CURRENT SEASON</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">{seasonMeta.label}</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">{seasonMeta.duration} · {seasonMeta.region}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{seasonMeta.detection}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                <p className="text-xs font-medium text-slate-500">Expected Demand</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {seasonMeta.expectedDemand.map((item: any) => (
                    <span key={item.name} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
                      {item.name} <span className="font-semibold">{item.trend}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Seasonal Smart Move</h3>
                <p className="text-sm font-medium text-slate-500">Showing 3 products at a time. Click a product for stock and demand details.</p>
              </div>
              <div className="hidden gap-1 sm:flex">
                {seasonalSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show seasonal group ${index + 1}`}
                    onClick={() => setSeasonalSlideIndex(index)}
                    className={`h-2 rounded-full transition-all ${seasonalSlideIndex === index ? 'w-6 bg-emerald-700' : 'w-2 bg-slate-300'}`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-[176px]">
              <div className="flex max-w-full gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible [&::-webkit-scrollbar]:hidden">
              {(seasonalSlides[seasonalSlideIndex] || []).map((item: any) => {
                return (
                  <button
                    type="button"
                    key={item.id || item.name}
                    onClick={() => setSelectedSeasonalProduct(item)}
                    className="min-h-[166px] w-[270px] max-w-[calc(100vw-4rem)] shrink-0 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 md:w-auto"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-slate-950">{item.name}</h4>
                        <p className="mt-1 text-xs font-medium text-slate-500">{item.season}</p>
                      </div>
                    </div>

                    <p className="mt-3 min-h-[2.5rem] text-sm leading-relaxed text-slate-600">{item.reason || 'Mapped from current season and category demand.'}</p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-medium">
                      <div><span className="block text-slate-500">Stock</span><span className="text-slate-950">{item.stock}</span></div>
                      <div><span className="block text-slate-500">Trend</span><span className="text-emerald-700">{item.trend}</span></div>
                      <div><span className="block text-slate-500">Finish</span><span className="text-slate-950">{item.finishIn}</span></div>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </div>

        <div className="space-y-5">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Customer Buying Pattern</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">Daily sales timing calculated from invoice and billing timestamps.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {smartSalesAnalytics.timePatterns.map((slot: any) => (
                <div key={slot.label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{slot.label.replace(' Sales', '')}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{slot.range}</p>
                    </div>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                      {slot.salesCount || slot.products?.reduce?.((sum: number, item: any) => sum + Number(item.sold || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {slot.products.map((item: any) => {
                      const productName = typeof item === 'string' ? item : item.name;
                      const sold = typeof item === 'string' ? null : item.sold;
                      return (
                        <div key={`${slot.label}-${productName}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-slate-800">{productName}</span>
                          <span className="shrink-0 font-semibold text-emerald-700">{sold ? `${sold} sales` : 'Top'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Period Demand Snapshot</h3>
                <p className="text-xs font-medium leading-relaxed text-slate-500">Compact retail insights for {selectedSalesData.label.toLowerCase()}.</p>
              </div>
              <span className="w-max rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                {selectedSalesData.products.length} products tracked
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total units sold', value: selectedSalesData.products.reduce((total: number, item: any) => total + item.sold, 0).toLocaleString('en-IN') },
                { label: 'Top growing category', value: selectedSalesData.products[0]?.timing || 'Fast moving items' },
                { label: 'Refill urgency', value: `${selectedSalesData.products.filter((item: any) => Number(item.stock) <= 50).length} products need review` },
                { label: 'Predicted out-of-stock', value: smartInventoryAnalytics.seasonalProducts[0]?.predictedOutOfStockDate || smartInventoryAnalytics.seasonalProducts[0]?.finishIn || 'Review in 5 days' },
                { label: 'Sales comparison', value: `${selectedSalesData.products[0]?.trend || '+0%'} vs last period` },
                { label: 'Trend percentage', value: selectedSalesData.products[0]?.trend || '+0%' },
                { label: 'Refill recommendation', value: 'Prioritize fastest mover and low stock items' },
                { label: 'Warehouse pressure', value: 'Main warehouse stock moving fastest' },
                { label: 'Stock movement', value: `${selectedSalesData.products[0]?.name || 'Top item'} increasing` },
              ].map((metric) => (
                <button
                  type="button"
                  key={metric.label}
                  onClick={() => setSelectedDemandMetric({
                    ...metric,
                    products: selectedSalesData.products.slice(0, 4),
                    recommendation: metric.label === 'Refill urgency' ? 'Raise reorder quantity and transfer surplus stock from slower branches.' : 'Monitor trend for the next billing cycle and keep shelf stock visible.',
                  })}
                  className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{metric.value}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">Product trend comparison</p>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {selectedSalesData.products.slice(0, 4).map((item: any, index: number) => (
                  <div key={`snapshot-${item.name}`} className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs">
                    <span className="font-semibold text-slate-400">#{index + 1}</span>
                    <span className="truncate font-semibold text-slate-800">{item.name}</span>
                    <span className="font-semibold text-emerald-700">{item.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Offers Section */}
      <div id="promotional-offers-section" className="relative z-0 mb-12 min-w-0 max-w-full">
        {/* Promotional Offers KPI Cards */}
        {loading ? renderKpiSkeleton() : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Active Promotional Offers */}
            <div 
              onClick={() => setPromoFilter('active')}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${promoFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Offers</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Percent className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {activePromotionsCount} Active
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Running Store Campaigns
                </span>
              </div>
            </div>

            {/* Upcoming Promotions */}
            <div 
              onClick={() => setPromoFilter('upcoming')}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${promoFilter === 'upcoming' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Upcoming</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {upcomingPromotionsCount} Scheduled
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Starts In Future
                </span>
              </div>
            </div>

            {/* Expired Promotions */}
            <div 
              onClick={() => setPromoFilter('expired')}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${promoFilter === 'expired' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Expired Offers</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {expiredPromotionsCount} Expired
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Campaigns Completed
                </span>
              </div>
            </div>

            {/* Products Included */}
            <div 
              onClick={() => setPromoFilter('all')}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${promoFilter === 'all' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Products</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Layers className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {productsInPromotionsCount} Products
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  In Active Promotions
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 max-w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-slate-900 mb-1">Promotional Offers</h2>
              <p className="text-sm text-slate-600">Manage your store offers</p>
            </div>

            <button
              onClick={() => {
                setEditingOfferId(null);
                setManualOfferForm({
                  product: null,
                  offerTitle: '',
                  offerType: 'Percentage Discount',
                  discountPercentage: '',
                  flatDiscountAmount: '',
                  buyQuantity: '',
                  freeQuantity: '',
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                  description: '',
                  isActive: true
                });
                setShowManualOfferModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Offer
            </button>
          </div>

          {/* Offer Cards */}
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredPromotions.map((offer) => {
              return (
                <div
                  key={offer.id}
                  className="group flex h-full min-h-[280px] flex-col bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Offer Title */}
                  <h3 className="min-h-[3.25rem] text-xl font-medium leading-snug text-slate-950 mb-4">{offer.offerTitle}</h3>

                  {/* Discount Text */}
                  <div className="mb-4">
                    <span className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-emerald-100 px-4 py-2 text-sm font-medium leading-none text-emerald-900">
                      {offer.offerType === 'Percentage Discount' && <>{offer.discountPercentage}% OFF</>}
                      {offer.offerType === 'Flat Discount' && <>Flat ₹{offer.flatDiscountAmount} OFF</>}
                      {(offer.offerType === 'Buy X Get Y' || offer.offerType === 'Bundle Offer') && <>Special Combo</>}
                      {offer.offerType === 'Seasonal Offer' && <>{offer.discountPercentage}% Seasonal</>}
                    </span>
                  </div>

                  {/* Dates */}
                  <p className="min-h-[1.5rem] text-sm font-medium leading-relaxed text-slate-800 mb-3">
                    {formatDate(offer.startDate)} → {formatDate(offer.endDate)}
                  </p>

                  {/* Product Info */}
                  <p className="text-sm font-medium leading-relaxed text-slate-700 mb-5">Product: {offer.productName}</p>

                  {/* Buttons */}
                  <div className="mt-auto flex gap-3 pt-5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingOfferId(offer.id);
                        setManualOfferForm({
                          product: { name: offer.productName },
                          offerTitle: offer.offerTitle,
                          offerType: offer.offerType,
                          discountPercentage: offer.discountPercentage?.toString() || '',
                          flatDiscountAmount: offer.flatDiscountAmount?.toString() || '',
                          buyQuantity: offer.buyQuantity?.toString() || '',
                          freeQuantity: offer.freeQuantity?.toString() || '',
                          startDate: offer.startDate,
                          endDate: offer.endDate,
                          description: offer.description,
                          isActive: offer.isActive
                        });
                        setShowManualOfferModal(true);
                      }}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-medium text-white transition-all hover:bg-slate-900"
                    >
                      Edit Offer
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this offer?')) {
                          setManualOffers(manualOffers.filter(o => o.id !== offer.id));
                        }
                      }}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div id="stock-inventory-section" className="min-w-0 max-w-full">

        {/* Row 2 Column 1: Stock Inventory Forecast Table */}
        <div className="min-w-0 max-w-full space-y-6">
          {/* KPI Stats Cards */}
          {loading ? renderKpiSkeleton() : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Products in Stock */}
              <div 
                onClick={() => handleSetTableFilter('all')}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${tableFilter === 'all' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Products In Stock</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                    {totalProductsInStock} Items
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                    Active Inventory
                  </span>
                </div>
              </div>

              {/* Low Stock Products */}
              <div 
                onClick={() => handleSetTableFilter('low_stock')}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${tableFilter === 'low_stock' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Low Stock Products</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                    {lowStockCount} Items
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                    Quantity &lt;= 10
                  </span>
                </div>
              </div>

              {/* Out of Stock Products */}
              <div 
                onClick={() => handleSetTableFilter('out_of_stock')}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${tableFilter === 'out_of_stock' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Out Of Stock Products</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                    {outOfStockCount} Items
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                    Quantity = 0
                  </span>
                </div>
              </div>

              {/* Total Inventory Value */}
              <div 
                onClick={() => handleSetTableFilter('all')}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer border-slate-200`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Inventory Value</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                    <CircleDollarSign className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                    ₹{totalInventoryValue.toLocaleString('en-IN')}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                    Valuation
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Forecast Table */}
          <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Stock Inventory</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Real-time product availability</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {loading ? 'Updating...' : `${insights?.overview?.totalProducts || 2350} products`}
                </div>

              </div>
            </div>

            <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Product</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">SKU</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Category</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Stock</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Expiry</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Offer</th>
                    <th className="px-4 py-4 text-left font-bold text-slate-900 dark:text-white text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {(productRows.length ? productRows : inventoryRows)
                    .filter((row: any) => {
                      const rowStatus = row.status || getStockStatus(row);
                      if (tableFilter === 'low_stock') return rowStatus === 'LOW_STOCK';
                      if (tableFilter === 'out_of_stock') return rowStatus === 'OUT_OF_STOCK';
                      if (tableFilter === 'draft') return row.status === 'DRAFT';
                      return true;
                    })
                    .map((row: any) => {
                    const quantity = row.quantity !== undefined ? row.quantity : row.stock;
                    const stockLabel = typeof quantity === 'number' ? `${quantity} PCS` : quantity;
                    const rowStatus = row.status || getStockStatus(row);
                    const warehouseName = row.branch?.name || row.warehouse || 'Main Warehouse';
                    const daysToExp = getDaysToExpiry(row.expiryDate || row.expiry);

                    return (
                      <tr key={row.sku || row.id} className={`${glassStyle} transition-all duration-300 hover:shadow-md`}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{row.name || row.product}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{warehouseName}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{row.sku}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{row.category?.name || row.category}</td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-900 dark:text-white">{stockLabel}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm">{formatDate(row.expiryDate || row.expiry)}</p>
                            {daysToExp && <p className="text-xs text-slate-500">In {daysToExp} days</p>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(rowStatus)}`}>
                            {getStatusLabel(rowStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {row.isOnOffer ? (
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-450 rounded-full text-xs font-semibold">
                              {row.offerDiscount || 0}% off
                            </span>
                          ) : row.isUnsold ? (
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Unsold</span>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {row.isUnsold ? (
                            <button
                              disabled={offerLoading}
                              onClick={() => openOfferModal(row)}
                              className="px-3 py-1 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-lg text-xs font-semibold transition duration-200 disabled:opacity-50"
                            >
                              {row.isOnOffer ? 'Edit' : 'Offer'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dead Stock Monitoring Section */}
      <div id="dead-stock-monitoring-section" className="mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-805 mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Dead Stock Monitoring</h2>
            <p className="text-sm text-slate-500 mt-1">Products with low or no sales activity requiring action.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-full shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {filteredDeadStock.length} Products Displayed
            </span>
          </div>
        </div>

        {/* Dead Stock Table */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden">
          <div className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-450 text-xs font-bold uppercase tracking-wider text-left">
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Product Name</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">SKU</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Category</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Current Stock</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Last Sold</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Days Unsold</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Inventory Value</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700">Suggested Action</th>
                  <th className="px-4 py-3.5 font-semibold text-slate-700 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeadStock.map((item: any) => {
                  const currentProd = productRows.find(p => p.id === item.id || p.sku === item.id || p.name === item.name) || item;
                  const hasOffer = currentProd.isOnOffer || currentProd.isOnDiscount || currentProd.offerLabel;
                  const isTransferred = currentProd.expiryActionStatus === 'transferred' || currentProd.actionTaken === 'transferred';

                  // Filter out fully resolved items from active feed
                  if (hasOffer || isTransferred) return null;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedDeadProduct(item)}
                      className="hover:bg-slate-50/60 transition-all duration-150 cursor-pointer text-sm font-['Trebuchet_MS']"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-mono">
                        {item.sku || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md">
                          {item.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {item.quantity} Units
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {item.lastSoldDate || 'Never'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-rose-600">
                        {item.daysWithoutSales} Days
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        ₹{item.inventoryValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.recommendation === 'Return to Supplier' 
                            ? 'bg-orange-50 text-orange-700 border border-orange-100' 
                            : item.recommendation === 'Clearance Sale' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : item.recommendation === 'Bundle Offer' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {item.recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openOfferModal(item)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition duration-200"
                        >
                          Take Action
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDeadStock.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">
                      No dead stock items found matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seasonal product details drawer */}
      {selectedSeasonalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">{selectedSeasonalProduct.season || seasonMeta.label} demand</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">{selectedSeasonalProduct.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{selectedSeasonalProduct.reason || seasonMeta.detection}</p>
                </div>
                <button type="button" onClick={() => setSelectedSeasonalProduct(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  {selectedSeasonalProduct.image ? <img src={selectedSeasonalProduct.image} alt={selectedSeasonalProduct.name} className="h-full w-full object-cover" /> : <Package className="h-7 w-7" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Predicted stock finish</p>
                  <p className="text-lg font-semibold text-slate-950">{selectedSeasonalProduct.predictedOutOfStockDate || selectedSeasonalProduct.finishIn || 'Review soon'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Stock', `${selectedSeasonalProduct.stock || 0} units`],
                  ['Sales trend', selectedSeasonalProduct.salesVelocity ? `${selectedSeasonalProduct.salesVelocity}/day` : 'Rising'],
                  ['Demand increase', selectedSeasonalProduct.trend || '+0%'],
                  ['Best selling time', selectedSeasonalProduct.bestTime || 'Afternoon'],
                  ['Weekly sales', `${selectedSeasonalProduct.weeklySales || 0}`],
                  ['Expiry', selectedSeasonalProduct.expiry || 'Not set'],
                  ['Warehouse stock', selectedSeasonalProduct.warehouseStock || 'Main warehouse'],
                  ['Active offers', selectedSeasonalProduct.activeOffers || 'No active offer'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demand metric detail drawer */}
      {selectedDemandMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Demand Analytics</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">{selectedDemandMetric.label}</h3>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{selectedDemandMetric.value}</p>
                </div>
                <button type="button" onClick={() => setSelectedDemandMetric(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">Recommendation</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedDemandMetric.recommendation}</p>
              </div>

              <div className="mt-5 space-y-3">
                <h4 className="text-lg font-semibold text-slate-950">Related Products</h4>
                {(selectedDemandMetric.products || []).map((item: any) => (
                  <div key={`metric-${item.name}`} className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{item.name}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{item.timing || 'Demand tracking'}</p>
                      </div>
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">{item.trend}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div><span className="block text-slate-500">Sold</span><span className="font-semibold text-slate-900">{item.sold}</span></div>
                      <div><span className="block text-slate-500">Stock</span><span className="font-semibold text-slate-900">{item.stock}</span></div>
                      <div><span className="block text-slate-500">Revenue</span><span className="font-semibold text-slate-900">₹{Number(item.revenue || 0).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over details drawer for Selected Dead Stock item */}
      {selectedDeadProduct && (() => {
        const currentProd = productRows.find(p => p.id === selectedDeadProduct.id || p.sku === selectedDeadProduct.id || p.name === selectedDeadProduct.name) || selectedDeadProduct;
        const hasOffer = currentProd.isOnOffer || currentProd.isOnDiscount || currentProd.offerLabel;
        const isTransferred = currentProd.expiryActionStatus === 'transferred' || currentProd.actionTaken === 'transferred';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition duration-200">
            <div className="h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-slide-in">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-805 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-blue-650 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded">Dead Stock Analysis</span>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">{selectedDeadProduct.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedDeadProduct(null)}
                  className="text-slate-400 hover:text-slate-705 dark:hover:text-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="hidden">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedDeadProduct.productImage || selectedDeadProduct.image ? (
                      <img src={selectedDeadProduct.productImage || selectedDeadProduct.image} alt={selectedDeadProduct.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="w-7 h-7 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">{selectedDeadProduct.categoryName || 'General'}</p>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{selectedDeadProduct.statusText || 'No Sales in 30 Days'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Days Idle</span>
                    <span className="text-base font-semibold text-rose-500 mt-1 block">{selectedDeadProduct.daysWithoutSales} Days</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Available Units</span>
                    <span className="text-base font-semibold text-slate-800 dark:text-white mt-1 block">{selectedDeadProduct.quantity} Units</span>
                  </div>
                </div>

                <div className="hidden">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Suggested action</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-950 dark:text-white">
                    {selectedDeadProduct.recommendation || 'Create an offer or transfer stock to a branch with higher demand.'}
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-505 uppercase block mb-1">Warehouse / Storage</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDeadProduct.warehouse || 'Main Warehouse'}</span>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-505 uppercase block mb-1">Last Sold Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDeadProduct.lastSoldDate || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-505 uppercase block mb-1">Recommended Action</span>
                    <p className="text-emerald-700 dark:text-emerald-450 font-medium leading-relaxed">
                      {selectedDeadProduct.recommendation || 'Create a promotional offer or schedule transfer to branch with higher demand.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-slate-505 uppercase block mb-2">Sales Summary</span>
                    <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      Zero customer transactions logged for this batch in the past {selectedDeadProduct.daysWithoutSales} days. Capital overhead tied to warehouse shelf allocation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2">
                {hasOffer && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-xl mb-2 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                    Offer Successfully Created
                  </div>
                )}
                {isTransferred && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3 rounded-xl mb-2 text-center text-xs font-semibold text-blue-800 dark:text-blue-400">
                    Stock Transfer Completed
                  </div>
                )}
                <div className="flex gap-2">
                  {!hasOffer && (
                    <button
                      type="button"
                      onClick={() => {
                        openOfferModal(selectedDeadProduct);
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-md"
                    >
                      Create Offer
                    </button>
                  )}
                  {!isTransferred && (
                    <button
                      type="button"
                      onClick={() => {
                        openTransferModal(selectedDeadProduct);
                      }}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                    >
                      Transfer Stock
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Slide-over details drawer / Modal popup for Expiry Management item */}
      {selectedExpiryProduct && (() => {
        const currentProd = productRows.find(p => p.id === selectedExpiryProduct.id || p.sku === selectedExpiryProduct.id || p.name === selectedExpiryProduct.name) || selectedExpiryProduct;
        const hasOffer = currentProd.isOnOffer || currentProd.isOnDiscount || currentProd.offerLabel;
        const isTransferred = currentProd.expiryActionStatus === 'transferred' || currentProd.actionTaken === 'transferred';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition duration-200">
            <div className="h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-slide-in">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-red-650 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded">Expiry Stock Analysis</span>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">{selectedExpiryProduct.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedExpiryProduct(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Remaining Stock</span>
                    <span className="text-base font-semibold text-slate-800 dark:text-white mt-1 block">{selectedExpiryProduct.quantity} Units</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Days To Expiry</span>
                    <span className="text-base font-semibold text-red-500 mt-1 block">
                      {getDaysToExpiry(selectedExpiryProduct.expiryDate)} Days
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Batch Number</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedExpiryProduct.batchNumber || 'B-EXP-908'}</span>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Supplier</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedExpiryProduct.supplier || 'Standard Supplier Group'}</span>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Purchase Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedExpiryProduct.purchaseDate)}</span>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Expiry Date</span>
                    <span className="font-semibold text-slate-850 dark:text-slate-200">{formatDate(selectedExpiryProduct.expiryDate)}</span>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Branch Availability</span>
                    <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                      {selectedExpiryProduct.branchAvailability || 'Main Warehouse (100% stock allocation)'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1">Suggested Action</span>
                    <p className="text-emerald-700 dark:text-emerald-450 font-medium leading-relaxed">
                      Apply a promotion offer or schedule immediate clearance to prevent write-offs.
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-medium text-slate-505 uppercase block mb-2">Fast Action Recommended</span>
                    <p className="text-sm text-slate-600 dark:text-slate-350 font-medium bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3.5 rounded-xl">
                      This product should be discounted or transferred soon.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2">
                {hasOffer && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-xl mb-2 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                    Offer Successfully Created
                  </div>
                )}
                {isTransferred && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3 rounded-xl mb-2 text-center text-xs font-semibold text-blue-800 dark:text-blue-400">
                    Stock Transfer Completed
                  </div>
                )}
                <div className="flex gap-2">
                  {!hasOffer && (
                    <button
                      type="button"
                      onClick={() => {
                        openOfferModal(selectedExpiryProduct);
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-md"
                    >
                      Create Offer
                    </button>
                  )}
                  {!isTransferred && (
                    <button
                      type="button"
                      onClick={() => {
                        openTransferModal(selectedExpiryProduct);
                      }}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                    >
                      Transfer Stock
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Expiry Management Center */}
      <div id="expiry-management-section" className="min-w-0 xl:col-span-3 mt-6">
        {/* Expiry KPI Cards */}
        {loading ? renderKpiSkeleton() : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Expiring in 7 Days */}
            <div 
              onClick={() => {
                setExpiryFilter('7_days');
                setExpirySort('none');
              }}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${expiryFilter === '7_days' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Expiring 7 Days</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {expiring7DaysCount} Items
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Urgent Actions Required
                </span>
              </div>
            </div>

            {/* Expiring in 30 Days */}
            <div 
              onClick={() => {
                setExpiryFilter('30_days');
                setExpirySort('none');
              }}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${expiryFilter === '30_days' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Expiring 30 Days</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {expiring30DaysCount} Items
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Monitor Closely
                </span>
              </div>
            </div>

            {/* Expired Products */}
            <div 
              onClick={() => {
                setExpiryFilter('expired');
                setExpirySort('none');
              }}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${expiryFilter === 'expired' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Expired Products</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  {expiredProductsCount} Items
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Requires Disposal
                </span>
              </div>
            </div>

            {/* Total Expiry Value */}
            <div 
              onClick={() => {
                setExpiryFilter('all');
                setExpirySort('value');
              }}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${expirySort === 'value' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Expiry Value</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0">
                  <CircleDollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mt-2">
                  ₹{totalExpiryValue.toLocaleString('en-IN')}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 mt-1.5 inline-block">
                  Potential Loss Value
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`${glassStyle} rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 font-sans`}>
          {/* Header Area */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Expiry Management</h2>
              <p className="text-sm text-slate-500 mt-1">Monitor products and stock nearing expiry in real time.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-full shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live Monitoring</span>
            </div>
          </div>

          {/* List/Feed Layout */}
          <div className="space-y-4">
            {filteredExpiryAlerts.map((alert: any, idx: number) => {
              const info = getExpiryStatusInfo(alert.expiryDate);
              // Human readable countdown labels
              let countdownText = "";
              if (info.daysLeft < 0) {
                countdownText = `Expired Yesterday`;
              } else if (info.daysLeft === 0) {
                countdownText = `Expired Today`;
              } else if (info.daysLeft === 1) {
                countdownText = `Expires Tomorrow`;
              } else {
                countdownText = `Expires In ${info.daysLeft} Days`;
              }

              const currentProd = productRows.find(p => p.id === alert.id || p.sku === alert.id || p.name === alert.name) || alert;
              const hasOffer = currentProd.isOnOffer || currentProd.isOnDiscount || currentProd.offerLabel;
              const isTransferred = currentProd.expiryActionStatus === 'transferred' || currentProd.actionTaken === 'transferred';

              return (
                <div
                  key={alert.id || idx}
                  className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition-all duration-200"
                >
                  {/* Left/Center: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{alert.name}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-full">
                        {alert.category || 'General'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3.5 text-sm text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Warehouse</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-300">{alert.warehouse || 'Main Warehouse'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Expiry Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-300">{formatDate(alert.expiryDate)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">Remaining Stock</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{alert.quantity} Units</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Countdown & Buttons */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${info.colorClass}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.lineColor }}></span>
                      {countdownText}
                    </span>
                    {!hasOffer && (
                      <button
                        type="button"
                        onClick={() => openOfferModal(alert)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl transition"
                      >
                        Create Offer
                      </button>
                    )}
                    {!isTransferred && (
                      <button
                        type="button"
                        onClick={() => openTransferModal(alert)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                      >
                        Transfer Stock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedExpiryProduct(alert)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-xl transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
            {liveAlerts.length === 0 && (
              <div className="text-center py-16 text-slate-500 font-semibold text-sm">
                No active expiry items in feed. All stocks are healthy.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`${glassStyle} rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800`}>
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">Offer Management</p>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {offerForm.product?.isOnOffer ? 'Edit Active Offer' : 'Configure New Offer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Product: <span className="font-semibold text-slate-800 dark:text-slate-200">{offerForm.product?.name}</span></p>
                </div>
                <button
                  onClick={closeOfferModal}
                  className="h-8 w-8 rounded-full hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Offer Type Tabs */}
              <div className="flex bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-800">
                {(['discount', 'bogo', 'bundle'] as const).map((type) => {
                  const isActive = offerForm.offerType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleOfferFieldChange('offerType', type)}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-650 dark:text-slate-450 hover:text-slate-950 dark:hover:text-white'
                        }`}
                    >
                      {type === 'discount' ? 'Discount Offer' : type === 'bogo' ? 'Buy X Get Y' : 'Bundle Offer'}
                    </button>
                  );
                })}
              </div>

              {/* Input fields with clean alignment & theme colors */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Offer Title or Description</label>
                  <input
                    type="text"
                    value={offerForm.offerLabel}
                    onChange={(e) => handleOfferFieldChange('offerLabel', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    placeholder="e.g. Clearance Sale 20% Off"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Expiry Date</label>
                    <input
                      type="date"
                      value={offerForm.endsAt}
                      onChange={(e) => handleOfferFieldChange('endsAt', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {offerForm.offerType === 'discount' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-355 block mb-1.5">Discount Percentage</label>
                      <input
                        type="text"
                        value={offerForm.offerDiscount}
                        onChange={(e) => handleOfferNumberChange('offerDiscount', e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-355 block mb-1.5">Buy Quantity</label>
                        <input
                          type="text"
                          value={offerForm.buyQuantity}
                          onChange={(e) => handleOfferNumberChange('buyQuantity', e.target.value)}
                          className="w-full rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-355 block mb-1.5">Free Quantity</label>
                        <input
                          type="text"
                          value={offerForm.freeQuantity}
                          onChange={(e) => handleOfferNumberChange('freeQuantity', e.target.value)}
                          className="w-full rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Save, Update, Delete */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {offerForm.product?.isOnOffer && (
                  <button
                    type="button"
                    onClick={handleDeleteOffer}
                    disabled={offerLoading}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-905/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition disabled:opacity-50 text-center"
                  >
                    Delete Offer
                  </button>
                )}
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={closeOfferModal}
                    className="flex-1 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleOfferSubmit}
                    disabled={offerLoading}
                    className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md shadow-emerald-500/10 text-center"
                  >
                    {offerLoading ? 'Saving...' : offerForm.product?.isOnOffer ? 'Update Offer' : 'Save Offer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Manual Offer Modal */}
      {showManualOfferModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowManualOfferModal(false)}
          />

          {/* Modal Container - Responsive */}
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-purple-50 border-b border-slate-200 px-6 md:px-8 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {editingOfferId ? 'Edit Offer' : 'Create New Offer'}
                    </h3>
                    <p className="text-sm text-slate-600">Configure promotional details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualOfferModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 md:px-8 py-6">
              <div className="space-y-6">
                {/* Section 1: Product Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">1</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">Product Details</h4>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Select Product</label>
                    <select
                      value={manualOfferForm.product?.name || ''}
                      onChange={(e) => {
                        const selectedProduct = [
                          { name: 'Fresh Orange Juice' },
                          { name: 'Premium Coffee' },
                          { name: 'Burger Combo' },
                          { name: 'Signature Pizza' },
                          { name: 'Family Meal Box' }
                        ].find(p => p.name === e.target.value);
                        setManualOfferForm({ ...manualOfferForm, product: selectedProduct || null });
                      }}
                      className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                    >
                      <option value="">Select a product...</option>
                      <option value="Fresh Orange Juice">Fresh Orange Juice</option>
                      <option value="Premium Coffee">Premium Coffee</option>
                      <option value="Burger Combo">Burger Combo</option>
                      <option value="Signature Pizza">Signature Pizza</option>
                      <option value="Family Meal Box">Family Meal Box</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Offer Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-700">2</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">Offer Configuration</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Offer Title</label>
                      <input
                        type="text"
                        value={manualOfferForm.offerTitle}
                        onChange={(e) => setManualOfferForm({ ...manualOfferForm, offerTitle: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                        placeholder="Summer Special"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Offer Type</label>
                      <select
                        value={manualOfferForm.offerType}
                        onChange={(e) => setManualOfferForm({ ...manualOfferForm, offerType: e.target.value as any })}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                      >
                        <option value="Percentage Discount">Percentage Discount</option>
                        <option value="Flat Discount">Flat Discount</option>
                        <option value="Buy X Get Y">Buy X Get Y</option>
                        <option value="Bundle Offer">Bundle Offer</option>
                        <option value="Seasonal Offer">Seasonal Offer</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Fields */}
                  {(manualOfferForm.offerType === 'Percentage Discount' || manualOfferForm.offerType === 'Seasonal Offer') && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Discount Percentage</label>
                      <input
                        type="text"
                        value={manualOfferForm.discountPercentage}
                        onChange={(e) => {
                          // Remove leading zeros
                          let val = e.target.value.replace(/^0+/, '') || '0';
                          if (val === '0' && e.target.value.length > 1) {
                            val = e.target.value.slice(e.target.value.length - 1);
                          }
                          setManualOfferForm({ ...manualOfferForm, discountPercentage: val });
                        }}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                        placeholder="20"
                      />
                    </div>
                  )}

                  {manualOfferForm.offerType === 'Flat Discount' && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Flat Discount Amount</label>
                      <input
                        type="text"
                        value={manualOfferForm.flatDiscountAmount}
                        onChange={(e) => {
                          let val = e.target.value.replace(/^0+/, '') || '0';
                          if (val === '0' && e.target.value.length > 1) {
                            val = e.target.value.slice(e.target.value.length - 1);
                          }
                          setManualOfferForm({ ...manualOfferForm, flatDiscountAmount: val });
                        }}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                        placeholder="50"
                      />
                    </div>
                  )}

                  {(manualOfferForm.offerType === 'Buy X Get Y' || manualOfferForm.offerType === 'Bundle Offer') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Buy Quantity</label>
                        <input
                          type="text"
                          value={manualOfferForm.buyQuantity}
                          onChange={(e) => {
                            let val = e.target.value.replace(/^0+/, '') || '0';
                            if (val === '0' && e.target.value.length > 1) {
                              val = e.target.value.slice(e.target.value.length - 1);
                            }
                            setManualOfferForm({ ...manualOfferForm, buyQuantity: val });
                          }}
                          className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Free Quantity</label>
                        <input
                          type="text"
                          value={manualOfferForm.freeQuantity}
                          onChange={(e) => {
                            let val = e.target.value.replace(/^0+/, '') || '0';
                            if (val === '0' && e.target.value.length > 1) {
                              val = e.target.value.slice(e.target.value.length - 1);
                            }
                            setManualOfferForm({ ...manualOfferForm, freeQuantity: val });
                          }}
                          className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Offer Description</label>
                    <textarea
                      value={manualOfferForm.description}
                      onChange={(e) => setManualOfferForm({ ...manualOfferForm, description: e.target.value })}
                      className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all resize-none"
                      rows={3}
                      placeholder="Brief description of the offer..."
                    />
                  </div>
                </div>

                {/* Section 3: Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">3</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">Schedule</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Start Date</label>
                      <input
                        type="date"
                        value={manualOfferForm.startDate}
                        onChange={(e) => setManualOfferForm({ ...manualOfferForm, startDate: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">End Date</label>
                      <input
                        type="date"
                        value={manualOfferForm.endDate}
                        onChange={(e) => setManualOfferForm({ ...manualOfferForm, endDate: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 md:px-8 py-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualOfferModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!manualOfferForm.product || !manualOfferForm.offerTitle) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    if (editingOfferId) {
                      setManualOffers(manualOffers.map(o => o.id === editingOfferId ? { ...o, ...manualOfferForm, productName: manualOfferForm.product.name } : o));
                    } else {
                      setManualOffers([...manualOffers, { id: `mo${Date.now()}`, ...manualOfferForm, productName: manualOfferForm.product.name }]);
                    }
                    setShowManualOfferModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  {editingOfferId ? 'Update Offer' : 'Save Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`${glassStyle} rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800`}>
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">Internal Logistics</p>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Stock Transfer Request</h3>
                  <p className="text-xs text-slate-500 mt-1">Product: <span className="font-semibold text-slate-850 dark:text-slate-200">{transferForm.productName}</span></p>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Source Warehouse</label>
                    <input
                      type="text"
                      value={transferForm.sourceWarehouse}
                      disabled
                      className="w-full rounded-xl px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Destination Warehouse</label>
                    <select
                      value={transferForm.destinationWarehouse}
                      onChange={(e) => setTransferForm({ ...transferForm, destinationWarehouse: e.target.value })}
                      className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    >
                      <option value="Secondary Warehouse">Secondary Warehouse</option>
                      <option value="Cold Storage">Cold Storage</option>
                      <option value="Mumbai Warehouse">Mumbai Warehouse</option>
                      <option value="Pune Warehouse">Pune Warehouse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Available Stock</label>
                    <input
                      type="number"
                      value={transferForm.availableStock}
                      disabled
                      className="w-full rounded-xl px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Transfer Quantity</label>
                    <input
                      type="text"
                      value={transferForm.transferQty}
                      onChange={(e) => handleTransferQtyChange(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Stock validation indicator */}
                {transferForm.transferQty > transferForm.availableStock && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Transfer quantity exceeds available stock!
                    </p>
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1">
                      Available: {transferForm.availableStock} units
                    </p>
                  </div>
                )}


                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 block mb-1.5">Reason for Transfer</label>
                  <textarea
                    rows={2}
                    value={transferForm.transferReason}
                    onChange={(e) => setTransferForm({ ...transferForm, transferReason: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    placeholder="Provide transfer logs context..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferSubmit}
                  disabled={transferForm.transferQty <= 0 || transferForm.transferQty > transferForm.availableStock}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
