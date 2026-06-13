import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  QrCode,
  Camera,
  CheckCircle2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Layers,
  TrendingUp,

} from 'lucide-react';

export const Products: React.FC = () => {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productStats, setProductStats] = useState<any>({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

  // Add Product Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLookupProduct, setBarcodeLookupProduct] = useState<any | null>(null);
  const [barcodeLookupError, setBarcodeLookupError] = useState('');
  const [showBarcodeLookupCamera, setShowBarcodeLookupCamera] = useState(false);
  const [isStartingBarcodeLookupCamera, setIsStartingBarcodeLookupCamera] = useState(false);
  const barcodeLookupInputRef = useRef<HTMLInputElement>(null);
  const barcodeLookupScannerRef = useRef<IScannerControls | null>(null);
  const barcodeLookupCandidateRef = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const isSearchingRef = useRef<boolean>(false);
  const [showProductBarcodeScanner, setShowProductBarcodeScanner] = useState(false);
  const [barcodeScanMessage, setBarcodeScanMessage] = useState('');
  const [barcodeScanError, setBarcodeScanError] = useState('');
  const [isStartingBarcodeCamera, setIsStartingBarcodeCamera] = useState(false);
  const [canStartProductBarcodeScanner, setCanStartProductBarcodeScanner] = useState(false);
  const [barcodeScanMode, setBarcodeScanMode] = useState<'product' | 'all'>('product');
  const productBarcodeInputRef = useRef<HTMLInputElement>(null);
  const productBarcodeScannerRef = useRef<IScannerControls | null>(null);
  const nativeBarcodeScanFrameRef = useRef<number | null>(null);
  const barcodeScanCandidateRef = useRef<{ value: string; count: number }>({ value: '', count: 0 });
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [brand, setBrand] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isOnOffer, setIsOnOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerEndDate, setOfferEndDate] = useState('');
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [expiryCalendarMonth, setExpiryCalendarMonth] = useState(() => new Date());
  const expiryCalendarRef = useRef<HTMLDivElement>(null);

  const getStockStatus = (product: any) => {
    const productQuantity = Number(product?.quantity || 0);
    if (productQuantity <= 0) return 'OUT_OF_STOCK';
    if (productQuantity <= 10) return 'LOW_STOCK';
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

  const formatPrice = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const expiryCalendarDays = (() => {
    const year = expiryCalendarMonth.getFullYear();
    const month = expiryCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  })();

  const changeExpiryCalendarMonth = (direction: number) => {
    setExpiryCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const selectExpiryDate = (date: Date) => {
    setExpiryDate(toDateInputValue(date));
    setShowExpiryCalendar(false);
  };

  const renderFilterDropdown = (
    id: string,
    label: string,
    value: string,
    options: Array<{ label: string; value: string }>,
    onChange: (value: string) => void
  ) => {
    const selectedLabel = options.find((option) => option.value === value)?.label || label;

    return (
      <div className="relative min-w-[150px]">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpenFilterMenu(openFilterMenu === id ? null : id);
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-left text-base font-bold text-black focus:outline-none hover:border-emerald-300 hover:bg-white transition-colors cursor-pointer"
        >
          <span className="flex items-center justify-between gap-3">
            {selectedLabel}
            <span
              className={`h-0 w-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-black transition-transform ${openFilterMenu === id ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        {openFilterMenu === id ? (
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute left-0 top-[calc(100%+0.35rem)] z-40 w-full max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {options.map((option) => (
              <button
                key={option.value || option.label}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(option.value);
                  setOpenFilterMenu(null);
                }}
                className={`block w-full px-3 py-2 text-left text-sm font-bold transition-colors ${option.value === value
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-black hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };
  const openProductDetails = (product: any) => {
    setSelectedProduct(product);
  };

  const openEditProduct = (product: any) => {
    setSelectedProduct(null);
    setEditingProduct(product);
    setName(product.name || '');
    setSku(product.sku || '');
    setBarcode(product.barcode || '');
    setCategoryId(product.category?.id || '');
    setCategoryInput(product.category?.name || '');
    setBrand(product.brand || '');
    setSellingPrice(String(product.sellingPrice ?? ''));
    setCostPrice(String(product.costPrice ?? ''));
    setUnit(product.unit || '');
    setQuantity(String(product.quantity ?? 0));
    setExpiryDate(product.expiryDate ? String(product.expiryDate).slice(0, 10) : '');
    setIsOnOffer(Boolean(product.isOnOffer));
    setOfferPrice(product.offerPrice !== null && product.offerPrice !== undefined ? String(product.offerPrice) : '');
    setOfferStartDate(product.offerStartDate ? String(product.offerStartDate).slice(0, 10) : '');
    setOfferEndDate(product.offerEndDate ? String(product.offerEndDate).slice(0, 10) : '');
    setBarcodeScanMessage('');
    setBarcodeScanError('');
    setShowProductBarcodeScanner(false);
    setShowAddModal(true);
  };

  const resetAddProductForm = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setBarcode('');
    setCategoryId('');
    setCategoryInput('');
    setBrand('');
    setSellingPrice('');
    setCostPrice('');
    setUnit('');
    setQuantity('');
    setExpiryDate('');
    setIsOnOffer(false);
    setOfferPrice('');
    setOfferStartDate('');
    setOfferEndDate('');
    setShowProductBarcodeScanner(false);
    setBarcodeScanMessage('');
    setBarcodeScanError('');
    setIsStartingBarcodeCamera(false);
    setCanStartProductBarcodeScanner(false);
    setBarcodeScanMode('product');
    barcodeScanCandidateRef.current = { value: '', count: 0 };
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = '/products?';
      if (search) url += `search=${search}&`;
      if (catFilter) url += `categoryId=${catFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (brandFilter) url += `brand=${brandFilter}&`;

      const data = await auth.apiRequest(url);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      const data = await auth.apiRequest('/products/stats');
      setProductStats(data);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to create product');
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await auth.apiRequest('/categories');
      setCategories(data);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to create product');
    }
  };


  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchProductStats();
  }, [search, catFilter, statusFilter, brandFilter]);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || '';
    if (['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', ''].includes(statusFromUrl)) {
      setStatusFilter(statusFromUrl);
    }
    const catFromUrl = searchParams.get('categoryId') || '';
    if (catFromUrl) {
      setCatFilter(catFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const closeOpenFilter = () => setOpenFilterMenu(null);
    window.addEventListener('click', closeOpenFilter);
    return () => window.removeEventListener('click', closeOpenFilter);
  }, []);

  useEffect(() => {
    const closeExpiryCalendar = (event: MouseEvent) => {
      if (expiryCalendarRef.current?.contains(event.target as Node)) return;
      setShowExpiryCalendar(false);
    };

    window.addEventListener('click', closeExpiryCalendar);
    return () => window.removeEventListener('click', closeExpiryCalendar);
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    const focusTimer = window.setTimeout(() => productBarcodeInputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [showAddModal]);

  useEffect(() => {
    if (!showBarcodeModal) return;
    const focusTimer = window.setTimeout(() => barcodeLookupInputRef.current?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [showBarcodeModal]);

  useEffect(() => {
    if (!showBarcodeModal) return;
    const cleanBarcode = normalizeBarcode(barcodeInput);
    if (cleanBarcode.length < 6) return;
    if (barcodeLookupProduct && normalizeBarcode(String(barcodeLookupProduct.barcode || '')) === cleanBarcode) return;

    const lookupTimer = window.setTimeout(() => handleBarcodeScan(cleanBarcode), 450);
    return () => window.clearTimeout(lookupTimer);
  }, [barcodeInput, showBarcodeModal, barcodeLookupProduct]);

  useEffect(() => {
    if (!showBarcodeLookupCamera) return;

    let isMounted = true;
    const productBarcodeFormats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
    ];
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, productBarcodeFormats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const scanner = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 40,
      delayBetweenScanSuccess: 100,
    });

    scanner
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        'lookup-barcode-video',
        async (result, _error, controls) => {
          if (!isMounted) return;
          barcodeLookupScannerRef.current = controls;
          if (!result) return;

          const cleanBarcode = result.getText().replace(/\s/g, '').trim();
          if (cleanBarcode.length < 6) return;

          if (barcodeLookupCandidateRef.current.value === cleanBarcode) {
            barcodeLookupCandidateRef.current.count += 1;
          } else {
            barcodeLookupCandidateRef.current = { value: cleanBarcode, count: 1 };
          }

          if (barcodeLookupCandidateRef.current.count >= 1) {
            if (isSearchingRef.current) return;
            isSearchingRef.current = true;
            const found = await handleBarcodeScan(cleanBarcode);
            isSearchingRef.current = false;
            if (found) {
              barcodeLookupScannerRef.current?.stop();
              barcodeLookupScannerRef.current = null;
              setShowBarcodeLookupCamera(false);
            } else {
              // Allow another scan immediately
              barcodeLookupCandidateRef.current = { value: '', count: 0 };
            }
          }
        }
      )
      .then((controls) => {
        barcodeLookupScannerRef.current = controls;
      })
      .catch((error) => {
        console.error('Failed to start product lookup camera:', error);
        setBarcodeLookupError('Camera could not start. Allow camera permission or use the scanner machine/manual barcode field.');
        setShowBarcodeLookupCamera(false);
      });

    return () => {
      isMounted = false;
      barcodeLookupScannerRef.current?.stop();
      barcodeLookupScannerRef.current = null;
    };
  }, [showBarcodeLookupCamera]);

  useEffect(() => {
    if (!showProductBarcodeScanner || !canStartProductBarcodeScanner) return;

    let isMounted = true;
    let nativeDetector: any = null;
    const isAllCodeMode = barcodeScanMode === 'all';
    const productBarcodeFormats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
    ];
    const allBarcodeFormats = [
      ...productBarcodeFormats,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
    ];
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, isAllCodeMode ? allBarcodeFormats : productBarcodeFormats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, false);
    hints.set(DecodeHintType.ENABLE_CODE_39_EXTENDED_MODE, true);

    const scanner = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 30,
      delayBetweenScanSuccess: 80,
    });
    setBarcodeScanError('');

    const finishBarcodeScan = (scannedBarcode: string) => {
      const cleanBarcode = scannedBarcode.replace(/\s/g, '').trim();
      if (!cleanBarcode || !isMounted) return;
      setBarcode(cleanBarcode);
      setBarcodeScanMessage('Barcode scanned successfully');
      setCanStartProductBarcodeScanner(false);
      productBarcodeScannerRef.current?.stop();
      if (nativeBarcodeScanFrameRef.current !== null) {
        window.cancelAnimationFrame(nativeBarcodeScanFrameRef.current);
        nativeBarcodeScanFrameRef.current = null;
      }
      setShowProductBarcodeScanner(false);
      window.setTimeout(() => productBarcodeInputRef.current?.focus(), 100);
    };

    const handleDetectedBarcode = (detectedBarcode: string, format?: BarcodeFormat | string) => {
      const cleanBarcode = detectedBarcode.replace(/\s/g, '').trim();
      const isProductLength = cleanBarcode.length >= 6;
      const isKnownProductFormat = typeof format === 'number' ? productBarcodeFormats.includes(format) : true;
      if (!isAllCodeMode && (!isProductLength || !isKnownProductFormat)) return;
      if (isAllCodeMode && cleanBarcode.length < 4) return;

      if (!isAllCodeMode) {
        finishBarcodeScan(cleanBarcode);
        return;
      }

      if (barcodeScanCandidateRef.current.value === cleanBarcode) {
        barcodeScanCandidateRef.current.count += 1;
      } else {
        barcodeScanCandidateRef.current = { value: cleanBarcode, count: 1 };
      }

      if (barcodeScanCandidateRef.current.count >= 2) {
        finishBarcodeScan(cleanBarcode);
      }
    };

    const startNativeBarcodeDetector = async () => {
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      const video = document.getElementById('add-product-barcode-video') as HTMLVideoElement | null;
      if (!BarcodeDetectorCtor || !video) return;
      const productNativeFormats = [
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'code_128',
        'code_39',
        'code_93',
        'codabar',
        'itf',
      ];
      const allNativeFormats = [
        ...productNativeFormats,
        'qr_code',
        'data_matrix',
        'pdf417',
        'aztec',
      ];

      try {
        const supportedFormats = typeof BarcodeDetectorCtor.getSupportedFormats === 'function'
          ? await BarcodeDetectorCtor.getSupportedFormats()
          : [];
        if (!supportedFormats.length) {
          nativeDetector = null;
          return;
        }
        const preferredFormats = isAllCodeMode ? allNativeFormats : productNativeFormats;
        const formats = preferredFormats.filter((format) => supportedFormats.includes(format));
        nativeDetector = new BarcodeDetectorCtor(formats.length ? { formats } : undefined);
      } catch {
        nativeDetector = null;
        return;
      }

      const scanFrame = async () => {
        if (!isMounted || !nativeDetector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          nativeBarcodeScanFrameRef.current = window.requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const detectedCodes = await nativeDetector.detect(video);
          const detectedCode = detectedCodes
            ?.filter((code: any) => {
              if (isAllCodeMode) return true;
              return productNativeFormats.includes(code.format) && String(code.rawValue || '').replace(/\s/g, '').length >= 6;
            })
            ?.sort((a: any, b: any) => {
              const priorityA = productNativeFormats.indexOf(a.format);
              const priorityB = productNativeFormats.indexOf(b.format);
              const safePriorityA = priorityA === -1 ? 999 : priorityA;
              const safePriorityB = priorityB === -1 ? 999 : priorityB;
              if (safePriorityA !== safePriorityB) return safePriorityA - safePriorityB;
              const areaA = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
              const areaB = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
              if (areaA !== areaB) return areaB - areaA;
              return String(b.rawValue || '').length - String(a.rawValue || '').length;
            })?.[0];
          if (detectedCode?.rawValue) {
            handleDetectedBarcode(detectedCode.rawValue, detectedCode.format);
            return;
          }
        } catch {
          nativeDetector = null;
          return;
        }

        nativeBarcodeScanFrameRef.current = window.requestAnimationFrame(scanFrame);
      };

      nativeBarcodeScanFrameRef.current = window.requestAnimationFrame(scanFrame);
    };

    scanner
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        'add-product-barcode-video',
        (result, _error, controls) => {
          if (!isMounted) return;
          productBarcodeScannerRef.current = controls;
          if (!result) return;
          handleDetectedBarcode(result.getText(), result.getBarcodeFormat());
        }
      )
      .then((controls) => {
        productBarcodeScannerRef.current = controls;
        startNativeBarcodeDetector();
      })
      .catch((error) => {
        console.error('Failed to start barcode camera:', error);
        setBarcodeScanError('Camera could not start. Check browser camera permission, HTTPS/localhost, and whether another app is using the camera.');
      });

    return () => {
      isMounted = false;
      if (nativeBarcodeScanFrameRef.current !== null) {
        window.cancelAnimationFrame(nativeBarcodeScanFrameRef.current);
        nativeBarcodeScanFrameRef.current = null;
      }
      productBarcodeScannerRef.current?.stop();
      productBarcodeScannerRef.current = null;
    };
  }, [showProductBarcodeScanner, canStartProductBarcodeScanner, barcodeScanMode]);

  const handleOpenProductBarcodeScanner = async () => {
    setBarcodeScanMessage('');
    setBarcodeScanError('');
    setBarcodeScanMode('product');
    setCanStartProductBarcodeScanner(false);

    if (!window.isSecureContext) {
      setShowProductBarcodeScanner(true);
      setBarcodeScanError('Camera works only on localhost or HTTPS. Open the app with localhost or enable HTTPS for mobile/tablet.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setShowProductBarcodeScanner(true);
      setBarcodeScanError('This browser does not support camera access. Use latest Chrome, Edge, or Firefox.');
      return;
    }

    try {
      setIsStartingBarcodeCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCanStartProductBarcodeScanner(true);
      setShowProductBarcodeScanner(true);
    } catch (error: any) {
      console.error('Camera permission rejected:', error);
      setShowProductBarcodeScanner(true);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setBarcodeScanError('Camera permission is blocked. Click the lock/camera icon in the browser address bar and allow Camera, then try again.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setBarcodeScanError('No camera was found on this device.');
      } else {
        setBarcodeScanError('Camera could not open. Close other camera apps and check browser permission.');
      }
    } finally {
      setIsStartingBarcodeCamera(false);
    }
  };

  const handleCloseProductBarcodeScanner = () => {
    if (nativeBarcodeScanFrameRef.current !== null) {
      window.cancelAnimationFrame(nativeBarcodeScanFrameRef.current);
      nativeBarcodeScanFrameRef.current = null;
    }
    barcodeScanCandidateRef.current = { value: '', count: 0 };
    productBarcodeScannerRef.current?.stop();
    productBarcodeScannerRef.current = null;
    setCanStartProductBarcodeScanner(false);
    setShowProductBarcodeScanner(false);
    setIsStartingBarcodeCamera(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryName = categoryInput.trim();
    if (!name || !sku || !categoryName || !sellingPrice || !costPrice) {
      alert('Please fill in all required fields: Product Name, Category, SKU, Selling Price, and Cost Price.');
      return;
    }
    if (quantity && Number(quantity) < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    try {
      let resolvedCategoryId = categoryId;
      if (!resolvedCategoryId) {
        const matchingCategory = categories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase());

        if (matchingCategory) {
          resolvedCategoryId = matchingCategory.id;
        } else {
          const createdCategory = await auth.apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({
              name: categoryName,
              description: '',
              sortOrder: categories.length + 1,
              status: 'Active',
              parentCategoryId: null,
            }),
          });
          resolvedCategoryId = createdCategory.id;
          setCategories((current) => [...current, { ...createdCategory, productsCount: 0 }]);
        }
      }

      await auth.apiRequest(editingProduct ? `/products/${editingProduct.id}` : '/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: JSON.stringify({
          name,
          sku,
          barcode,
          categoryId: resolvedCategoryId,
          brand,
          sellingPrice,
          costPrice,
          expiryDate: expiryDate || null,
          unit,
          quantity,
          isOnOffer,
          offerPrice: offerPrice ? parseFloat(offerPrice) : null,
          offerStartDate: offerStartDate || null,
          offerEndDate: offerEndDate || null,
        }),
      });

      // Clear Form & Close
      resetAddProductForm();
      setShowAddModal(false);
      fetchProducts();
      fetchCategories();
      fetchProductStats();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to save product. Check for duplicate SKU/Barcode or other missing info.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await auth.apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      alert('Product deleted successfully');
      setProductToDelete(null);
      fetchProducts();
      fetchProductStats();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.message || 'Failed to delete product.');
    }
  };

  const normalizeBarcode = (value: string) => value.replace(/[\r\n\t\s]/g, '').trim();

  const closeBarcodeLookup = () => {
    barcodeLookupScannerRef.current?.stop();
    barcodeLookupScannerRef.current = null;
    barcodeLookupCandidateRef.current = { value: '', count: 0 };
    setShowBarcodeLookupCamera(false);
    setIsStartingBarcodeLookupCamera(false);
    setShowBarcodeModal(false);
  };

  const openBarcodeLookup = () => {
    setBarcodeInput('');
    setBarcodeLookupProduct(null);
    setBarcodeLookupError('');
    setShowBarcodeModal(true);
    handleOpenBarcodeLookupCamera();
  };

  const handleOpenBarcodeLookupCamera = async () => {
    setBarcodeLookupProduct(null);
    setBarcodeLookupError('');
    barcodeLookupCandidateRef.current = { value: '', count: 0 };

    if (!window.isSecureContext) {
      setBarcodeLookupError('Camera works only on localhost or HTTPS. Use the scanner machine/manual barcode field or open this app on localhost.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setBarcodeLookupError('This browser does not support camera access. Use the scanner machine/manual barcode field.');
      return;
    }

    try {
      setIsStartingBarcodeLookupCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setShowBarcodeLookupCamera(true);
    } catch (error: any) {
      console.error('Camera permission rejected:', error);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setBarcodeLookupError('Camera permission is blocked. Allow Camera from the browser address bar, or scan with the scanner machine.');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setBarcodeLookupError('No camera was found. Scan with the scanner machine or enter the barcode manually.');
      } else {
        setBarcodeLookupError('Camera could not open. Close other camera apps or use the scanner machine/manual barcode field.');
      }
    } finally {
      setIsStartingBarcodeLookupCamera(false);
    }
  };

  const handleBarcodeScan = async (scannedValue = barcodeInput): Promise<boolean> => {
    console.log('[DEBUG] Verify Scanner Input:', {
      scannedBarcode: scannedValue,
      barcodeLength: scannedValue?.length || 0,
      timestamp: new Date().toISOString()
    });

    const cleanBarcode = normalizeBarcode(scannedValue);
    if (!cleanBarcode) {
      setBarcodeLookupError('Scan or enter a barcode first.');
      setBarcodeLookupProduct(null);
      return false;
    }

    setBarcodeInput(cleanBarcode);
    setBarcodeLookupError('');

    try {
      const localProduct = products.find((p: any) => normalizeBarcode(String(p.barcode || '')) === cleanBarcode);
      const foundProduct = localProduct || (await auth.apiRequest(`/products?search=${encodeURIComponent(cleanBarcode)}`))
        .find((p: any) => normalizeBarcode(String(p.barcode || '')) === cleanBarcode);

      if (foundProduct) {
        console.log('[DEBUG] Product Search Validation (Success):', {
          scannedBarcode: cleanBarcode,
          matchedProduct: foundProduct.name,
          databaseBarcode: foundProduct.barcode
        });

        setBarcodeLookupProduct(foundProduct);
        setSearch(cleanBarcode);
        // Automatically Close Scanner Popup
        closeBarcodeLookup();
        // Show Product Details Immediately
        setSelectedProduct(foundProduct);
        return true;
      }

      console.log('[DEBUG] Product Search Validation (Failure - Product Not Found):', {
        scannedBarcode: cleanBarcode
      });

      setBarcodeLookupProduct(null);
      setBarcodeLookupError('Product not found');
      return false;
    } catch (err: any) {
      console.error(err);
      console.log('[DEBUG] Product Search Validation (Error):', {
        scannedBarcode: cleanBarcode,
        error: err?.message
      });
      setBarcodeLookupProduct(null);
      setBarcodeLookupError('Product not found');
      return false;
    }
  };

  const productKpiInsights = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const today = new Date().toDateString();

    const addedThisWeek = products.filter((product: any) => {
      const createdAt = product.createdAt || product.created_at;
      return createdAt ? new Date(createdAt).getTime() >= weekAgo : false;
    }).length;

    const addedToday = products.filter((product: any) => {
      const createdAt = product.createdAt || product.created_at;
      return createdAt ? new Date(createdAt).toDateString() === today : false;
    }).length;

    const totalStockUnits = products.reduce((sum: number, product: any) => sum + Number(product.quantity || 0), 0);
    const lowStockUnits = products
      .filter((product: any) => getStockStatus(product) === 'LOW_STOCK')
      .reduce((sum: number, product: any) => sum + Number(product.quantity || 0), 0);
    const outOfStockUnits = products
      .filter((product: any) => getStockStatus(product) === 'OUT_OF_STOCK')
      .reduce((sum: number, product: any) => sum + Number(product.quantity || 0), 0);

    const categoryScores = products.reduce((acc: Record<string, number>, product: any) => {
      const categoryName = product.category?.name || product.categoryName || 'General';
      acc[categoryName] = (acc[categoryName] || 0) + Math.max(Number(product.soldCount || 0), 1);
      return acc;
    }, {});

    const topCategory = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0] || categories[0]?.name || 'No category data';
    const fastMovingProduct = products.reduce((top: any | null, product: any) => {
      if (!top) return product;
      return Number(product.soldCount || 0) > Number(top.soldCount || 0) ? product : top;
    }, null);
    const newInStockProduct = [...products]
      .filter((product: any) => product.createdAt || product.created_at)
      .sort((a: any, b: any) =>
        new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
      )
      .find((product: any) => Number(product.quantity || 0) > 0) || products.find((product: any) => Number(product.quantity || 0) > 0);
    const topCategoryCount = products.filter((product: any) =>
      (product.category?.name || product.categoryName || 'General') === topCategory
    ).length;

    return {
      addedThisWeek,
      addedToday,
      totalStockUnits,
      lowStockUnits,
      outOfStockUnits,
      topCategory,
      topCategoryCount,
      fastMovingProductName: fastMovingProduct?.name || 'No sales data',
      fastMovingSoldCount: Number(fastMovingProduct?.soldCount || 0),
      newInStockName: newInStockProduct?.name || 'No new stock item',
      newInStockUnits: Number(newInStockProduct?.quantity || 0),
    };
  }, [products, categories]);

  return (
    <div className="w-full max-w-full space-y-8 select-none font-['Trebuchet_MS'] text-[15px]">

      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-3xl font-semibold text-black tracking-tight leading-none">
            Products
          </h1>

          <nav className="text-sm font-bold text-slate-600 mt-2 block tracking-wide">
            Dashboard &nbsp;&gt;&nbsp;
            <span className="text-slate-700">Products</span>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <button
            onClick={openBarcodeLookup}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200/80 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            Barcode Scan
          </button>

          <button
            onClick={() => {
              resetAddProductForm();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Products */}
        <button type="button" onClick={() => setStatusFilter('')} className={`bg-white border rounded-2xl px-4 py-4 min-h-[125px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left ${!statusFilter ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-100/80'}`}>
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">Total Products</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Package className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productStats.totalProducts.toLocaleString()} Products</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">+{productKpiInsights.addedThisWeek} added this week</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Stock units</span>
                <span className="text-slate-800">{productKpiInsights.totalStockUnits.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Low Stock Alerts */}
        <button type="button" onClick={() => setStatusFilter('LOW_STOCK')} className={`bg-white border rounded-2xl px-4 py-4 min-h-[128px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left ${statusFilter === 'LOW_STOCK' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100/80'}`}>
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">Low Stock Products</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productStats.lowStock} Products</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">Need restock soon</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Units left</span>
                <span className="text-slate-800">{productKpiInsights.lowStockUnits.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Top Category */}
        <button type="button" onClick={() => setStatusFilter('')} className="bg-white border border-slate-100/80 rounded-2xl px-4 py-4 min-h-[128px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left">
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">Top Category</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Layers className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productKpiInsights.topCategory}</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">Leading product category</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Products</span>
                <span className="text-slate-800">{productKpiInsights.topCategoryCount}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Out of Stock */}
        <button type="button" onClick={() => setStatusFilter('OUT_OF_STOCK')} className={`bg-white border rounded-2xl px-4 py-4 min-h-[128px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left ${statusFilter === 'OUT_OF_STOCK' ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-100/80'}`}>
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">Out Of Stock</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productStats.outOfStock} Products</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">Currently unavailable</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Sellable units</span>
                <span className="text-slate-800">{productKpiInsights.outOfStockUnits}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Fast Moving Product */}
        <button type="button" onClick={() => setStatusFilter('')} className="bg-white border border-slate-100/80 rounded-2xl px-4 py-4 min-h-[128px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left">
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">Fast Moving Product</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productKpiInsights.fastMovingProductName}</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">Highest sales this week</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Sold</span>
                <span className="text-slate-800">{productKpiInsights.fastMovingSoldCount.toLocaleString()} units</span>
              </div>
            </div>
          </div>
        </button>

        {/* New In Stock */}
        <button type="button" onClick={() => setStatusFilter('')} className="bg-white border border-slate-100/80 rounded-2xl px-4 py-4 min-h-[128px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full text-left">
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-600 block">New In Stock</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <CalendarDays className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium font-['Inter'] text-slate-950 leading-snug break-words">{productKpiInsights.newInStockName}</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">New product now available</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
                <span>Added today</span>
                <span className="text-slate-800">{productKpiInsights.addedToday || productKpiInsights.newInStockUnits} {productKpiInsights.addedToday ? 'items' : 'units'}</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Product List Table Panel */}
      <div className="bg-white border border-slate-100/80 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 text-left font-['Trebuchet_MS'] text-sm">

        {/* Table Filters & Control row */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="relative w-full xl:max-w-md">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by product name, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {renderFilterDropdown(
              'category',
              'All Categories',
              catFilter,
              [
                { label: 'All Categories', value: '' },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ],
              setCatFilter
            )}

            {renderFilterDropdown(
              'brand',
              'All Brands',
              brandFilter,
              [
                { label: 'All Brands', value: '' },
                { label: 'Fresh Farms', value: 'Fresh Farms' },
                { label: 'Amul', value: 'Amul' },
                { label: 'Coca Cola', value: 'Coca Cola' },
                { label: "Lay's", value: "Lay's" },
                { label: 'Britannia', value: 'Britannia' },
              ],
              setBrandFilter
            )}

            {renderFilterDropdown(
              'warehouse',
              'All Warehouses',
              warehouseFilter,
              [
                { label: 'All Warehouses', value: '' },
                { label: 'Main Warehouse', value: 'Main Warehouse' },
                { label: 'Retail Store', value: 'Retail Store' },
              ],
              setWarehouseFilter
            )}

            {renderFilterDropdown(
              'status',
              'Stock Status',
              statusFilter,
              [
                { label: 'Stock Status', value: '' },
                { label: 'In Stock', value: 'IN_STOCK' },
                { label: 'Low Stock', value: 'LOW_STOCK' },
                { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
              ],
              setStatusFilter
            )}




          </div>
        </div>

        {/* Master Catalog Data Table */}
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-black dark:text-white text-sm font-bold">
                <th className="px-4 py-4 text-left">Product</th>
                <th className="px-4 py-4 text-left w-[100px] whitespace-nowrap">SKU</th>
                <th className="px-4 py-4 text-left w-[110px] whitespace-nowrap">Barcode</th>
                <th className="px-4 py-4 text-left w-[110px] whitespace-nowrap">Category</th>
                <th className="px-4 py-4 text-left w-[100px] whitespace-nowrap">Brand</th>
                <th className="px-4 py-4 text-right w-[100px] whitespace-nowrap">Selling Price</th>
                <th className="px-4 py-4 text-right w-[100px] whitespace-nowrap">Cost Price</th>
                <th className="px-4 py-4 text-right w-[80px] whitespace-nowrap">Stock</th>
                <th className="px-4 py-4 text-center w-[100px] whitespace-nowrap">Status</th>
                <th className="px-4 py-4 text-center w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    Loading products list...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    {catFilter ? 'No products available in this category.' : 'No products matching search criteria.'}
                  </td>
                </tr>
              ) : (
                products.map((prod: any) => (
                  <tr key={prod.id} className="text-sm font-semibold text-slate-800 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 text-left">
                      <div className="flex flex-col">
                        <h5 className="text-sm font-bold text-black dark:text-white leading-none">{prod.name}</h5>
                        <span className="text-xs text-slate-500 mt-1 block font-medium">{prod.unit || 'PCS'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-left">{prod.sku}</td>
                    <td className="px-4 py-4 text-left font-normal text-slate-650 text-slate-600 dark:text-slate-400">{prod.barcode || '—'}</td>
                    <td className="px-4 py-4 text-left">{prod.category?.name}</td>
                    <td className="px-4 py-4 text-left font-normal text-slate-600 dark:text-slate-400">{prod.brand || '—'}</td>
                    <td className="px-4 py-4 text-right font-extrabold text-black dark:text-white">
                      {formatPrice(prod.sellingPrice)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {formatPrice(prod.costPrice)}
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-black dark:text-white">
                      {prod.quantity}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex min-w-[92px] justify-center px-2.5 py-1 rounded-full border font-bold text-xs ${getStatusClass(getStockStatus(prod))}`}>
                        {getStatusLabel(getStockStatus(prod))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openProductDetails(prod)}
                          className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                          title="View catalog details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEditProduct(prod)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all" title="Edit product">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                         <button
                          onClick={() => setProductToDelete(prod)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                          title="Delete from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* High Fidelity Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-4 md:pt-8 p-2 md:p-4 select-none">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-xl md:max-w-2xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] shadow-2xl text-left animate-pulse-subtle/0 flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-black tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button
                onClick={() => {
                  resetAddProductForm();
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-3.5 md:p-4 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Apple"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Category</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      const cat = categories.find((c) => c.id === e.target.value);
                      setCategoryInput(cat ? cat.name : '');
                    }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50 text-black"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APL-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Farms"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap">Barcode</label>
                  {barcodeScanMessage ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {barcodeScanMessage}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={productBarcodeInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Scan with USB scanner or type barcode"
                    value={barcode}
                    onChange={(e) => {
                      setBarcode(e.target.value);
                      setBarcodeScanMessage('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleOpenProductBarcodeScanner}
                    disabled={isStartingBarcodeCamera}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-bold text-xs transition-all cursor-pointer disabled:cursor-wait whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4" />
                    {isStartingBarcodeCamera ? 'Opening...' : 'Camera Scan'}
                  </button>
                </div>
                <p className="text-[10px] font-semibold text-slate-500">USB scanner and manual entry work directly in this field.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="250"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="120"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="Per Kg, PCS, Tray"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50"
                  />
                </div>

                <div ref={expiryCalendarRef} className="relative sm:col-span-2">
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider whitespace-nowrap block mb-1.5">
                    Expiry Date <span className="text-slate-500 normal-case">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowExpiryCalendar((current) => !current);
                    }}
                    className="flex w-full items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 focus:bg-white bg-slate-50 hover:border-emerald-300 transition-colors"
                  >
                    <span>{expiryDate ? formatDate(expiryDate) : 'Select expiry date'}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                  </button>

                  {showExpiryCalendar ? (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute bottom-[calc(100%+0.35rem)] left-0 z-[70] w-64 rounded-xl border border-emerald-200 bg-emerald-50 p-2 shadow-xl shadow-emerald-200/70"
                    >
                      <div className="flex items-center justify-between rounded-lg bg-white border border-emerald-100 px-2 py-1.5">
                        <button type="button" onClick={() => changeExpiryCalendarMonth(-1)} className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50" aria-label="Previous month">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[11px] font-extrabold text-black">
                          {expiryCalendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </span>
                        <button type="button" onClick={() => changeExpiryCalendarMonth(1)} className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50" aria-label="Next month">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-0.5 pt-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                          <span key={day} className="text-[9px] font-extrabold text-emerald-700">
                            {day}
                          </span>
                        ))}

                        {expiryCalendarDays.map((date, index) => {
                          const value = date ? toDateInputValue(date) : '';
                          const isSelected = value && value === expiryDate;
                          const isToday = value && value === toDateInputValue(new Date());

                          return date ? (
                            <button
                              key={value}
                              type="button"
                              onClick={() => selectExpiryDate(date)}
                              className={`h-7 rounded-lg text-[11px] font-bold transition-all ${isSelected
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-300'
                                : isToday
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-white text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                            >
                              {date.getDate()}
                            </button>
                          ) : (
                            <span key={`empty-${index}`} />
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-2">
                        <button
                          type="button"
                          onClick={() => setExpiryDate('')}
                          className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-red-600"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExpiryCalendar(false)}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isOnOffer"
                    checked={isOnOffer}
                    onChange={(e) => setIsOnOffer(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="isOnOffer" className="text-xs font-bold text-black uppercase tracking-wider cursor-pointer">
                    Promotional Offer Active
                  </label>
                </div>

                {isOnOffer && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                    <div>
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1.5">Offer Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Offer price"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={offerStartDate}
                        onChange={(e) => setOfferStartDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={offerEndDate}
                        onChange={(e) => setOfferEndDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetAddProductForm();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>

          {showProductBarcodeScanner ? (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-left">
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">Camera Barcode Scan</h4>
                  <button
                    type="button"
                    onClick={handleCloseProductBarcodeScanner}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  {barcodeScanError ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700 leading-5">
                      {barcodeScanError}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        barcodeScanCandidateRef.current = { value: '', count: 0 };
                        setBarcodeScanMode('product');
                      }}
                      className={`rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${barcodeScanMode === 'product'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                      Product Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        barcodeScanCandidateRef.current = { value: '', count: 0 };
                        setBarcodeScanMode('all');
                      }}
                      className={`rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${barcodeScanMode === 'all'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                      All Codes
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-2 overflow-hidden min-h-[276px]">
                    <div className="relative overflow-hidden rounded-lg bg-black">
                      <video
                        id="add-product-barcode-video"
                        className="h-[280px] w-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(15,23,42,0.28)]" />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 leading-5">
                    Product Barcode captures the first valid product barcode instantly. Use All Codes only for custom labels or QR/DataMatrix codes.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseProductBarcodeScanner}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Close Camera
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-left">
            <div className="flex justify-between items-center border-b pb-3.5">
              <h3 className="text-lg font-bold text-rose-600 uppercase tracking-wider">Delete Product</h3>
              <button
                onClick={() => setProductToDelete(null)}
                className="text-slate-400 hover:text-black transition p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700">
                Are you sure you want to delete this product?
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold space-y-2 text-black">
                <div className="flex justify-between">
                  <span className="text-[#374151]">Product Name:</span>
                  <span className="font-extrabold text-black">{productToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#374151]">Barcode:</span>
                  <span className="font-bold text-black">{productToDelete.barcode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#374151]">SKU:</span>
                  <span className="font-bold text-black">{productToDelete.sku || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 font-bold text-xs">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 py-3 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-all duration-200 cursor-pointer text-center uppercase tracking-wider shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="relative bg-white border border-slate-100 rounded-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] shadow-2xl overflow-hidden text-left flex flex-col">
            <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-amber-50 border-b border-slate-100 pl-5 pr-14 py-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-black tracking-tight">{selectedProduct.name}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">{selectedProduct.category?.name || 'No category'} - {selectedProduct.brand || 'No brand'}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 hover:bg-white hover:text-black shadow-sm cursor-pointer"
                aria-label="Close catalog details"
              >
                x
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-600">Selling Price</span>
                  <h4 className="text-2xl font-extrabold text-black mt-1">{formatPrice(selectedProduct.sellingPrice)}</h4>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <span className="text-[10px] uppercase font-extrabold text-amber-600">Current Stock</span>
                  <h4 className="text-2xl font-extrabold text-black mt-1">{selectedProduct.quantity} {selectedProduct.unit || 'PCS'}</h4>
                </div>
                <div className={`rounded-2xl border p-4 ${getStatusClass(getStockStatus(selectedProduct))}`}>
                  <span className="text-[10px] uppercase font-extrabold">Status</span>
                  <h4 className="text-xl font-extrabold mt-1">{getStatusLabel(getStockStatus(selectedProduct))}</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['SKU', selectedProduct.sku],
                  ['Barcode', selectedProduct.barcode || 'N/A'],
                  ['Cost Price', formatPrice(selectedProduct.costPrice)],
                  ['Expiry Date', formatDate(selectedProduct.expiryDate)],
                  ['Created', selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{label}</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => openEditProduct(selectedProduct)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Product
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scan Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] shadow-2xl overflow-hidden text-left animate-pulse-subtle/0 flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-black tracking-tight">Scan Barcode</h3>
              <button
                onClick={closeBarcodeLookup}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {barcodeLookupError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700 leading-5">
                  {barcodeLookupError}
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-white p-2 overflow-hidden">
                {showBarcodeLookupCamera ? (
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video
                      id="lookup-barcode-video"
                      className="h-[260px] w-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(15,23,42,0.28)]" />
                  </div>
                ) : (
                  <div className="h-[260px] rounded-lg bg-slate-950 flex flex-col items-center justify-center gap-3 text-white">
                    <Camera className="w-10 h-10 text-emerald-300" />
                    <span className="text-sm font-bold">{isStartingBarcodeLookupCamera ? 'Opening camera...' : 'Camera not started'}</span>
                    <button
                      type="button"
                      onClick={handleOpenBarcodeLookupCamera}
                      disabled={isStartingBarcodeLookupCamera}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-xs transition-all cursor-pointer disabled:cursor-wait"
                    >
                      Open Camera
                    </button>
                  </div>
                )}
              </div>

              {barcodeLookupProduct ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-lg shadow-slate-200/70">
                  <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div>
                      <h4 className="text-xl font-extrabold text-black leading-tight">{barcodeLookupProduct.name}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{barcodeLookupProduct.category?.name || 'No category'} - {barcodeLookupProduct.brand || 'No brand'}</p>
                    </div>
                    <span className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-sm">
                      Found
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SKU</span>
                      <strong className="text-sm text-black">{barcodeLookupProduct.sku}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Barcode</span>
                      <strong className="text-sm text-black break-all">{barcodeLookupProduct.barcode || 'N/A'}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock</span>
                      <strong className="text-sm text-black">{barcodeLookupProduct.quantity} {barcodeLookupProduct.unit || 'PCS'}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                      <strong className="text-sm text-black">{String(barcodeLookupProduct.status || '').replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Expiry Date</span>
                      <strong className="text-sm text-black">{formatDate(barcodeLookupProduct.expiryDate)}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Selling Price</span>
                      <strong className="text-base text-black">{formatPrice(barcodeLookupProduct.sellingPrice)}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Price</span>
                      <strong className="text-base text-black">{formatPrice(barcodeLookupProduct.costPrice)}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Created</span>
                      <strong className="text-sm text-black">
                        {barcodeLookupProduct.createdAt ? new Date(barcodeLookupProduct.createdAt).toLocaleString() : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400">Point the camera at the product barcode.</span>
                <button
                  type="button"
                  onClick={closeBarcodeLookup}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Products;

