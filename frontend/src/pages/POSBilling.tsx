import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Minus,
  Printer,
  MessageCircle,
  CheckCircle,
  Trash2,
  Camera,
  Barcode,
  RefreshCw,
  Store,
  X
} from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  stockQty: number;
  gstPercent: number;
  barcode?: string;
  sku?: string;
  notes?: string;
  itemDiscount?: number;
  isOfferActive?: boolean;
  originalPrice?: number;
  offerPrice?: number;
  savings?: number;
}

export const POSBilling: React.FC = () => {
  const auth = useAuth();
  const [selectedCashier] = useState<string>('Admin');

  // Restaurant states
  const [tableId, setTableId] = useState<string | null>(null);
  const [table, setTable] = useState<any>(null);
  const [isRestaurantMode, setIsRestaurantMode] = useState<boolean>(false);
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [gstPercent] = useState<number>(5); // default restaurant GST is 5%
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [isFullScreenOrder, setIsFullScreenOrder] = useState<boolean>(false);
  const [activeRunningBillTable, setActiveRunningBillTable] = useState<any | null>(null);

  // References
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const isLookingUpRef = useRef<boolean>(false);

  // Lists from DB
  const [customers, setCustomers] = useState<any[]>([]);

  // Terminal state
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [currentStep, setCurrentStep] = useState<'BILLING' | 'PAYMENT' | 'SUCCESS' | 'INVOICE'>('BILLING');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');

  // Camera scan toggler
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Held Bills and Customer Modal
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [activeHeldBillId, setActiveHeldBillId] = useState<string | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerModalTab, setCustomerModalTab] = useState<'SELECT' | 'REGISTER'>('SELECT');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Customer specific discount percentage
  const [customerDiscountPercent, setCustomerDiscountPercent] = useState<number>(0);
  const [printCustomerDiscount, setPrintCustomerDiscount] = useState(0);

  // Time & Invoice metadata
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  const [activeBillNumber, setActiveBillNumber] = useState(() => 'INV-' + Math.floor(10000 + Math.random() * 90000));
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'FAILED'>('IDLE');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'CASH'>('UPI');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Settings loaded from DB
  const [settings, setSettings] = useState({
    shopName: 'Society Supermarket',
    shopAddress: 'Sector 15, HSR Layout, Bengaluru',
    gstNumber: '29AAAAA1111A1Z1',
    mobileNumber: '+91 99999 88888',
    whatsappNumber: '+91 99999 88888',
    email: 'info@societysupermarket.com',
    logo: '',
    invoiceFooter: 'Thank you for visiting our store',
  });

  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio blocked', e);
    }
  };

  const loadData = async () => {
    try {
      const dbCustomers = await auth.apiRequest('/customers');
      setCustomers(dbCustomers || []);

      const dbSettings = await auth.apiRequest('/settings');
      if (dbSettings) {
        setSettings({
          shopName: dbSettings.shopName || 'Society Supermarket',
          shopAddress: dbSettings.shopAddress || 'Sector 15, HSR Layout, Bengaluru',
          gstNumber: dbSettings.gstNumber || '29AAAAA1111A1Z1',
          mobileNumber: dbSettings.mobile || '+91 99999 88888',
          whatsappNumber: dbSettings.mobile || '+91 99999 88888',
          email: dbSettings.email || 'info@societysupermarket.com',
          logo: dbSettings.logo || '',
          invoiceFooter: dbSettings.footerMessage || 'Thank you for visiting our store',
        });
      }

      const dbHeld = await auth.apiRequest('/billing/resume');
      setHeldBills(dbHeld || []);

      setSelectedCustomerId('');

      // Fetch restaurant categories & menu items if business is Restaurant/Cafe or URL contains tableId
      const params = new URLSearchParams(window.location.search);
      const tId = params.get('tableId');
      const businessType = auth.user?.businessType || '';
      const isRest = tId || businessType === 'Restaurant' || businessType === 'Cafe';

      if (isRest) {
        setIsRestaurantMode(true);
        let tablesList: any[] = [];
        try {
          tablesList = await auth.apiRequest(`/restaurant/tables`);
          setTables(tablesList || []);
        } catch (err) {
          console.warn('Failed to load restaurant tables', err);
        }

        if (tId) {
          setTableId(tId);
          const currentTable = tablesList.find((t: any) => t.id === tId);
          if (currentTable) {
            setTable(currentTable);
            if (currentTable.activeOrderId) {
              try {
                // Fetch existing active kitchen order items
                const activeOrder = await auth.apiRequest(`/restaurant/orders/${currentTable.activeOrderId}`);
                if (activeOrder && activeOrder.items) {
                  const loadedCart = activeOrder.items.map((it: any) => ({
                    id: it.menuItem.id,
                    name: it.menuItem.name,
                    price: it.menuItem.price || it.unitPrice,
                    unit: it.menuItem.unit || 'pcs',
                    quantity: it.quantity,
                    stockQty: 9999,
                    gstPercent: 5, // Restaurant standard GST is 5%
                    orderedQty: it.quantity, // Track already sent quantity
                    notes: it.notes || ''
                  }));
                  setCart(loadedCart);
                  setSpecialInstructions(activeOrder.notes || '');
                }
              } catch (err) {
                console.warn('Failed to load table billing data', err);
              }
            }
          }
        }

        try {
          const cats = await auth.apiRequest('/restaurant/menu/categories');
          setRestaurantCategories(cats || []);
          if (cats && cats.length > 0) {
            setActiveCategory(cats[0].id);
          }
          const items = await auth.apiRequest('/restaurant/menu/items');
          setRestaurantMenuItems(items || []);
        } catch (err) {
          console.warn('Failed to load restaurant menu data', err);
        }
      }
    } catch (err) {
      console.warn('Data lookup offline fallback', err);
    }
  };

  const focusInput = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  useEffect(() => {
    loadData();
    const clock = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    }, 1000);

    const timer = setTimeout(focusInput, 300);

    // Navbar Autocomplete Click Handler
    const handleNavbarProduct = (e: any) => {
      const prod = e.detail;
      if (prod) {
        addToCart(prod);
      }
    };
    window.addEventListener('navbar-product-selected', handleNavbarProduct);

    return () => {
      clearInterval(clock);
      clearTimeout(timer);
      window.removeEventListener('navbar-product-selected', handleNavbarProduct);
    };
  }, [currentStep]);

  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      // Allow user to click payment modals, number boxes, or input fields
      const target = e.target as HTMLElement;
      const isInteraction = target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a');

      if (currentStep === 'BILLING' && !showCameraScanner && !isRestaurantMode && !isInteraction) {
        focusInput();
      }
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [currentStep, showCameraScanner, isRestaurantMode]);

  // Main barcode check scanner lookup
  const handleBarcodeLookup = async (code: string): Promise<boolean> => {
    if (isLookingUpRef.current) return false;
    isLookingUpRef.current = true;

    console.log('[DEBUG] Verify Scanner Input:', {
      scannedBarcode: code,
      barcodeLength: code?.length || 0,
      timestamp: new Date().toISOString()
    });

    const trimmed = code.replace(/[\r\n\t\s]/g, '').trim();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = '';
    }
    setBarcodeValue('');
    if (!trimmed) {
      isLookingUpRef.current = false;
      return false;
    }

    try {
      console.log('[DEBUG] Barcode Lookup Triggered:', {
        scannedCode: trimmed,
        apiUrl: `/products?search=${encodeURIComponent(trimmed)}`
      });

      // Fetch latest search results from backend in real-time
      const results = await auth.apiRequest(`/products?search=${encodeURIComponent(trimmed)}`);
      console.log('[DEBUG] Barcode Lookup API Results:', results);

      let matchedProduct = results?.find(
        (p: any) =>
          (p.barcode && p.barcode === trimmed) ||
          p.sku?.toLowerCase() === trimmed.toLowerCase() ||
          p.id === trimmed ||
          p.name?.toLowerCase() === trimmed.toLowerCase()
      );

      // Fallback: If no exact matchedProduct is found, but the search API returned exactly one result, and its barcode matches exactly:
      if (!matchedProduct && results && results.length === 1) {
        const singleProd = results[0];
        if (singleProd.barcode && singleProd.barcode === trimmed) {
          console.log('[DEBUG] exact match fallback to single API search result:', singleProd);
          matchedProduct = singleProd;
        }
      }

      console.log('[DEBUG] Barcode Lookup Matched Product:', matchedProduct);

      if (!matchedProduct) {
        console.log('[DEBUG] Product Search Validation (Failure - Product Not Found):', {
          scannedBarcode: trimmed
        });
        showToast('Product not found', 'error');
        setBarcodeValue('');
        setTimeout(focusInput, 50);
        isLookingUpRef.current = false;
        return false;
      }

      console.log('[DEBUG] Product Search Validation (Success):', {
        scannedBarcode: trimmed,
        matchedProduct: matchedProduct.name,
        databaseBarcode: matchedProduct.barcode
      });

      if (!matchedProduct.name) {
        showToast('Product name missing.', 'error');
        setBarcodeValue('');
        setTimeout(focusInput, 50);
        isLookingUpRef.current = false;
        return false;
      }

      if (matchedProduct.sellingPrice === undefined || matchedProduct.sellingPrice === null || matchedProduct.sellingPrice <= 0) {
        showToast('Product price missing.', 'error');
        setBarcodeValue('');
        setTimeout(focusInput, 50);
        isLookingUpRef.current = false;
        return false;
      }

      if (matchedProduct.status === 'Inactive' || matchedProduct.status === 'INACTIVE') {
        showToast('Product inactive.', 'error');
        setBarcodeValue('');
        setTimeout(focusInput, 50);
        isLookingUpRef.current = false;
        return false;
      }

      addToCart(matchedProduct);
      setBarcodeValue('');

      // Auto-focus barcode scanner input field after scanning product
      setTimeout(focusInput, 150);
      isLookingUpRef.current = false;
      return true;
    } catch (err) {
      console.error('Barcode lookup error:', err);
      console.log('[DEBUG] Product Search Validation (Error):', {
        scannedBarcode: trimmed,
        error: err instanceof Error ? err.message : String(err)
      });
      showToast('Product not found', 'error');
      setBarcodeValue('');
      setTimeout(focusInput, 50);
      isLookingUpRef.current = false;
      return false;
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scannedCode = barcodeInputRef.current?.value || barcodeValue;
    if (scannedCode) {
      handleBarcodeLookup(scannedCode);
    }
  };

  const addToCart = (product: any) => {
    playBeep();
    const branchStock = product.quantity ?? (product.stocks && product.stocks[0] ? product.stocks[0].quantity : 10);

    if (branchStock <= 0) {
      showToast(`${product.name} is OUT OF STOCK!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.id === product.id);
    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      if (existingItem.quantity + 1 > branchStock) {
        showToast(`Stock limit exceeded. Only ${branchStock} units available.`, 'error');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex] = { ...existingItem, quantity: existingItem.quantity + 1 };
      setCart(newCart);
    } else {
      const now = new Date();
      let isOfferActive = false;
      let finalPrice = product.sellingPrice || product.price || 0;
      let originalPrice = product.sellingPrice || product.price || 0;
      let offerPrice = product.offerPrice;
      let savings = 0;

      if (product.isOnOffer && typeof product.offerPrice === 'number' && product.offerPrice >= 0) {
        const startOk = !product.offerStartDate || new Date(product.offerStartDate) <= now;
        const endOk = !product.offerEndDate || new Date(product.offerEndDate) >= now;
        if (startOk && endOk) {
          isOfferActive = true;
          finalPrice = product.offerPrice;
          savings = Math.max(0, originalPrice - finalPrice);
        }
      }

      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: finalPrice,
          unit: product.unit || 'pcs',
          quantity: 1,
          stockQty: branchStock,
          gstPercent: product.gstPercent || 18,
          barcode: product.barcode,
          sku: product.sku,
          itemDiscount: product.offerDiscount || 0,
          isOfferActive,
          originalPrice,
          offerPrice,
          savings
        }
      ]);
    }
    setTimeout(focusInput, 50);
  };

  const incrementCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item && item.quantity < item.stockQty) {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      showToast('Exceeded available stock.', 'error');
    }
    setTimeout(focusInput, 50);
  };

  const decrementCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item && item.quantity > 1) {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)));
    } else {
      setCart(cart.filter((i) => i.id !== id));
    }
    setTimeout(focusInput, 50);
  };

  const deleteCartItem = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
    setTimeout(focusInput, 50);
  };

  // Customer Mobile silent auto-registration on 10 digits
  useEffect(() => {
    const mobile = customerMobile.trim();
    if (mobile.length === 10) {
      const matched = customers.find((c) => c.phone && c.phone.includes(mobile));
      if (matched) {
        setSelectedCustomerId(matched.id);
        showToast(`Customer Identified: ${matched.name}`, 'success');
      } else {
        // Auto create customer silent workflow
        const autoName = `Customer - ${mobile}`;
        auth.apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify({ name: autoName, phone: mobile, customerType: 'Regular' })
        })
          .then((newCust: any) => {
            setCustomers((prev) => [...prev, newCust]);
            setSelectedCustomerId(newCust.id);
            showToast(`New Customer Auto-Created: ${mobile}`, 'success');
          })
          .catch(() => {
            showToast('Failed to auto-create customer profile.', 'error');
          });
      }
    }
  }, [customerMobile]);

  // Handle success screen redirect timeout
  useEffect(() => {
    if (currentStep === 'SUCCESS') {
      const timer = setTimeout(() => {
        if (generatedInvoice) {
          localStorage.setItem('selectedInvoice', JSON.stringify(generatedInvoice));
        }
        setCurrentStep('INVOICE');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, generatedInvoice]);

  // Handle class toggle for layout visibility on invoice / success view
  useEffect(() => {
    if (currentStep === 'INVOICE' || currentStep === 'SUCCESS') {
      document.body.classList.add('is-invoice-view');
    } else {
      document.body.classList.remove('is-invoice-view');
    }
    return () => {
      document.body.classList.remove('is-invoice-view');
    };
  }, [currentStep]);

  // Camera scanner controller logic
  useEffect(() => {
    if (!showCameraScanner) {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
      return;
    }

    let isMounted = true;
    setCameraLoading(true);
    setCameraError('');

    // Wait a brief frame for the modal DOM to mount
    const initTimer = setTimeout(async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('NOT_SUPPORTED');
        }

        // Verify camera devices exist
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length === 0) {
          throw new Error('NO_CAMERA');
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        setCameraLoading(false);

        // Initialize ZXing reader
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.CODE_128
        ]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });

        if (videoRef.current && isMounted) {
          const controls = await reader.decodeFromVideoElement(videoRef.current, async (result, _err) => {
            if (!isMounted) return;
            if (result) {
              const barcode = result.getText().replace(/\s/g, '').trim();
              const found = await handleBarcodeLookup(barcode);
              if (found) {
                setShowCameraScanner(false);
              }
            }
          });
          scannerControlsRef.current = controls;
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        setCameraLoading(false);
        if (!isMounted) return;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access denied. Please allow camera permissions.');
        } else if (err.message === 'NO_CAMERA') {
          setCameraError('No camera device found.');
        } else if (err.message === 'NOT_SUPPORTED') {
          setCameraError('Camera access is not supported by your browser.');
        } else {
          setCameraError('Scanner initialization failed.');
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
        activeStreamRef.current = null;
      }
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
    };
  }, [showCameraScanner]);

  // Cart math
  const itemsCount = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const customerDiscount = subtotal * (customerDiscountPercent / 100);
  const finalDiscount = customerDiscount;

  // Tax is calculated on (subtotal - discount)
  const gstRate = isRestaurantMode ? gstPercent : 18;
  const taxAmount = (subtotal - finalDiscount) * (gstRate / 100);

  const grandTotal = Math.max(0, subtotal - finalDiscount + (isRestaurantMode ? serviceCharge : 0) + taxAmount);
  const changeReturned = Math.max(0, (parseFloat(cashReceived) || 0) - grandTotal);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Trigger Checkout
  const handleProceedToPayment = async (method: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' = 'UPI') => {
    if (cart.length === 0) return;
    const activeMobile = selectedCustomer?.phone || customerMobile || '0000000000';

    try {
      const orderData = await auth.apiRequest('/payment/create', {
        method: 'POST',
        body: JSON.stringify({ amount: grandTotal })
      });

      // Log order creation
      try {
        await auth.apiRequest('/payment/log', {
          method: 'POST',
          body: JSON.stringify({
            gateway: 'RAZORPAY',
            event: 'order_created',
            payload: { orderData, grandTotal, activeMobile },
            transactionStatus: 'INITIATED'
          })
        });
      } catch (e) {
        console.error('Failed to log order creation:', e);
      }

      // Load Razorpay script and open checkout directly
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast('Failed to load Razorpay SDK.', 'error');
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settings.shopName,
        description: `Invoice: ${activeBillNumber}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsProcessingPayment(true);
          setPrintCustomerDiscount(customerDiscount);
          const billingPayload = {
            customerId: selectedCustomerId || null,
            items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, itemDiscount: i.itemDiscount || 0 })),
            discount: finalDiscount,
            tax: taxAmount,
            paymentMethod: method,
            couponCode: null,
            cashierName: selectedCashier,
            customerMobile: activeMobile,
            heldBillId: activeHeldBillId
          };

          try {
            const verifyRes = await auth.apiRequest('/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                billingPayload
              })
            });

            setGeneratedInvoice(verifyRes.order);
            setCart([]);
            setCustomerDiscountPercent(0);
            setCurrentStep('SUCCESS');
            setWhatsappStatus('SENT');
            setActiveHeldBillId(null);
            const dbHeld = await auth.apiRequest('/billing/resume');
            setHeldBills(dbHeld || []);
            showToast('Payment Succeeded and Invoice Generated!', 'success');
          } catch (err) {
            showToast('Payment verification failed.', 'error');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          contact: activeMobile || undefined,
        },
        notes: {
          invoiceNumber: activeBillNumber,
          cashierName: selectedCashier,
          storeName: settings.shopName
        },
        theme: {
          color: '#059669', // emerald-600
        },
        modal: {
          ondismiss: function () {
            showToast('Payment cancelled.', 'info');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', async function (response: any) {
        console.error('Razorpay payment failed:', response.error);

        const errorReason = response.error.reason || '';
        const errorDesc = response.error.description || '';
        const errorCode = response.error.code || '';
        const paymentId = response.error.metadata?.payment_id || null;

        const isAmazonPayLaterIssue =
          errorReason.toLowerCase().includes('eligibility') ||
          errorReason.toLowerCase().includes('approved') ||
          errorReason.toLowerCase().includes('kyc') ||
          errorReason.toLowerCase().includes('limit') ||
          errorDesc.toLowerCase().includes('not eligible') ||
          errorDesc.toLowerCase().includes('not approved') ||
          errorDesc.toLowerCase().includes('kyc incomplete') ||
          errorDesc.toLowerCase().includes('credit limit not available') ||
          errorDesc.toLowerCase().includes('amazon pay later') ||
          errorDesc.toLowerCase().includes('not approved for pay later');

        if (isAmazonPayLaterIssue) {
          showToast('This mobile number is not eligible for Amazon Pay Later. Please choose another payment method.', 'error');
        } else {
          showToast(`Payment Failed: ${errorDesc || 'Please try another method.'}`, 'error');
        }

        // Send log to backend
        try {
          await auth.apiRequest('/payment/log', {
            method: 'POST',
            body: JSON.stringify({
              paymentId: paymentId,
              gateway: 'RAZORPAY',
              event: 'payment_failed',
              payload: {
                error: response.error,
                activeMobile
              },
              paymentMethodSelected: response.error.metadata?.payment_method || 'Razorpay-Checkout',
              errorCode: errorCode,
              errorMessage: errorDesc,
              transactionStatus: 'FAILED',
              providerResponse: response.error
            })
          });
        } catch (logErr) {
          console.error('Failed to save payment failure log:', logErr);
        }
      });

      rzp.open();

    } catch (e) {
      console.error('Payment flow error:', e);
      await createLocalOrder();
    }
  };
  const createLocalOrder = async (method: string = 'CASH') => {
    setIsProcessingPayment(true);
    setPrintCustomerDiscount(customerDiscount);
    const activeMobile = selectedCustomer?.phone || customerMobile || '0000000000';
    const billingPayload = {
      customerId: selectedCustomerId || null,
      items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, itemDiscount: i.itemDiscount || 0 })),
      discount: finalDiscount,
      tax: taxAmount,
      paymentMethod: method,
      couponCode: null,
      cashierName: selectedCashier,
      customerMobile: activeMobile,
      heldBillId: activeHeldBillId
    };

    try {
      const res = await auth.apiRequest('/billing/create', {
        method: 'POST',
        body: JSON.stringify(billingPayload)
      });

      const recentQ = JSON.parse(localStorage.getItem('recentInvoices') || '[]');
      recentQ.unshift(res);
      localStorage.setItem('recentInvoices', JSON.stringify(recentQ.slice(0, 50)));

      setGeneratedInvoice(res);
      setCart([]);
      setCustomerDiscountPercent(0);
      setCurrentStep('SUCCESS');
      setWhatsappStatus('SENT');
      setActiveHeldBillId(null);
      const dbHeld = await auth.apiRequest('/billing/resume');
      setHeldBills(dbHeld || []);
    } catch (e) {
      console.warn('Network offline or billing request failed. Saving order locally...', e);

      const mockInvoice = {
        id: 'offline-' + Date.now(),
        localId: 'offline-' + Date.now(),
        invoiceNumber: activeBillNumber || ('INV-' + Math.floor(10000 + Math.random() * 90000)),
        customerId: selectedCustomerId || null,
        customer: selectedCustomer || (activeMobile ? { name: `Customer - ${activeMobile}`, phone: activeMobile } : { name: 'Walk-in Customer', phone: '0000000000' }),
        customerMobile: activeMobile,
        items: cart.map((i, idx) => ({
          id: 'item-' + idx,
          productId: i.id,
          product: { id: i.id, name: i.name, sellingPrice: i.price, gstPercent: i.gstPercent },
          quantity: i.quantity,
          unitPrice: i.price,
          total: i.price * i.quantity,
        })),
        subtotal: subtotal,
        discount: finalDiscount,
        tax: taxAmount,
        totalPayable: grandTotal,
        paymentMethod: method,
        createdAt: new Date().toISOString(),
        status: 'PENDING_SYNC',
        offline: true
      };

      const offlineQ = JSON.parse(localStorage.getItem('offlineInvoices') || '[]');
      offlineQ.push(mockInvoice);
      localStorage.setItem('offlineInvoices', JSON.stringify(offlineQ));

      const recentQ = JSON.parse(localStorage.getItem('recentInvoices') || '[]');
      recentQ.unshift(mockInvoice);
      localStorage.setItem('recentInvoices', JSON.stringify(recentQ.slice(0, 50)));

      setGeneratedInvoice(mockInvoice);
      setCart([]);
      setCustomerDiscountPercent(0);
      setCurrentStep('SUCCESS');
      setWhatsappStatus('SENT');
      setActiveHeldBillId(null);
      showToast('Order saved offline successfully!', 'success');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const handleSendWhatsApp = async () => {
    if (!generatedInvoice) return;
    const phone = customerMobile || generatedInvoice.customer?.phone;
    if (!phone) {
      showToast('Mobile number not available', 'error');
      return;
    }

    setWhatsappStatus('SENDING');
    try {
      await auth.apiRequest('/invoice/send-whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: generatedInvoice.id,
          phone: phone
        })
      });
      setWhatsappStatus('SENT');
      showToast('Invoice Sent Successfully', 'success');
    } catch (e: any) {
      console.error('Failed to send WhatsApp invoice:', e);
      setWhatsappStatus('FAILED');
      showToast(e.message || 'Failed to send WhatsApp invoice', 'error');
    }
  };




  const handleDownloadPDFDirect = () => {
    const element = document.getElementById('thermal-print');
    if (!element) return;

    // Dynamic import of html2pdf from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${generatedInvoice.invoiceNumber || 'receipt'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
    };
    document.body.appendChild(script);
  };

  const handleHoldBill = async () => {
    if (cart.length === 0) {
      showToast('Cannot hold an empty cart.', 'error');
      return;
    }
    try {
      const heldBillData = {
        customerId: selectedCustomerId || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        items: cart,
        subtotal: subtotal,
        discount: finalDiscount,
        tax: taxAmount,
        totalPayable: grandTotal,
        notes: customerMobile
      };

      const response = await auth.apiRequest('/billing/hold', {
        method: 'POST',
        body: JSON.stringify(heldBillData)
      });

      showToast(`Bill ${response.billNumber} held successfully.`, 'success');

      // Refresh held bills
      const dbHeld = await auth.apiRequest('/billing/resume');
      setHeldBills(dbHeld || []);

      // Reset terminal for next customer
      setCart([]);
      setCustomerMobile('');
      setCustomerDiscountPercent(0);
      setActiveHeldBillId(null);
      setActiveBillNumber('INV-' + Math.floor(10000 + Math.random() * 90000));
      setTimeout(focusInput, 50);
    } catch (err) {
      console.error(err);
      showToast('Failed to hold bill in database.', 'error');
    }
  };

  const handleRetrieveBill = async (held: any) => {
    setCart(held.items || []);
    if (held.customerId) {
      setSelectedCustomerId(held.customerId);
    }
    setCustomerMobile(held.notes || '');
    const discPercent = held.subtotal > 0 ? (held.discount / held.subtotal) * 100 : 0;
    setCustomerDiscountPercent(discPercent);
    setActiveBillNumber(held.billNumber);
    setActiveHeldBillId(held.id);

    try {
      // Delete (cancel/remove) from active held queue
      await auth.apiRequest(`/billing/held/${held.id}`, { method: 'DELETE' });
      const dbHeld = await auth.apiRequest('/billing/resume');
      setHeldBills(dbHeld || []);
      showToast(`Retrieved Bill ${held.billNumber}`, 'success');
    } catch (err) {
      console.error(err);
    }
    setTimeout(focusInput, 50);
  };

  const handleClearCart = () => {
    setCart([]);
    setCustomerMobile('');
    setCustomerDiscountPercent(0);
    setActiveHeldBillId(null);
    showToast('Cart cleared.', 'info');
    setTimeout(focusInput, 50);
  };

  const handleManualAddCustomer = async () => {
    const trimmedPhone = newCustomerPhone.trim();
    if (!newCustomerName.trim() || trimmedPhone.length !== 10) {
      showToast('Enter valid name and 10-digit phone number', 'error');
      return;
    }
    try {
      const newCust = await auth.apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: newCustomerName, phone: trimmedPhone, customerType: 'Regular' })
      });
      setCustomers((prev) => [...prev, newCust]);
      setSelectedCustomerId(newCust.id);
      setCustomerMobile(trimmedPhone);
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      showToast(`Customer ${newCust.name} added successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add customer', 'error');
    }
  };

  const addMenuItemToCart = (menuItem: any) => {
    playBeep();
    const existingIndex = cart.findIndex((item) => item.id === menuItem.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          unit: menuItem.unit || 'pcs',
          quantity: 1,
          stockQty: 9999,
          gstPercent: 5,
          orderedQty: 0,
          notes: ''
        }
      ]);
    }
  };

  const handleSendToKitchen = async () => {
    const newItems = cart.filter(item => item.quantity > (item.orderedQty || 0));
    if (newItems.length === 0) {
      showToast('No new items to send to the kitchen.', 'error');
      return;
    }

    try {
      setIsProcessingPayment(true);
      const payload = {
        tableId: tableId || null,
        source: 'WALK_IN',
        items: newItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity - (item.orderedQty || 0),
          unitPrice: item.price,
          notes: item.notes || ''
        })),
        notes: specialInstructions || null,
        waiterId: table?.waiterId || null
      };

      await auth.apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Order successfully sent to kitchen!', 'success');

      // Update orderedQty in local cart state
      setCart(prev =>
        prev.map(item => ({
          ...item,
          orderedQty: item.quantity
        }))
      );

      // Refresh table status
      const tablesList = await auth.apiRequest(`/restaurant/tables`);
      setTables(tablesList || []);

      // Clear current inputs and close order screen
      setIsFullScreenOrder(false);
      setTableId(null);
      setTable(null);
      setCart([]);
      setSpecialInstructions('');
    } catch (err: any) {
      showToast(err.message || 'Failed to place kitchen order', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSettleTable = async (method: 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'NETBANKING') => {
    if (!tableId) return;
    setIsProcessingPayment(true);
    try {
      const payload = {
        tableId,
        paymentMethod: method,
        discount: finalDiscount,
        serviceCharge: serviceCharge,
        tax: taxAmount,
        customerId: selectedCustomerId || null,
        cashierName: selectedCashier,
        customerMobile: customerMobile || selectedCustomer?.phone || '0000000000'
      };

      const res = await auth.apiRequest('/restaurant/tables/settle', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setGeneratedInvoice(res.invoice);
      setCart([]);
      setCustomerDiscountPercent(0);
      setServiceCharge(0);
      setSpecialInstructions('');
      setTableId(null);
      setTable(null);
      setActiveRunningBillTable(null);
      try {
        const tablesList = await auth.apiRequest('/restaurant/tables');
        setTables(tablesList || []);
      } catch (err) {
        console.warn('Failed to refresh tables after settlement', err);
      }
      setCurrentStep('SUCCESS');
      showToast('Table bill settled successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to settle table bill', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const renderRestaurantBilling = () => {
    // filter menu items by active category and search
    const filteredMenuItems = restaurantMenuItems.filter(item => {
      const matchCat = activeCategory ? item.categoryId === activeCategory : true;
      const matchSearch = customerSearchQuery ? item.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) : true;
      return matchCat && matchSearch && item.status === 'Active';
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'AVAILABLE': return 'bg-white border-slate-300 text-slate-700';
        case 'CLEANING': return 'bg-amber-50 border-amber-300 text-amber-700';
        case 'OCCUPIED': return 'bg-emerald-50 border-emerald-300 text-emerald-700';
        case 'COOKING': return 'bg-orange-50 border-orange-300 text-orange-700';
        case 'READY': return 'bg-sky-50 border-sky-350 text-sky-750';
        case 'SERVED': return 'bg-teal-50 border-teal-300 text-teal-700';
        case 'BILLING_PENDING': return 'bg-rose-50 border-rose-300 text-rose-700';
        case 'RESERVED': return 'bg-blue-50 border-blue-300 text-blue-700';
        default: return 'bg-white border-slate-200 text-slate-700';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'AVAILABLE': return 'Available';
        case 'OCCUPIED': return 'Occupied';
        case 'COOKING': return 'Cooking';
        case 'READY': return 'Ready';
        case 'SERVED': return 'Served';
        case 'BILLING_PENDING': return 'Billing Pending';
        case 'RESERVED': return 'Reserved';
        case 'CLEANING': return 'Cleaning';
        default: return status;
      }
    };

    const loadTableActiveOrder = async (t: any) => {
      setTableId(t.id);
      setTable(t);
      setCart([]);
      setSpecialInstructions('');
      if (t.activeOrderId) {
        try {
          const activeOrder = await auth.apiRequest(`/restaurant/orders/${t.activeOrderId}`);
          if (activeOrder && activeOrder.items) {
            const loadedCart = activeOrder.items.map((it: any) => ({
              id: it.menuItem.id,
              name: it.menuItem.name,
              price: it.menuItem.price || it.unitPrice,
              unit: it.menuItem.unit || 'pcs',
              quantity: it.quantity,
              stockQty: 9999,
              gstPercent: 5,
              orderedQty: it.quantity,
              notes: it.notes || ''
            }));
            setCart(loadedCart);
            setSpecialInstructions(activeOrder.notes || '');
          }
        } catch (e) {
          console.warn('Failed to load table active order', e);
        }
      }
    };

    const selectOrderingTable = async (t: any) => {
      await loadTableActiveOrder(t);
    };

    if (isFullScreenOrder) {
      /* FULLSCREEN ORDER TAKING SCREEN */
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-black antialiased -m-8 p-8">
          {tableId === null ? (
            /* STEP 1: Select Table */
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex-grow flex flex-col max-w-4xl mx-auto w-full">
              <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-normal text-black uppercase tracking-wider">Step 1: Select Table</h2>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">Select a table to start order taking.</p>
                </div>
                <button
                  onClick={() => setIsFullScreenOrder(false)}
                  className="bg-slate-100 hover:bg-slate-250 text-black py-2 px-4 rounded-xl border border-slate-200 text-xs transition font-normal"
                >
                  Cancel & Exit
                </button>
              </div>

              {/* Grid of simple buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 overflow-y-auto pr-1 flex-grow">
                {tables.map(t => {
                  const isOccupied = t.status !== 'AVAILABLE' && t.status !== 'CLEANING';
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectOrderingTable(t)}
                      className={`py-4 px-3 rounded-xl border transition text-center text-xs font-normal cursor-pointer shadow-sm hover:shadow-md ${isOccupied
                          ? `${getStatusColor(t.status)} border-2`
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-black'
                        }`}
                    >
                      <span className="block text-sm font-semibold">{t.tableNumber.replace('Table ', 'T')}</span>
                      {isOccupied && (
                        <span className="block text-[8px] text-slate-500 uppercase tracking-widest mt-1">
                          {getStatusText(t.status)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: Add Food */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow overflow-hidden max-w-7xl mx-auto w-full h-full">
              {/* Left Pane - Category tabs & Food items list */}
              <div className="lg:col-span-8 flex flex-col space-y-4 h-full overflow-hidden">
                <div className="flex gap-3 items-center shrink-0">
                  <button
                    onClick={() => {
                      setTableId(null);
                      setTable(null);
                      setCart([]);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-black py-2 px-4 rounded-xl border border-slate-200 text-xs transition font-normal shrink-0"
                  >
                    ← Back to Tables
                  </button>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search food items..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-normal text-black focus:outline-none focus:border-slate-400 shadow-sm"
                  />
                </div>

                {/* Categories Tab List */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none text-[10px]">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-3 py-2 rounded-xl border transition whitespace-nowrap uppercase tracking-wider font-normal ${activeCategory === null
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    All Items
                  </button>
                  {restaurantCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl border transition whitespace-nowrap uppercase tracking-wider font-normal ${activeCategory === cat.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Food Items List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-grow pr-1">
                  {filteredMenuItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addMenuItemToCart(item)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-350 hover:shadow-sm cursor-pointer transition flex flex-col justify-between text-left space-y-2 group select-none"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-black leading-tight">
                            {item.name}
                          </span>
                          <span className={`text-[7px] font-bold px-1 py-0.5 rounded border ${item.isVeg ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {item.isVeg ? 'VEG' : 'MEAT'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-normal leading-normal mt-1 line-clamp-2">
                          {item.description || 'Delicious freshly prepared dish.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <span className="text-xs font-semibold text-black">₹{item.price.toFixed(2)}</span>
                        <span className="text-emerald-600 group-hover:text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">
                          + Add
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Live Order Cart */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col max-h-[80vh] h-full overflow-hidden">
                <h3 className="font-normal text-black text-sm uppercase tracking-wider pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <span>Live Order - {table?.tableNumber}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {cart.length} items
                  </span>
                </h3>

                {/* Items List */}
                <div className="flex-grow overflow-y-auto my-4 space-y-2.5 pr-1">
                  {cart.length > 0 ? (
                    cart.map(item => (
                      <div key={item.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-150 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-normal text-black">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => decrementCart(item.id)}
                              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 bg-white text-black font-semibold text-xs"
                            >
                              -
                            </button>
                            <span className="w-3 text-center text-xs font-normal">{item.quantity}</span>
                            <button
                              onClick={() => incrementCart(item.id)}
                              className="w-5 h-5 flex items-center justify-center rounded border border-slate-200 bg-white text-black font-semibold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => {
                            const updatedCart = cart.map(c => c.id === item.id ? { ...c, notes: e.target.value } : c);
                            setCart(updatedCart);
                          }}
                          placeholder="Special instructions..."
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[9px] focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center text-slate-400 font-normal uppercase tracking-wider text-xs">
                      Cart is empty
                    </div>
                  )}
                </div>

                {/* Footer calculations & submit */}
                {cart.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-3 shrink-0 text-xs text-slate-650 font-normal">
                    <div className="space-y-1 pb-2 border-b border-slate-100">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="text-black">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charge (5%):</span>
                        <span className="text-black">₹{serviceCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Tax (5%):</span>
                        <span className="text-black">₹{taxAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm py-1 font-semibold text-black">
                      <span className="uppercase tracking-wider">Total</span>
                      <span className="text-base font-bold text-emerald-600">₹{grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-normal text-xs">
                      <button
                        onClick={() => {
                          setIsFullScreenOrder(false);
                          setTableId(null);
                          setTable(null);
                          setCart([]);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-black py-2.5 rounded-xl border border-slate-200 transition uppercase tracking-wider cursor-pointer text-center"
                      >
                        Save Order
                      </button>
                      <button
                        onClick={handleSendToKitchen}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition uppercase tracking-wider shadow-sm cursor-pointer text-center"
                      >
                        Send To Kitchen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* MAIN SCREEN */
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-black antialiased -m-8 p-8 max-w-4xl mx-auto w-full">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 shrink-0 text-left">
          <div className="space-y-1">
            <h1 className="text-lg font-normal text-black uppercase tracking-wider">Bistro POS Console</h1>
            <p className="text-xs text-slate-400 font-normal">Restaurant Manager Order Taking System</p>
          </div>
          <button
            onClick={() => {
              setIsRestaurantMode(false);
              window.history.pushState({}, '', '/billing');
            }}
            className="mt-3 sm:mt-0 bg-slate-100 hover:bg-slate-200 text-black text-xs px-4 py-2 rounded-xl border border-slate-200 font-normal transition uppercase tracking-wider shrink-0"
          >
            Switch to Retail
          </button>
        </div>

        {/* Large, Very Visible Take New Order Action Button */}
        <div className="mb-8 shrink-0">
          <button
            onClick={() => {
              setIsFullScreenOrder(true);
              setTableId(null);
              setTable(null);
              setCart([]);
              setSpecialInstructions('');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-3xl border border-emerald-500 shadow-md transition uppercase tracking-widest text-sm font-semibold cursor-pointer text-center flex items-center justify-center space-x-2.5"
          >
            <span className="text-xl">➕</span>
            <span>Take New Order</span>
          </button>
        </div>

        {/* ACTIVE TABLES SECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-grow text-left flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wider">Active Tables</h2>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">Tables currently dining with running bills.</p>
          </div>

          <div className="overflow-y-auto flex-grow pr-1">
            {tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'CLEANING').length === 0 ? (
              <div className="py-24 text-center text-slate-400 font-normal uppercase tracking-wider text-xs">
                No active tables currently. Click "Take New Order" above to seat customers.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'CLEANING').map(t => {
                  const totalAmount = t.kitchenOrders?.[0]?.totalAmount || 0;
                  const itemsCount = t.kitchenOrders?.[0]?.items?.reduce((acc: number, it: any) => acc + it.quantity, 0) || 0;
                  return (
                    <div
                      key={t.id}
                      onClick={async () => {
                        await loadTableActiveOrder(t);
                        setActiveRunningBillTable(t);
                      }}
                      className="p-4 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer hover:shadow-sm transition flex flex-col justify-between min-h-[100px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-black">{t.tableNumber}</span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase border font-semibold ${getStatusColor(t.status)}`}>
                          {getStatusText(t.status)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500 font-normal mt-2">
                        <span>{itemsCount} Items</span>
                        <span className="font-bold text-emerald-600">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RUNNING BILL SCREEN OVERLAY MODAL */}
        {activeRunningBillTable && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh] text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-black uppercase tracking-wider">Running Bill - {activeRunningBillTable.tableNumber}</h3>
                  <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase border mt-1 inline-block ${getStatusColor(activeRunningBillTable.status)}`}>
                    {getStatusText(activeRunningBillTable.status)}
                  </span>
                </div>
                <button
                  onClick={() => setActiveRunningBillTable(null)}
                  className="text-slate-400 hover:text-black font-semibold p-1 text-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* Items List */}
              <div className="flex-grow overflow-y-auto my-4 space-y-2 pr-1 font-normal text-xs text-black">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 flex justify-between items-center">
                    <div>
                      <span className="font-normal block text-black">{item.name}</span>
                      {item.notes && <span className="text-[8px] text-slate-450 italic">({item.notes})</span>}
                    </div>
                    <div className="text-right font-semibold">
                      <span className="text-slate-500 mr-2">Qty {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary and Buttons */}
              <div className="border-t border-slate-100 pt-3 space-y-4 shrink-0 text-xs">
                <div className="flex justify-between items-center font-normal">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px]">Grand Total</span>
                  <span className="text-sm font-bold text-black">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-normal text-xs">
                  <button
                    onClick={() => {
                      setTableId(activeRunningBillTable.id);
                      setTable(activeRunningBillTable);
                      setIsFullScreenOrder(true);
                      setActiveRunningBillTable(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-black py-2.5 rounded-xl border border-slate-200 transition text-center uppercase tracking-wider cursor-pointer"
                  >
                    Add More Items
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await auth.apiRequest(`/restaurant/tables/${activeRunningBillTable.id}/status`, {
                          method: 'PUT',
                          body: JSON.stringify({ status: 'BILLING_PENDING' })
                        });
                        // Clear activebilltable overlay and trigger payment modal directly
                        setTableId(activeRunningBillTable.id);
                        setTable(activeRunningBillTable);
                        setActiveRunningBillTable(null);
                        setShowPaymentModal(true);
                      } catch (e) {
                        showToast('Failed to generate bill', 'error');
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl transition text-center uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    Generate Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isRestaurantMode && currentStep === 'BILLING' && !isProcessingPayment) {
    return renderRestaurantBilling();
  }

  return (
    <div className="min-h-screen bg-white text-[#000000] text-left font-['Trebuchet_MS'] text-[15px] select-none antialiased py-6 px-8 space-y-6">

      {isProcessingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-2xl max-w-sm w-full">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-black">Verifying Transaction</h3>
              <p className="text-sm text-slate-550">Processing order details and generating your invoice. Please wait...</p>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'BILLING' && !isProcessingPayment && (
        <>
          {/* Page Title & Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tight leading-none">POS Billing</h1>
              <p className="text-sm text-[#374151] mt-2">Manage customer carts, scan products, and verify payment transactions in real-time.</p>
            </div>
          </div>

          {/* 1. TOP SINGLE ROW METADATA */}
          <div className="flex justify-between items-center bg-white px-5 py-4 rounded-2xl border border-[#E5E7EB] text-sm font-semibold tracking-wide text-black shadow-sm">
            <div className="font-bold">{settings.shopName}</div>
            <div className="flex gap-4 text-[#374151] text-xs">
              <span>Date: <strong className="text-black">{currentDate}</strong></span>
              <span>|</span>
              <span>GST No: <strong className="text-black">{settings.gstNumber}</strong></span>
              <span>|</span>
              <span>Bill ID: <strong className="text-black">{activeBillNumber}</strong></span>
              <span>|</span>
              <span>Cashier: <strong className="text-black">{selectedCashier}</strong></span>
            </div>
          </div>
        </>
      )}

      {currentStep === 'BILLING' && !isProcessingPayment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT SIDE AREA: 33% Width - Controls, Customer, Actions & Held Queue */}
          <div className="lg:col-span-4 space-y-4">

            {/* Scanner Console */}
            <div className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm space-y-3.5">
              <h3 className="text-lg font-semibold text-black">Scanner Console</h3>

              <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <Barcode className="w-5.5 h-5.5" />
                  </span>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    placeholder="Scan Barcode / Type SKU..."
                    className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                </div>
              </form>

              <button
                onClick={() => setShowCameraScanner(true)}
                className="w-full bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Camera className="w-4.5 h-4.5" />
                Scan Camera
              </button>
            </div>

            {/* Customer Details Console */}
            <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">Customer Console</h3>
                {selectedCustomer && !selectedCustomer.name.toLowerCase().includes('walk-in') && selectedCustomer.phone !== '0000000000' && (
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer border border-emerald-250 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 whitespace-nowrap inline-block shrink-0"
                  >
                    Change Customer
                  </button>
                )}
              </div>

              {selectedCustomer && !selectedCustomer.name.toLowerCase().includes('walk-in') && selectedCustomer.phone !== '0000000000' ? (
                <div className="bg-slate-50 border border-[#E5E7EB] p-3 rounded-xl text-xs font-semibold space-y-2 text-black">
                  <div className="text-sm font-bold text-black">{selectedCustomer.name}</div>
                  <div className="text-xs font-semibold text-slate-550">{selectedCustomer.phone}</div>
                  {selectedCustomer.gstNumber && (
                    <div className="flex justify-between pt-1 border-t border-slate-100 mt-1">
                      <span className="text-slate-400">GST:</span>
                      <span className="font-bold text-emerald-700">{selectedCustomer.gstNumber}</span>
                    </div>
                  )}
                  <div className="pt-1.5 text-right border-t border-slate-200 mt-1.5">
                    <button
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerMobile('');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-[#E5E7EB] p-4 rounded-xl text-center space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-black">Customer Not Selected</p>
                    <p className="text-[11px] text-[#374151] font-medium">Please link a customer to this transaction</p>
                  </div>
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-xl transition cursor-pointer"
                  >
                    Add Customer
                  </button>
                </div>
              )}
            </div>

            {/* Quick Cart Actions */}
            <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm space-y-2.5">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Register Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleHoldBill}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 rounded-lg transition cursor-pointer text-center"
                >
                  Hold Bill
                </button>
                <button
                  onClick={handleClearCart}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 rounded-lg transition cursor-pointer text-center"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Dedicated Held Bills Section */}
            <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm space-y-2.5">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider flex justify-between">
                <span>Held Bills</span>
                <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-full">{heldBills.length}</span>
              </h3>
              {heldBills.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 space-y-2">
                  {heldBills.map((held) => (
                    <div key={held.id} className="py-2.5 flex items-center justify-between text-xs border-b border-slate-100 last:border-b-0">
                      <div className="text-left space-y-0.5">
                        <p className="font-extrabold text-black text-sm">{held.billNumber}</p>
                        <p className="text-slate-900 font-bold text-xs">{held.customerName || 'Walk-in Customer'}</p>
                        <div className="flex gap-2 text-slate-550 font-semibold text-[10px]">
                          <span>{Array.isArray(held.items) ? held.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0} Items</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">₹{held.totalPayable.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRetrieveBill(held)}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer text-xs shrink-0"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-1 text-center">No bills currently on hold.</p>
              )}
            </div>


          </div>

          {/* RIGHT SIDE AREA: 67% Width - Billing Cart Table & sticky summary */}
          <div className="lg:col-span-8 space-y-4">

            {/* Bill Table */}
            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-xs font-normal text-left text-black table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB] text-[12px] font-semibold text-black">
                    <th className="px-1.5 py-2 text-center w-[8%] whitespace-nowrap">SR No</th>
                    <th className="px-1.5 py-2 w-[20%] whitespace-nowrap">SKU/Barcode</th>
                    <th className="px-1.5 py-2 w-[15%] whitespace-nowrap">Product</th>
                    <th className="px-1.5 py-2 text-center w-[12%] whitespace-nowrap">Qty</th>
                    <th className="px-1.5 py-2 text-right w-[12%] whitespace-nowrap">MRP</th>
                    <th className="px-1.5 py-2 text-right w-[14%] whitespace-nowrap pr-8">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {cart.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-1.5 py-2 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-1.5 py-2 text-black font-bold truncate">{item.barcode || item.sku || '-'}</td>
                      <td className="px-1.5 py-2 font-bold text-black truncate">
                        <div>{item.name}</div>
                        {item.isOfferActive && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5 whitespace-nowrap">
                            MRP: ₹{Number(item.originalPrice).toFixed(2)} | Offer: ₹{Number(item.offerPrice).toFixed(2)} | You Save: ₹{Number(item.savings).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-1.5 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => decrementCart(item.id)}
                            className="w-5 h-5 flex items-center justify-center rounded border border-[#E5E7EB] bg-white hover:bg-slate-50 transition text-black font-semibold cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-4 text-center text-xs font-bold text-black">{item.quantity}</span>
                          <button
                            onClick={() => incrementCart(item.id)}
                            className="w-5 h-5 flex items-center justify-center rounded border border-[#E5E7EB] bg-white hover:bg-slate-50 transition text-black font-semibold cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-1.5 py-2 text-right text-black font-bold">₹{item.price.toFixed(2)}</td>
                      <td className="px-1.5 py-2 text-right font-bold text-black whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2.5">
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            onClick={() => deleteCartItem(item.id)}
                            className="text-[#374151] hover:text-red-655 p-0.5 rounded transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-24 bg-slate-50/10">
                        <div className="flex flex-col items-center justify-center space-y-2 text-black">
                          <p className="text-sm font-bold text-black uppercase tracking-wider">No products added to the bill yet.</p>
                          <p className="text-xs text-slate-500 font-medium">Scan a barcode to start billing or search and add a product</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Billing Summary calculator panel */}
            {cart.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3.5 text-sm text-[#000000] shadow-md sticky bottom-4 z-10">
                <span className="text-sm font-bold text-black uppercase tracking-wider block border-b pb-2 border-[#E5E7EB]">Checkout Bill Summary</span>

                <div className="space-y-2 pb-2.5 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-[#374151] font-bold text-xs">Total Items:</span>
                    <span className="text-black font-bold">{itemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#374151] font-bold text-xs">Total Quantity:</span>
                    <span className="text-black font-bold">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#374151] font-bold text-xs">Customer Discount:</span>
                    <div className="flex items-center gap-2">
                      {selectedCustomer && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-bold">Disc %:</span>
                          <input
                            type="text"
                            value={customerDiscountPercent === 0 ? '' : customerDiscountPercent.toString()}
                            placeholder="0"
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                              const num = Math.max(0, Math.min(100, parseFloat(cleaned) || 0));
                              setCustomerDiscountPercent(num);
                            }}
                            className="w-10 text-right bg-white border border-slate-350 rounded-lg text-xs font-bold p-0.5 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                      )}
                      <span className="text-black font-bold">₹{customerDiscount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#374151] font-bold text-xs">GST:</span>
                    <span className="text-black font-bold">₹{taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-black uppercase">Grand Total</span>
                  <span className="text-xl font-black text-black">₹{grandTotal.toFixed(2)}</span>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setCashReceived('');
                      setShowPaymentModal(true);
                    }}
                    disabled={cart.length === 0}
                    className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-xl disabled:opacity-50 transition duration-150 cursor-pointer text-xs font-semibold shadow-sm uppercase whitespace-nowrap"
                  >
                    Proceed To Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 'SUCCESS' && generatedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-2xl max-w-md w-full animate-[fadeIn_0.3s_ease-out]">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-pulse">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-emerald-600 tracking-tight">✓ Payment Successful</h2>
              <p className="text-sm font-bold text-slate-500">Payment received successfully.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs font-bold text-slate-700 space-y-2.5">
              <div className="flex justify-between">
                <span>Bill Number:</span>
                <span className="text-black font-extrabold">{generatedInvoice.id || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Number:</span>
                <span className="text-black font-extrabold">{generatedInvoice.invoiceNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 font-extrabold">₹{parseFloat(String(generatedInvoice.totalPayable)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="text-slate-800 font-extrabold uppercase">{generatedInvoice.paymentMethod || 'CASH'}</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep('INVOICE')}
              className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              ← View Invoice
            </button>

            <p className="text-[10px] text-slate-400 font-medium">Redirecting to invoice page in 3 seconds...</p>
          </div>
        </div>
      )}

      {/* 3. STEP 2: PRINTABLE THERMAL RECEIPT PAGE */}
      {currentStep === 'INVOICE' && generatedInvoice && (
        <div className="min-h-screen bg-[#f8fafc] text-black font-sans py-8 px-4 sm:px-6 lg:px-8 relative animate-[fadeIn_0.3s_ease-out]">


          {/* Sticky Top Right Action Bar */}
          <div className="no-print absolute top-6 right-6 z-10 flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-black py-2 px-4 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm hover:shadow-md"
            >
              <Printer className="w-4 h-4" /> Print
            </button>

            <button
              onClick={handleDownloadPDFDirect}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg> Download PDF
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={whatsappStatus === 'SENDING'}
              className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>

          {/* Main Clean Invoice Sheet */}
          <div
            className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl print:border-0 print:shadow-none print:p-0 mt-12 space-y-6"
            id="thermal-print"
          >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-4 pb-6 border-b border-slate-100">
              <div className="text-center md:text-left space-y-2">
                {settings.logo ? (
                  <img src={settings.logo} alt="Shop Logo" className="max-h-16 object-contain mb-2 mx-auto md:mx-0" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md mx-auto md:mx-0">
                    <Store className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-2xl font-extrabold text-black leading-tight">{settings.shopName}</h2>
                <p className="text-xs text-slate-500 max-w-xs">{settings.shopAddress}</p>
                <p className="text-xs text-slate-500 font-bold">GSTIN: {settings.gstNumber}</p>
                <p className="text-xs text-slate-500">Mobile: {settings.mobileNumber}</p>
              </div>

              <div className="text-center md:text-right space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block">Retail Invoice</span>
                <h3 className="text-lg font-bold text-black">{generatedInvoice.invoiceNumber}</h3>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold">Bill ID:</span>
                    <span>{generatedInvoice.id}</span>
                  </div>
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold">Date:</span>
                    <span>{new Date(generatedInvoice.createdAt).toLocaleString('en-GB')}</span>
                  </div>
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold">Cashier:</span>
                    <span>{generatedInvoice.cashierName || 'Admin'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Payment Status Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Details Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-extrabold mb-1">Customer Details</span>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-black text-sm">{generatedInvoice.customer?.name || 'Walk-in Customer'}</p>
                  <p className="font-bold text-slate-600 text-xs">Mobile: {generatedInvoice.customer?.phone || generatedInvoice.customerMobile || 'N/A'}</p>
                </div>
              </div>

              {/* Status & QR Code Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-extrabold">Payment Status</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200`}>
                    ✓ {generatedInvoice.paymentMethod || 'CASH'} PAID
                  </span>
                </div>
                <div className="shrink-0 bg-white p-1 rounded-xl border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(
                      `Invoice No: ${generatedInvoice.invoiceNumber}\nBill No: ${generatedInvoice.id}\nInvoice URL: ${window.location.origin}/invoice/${generatedInvoice.invoiceNumber}?token=${generatedInvoice.qrToken || ''}`
                    )}`}
                    alt="QR"
                    className="w-14 h-14"
                  />
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs font-normal text-left text-black table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-extrabold text-black uppercase tracking-wider">
                    <th className="px-3 py-3 w-[45%]">Product</th>
                    <th className="px-3 py-3 text-center w-[12%]">Qty</th>
                    <th className="px-3 py-3 text-right w-[15%]">MRP</th>
                    <th className="px-3 py-3 text-right w-[13%]">GST</th>
                    <th className="px-3 py-3 text-right w-[15%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(generatedInvoice.items || []).map((item: any) => {
                    const price = item.unitPrice || 0;
                    const qty = item.quantity || 0;
                    const taxRate = item.product?.gstPercent || 18;
                    return (
                      <tr key={item.id} className="text-black hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-3 font-bold truncate">{item.product?.name || 'Item'}</td>
                        <td className="px-3 py-3 text-center font-extrabold">{qty}</td>
                        <td className="px-3 py-3 text-right">₹{price.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-slate-500 font-bold">{taxRate}%</td>
                        <td className="px-3 py-3 text-right font-extrabold">₹{item.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Highlighted Total Section */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-extrabold border-b pb-1.5 border-slate-200">Receipt Summary</span>
              <div className="space-y-1.5 text-xs text-slate-700 font-bold">
                {printCustomerDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Customer Discount:</span>
                    <span className="text-rose-600">-₹{printCustomerDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">GST Tax:</span>
                  <span>₹{(generatedInvoice.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-250 pt-3 text-base font-black text-black">
                  <span>Grand Total:</span>
                  <span className="text-xl font-extrabold text-black">₹{parseFloat(String(generatedInvoice.totalPayable)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-dashed border-slate-200 text-xs text-slate-400 font-bold space-y-1">
              <p>{settings.invoiceFooter}</p>
              <p className="text-black font-extrabold uppercase tracking-wide">Thank You For Your Business!</p>
            </div>
          </div>
        </div>
      )}



      {/* CAMERA SCANNER POPUP MODAL */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 space-y-4 relative text-center text-xs text-black">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-black text-sm text-black uppercase tracking-wider">Camera Barcode Scanner</span>
              <button
                onClick={() => setShowCameraScanner(false)}
                className="text-slate-450 hover:text-slate-800 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative border-2 border-emerald-500 rounded-2xl bg-black aspect-video overflow-hidden shadow-inner flex items-center justify-center">
              <video
                id="pos-camera-popup"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraLoading || cameraError ? 'hidden' : 'block'}`}
              ></video>

              {/* Loader State */}
              {cameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-4">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-black tracking-widest uppercase text-slate-300">Loading Camera...</span>
                </div>
              )}

              {/* Error State */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-rose-500 gap-2 p-6 text-center">
                  <span className="text-xs font-black uppercase tracking-wider">Access Error</span>
                  <p className="text-[10px] font-bold text-slate-300 leading-normal">{cameraError}</p>
                </div>
              )}

              {/* Barcode Reticle Guide Frame */}
              {!cameraLoading && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <style>{`
                    @keyframes scanMotion {
                      0% { top: 4px; }
                      50% { top: calc(100% - 6px); }
                      100% { top: 4px; }
                    }
                    .custom-scan-line {
                      position: absolute;
                      left: 4px;
                      right: 4px;
                      height: 2px;
                      background-color: #ef4444;
                      box-shadow: 0 0 8px #ef4444, 0 0 15px #ef4444;
                      animation: scanMotion 2.2s linear infinite;
                    }
                  `}</style>

                  {/* Rounded Focus Scanner Box */}
                  <div className="relative w-64 h-36 border-2 border-emerald-500/60 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                    {/* Animated moving scanline inside frame */}
                    <div className="custom-scan-line"></div>

                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-md"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-md"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-md"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-md"></div>
                  </div>

                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mt-4 px-3 py-1 bg-slate-950/80 rounded-full shadow border border-emerald-500/30 animate-pulse">
                    Scanning Barcode...
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 font-bold leading-normal">
              Align barcode inside the green window frame. The popup closes automatically on successful scan.
            </p>
            <button
              onClick={() => setShowCameraScanner(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 py-3 rounded-xl transition font-bold cursor-pointer"
            >
              Close Camera
            </button>
          </div>
        </div>
      )}



      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setCustomerModalTab('SELECT')}
                className={`flex-1 pb-2 text-center transition border-b-2 cursor-pointer ${customerModalTab === 'SELECT'
                  ? 'border-emerald-600 text-emerald-650 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                  }`}
              >
                Select Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerModalTab('REGISTER')}
                className={`flex-1 pb-2 text-center transition border-b-2 cursor-pointer ${customerModalTab === 'REGISTER'
                  ? 'border-emerald-600 text-emerald-650 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
                  }`}
              >
                New Registration
              </button>
            </div>

            {/* Tab 1: SELECT EXISTING CUSTOMER */}
            {customerModalTab === 'SELECT' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Search Customer (Name / Phone)</label>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50 font-semibold text-black placeholder-slate-400"
                  />
                </div>

                {/* Filtered customers list */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-150 border rounded-xl bg-slate-50/50 p-1.5 space-y-1">
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                      (c.phone || '').includes(customerSearchQuery)
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerMobile(c.phone || '');
                          setShowAddCustomerModal(false);
                          setCustomerSearchQuery('');
                          focusInput();
                          showToast(`Selected Customer: ${c.name}`, 'success');
                        }}
                        className="p-2 hover:bg-emerald-50 rounded-lg cursor-pointer transition text-xs font-semibold text-slate-805 flex justify-between items-center"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="text-slate-500 text-[10px]">{c.phone || 'No Phone'}</span>
                      </div>
                    ))}
                  {customers.filter((c) =>
                    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    (c.phone || '').includes(customerSearchQuery)
                  ).length === 0 && (
                      <p className="text-xs text-slate-450 italic text-center py-4">No matching customers found.</p>
                    )}
                </div>
              </div>
            )}

            {/* Tab 2: REGISTER NEW CUSTOMER */}
            {customerModalTab === 'REGISTER' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50 font-semibold text-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50 font-semibold text-black"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                  setCustomerSearchQuery('');
                  focusInput();
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 py-2 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              {customerModalTab === 'REGISTER' && (
                <button
                  type="button"
                  onClick={handleManualAddCustomer}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl transition cursor-pointer"
                >
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODERN PAYMENT SELECTION POPUP */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 text-left flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3.5 shrink-0">
              <h3 className="text-lg font-bold text-black uppercase tracking-wider">Select Payment Method</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentNotes('');
                }}
                className="text-slate-400 hover:text-black transition p-1 rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div
              className="flex-grow overflow-y-auto space-y-6 pr-1 no-scrollbar"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* CSS style definition to hide Webkit scrollbars */}
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* Bill Summary info inside popup */}
              <div className="bg-slate-50 border border-[#E5E7EB] rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Grand Total</span>
                  <span className="text-2xl font-black text-black">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-right text-xs font-semibold text-[#374151]">
                  <p>Items: <strong className="text-black">{itemsCount}</strong></p>
                  <p>Customer: <strong className="text-black">{selectedCustomer && !selectedCustomer.name.toLowerCase().includes('walk-in') && selectedCustomer.phone !== '0000000000' ? selectedCustomer.name : 'Customer Not Selected'}</strong></p>
                </div>
              </div>

              {/* Payment Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'CASH', label: 'Cash', icon: '💵', color: 'bg-emerald-50 text-emerald-600 border-emerald-250' },
                  { id: 'UPI', label: 'UPI', icon: '📱', color: 'bg-blue-50 text-blue-600 border-blue-250' },
                  { id: 'CARD', label: 'Card', icon: '💳', color: 'bg-indigo-50 text-indigo-600 border-indigo-250' },
                  { id: 'WALLET', label: 'Wallet', icon: '👛', color: 'bg-purple-50 text-purple-600 border-purple-250' },
                  { id: 'NETBANKING', label: 'Net Banking', icon: '🏛️', color: 'bg-amber-50 text-amber-600 border-amber-250' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedPaymentMethod(method.id as any);
                      if (method.id !== 'CASH') setCashReceived('');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-center ${selectedPaymentMethod === method.id
                        ? `${method.color} shadow-sm font-bold scale-[1.02] border-2`
                        : 'border-[#E5E7EB] hover:border-slate-350 bg-white text-black hover:text-black font-semibold border'
                      }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <span className="text-xs font-bold">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Sub-UI based on Payment Method */}
              {selectedPaymentMethod === 'CASH' ? (
                <div className="bg-slate-50 border border-[#E5E7EB] p-4 rounded-2xl space-y-3.5 animate-[fadeIn_0.15s_ease-out]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#374151] uppercase tracking-wider block">Amount Received (₹)</label>
                      <input
                        type="text"
                        value={cashReceived}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setCashReceived(val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-600 text-black shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#374151] uppercase tracking-wider block">Change Return</span>
                      <div className="text-lg font-black text-emerald-700 pt-1">
                        ₹{changeReturned.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#374151] uppercase tracking-wider block">Payment Notes (optional)</label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Enter cash payment notes..."
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 text-black shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-[#E5E7EB] p-4 rounded-2xl space-y-2 animate-[fadeIn_0.15s_ease-out]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-black">Razorpay Gateway Integration</h4>
                      <p className="text-[10px] text-[#374151] font-semibold leading-normal mt-0.5">
                        The transaction will be processed via Razorpay secure checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 font-bold text-xs shrink-0">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentNotes('');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 py-3 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowPaymentModal(false);
                  setPaymentNotes('');
                  if (isRestaurantMode) {
                    await handleSettleTable(selectedPaymentMethod);
                  } else {
                    if (selectedPaymentMethod === 'CASH') {
                      await createLocalOrder('CASH');
                    } else {
                      await handleProceedToPayment(selectedPaymentMethod);
                    }
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition cursor-pointer text-center uppercase tracking-wider"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 pointer-events-auto transition-all ${t.type === 'error' ? 'bg-rose-900 border-rose-850' : 'bg-slate-900 border-slate-850'
              }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default POSBilling;
