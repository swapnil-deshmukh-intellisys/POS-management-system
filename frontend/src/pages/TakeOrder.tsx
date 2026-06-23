import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';

export const TakeOrder: React.FC = () => {
  const auth = useAuth();

  // Seating & Menu states
  const [tables, setTables] = useState<any[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);
  const [table, setTable] = useState<any>(null);
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successItemsCount, setSuccessItemsCount] = useState(0);
  const [successTableName, setSuccessTableName] = useState('');

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
      const tablesList = await auth.apiRequest(`/restaurant/tables`);
      // Sort tables by table number (T1, T2...)
      const sortedTables = (tablesList || []).sort((a: any, b: any) => {
        const numA = parseInt(a.tableNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.tableNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setTables(sortedTables);

      const cats = await auth.apiRequest('/restaurant/menu/categories');
      setRestaurantCategories(cats || []);
      if (cats && cats.length > 0) {
        setActiveCategory(cats[0].id);
      }

      const items = await auth.apiRequest('/restaurant/menu/items');
      setRestaurantMenuItems(items || []);
    } catch (err) {
      console.warn('Failed to load restaurant data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectOrderingTable = async (t: any) => {
    setTableId(t.id);
    setTable(t);
    setCart([]);
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
            orderedQty: it.quantity,
            notes: it.notes || ''
          }));
          setCart(loadedCart);
        }
      } catch (e) {
        console.warn('Failed to load active orders', e);
      }
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
          orderedQty: 0,
          notes: ''
        }
      ]);
    }
  };

  const incrementCart = (id: string) => {
    setCart(cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)));
  };

  const decrementCart = (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (item && item.quantity > 1) {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)));
    } else {
      setCart(cart.filter((i) => i.id !== id));
    }
  };

  const handleSendToKitchen = async () => {
    const newItems = cart.filter(item => item.quantity > (item.orderedQty || 0));
    if (newItems.length === 0) {
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        tableId: tableId || null,
        source: 'WALK_IN',
        items: newItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity - (item.orderedQty || 0),
          unitPrice: item.price,
          notes: item.notes || ''
        })),
        notes: null,
        waiterId: table?.waiterId || null
      };

      await auth.apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Show Popup
      setSuccessTableName(table?.tableNumber?.replace('Table ', 'T') || '');
      setSuccessItemsCount(newItems.reduce((acc, i) => acc + (i.quantity - i.orderedQty), 0));
      setShowSuccessPopup(true);

      // Clear states & reset back to table selection screen
      setTableId(null);
      setTable(null);
      setCart([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to place kitchen order');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMenuItems = restaurantMenuItems.filter(item => {
    const matchCat = activeCategory ? item.categoryId === activeCategory : true;
    return matchCat && item.status === 'Active';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
      case 'CLEANING': return 'bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200';
      default: return 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'; // OCCUPIED, COOKING, READY, SERVED
    }
  };

  const runningTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white font-sans text-black select-none p-4 pb-24 text-left max-w-lg mx-auto border-x border-slate-100 shadow-sm relative">
      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-4 shadow-xl max-w-xs w-full">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-black">Sending order to kitchen...</p>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black uppercase tracking-wider">ORDER SENT</h3>
              <p className="text-sm text-slate-600 mt-1 font-semibold">TABLE {successTableName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{successItemsCount} Items Added</p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-black transition uppercase tracking-wider"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* TOP SECTION */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <h1 className="text-xl font-bold tracking-tight">TAKE ORDER</h1>
        {tableId && (
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
            Selected Table: T{table?.tableNumber?.replace('Table ', '')}
          </div>
        )}
      </div>

      {tableId === null ? (
        /* STEP 1: SELECT TABLE */
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">STEP 1: SELECT TABLE</h2>
          <div className="flex flex-wrap gap-2">
            {tables.map(t => {
              const tableNum = t.tableNumber.replace('Table ', 'T');
              return (
                <button
                  key={t.id}
                  onClick={() => selectOrderingTable(t)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border cursor-pointer transition ${getStatusColor(t.status)}`}
                >
                  {tableNum}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ORDER DETAILS (STEP 2, 3, 4) */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
            <span className="text-sm font-bold text-black">
              TABLE T{table?.tableNumber?.replace('Table ', '')} ACTIVE
            </span>
            <button
              onClick={() => {
                setTableId(null);
                setTable(null);
                setCart([]);
              }}
              className="text-xs font-bold text-slate-500 hover:text-black uppercase tracking-wider"
            >
              Change Table
            </button>
          </div>

          {/* STEP 2: MENU CATEGORIES (Swiggy-style horizontal tabs) */}
          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">STEP 2: MENU CATEGORIES</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {restaurantCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-full border transition whitespace-nowrap uppercase tracking-wider cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: MENU ITEMS (Simple vertical list with large Add button) */}
          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">STEP 3: MENU ITEMS</h2>
            <div className="divide-y divide-slate-100">
              {filteredMenuItems.map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm font-medium">
                  <div>
                    <div className="font-bold text-black">{item.name}</div>
                    <div className="text-slate-500 font-semibold text-xs mt-0.5">₹{item.price}</div>
                  </div>
                  <button
                    onClick={() => addMenuItemToCart(item)}
                    className="bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-sm px-4 py-2 rounded-xl border border-slate-250 transition cursor-pointer select-none"
                  >
                    [ + ]
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: CURRENT ORDER */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">STEP 4: CURRENT ORDER - TABLE T{table?.tableNumber?.replace('Table ', '')}</h2>
            {cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-semibold">
                    <div>
                      <span className="font-bold text-black">{item.name}</span>
                      <span className="text-slate-450 block text-[10px]">Qty {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => decrementCart(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-black font-bold text-xs"
                      >
                        -
                      </button>
                      <button
                        onClick={() => incrementCart(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-black font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold text-black mt-2">
                  <span>Running Total</span>
                  <span>₹{runningTotal.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No items added to current order yet.</p>
            )}
          </div>

          {/* Bottom Fixed Button */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 max-w-lg mx-auto shadow-md">
              <button
                onClick={handleSendToKitchen}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl transition uppercase tracking-widest shadow-sm cursor-pointer text-center"
              >
                SEND TO KITCHEN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakeOrder;
