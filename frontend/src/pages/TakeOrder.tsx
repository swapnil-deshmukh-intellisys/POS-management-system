import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Clock,
  Users,
  Utensils,
  User,
  FileText,
  CheckCircle,
  CornerDownLeft
} from 'lucide-react';

// Interfaces
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  specialInstructions: string;
  isSentToKitchen: boolean;
  price: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  loyaltyMember: boolean;
}

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'WAITING_FOR_ORDER' | 'ORDER_SENT' | 'PREPARING' | 'READY' | 'SERVED' | 'RESERVED' | 'OUT_OF_SERVICE';
  assignedWaiter: string;
  customer: CustomerInfo | null;
  guestsCount: number;
  occupiedSince: string | null;
  activeOrderItems: CartItem[];
  kotNumber: string | null;
  orderTime: string | null;
  occasion?: 'Birthday' | 'Anniversary' | 'VIP' | 'None';
  activeOrderId?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  veg: boolean;
  sku: string;
  barcode: string;
  favorite: boolean;
  isAvailable: boolean;
  price: number;
}

export const TakeOrder: React.FC = () => {
  const auth = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Core States
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generalKitchenNote, setGeneralKitchenNote] = useState<string>('');

  // Table Filters
  const [tableFilter, setTableFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'PREPARING' | 'READY'>('ALL');

  // Modal State for New Session
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [sessionModalTable, setSessionModalTable] = useState<Table | null>(null);

  // Dialog form fields
  const [formGuestsCount, setFormGuestsCount] = useState<number>(4);
  const [formWaiter, setFormWaiter] = useState<string>('Rahul');
  const [formCustomerType, setFormCustomerType] = useState<'Walk-in' | 'Registered'>('Walk-in');
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formCustomerPhone, setFormCustomerPhone] = useState<string>('');
  const [formOccasion, setFormOccasion] = useState<'Birthday' | 'Anniversary' | 'VIP' | 'None'>('None');

  // Search & Menu States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState<number>(-1);

  // Quick quantity state for search results
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Add Item to KOT Cart Instantly (no popup)
  const handleAddItemToCart = (item: MenuItem, customQty?: number) => {
    if (!selectedTable) return;
    playSound(950, 'sine', 0.05);

    const qtyToAdd = customQty || itemQuantities[item.id] || 1;
    
    // We search for a cart item that matches the item id, is not sent, and has NO customizations yet
    const existingIndex = cart.findIndex(c => c.id === item.id && !c.isSentToKitchen && c.specialInstructions === '');

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += qtyToAdd;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        quantity: qtyToAdd,
        category: item.category,
        specialInstructions: '',
        isSentToKitchen: false,
        price: item.price
      };
      setCart([...cart, newItem]);
    }

    setItemQuantities(prev => ({ ...prev, [item.id]: 1 }));
    notify(`${qtyToAdd}x ${item.name} added to order.`, 'info');
  };





  // Sound effects helper for tactile feedback
  const playSound = (frequency = 800, type: OscillatorType = 'sine', duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play blocked');
    }
  };

  const notify = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    console.log(`[POS KOT Terminal]: ${text}`);
    if (type === 'success') {
      playSound(1150, 'sine', 0.12);
    } else if (type === 'warning') {
      playSound(450, 'triangle', 0.18);
    } else {
      playSound(820, 'sine', 0.08);
    }
  };

  // Dynamic Digital Menu Items & Categories
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  // Fetch Menu Items & Categories from DB
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        const items = await auth.apiRequest('/restaurant/menu/items');
        const mappedItems: MenuItem[] = (items || [])
          .filter((item: any) => item.status === 'Active' || item.status === 'ACTIVE')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category?.name || 'Uncategorized',
            veg: item.isVeg ?? true,
            sku: item.sku || `ITM-${item.id.slice(-4).toUpperCase()}`,
            barcode: item.barcode || '',
            favorite: item.isRecommended || false,
            isAvailable: true,
            price: item.price || 0
          }));
        setMenuItems(mappedItems);

        // Fetch categories
        const cats = await auth.apiRequest('/restaurant/menu/categories');
        const catNames = (cats || [])
          .filter((c: any) => c.status === 'Active' || c.status === 'ACTIVE')
          .map((c: any) => c.name);

        const uniqueCats = Array.from(new Set(['All', ...catNames, ...mappedItems.map(i => i.category)]));
        setCategories(uniqueCats);
      } catch (err) {
        console.error('Failed to load digital menu data:', err);
      }
    };
    loadMenuData();
  }, [auth]);

  // Load tables initially
  const initializeTables = async () => {
    try {
      const apiTables = await auth.apiRequest(`/restaurant/tables`);
      if (apiTables && apiTables.length > 0) {
        const mapped = apiTables.map((t: any) => {
          const activeOrder = (t.kitchenOrders || []).find((ko: any) => ['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(ko.status));
          
          return {
            id: t.id,
            tableNumber: t.tableNumber,
            capacity: t.capacity || 4,
            status: (() => {
              if (t.status === 'AVAILABLE') return 'AVAILABLE';
              if (t.status === 'RESERVED') return 'RESERVED';
              if (t.status === 'OUT_OF_SERVICE') return 'OUT_OF_SERVICE';
              if (activeOrder) {
                if (activeOrder.status === 'NEW' || activeOrder.status === 'ACCEPTED') return 'ORDER_SENT';
                if (activeOrder.status === 'PREPARING') return 'PREPARING';
                if (activeOrder.status === 'READY') return 'READY';
              }
              return 'OCCUPIED';
            })() as Table['status'],
            assignedWaiter: t.waiter?.name || 'Rahul',
            customer: activeOrder ? { name: activeOrder.customerName || 'Guest', phone: '', loyaltyMember: false } : null,
            guestsCount: activeOrder?.guestsCount || (t.status === 'AVAILABLE' ? 0 : 2),
            occupiedSince: activeOrder?.createdAt || (t.status === 'AVAILABLE' ? null : new Date(Date.now() - 20 * 60000).toISOString()),
            activeOrderItems: (t.kitchenOrders || []).flatMap((ko: any) =>
              (ko.items || []).map((it: any) => ({
                id: it.menuItem?.id || it.menuItemId,
                name: it.menuItem?.name || 'Unknown Item',
                quantity: it.quantity,
                category: it.menuItem?.category?.name || 'Main Course',
                specialInstructions: it.notes ? it.notes.replace(/^\[KOT-\d+\]\s*/, '') : '',
                isSentToKitchen: true,
                price: it.unitPrice || it.menuItem?.price || 0
              }))
            ),
            kotNumber: activeOrder ? `KOT-${activeOrder.id.slice(-4).toUpperCase()}` : (t.status === 'AVAILABLE' ? null : `KOT-${Math.floor(1000 + Math.random() * 9000)}`),
            orderTime: activeOrder ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (t.status === 'AVAILABLE' ? null : new Date(Date.now() - 20 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          };
        });
        setTables(mapped);
        return;
      }
    } catch (e) {
      console.warn('API tables not reachable, loading mock tables.');
    }

    setTables([
      { id: 't-1', tableNumber: 'Table 01', capacity: 2, status: 'AVAILABLE', assignedWaiter: 'Rahul', customer: null, guestsCount: 0, occupiedSince: null, activeOrderItems: [], kotNumber: null, orderTime: null },
      {
        id: 't-2',
        tableNumber: 'Table 02',
        capacity: 4,
        status: 'PREPARING',
        assignedWaiter: 'Akshay',
        customer: { name: 'Deshmukh', phone: '9876543210', loyaltyMember: true },
        guestsCount: 3,
        occupiedSince: new Date(Date.now() - 40 * 60000).toISOString(),
        activeOrderItems: [
          { id: 'm-1', name: 'Paneer Tikka', quantity: 2, category: 'Starters', specialInstructions: 'Less spicy', isSentToKitchen: true, price: 250 },
          { id: 'm-17', name: 'Butter Naan', quantity: 6, category: 'Breads', specialInstructions: '', isSentToKitchen: true, price: 40 }
        ],
        kotNumber: 'KOT-7421',
        orderTime: '01:45 PM'
      },
      {
        id: 't-3',
        tableNumber: 'Table 03',
        capacity: 6,
        status: 'READY',
        assignedWaiter: 'Ritesh',
        customer: null,
        guestsCount: 4,
        occupiedSince: new Date(Date.now() - 60 * 60000).toISOString(),
        activeOrderItems: [
          { id: 'm-2', name: 'Chicken Tikka Kebab', quantity: 2, category: 'Starters', specialInstructions: '', isSentToKitchen: true, price: 320 },
          { id: 'm-7', name: 'Hakka Noodles', quantity: 1, category: 'Chinese', specialInstructions: 'Jain', isSentToKitchen: true, price: 180 }
        ],
        kotNumber: 'KOT-7405',
        orderTime: '01:10 PM'
      },
      { id: 't-4', tableNumber: 'Table 04', capacity: 4, status: 'AVAILABLE', assignedWaiter: 'Rahul', customer: null, guestsCount: 0, occupiedSince: null, activeOrderItems: [], kotNumber: null, orderTime: null },
      { id: 't-5', tableNumber: 'Table 05', capacity: 8, status: 'WAITING_FOR_ORDER', assignedWaiter: 'Akshay', customer: { name: 'Vikram', phone: '9123456789', loyaltyMember: false }, guestsCount: 5, occupiedSince: new Date(Date.now() - 5 * 60000).toISOString(), activeOrderItems: [], kotNumber: null, orderTime: null },
      { id: 't-6', tableNumber: 'Table 06', capacity: 4, status: 'RESERVED', assignedWaiter: 'Ritesh', customer: null, guestsCount: 0, occupiedSince: null, activeOrderItems: [], kotNumber: null, orderTime: null }
    ]);
  };

  useEffect(() => {
    initializeTables();
  }, []);

  useEffect(() => {
    if (tables.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlTableId = params.get('tableId');
      if (urlTableId) {
        const found = tables.find(t => t.id === urlTableId);
        if (found) {
          handleSelectTable(found);
        }
      }
    }
  }, [tables, window.location.search]);

  // Handle Table Click
  const handleSelectTable = (table: Table) => {
    playSound(700, 'sine', 0.05);

    if (table.status === 'RESERVED' || table.status === 'OUT_OF_SERVICE') {
      notify(`Table is ${table.status}. Cannot take orders.`, 'warning');
      return;
    }

    if (table.status === 'AVAILABLE') {
      // Step 2: Open Start New Table Session Dialog
      setSessionModalTable(table);
      setFormGuestsCount(table.capacity);
      setFormWaiter(table.assignedWaiter || 'Rahul');
      setFormCustomerType('Walk-in');
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormOccasion('None');
      setShowSessionModal(true);
    } else {
      // Step 7: Load existing dining session
      setSelectedTable(table);
      setCart(table.activeOrderItems);
      setGeneralKitchenNote('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // Confirm starting a new table session
  const handleStartSession = async () => {
    if (!sessionModalTable) return;
    playSound(950, 'sine', 0.1);

    const hasCustomerDetails = formCustomerName || formCustomerPhone;
    const sessionCustomer: CustomerInfo | null = hasCustomerDetails ? {
      name: formCustomerName || 'Walk-in',
      phone: formCustomerPhone || '',
      loyaltyMember: formCustomerType === 'Registered'
    } : null;

    try {
      // Persist the dining session in the database immediately!
      const resolvedOrder = await auth.apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify({
          tableId: sessionModalTable.id,
          source: 'WALK_IN',
          waiterName: formWaiter,
          items: [], // Start with empty items
          notes: '',
          orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      });

      await initializeTables();

      const newSessionTable: Table = {
        ...sessionModalTable,
        status: 'OCCUPIED',
        guestsCount: formGuestsCount,
        assignedWaiter: formWaiter,
        occupiedSince: new Date().toISOString(),
        customer: sessionCustomer,
        occasion: formOccasion,
        kotNumber: `KOT-${Math.floor(1000 + Math.random() * 9000)}`,
        orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activeOrderItems: []
      };

      setTables(prev => prev.map(t => t.id === sessionModalTable.id ? { ...newSessionTable, activeOrderId: resolvedOrder.id } : t));
      setSelectedTable({ ...newSessionTable, activeOrderId: resolvedOrder.id });
      setCart([]);
      setGeneralKitchenNote('');
      setShowSessionModal(false);
      setSessionModalTable(null);

      notify(`${newSessionTable.tableNumber} is now Occupied. Session started & saved to DB.`, 'success');
    } catch (err) {
      console.warn('Failed to persist session, using local fallback:', err);
      const newSessionTable: Table = {
        ...sessionModalTable,
        status: 'OCCUPIED',
        guestsCount: formGuestsCount,
        assignedWaiter: formWaiter,
        occupiedSince: new Date().toISOString(),
        customer: sessionCustomer,
        occasion: formOccasion,
        kotNumber: `KOT-${Math.floor(1000 + Math.random() * 9000)}`,
        orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activeOrderItems: []
      };

      setTables(prev => prev.map(t => t.id === sessionModalTable.id ? newSessionTable : t));
      setSelectedTable(newSessionTable);
      setCart([]);
      setGeneralKitchenNote('');
      setShowSessionModal(false);
      setSessionModalTable(null);

      notify(`${newSessionTable.tableNumber} is now Occupied (Simulated).`, 'success');
    }

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };



  // Keyboard navigation inside search results
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, filteredResults: MenuItem[]) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSelectedIndex >= 0 && searchSelectedIndex < filteredResults.length) {
        const selectedItem = filteredResults[searchSelectedIndex];
        handleAddItemToCart(selectedItem);
        setSearchQuery('');
        setSearchSelectedIndex(-1);
      }
    }
  };

  // Adjust item quantity in the Cart KOT
  const handleUpdateQty = (itemId: string, isSent: boolean, diff: number) => {
    playSound(850, 'sine', 0.03);
    const updated = cart.map(item => {
      if (item.id === itemId && item.isSentToKitchen === isSent) {
        const newQty = Math.max(1, item.quantity + diff);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
  };

  // Remove Item
  const handleRemoveItem = (itemId: string, isSent: boolean) => {
    playSound(400, 'sawtooth', 0.08);
    setCart(cart.filter(item => !(item.id === itemId && item.isSentToKitchen === isSent)));
  };



  // Save Draft
  const handleSaveDraft = () => {
    if (!selectedTable) return;
    playSound(800, 'sine', 0.1);

    setTables(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        return { ...t, activeOrderItems: cart };
      }
      return t;
    }));
    notify(`Draft KOT saved for ${selectedTable.tableNumber}.`, 'info');
  };

  // Send to Kitchen (KOT Dispatch)
  const handleSendToKitchen = async () => {
    if (!selectedTable) return;
    if (cart.length === 0) {
      notify('KOT is empty!', 'warning');
      return;
    }

    const newItems = cart.filter(item => !item.isSentToKitchen);
    if (newItems.length === 0) {
      notify('All items have already been sent.', 'info');
      return;
    }

    try {
      // Dispatch KOT to backend API (No financial data sent)
      await auth.apiRequest('/restaurant/orders', {
        method: 'POST',
        body: JSON.stringify({
          tableId: selectedTable.id,
          kotNumber: selectedTable.kotNumber,
          source: 'WALK_IN',
          waiterName: selectedTable.assignedWaiter,
          items: newItems.map(it => ({
            menuItemId: it.id,
            quantity: it.quantity,
            notes: '',
            unitPrice: it.price
          })),
          notes: generalKitchenNote,
          orderTime: selectedTable.orderTime
        })
      });
    } catch (e) {
      console.warn('Backend KDS connection unavailable, dispatching simulated KOT.');
    }

    // Mark all items in the cart as sent to kitchen
    const updatedCart = cart.map(item => ({ ...item, isSentToKitchen: true }));

    setTables(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'PREPARING',
          activeOrderItems: updatedCart
        };
      }
      return t;
    }));

    setSelectedTable(prev => prev ? {
      ...prev,
      status: 'PREPARING',
      activeOrderItems: updatedCart
    } : null);

    setCart(updatedCart);
    notify(`KOT dispatched for ${selectedTable.tableNumber}!`, 'success');
  };

  const handleUpdateOrder = async () => {
    if (!selectedTable) return;

    // Compare current cart with original saved items
    const original = selectedTable.activeOrderItems || [];
    
    // 1. Identify new items (not sent yet)
    const newItems = cart.filter(item => !item.isSentToKitchen);
    
    // 2. Identify modified sent items
    const modifiedSentItems = cart.filter(item => {
      if (!item.isSentToKitchen) return false;
      const orig = original.find(o => o.id === item.id && o.isSentToKitchen);
      if (!orig) return false;
      return orig.quantity !== item.quantity || orig.specialInstructions !== item.specialInstructions;
    });

    // 3. Identify removed sent items
    const removedSentItems = original.filter(orig => {
      if (!orig.isSentToKitchen) return false;
      return !cart.some(item => item.id === orig.id && item.isSentToKitchen);
    });

    const hasSentModifications = modifiedSentItems.length > 0 || removedSentItems.length > 0;

    if (hasSentModifications) {
      const confirmUpdate = window.confirm(
        "Some items have already been sent to the kitchen. Updating this order will notify the kitchen of these changes. Do you want to proceed?"
      );
      if (!confirmUpdate) return;
    }

    try {
      const itemsToDispatch: any[] = [];

      // Add new items
      newItems.forEach(it => {
        itemsToDispatch.push({
          menuItemId: it.id,
          quantity: it.quantity,
          notes: '',
          unitPrice: it.price
        });
      });

      // Add modified items as amendments
      modifiedSentItems.forEach(it => {
        itemsToDispatch.push({
          menuItemId: it.id,
          quantity: it.quantity,
          notes: '[AMENDMENT]',
          unitPrice: it.price
        });
      });

      // Add cancelled/removed items
      removedSentItems.forEach(it => {
        itemsToDispatch.push({
          menuItemId: it.id,
          quantity: 0,
          notes: `[CANCELLED] ${it.name} removed from order`,
          unitPrice: it.price
        });
      });

      if (itemsToDispatch.length > 0) {
        await auth.apiRequest('/restaurant/orders', {
          method: 'POST',
          body: JSON.stringify({
            tableId: selectedTable.id,
            kotNumber: selectedTable.kotNumber,
            source: 'WALK_IN',
            waiterName: selectedTable.assignedWaiter,
            items: itemsToDispatch,
            notes: generalKitchenNote,
            orderTime: selectedTable.orderTime
          })
        });
      }

      // Mark all items as sent to kitchen
      const updatedCart = cart.map(item => ({ ...item, isSentToKitchen: true }));

      setTables(prev => prev.map(t => {
        if (t.id === selectedTable.id) {
          return {
            ...t,
            status: 'PREPARING',
            activeOrderItems: updatedCart
          };
        }
        return t;
      }));

      setSelectedTable(prev => prev ? {
        ...prev,
        status: 'PREPARING',
        activeOrderItems: updatedCart
      } : null);

      setCart(updatedCart);
      notify("Order updated successfully.", "success");
    } catch (error) {
      console.error("Failed to update order", error);
      // Fallback: update local state anyway
      const updatedCart = cart.map(item => ({ ...item, isSentToKitchen: true }));
      setTables(prev => prev.map(t => {
        if (t.id === selectedTable.id) {
          return {
            ...t,
            activeOrderItems: updatedCart
          };
        }
        return t;
      }));
      setSelectedTable(prev => prev ? {
        ...prev,
        activeOrderItems: updatedCart
      } : null);
      setCart(updatedCart);
      notify("Order updated locally. Kitchen connection offline.", "warning");
    }
  };

  // KDS simulation status progression
  const handleSimulateStatusAdvance = (tableId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        let nextStatus: Table['status'] = t.status;
        if (t.status === 'OCCUPIED' || t.status === 'WAITING_FOR_ORDER') nextStatus = 'ORDER_SENT';
        else if (t.status === 'ORDER_SENT') nextStatus = 'PREPARING';
        else if (t.status === 'PREPARING') nextStatus = 'READY';
        else if (t.status === 'READY') nextStatus = 'SERVED';
        else if (t.status === 'SERVED') {
          nextStatus = 'AVAILABLE';
          notify(`Table ${t.tableNumber} session completed.`, 'success');
          return {
            ...t,
            status: 'AVAILABLE',
            customer: null,
            guestsCount: 0,
            occupiedSince: null,
            activeOrderItems: [],
            kotNumber: null,
            orderTime: null
          };
        }

        notify(`Table ${t.tableNumber} is now ${nextStatus}`, 'info');
        return { ...t, status: nextStatus };
      }
      return t;
    }));

    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(prev => {
        if (!prev) return null;
        let nextStatus: Table['status'] = prev.status;
        if (prev.status === 'OCCUPIED' || prev.status === 'WAITING_FOR_ORDER') nextStatus = 'ORDER_SENT';
        else if (prev.status === 'ORDER_SENT') nextStatus = 'PREPARING';
        else if (prev.status === 'PREPARING') nextStatus = 'READY';
        else if (prev.status === 'READY') nextStatus = 'SERVED';
        else if (prev.status === 'SERVED') return null;

        return { ...prev, status: nextStatus };
      });
    }
  };

  // Search filter logic
  const getFilteredResults = () => {
    return menuItems.filter(item => {
      // If a search query exists, search across the entire menu (bypass category filter).
      // Otherwise, filter by the active category.
      const matchesCategory = searchQuery ? true : (activeCategory === 'All' || item.category === activeCategory);
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const filteredResults = getFilteredResults();

  const getEstimatedPrepTime = () => {
    if (cart.length === 0) return 0;
    const times = cart.map(c => {
      if (c.category === 'Main Course') return 20;
      if (c.category === 'Starters' || c.category === 'Chinese') return 15;
      return 10;
    });
    return Math.max(...times);
  };

  // Consistent Status Badges
  const getStatusBadge = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🟢</span> Available
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🟡</span> Occupied
          </span>
        );
      case 'WAITING_FOR_ORDER':
        return (
          <span className="text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🟡</span> Waiting
          </span>
        );
      case 'ORDER_SENT':
        return (
          <span className="text-blue-700 bg-blue-50 border border-blue-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🔵</span> Sent
          </span>
        );
      case 'PREPARING':
        return (
          <span className="text-orange-700 bg-orange-50 border border-orange-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 animate-pulse">
            <span>🟠</span> Preparing
          </span>
        );
      case 'READY':
        return (
          <span className="text-purple-700 bg-purple-50 border border-purple-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🟣</span> Ready
          </span>
        );
      case 'SERVED':
        return (
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🍽️</span> Served
          </span>
        );
      case 'RESERVED':
        return (
          <span className="text-slate-700 bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>⚪</span> Reserved
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="text-rose-700 bg-rose-50 border border-rose-200/60 rounded-full px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1">
            <span>🔴</span> Out of Service
          </span>
        );
      default:
        return (
          <span className="text-slate-700 bg-slate-100 border border-slate-300 rounded-full px-2.5 py-1 text-xs font-bold">
            Available
          </span>
        );
    }
  };

  const handleAdjustRowQty = (itemId: string, diff: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + diff)
    }));
  };

  // Filter Tables
  const getFilteredTables = () => {
    return tables.filter(t => {
      if (tableFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
      if (tableFilter === 'OCCUPIED') return ['OCCUPIED', 'WAITING_FOR_ORDER', 'ORDER_SENT', 'SERVED'].includes(t.status);
      if (tableFilter === 'PREPARING') return t.status === 'PREPARING';
      if (tableFilter === 'READY') return t.status === 'READY';
      return true;
    });
  };

  const filteredTables = getFilteredTables();

  return (
    <div className="font-['Outfit'] antialiased text-slate-900 bg-slate-50 min-h-screen p-6 space-y-6 text-left">

      {/* Top Title Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Utensils className="w-5.5 h-5.5 text-emerald-600" />
            <span>Dine-In Order Terminal</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">High-performance search POS workspace for recording guest selections and dispatching KOTs.</p>
        </div>

        {/* Live Simulator quick controls */}
        {tables.some(t => t.status !== 'AVAILABLE') && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/65 p-2.5 rounded-xl">
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
              <span>Simulate KDS:</span>
            </span>
            <div className="flex gap-2 flex-wrap">
              {tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'RESERVED' && t.status !== 'OUT_OF_SERVICE').map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSimulateStatusAdvance(t.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {t.tableNumber} ({t.status === 'OCCUPIED' || t.status === 'WAITING_FOR_ORDER' ? '→ Sent' : t.status === 'ORDER_SENT' ? '→ Prep' : t.status === 'PREPARING' ? '→ Ready' : t.status === 'READY' ? '→ Served' : '→ Clear'})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Tables Horizontal Bar */}
      {tables.some(t => t.status !== 'AVAILABLE' && t.status !== 'RESERVED' && t.status !== 'OUT_OF_SERVICE') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3.5 select-none animate-[fadeIn_0.15s_ease-out]">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
            <Users className="w-4.5 h-4.5 text-emerald-600" />
            <span>Active Sessions:</span>
          </span>
          <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0 w-full scrollbar-thin">
            {tables
              .filter(t => t.status !== 'AVAILABLE' && t.status !== 'RESERVED' && t.status !== 'OUT_OF_SERVICE')
              .map(t => {
                const isSelected = selectedTable?.id === t.id;
                const itemsCount = t.activeOrderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                const runningMins = t.occupiedSince ? Math.floor((Date.now() - new Date(t.occupiedSince).getTime()) / 60000) : 0;
                const isReady = t.status === 'READY';
                
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-150 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                        : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700 hover:border-slate-355'
                    } ${isReady ? 'animate-pulse bg-purple-50 border-purple-300 text-purple-700' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      t.status === 'READY' ? 'bg-purple-500' :
                      t.status === 'PREPARING' ? 'bg-orange-500' :
                      t.status === 'ORDER_SENT' ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`} />
                    <span>{t.tableNumber}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'} font-semibold`}>
                      {itemsCount} items
                    </span>
                    {runningMins > 0 && (
                      <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-550'} font-semibold flex items-center gap-0.5`}>
                        <Clock className="w-3.5 h-3.5" /> {runningMins}m
                      </span>
                    )}
                    {isReady && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                        1
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Main 3-Column Grid with Equal Height Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* LEFT PANEL: ACTIVE TABLES (33.3% - 4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[850px]">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Floor Layout</h2>
              <span className="text-xs text-slate-400 font-bold uppercase">{tables.length} Tables</span>
            </div>

            {/* Table Quick Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              {(['ALL', 'AVAILABLE', 'OCCUPIED', 'PREPARING', 'READY'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border cursor-pointer ${tableFilter === f
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Scrollable Table List */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {filteredTables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                const isAvailable = table.status === 'AVAILABLE';
                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`bg-white border rounded-2xl p-6 transition-all duration-200 cursor-pointer text-left ${isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/10 shadow-md'
                        : isAvailable
                          ? 'border-emerald-200 hover:border-emerald-400 shadow-xs hover:shadow-sm bg-emerald-50/10'
                          : 'border-slate-200/85 hover:border-slate-300 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-black text-lg text-slate-900 leading-tight">{table.tableNumber}</span>
                      <div className="shrink-0">{getStatusBadge(table.status)}</div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-y-2.5 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Capacity: {table.capacity}</span>
                      </div>
                      {!isAvailable && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Staff: {table.assignedWaiter}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER & RIGHT WORKSPACE (66.6% - 8 Columns) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-9 gap-6 items-stretch">
          {selectedTable ? (
            <>
              {/* CENTER PANEL: POS SEARCH & QUICK MENU (45% - 5 Columns) */}
              <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[850px]">
                <div className="space-y-5 flex-1 flex flex-col overflow-hidden">

                  {/* Category Selector Chips */}
                  <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none shrink-0">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setSearchSelectedIndex(-1); playSound(805); }}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer ${activeCategory === cat
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar - Main Focus */}
                  <div className="space-y-2 shrink-0">
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search menu item..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchSelectedIndex(-1); }}
                        onKeyDown={(e) => handleSearchKeyDown(e, filteredResults)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-16 py-3.5 text-sm focus:outline-none focus:border-emerald-600 font-medium shadow-inner text-slate-900"
                      />
                      {searchQuery && (
                        <div className="absolute right-3 top-3.5 flex items-center gap-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          <span>ENTER</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Results List */}
                  <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results ({filteredResults.length})</h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {filteredResults.map((item, index) => {
                        const isHighlighted = index === searchSelectedIndex;
                        const rowQty = itemQuantities[item.id] || 1;
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${isHighlighted
                                ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/10'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                              }`}
                          >
                            {/* Top Row: Item Name & Veg/Non-Veg Badge */}
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-extrabold text-slate-900 text-left leading-snug whitespace-normal">
                                {item.name}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${item.veg ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {item.veg ? 'VEG' : 'NON-VEG'}
                              </span>
                            </div>

                            {/* Bottom Row: Details and Actions */}
                            <div className="flex items-center justify-between gap-4">
                              {/* Left side: Category & SKU */}
                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                  {item.category} • {item.sku}
                                </span>
                              </div>

                              {/* Right side: Qty and Add Button */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                {/* Row Qty adjustment */}
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-205 rounded-lg p-0.5">
                                  <button
                                    onClick={() => handleAdjustRowQty(item.id, -1)}
                                    className="w-5.5 h-5.5 flex items-center justify-center rounded-md bg-white text-slate-600 font-bold text-xs shadow-xs hover:bg-slate-100"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="w-4 text-center font-extrabold text-slate-850 text-xs">{rowQty}</span>
                                  <button
                                    onClick={() => handleAdjustRowQty(item.id, 1)}
                                    className="w-5.5 h-5.5 flex items-center justify-center rounded-md bg-white text-slate-600 font-bold text-xs shadow-xs hover:bg-slate-100"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleAddItemToCart(item, rowQty)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredResults.length === 0 && (
                        <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                          <span className="text-2xl">🍽️</span>
                          <span className="text-slate-900 font-extrabold text-sm block">No menu items found.</span>
                          <span className="text-slate-400 font-medium text-xs max-w-[220px] leading-relaxed block">
                            We couldn't find any matching items. Try checking the spelling or clearing the search query.
                          </span>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT PANEL: CURRENT ORDER SUMMARY / KOT (30% - 4 Columns) */}
              <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[850px] relative overflow-hidden text-left">

                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-950"></div>

                <div className="space-y-5 flex-1 flex flex-col overflow-hidden pt-1">

                  {/* Table Information Card */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 shrink-0">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4.5 h-4.5 text-slate-700" />
                        <span className="font-extrabold text-xs text-slate-500 tracking-wider uppercase">Kitchen Order Ticket</span>
                      </div>
                      <span className="font-bold text-xs text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                        {selectedTable.kotNumber || 'DRAFT'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <h3 className="font-black text-lg text-slate-900">{selectedTable.tableNumber}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mt-1">
                          Opened: {selectedTable.orderTime || ''}
                        </span>
                      </div>
                      <div className="text-right text-[11px] font-bold text-slate-500 uppercase space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Waiter: {selectedTable.assignedWaiter}</span>
                        </div>
                        <div>Guests: {selectedTable.guestsCount}</div>
                        {selectedTable.occasion && selectedTable.occasion !== 'None' && (
                          <div className="text-emerald-600 font-bold">✨ {selectedTable.occasion}</div>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* Ordered Items List */}
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ordered Items</span>
                        <span className="text-xs text-slate-450 font-bold uppercase">{cart.length} Rows</span>
                      </div>

                      {cart.map(item => {
                        const itemKey = `${item.id}-${item.isSentToKitchen}`;
                        
                        return (
                          <div key={itemKey} className="text-left space-y-2 pb-3.5 border-b border-slate-100">
                            <div className="flex justify-between items-start gap-2">
                              <div className="text-left min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                                    {item.name}
                                  </h4>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${item.isSentToKitchen ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                    {item.isSentToKitchen ? 'Cooking' : 'New'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</span>
                                </div>
                                

                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                <button
                                  onClick={() => handleUpdateQty(item.id, item.isSentToKitchen, -1)}
                                  className="w-5.5 h-5.5 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-slate-850 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-slate-950 w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQty(item.id, item.isSentToKitchen, 1)}
                                  className="w-5.5 h-5.5 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-slate-850 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item.id, item.isSentToKitchen)}
                                  className="w-5.5 h-5.5 flex items-center justify-center rounded bg-slate-50 text-rose-600 border border-rose-150 hover:bg-rose-100 cursor-pointer ml-1"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {cart.length === 0 && (
                        <div className="py-16 text-center text-slate-400 text-xs italic">
                          KOT is empty. Use the search bar to add items.
                        </div>
                      )}
                    </div>

                </div>

                {/* Bottom KOT Summary Footer & Actions */}
                <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-4 shrink-0">

                  {/* General instructions */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">General KOT Instructions</label>
                    <input
                      type="text"
                      placeholder="E.g. Jain preparation, Serve beverages first..."
                      value={generalKitchenNote}
                      onChange={(e) => setGeneralKitchenNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 placeholder:text-slate-400 font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 font-bold text-left">
                    <div>
                      <span>Total Items</span>
                      <div className="text-slate-950 font-black text-sm mt-0.5">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} Pcs
                      </div>
                    </div>
                    <div className="text-right">
                      <span>Est. Prep Time</span>
                      <div className="text-slate-950 font-black text-sm mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{getEstimatedPrepTime()} Mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={handleSaveDraft}
                      className="bg-white border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handleSendToKitchen}
                      disabled={cart.filter(c => !c.isSentToKitchen).length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Send KOT
                    </button>
                    <button
                      onClick={handleUpdateOrder}
                      disabled={cart.filter(c => !c.isSentToKitchen).length === 0}
                      className="bg-slate-900 hover:bg-slate-950 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider col-span-2 transition-all cursor-pointer"
                    >
                      Update Order
                    </button>
                  </div>
                </div>

              </div>
            </>
          ) : (
            /* Empty State Workspace */
            <div className="md:col-span-9 bg-white border border-slate-200/80 rounded-2xl p-20 shadow-sm flex flex-col items-center justify-center text-center space-y-4 h-[850px]">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
                <Utensils className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Select a Dining Table</h3>
                <p className="text-slate-500 text-xs font-normal mt-1.5 max-w-sm">Choose an active table from the floor layout on the left to start adding items, writing kitchen notes, or dispatching KOTs.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* START NEW TABLE SESSION MODAL */}
      {showSessionModal && sessionModalTable && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 text-left font-['Outfit'] max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Start New Table Session</h3>
              <button
                onClick={() => { setShowSessionModal(false); setSessionModalTable(null); }}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Table Number</label>
                  <input
                    type="text"
                    readOnly
                    value={sessionModalTable.tableNumber}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Capacity</label>
                  <input
                    type="text"
                    readOnly
                    value={sessionModalTable.capacity}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Number of Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={sessionModalTable.capacity * 2}
                    value={formGuestsCount}
                    onChange={(e) => setFormGuestsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Assigned Waiter</label>
                  <select
                    value={formWaiter}
                    onChange={(e) => setFormWaiter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="Rahul">Rahul</option>
                    <option value="Akshay">Akshay</option>
                    <option value="Ritesh">Ritesh</option>
                    <option value="Amit">Amit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase block">Customer Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="custType"
                      checked={formCustomerType === 'Walk-in'}
                      onChange={() => setFormCustomerType('Walk-in')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Walk-in</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="custType"
                      checked={formCustomerType === 'Registered'}
                      onChange={() => setFormCustomerType('Registered')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Registered Customer</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowSessionModal(false); setSessionModalTable(null); }}
                className="bg-white border border-slate-200 text-slate-750 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSession}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Start Order
              </button>
      
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TakeOrder;
