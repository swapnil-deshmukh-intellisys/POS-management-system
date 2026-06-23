import React, { useEffect, useState } from 'react';
import {
  Mail, Phone, Printer, Edit, ShoppingCart, X, AlertTriangle, Search,
  ArrowUpDown, ChevronLeft, ChevronRight, Plus, Activity, Truck, Calendar, DollarSign, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// 60 Realistic Kitchen Raw Materials / Products
const defaultDummyProducts = [
  { id: 'dummy-1', name: 'Tomato', currentStock: 125, unitType: 'Kg', purchasePrice: 25, minimumStock: 40, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-30' },
  { id: 'dummy-2', name: 'Onion', currentStock: 80, unitType: 'Kg', purchasePrice: 30, minimumStock: 50, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-07-10' },
  { id: 'dummy-3', name: 'Potato', currentStock: 150, unitType: 'Kg', purchasePrice: 20, minimumStock: 50, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-07-20' },
  { id: 'dummy-4', name: 'Rice', currentStock: 250, unitType: 'Kg', purchasePrice: 65, minimumStock: 100, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-06-15' },
  { id: 'dummy-5', name: 'Wheat Flour', currentStock: 200, unitType: 'Kg', purchasePrice: 45, minimumStock: 80, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-03-10' },
  { id: 'dummy-6', name: 'Sugar', currentStock: 90, unitType: 'Kg', purchasePrice: 40, minimumStock: 30, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-02-15' },
  { id: 'dummy-7', name: 'Salt', currentStock: 45, unitType: 'Kg', purchasePrice: 15, minimumStock: 10, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2028-01-01' },
  { id: 'dummy-8', name: 'Cooking Oil', currentStock: 60, unitType: 'Liter', purchasePrice: 135, minimumStock: 20, supplierId: 'sup-3', supplierName: 'Sunflow Oils Ltd', supplierMobile: '+91 9988776655', expiryDate: '2026-12-30' },
  { id: 'dummy-9', name: 'Butter', currentStock: 15, unitType: 'Kg', purchasePrice: 420, minimumStock: 25, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-07-05' },
  { id: 'dummy-10', name: 'Cheese', currentStock: 8, unitType: 'Kg', purchasePrice: 480, minimumStock: 12, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-07-01' },
  { id: 'dummy-11', name: 'Paneer', currentStock: 4, unitType: 'Kg', purchasePrice: 320, minimumStock: 10, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-06-27' },
  { id: 'dummy-12', name: 'Milk', currentStock: 12, unitType: 'Liter', purchasePrice: 60, minimumStock: 30, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-06-25' },
  { id: 'dummy-13', name: 'Curd', currentStock: 5, unitType: 'Kg', purchasePrice: 80, minimumStock: 15, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-06-26' },
  { id: 'dummy-14', name: 'Green Chilli', currentStock: 10, unitType: 'Kg', purchasePrice: 80, minimumStock: 5, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-29' },
  { id: 'dummy-15', name: 'Coriander', currentStock: 2, unitType: 'Kg', purchasePrice: 50, minimumStock: 8, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-27' },
  { id: 'dummy-16', name: 'Garlic', currentStock: 22, unitType: 'Kg', purchasePrice: 160, minimumStock: 10, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-08-15' },
  { id: 'dummy-17', name: 'Ginger', currentStock: 18, unitType: 'Kg', purchasePrice: 120, minimumStock: 8, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-08-10' },
  { id: 'dummy-18', name: 'Black Pepper', currentStock: 5, unitType: 'Kg', purchasePrice: 650, minimumStock: 3, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-10-10' },
  { id: 'dummy-19', name: 'Cardamom', currentStock: 1.5, unitType: 'Kg', purchasePrice: 2400, minimumStock: 2, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-12-05' },
  { id: 'dummy-20', name: 'Clove', currentStock: 3, unitType: 'Kg', purchasePrice: 900, minimumStock: 2, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-11-20' },
  { id: 'dummy-21', name: 'Tea Powder', currentStock: 12, unitType: 'Kg', purchasePrice: 280, minimumStock: 10, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-05-18' },
  { id: 'dummy-22', name: 'Coffee Powder', currentStock: 8, unitType: 'Kg', purchasePrice: 450, minimumStock: 6, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-04-20' },
  { id: 'dummy-23', name: 'Soft Drink Syrup', currentStock: 4, unitType: 'Liter', purchasePrice: 850, minimumStock: 10, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2026-11-15' },
  { id: 'dummy-24', name: 'Packaging Containers', currentStock: 500, unitType: 'Piece', purchasePrice: 5, minimumStock: 200, supplierId: 'sup-7', supplierName: 'City Packaging Depot', supplierMobile: '+91 9555444333', expiryDate: '2028-02-15' },
  { id: 'dummy-25', name: 'Paper Cups', currentStock: 800, unitType: 'Piece', purchasePrice: 1.5, minimumStock: 300, supplierId: 'sup-7', supplierName: 'City Packaging Depot', supplierMobile: '+91 9555444333', expiryDate: '2028-04-10' },
  { id: 'dummy-26', name: 'Tissue Paper', currentStock: 1500, unitType: 'Piece', purchasePrice: 0.5, minimumStock: 500, supplierId: 'sup-7', supplierName: 'City Packaging Depot', supplierMobile: '+91 9555444333', expiryDate: '2028-06-01' },
  { id: 'dummy-27', name: 'Mushroom', currentStock: 0, unitType: 'Kg', purchasePrice: 160, minimumStock: 5, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-24' },
  { id: 'dummy-28', name: 'Capsicum', currentStock: 3, unitType: 'Kg', purchasePrice: 75, minimumStock: 10, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-26' },
  { id: 'dummy-29', name: 'Broccoli', currentStock: 0, unitType: 'Kg', purchasePrice: 190, minimumStock: 6, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-25' },
  { id: 'dummy-30', name: 'Cabbage', currentStock: 35, unitType: 'Kg', purchasePrice: 28, minimumStock: 15, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-07-02' },
  { id: 'dummy-31', name: 'Carrot', currentStock: 45, unitType: 'Kg', purchasePrice: 38, minimumStock: 20, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-07-05' },
  { id: 'dummy-32', name: 'Lemon', currentStock: 250, unitType: 'Piece', purchasePrice: 3, minimumStock: 100, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-07-15' },
  { id: 'dummy-33', name: 'Mint Leaves', currentStock: 1, unitType: 'Kg', purchasePrice: 40, minimumStock: 5, supplierId: 'sup-1', supplierName: 'Fresh Farm Traders', supplierMobile: '+91 9876543210', expiryDate: '2026-06-25' },
  { id: 'dummy-34', name: 'Soy Sauce', currentStock: 15, unitType: 'Liter', purchasePrice: 120, minimumStock: 5, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2027-04-12' },
  { id: 'dummy-35', name: 'Vinegar', currentStock: 8, unitType: 'Liter', purchasePrice: 45, minimumStock: 5, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2027-08-20' },
  { id: 'dummy-36', name: 'Tomato Puree', currentStock: 40, unitType: 'Packet', purchasePrice: 90, minimumStock: 15, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2026-10-18' },
  { id: 'dummy-37', name: 'Mayonnaise', currentStock: 6, unitType: 'Kg', purchasePrice: 210, minimumStock: 10, supplierId: 'sup-4', supplierName: 'Amul Dairy Dist.', supplierMobile: '+91 9090909090', expiryDate: '2026-08-01' },
  { id: 'dummy-38', name: 'Red Chilli Sauce', currentStock: 12, unitType: 'Liter', purchasePrice: 110, minimumStock: 6, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2026-12-05' },
  { id: 'dummy-39', name: 'Green Chilli Sauce', currentStock: 10, unitType: 'Liter', purchasePrice: 105, minimumStock: 6, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2026-12-10' },
  { id: 'dummy-40', name: 'Pasta', currentStock: 30, unitType: 'Kg', purchasePrice: 95, minimumStock: 15, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-05-01' },
  { id: 'dummy-41', name: 'Corn Flour', currentStock: 15, unitType: 'Kg', purchasePrice: 60, minimumStock: 10, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-02-18' },
  { id: 'dummy-42', name: 'Maida', currentStock: 120, unitType: 'Kg', purchasePrice: 38, minimumStock: 50, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-01-20' },
  { id: 'dummy-43', name: 'Suji', currentStock: 25, unitType: 'Kg', purchasePrice: 42, minimumStock: 15, supplierId: 'sup-2', supplierName: 'Punjab Grains Co.', supplierMobile: '+91 9812345678', expiryDate: '2027-03-05' },
  { id: 'dummy-44', name: 'Salted Peanuts', currentStock: 8, unitType: 'Packet', purchasePrice: 85, minimumStock: 12, supplierId: 'sup-7', supplierName: 'City Packaging Depot', supplierMobile: '+91 9555444333', expiryDate: '2026-09-30' },
  { id: 'dummy-45', name: 'Cashew Nuts', currentStock: 10, unitType: 'Kg', purchasePrice: 850, minimumStock: 5, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-08-25' },
  { id: 'dummy-46', name: 'Almonds', currentStock: 12, unitType: 'Kg', purchasePrice: 900, minimumStock: 5, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-09-15' },
  { id: 'dummy-47', name: 'Raisins', currentStock: 6, unitType: 'Kg', purchasePrice: 400, minimumStock: 4, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-07-20' },
  { id: 'dummy-48', name: 'Baking Powder', currentStock: 4, unitType: 'Kg', purchasePrice: 180, minimumStock: 2, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2027-04-10' },
  { id: 'dummy-49', name: 'Yeast', currentStock: 1.2, unitType: 'Kg', purchasePrice: 350, minimumStock: 2, supplierId: 'sup-5', supplierName: 'Spice Route Exporters', supplierMobile: '+91 9777666555', expiryDate: '2026-08-15' },
  { id: 'dummy-50', name: 'Vanilla Essence', currentStock: 3, unitType: 'Liter', purchasePrice: 650, minimumStock: 1, supplierId: 'sup-6', supplierName: 'Beverage Solutions', supplierMobile: '+91 9666555444', expiryDate: '2027-12-01' }
];

export const RestaurantInventory: React.FC = () => {
  const auth = useAuth();
  const isAdmin = !!auth.user;

  // State management
  const [products, setProducts] = useState<any[]>(defaultDummyProducts);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting handler
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Section highlight states
  const [highlightLowStock, setHighlightLowStock] = useState(false);
  const [highlightOutOfStock, setHighlightOutOfStock] = useState(false);
  const [highlightExpiry, setHighlightExpiry] = useState(false);
  const [highlightTable, setHighlightTable] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);

  // Add/Edit Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    currentStock: '0',
    minimumStock: '10',
    purchasePrice: '0',
    unitType: 'Kg',
    supplierId: '',
    expiryDate: '',
    notes: '',
    newSupplierName: '',
    newSupplierMobile: '',
    isNewSupplier: false
  });

  // PO Form State
  const [selectedPOProduct, setSelectedPOProduct] = useState<any | null>(null);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    quantity: '50',
    notes: 'Urgent kitchen procurement order.',
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Helper to calculate days diff
  const getDaysDiff = (dateStr: string | null | undefined) => {
    if (!dateStr) return Infinity;
    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, supData, movements] = await Promise.all([
        auth.apiRequest('/restaurant/inventory/items'),
        auth.apiRequest('/restaurant/inventory/suppliers'),
        auth.apiRequest('/restaurant/inventory/movements')
      ]);

      const itemsList = Array.isArray(prodData) && prodData.length > 0 ? prodData : defaultDummyProducts;
      setProducts(itemsList);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setActivities(Array.isArray(movements) ? movements : []);
    } catch (error) {
      console.error('Error fetching restaurant inventory data:', error);
      setProducts(defaultDummyProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Smooth scroll and highlight section helper
  const handleScrollToSection = (sectionId: string) => {
    setHighlightLowStock(false);
    setHighlightOutOfStock(false);
    setHighlightExpiry(false);
    setHighlightTable(false);

    if (sectionId === 'low-stock-section') {
      setHighlightLowStock(true);
      setTimeout(() => setHighlightLowStock(false), 2000);
    } else if (sectionId === 'out-of-stock-section') {
      setHighlightOutOfStock(true);
      setTimeout(() => setHighlightOutOfStock(false), 2000);
    } else if (sectionId === 'expiry-tracking-section') {
      setHighlightExpiry(true);
      setTimeout(() => setHighlightExpiry(false), 2000);
    } else if (sectionId === 'main-inventory-table') {
      setHighlightTable(true);
      setTimeout(() => setHighlightTable(false), 2000);
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handlers for Add/Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalSupplierId = prodForm.supplierId;
      if (prodForm.isNewSupplier && prodForm.newSupplierName) {
        const newSup = await auth.apiRequest('/restaurant/inventory/suppliers', {
          method: 'POST',
          body: JSON.stringify({
            name: prodForm.newSupplierName,
            mobile: prodForm.newSupplierMobile || '9999999999'
          })
        });
        finalSupplierId = newSup.id;
      }

      const payload: any = {
        name: prodForm.name,
        categoryName: 'Kitchen', // Kitchen inventory category auto-saved as Kitchen
        unitType: prodForm.unitType,
        currentStock: parseFloat(prodForm.currentStock) || 0,
        minimumStock: parseFloat(prodForm.minimumStock) || 10,
        purchasePrice: parseFloat(prodForm.purchasePrice) || 0,
        sellingPrice: 0, // Kitchen ingredients have no selling price
        expiryDate: prodForm.expiryDate || null,
        storageLocation: 'Kitchen Store',
        notes: prodForm.notes || null,
        supplierId: finalSupplierId || null
      };

      if (editingProduct) {
        await auth.apiRequest(`/restaurant/inventory/items/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await auth.apiRequest('/restaurant/inventory/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowAddModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Error saving product');
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name,
      currentStock: String(product.currentStock || 0),
      minimumStock: String(product.minimumStock || 10),
      purchasePrice: String(product.purchasePrice || 0),
      unitType: product.unitType || 'Kg',
      supplierId: product.supplierId || '',
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
      notes: product.notes || '',
      newSupplierName: '',
      newSupplierMobile: '',
      isNewSupplier: false
    });
    setShowAddModal(true);
  };

  // Action: Write off stock (expiry action)
  const handleWriteOff = async (product: any) => {
    if (!window.confirm(`Write off entire stock for ${product.name}?`)) return;
    try {
      await auth.apiRequest(`/restaurant/inventory/items/${product.id}/movement`, {
        method: 'POST',
        body: JSON.stringify({ type: 'Expiry', quantity: product.currentStock, notes: 'Stock written off due to expiry.' })
      });
      fetchData();
    } catch (error: any) {
      alert('Failed to write off stock');
    }
  };

  // Action: Return to supplier
  const handleReturnSupplier = async (product: any) => {
    const qty = prompt(`Enter quantity to return to supplier (Max: ${product.currentStock}):`, String(product.currentStock));
    if (!qty || isNaN(Number(qty))) return;
    const parsedQty = parseFloat(qty);
    if (parsedQty <= 0 || parsedQty > product.currentStock) return;

    try {
      await auth.apiRequest(`/restaurant/inventory/items/${product.id}/movement`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'Waste',
          quantity: parsedQty,
          notes: `Returned ${parsedQty} units to supplier.`
        })
      });
      fetchData();
      alert('Return documented and stock adjusted.');
    } catch (error: any) {
      alert('Failed to return stock to supplier');
    }
  };

  // PO handlers
  const handleOpenPO = (product: any) => {
    setSelectedPOProduct(product);
    setPoForm({
      supplierId: product.supplierId || '',
      quantity: String(product.minimumStock * 2),
      notes: `Auto-procurement order for ${product.name} due to low stock alert.`,
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowPOModal(true);
  };

  const handleGeneratePO = async (type: 'whatsapp' | 'email' | 'print') => {
    if (!poForm.supplierId) {
      alert('Please select a supplier for this Purchase Order');
      return;
    }
    const supplier = suppliers.find(s => s.id === poForm.supplierId);
    if (!supplier) return;

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const totalCost = (parseFloat(poForm.quantity) || 0) * (selectedPOProduct?.purchasePrice || 0);

    try {
      await auth.apiRequest('/restaurant/inventory/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: poForm.supplierId,
          items: [{
            productId: selectedPOProduct.id,
            quantityOrdered: parseInt(poForm.quantity)
          }]
        })
      });
    } catch (err) {
      console.warn('Failed to save PO history, proceeding with direct output');
    }

    const messageText = `*PURCHASE ORDER*
Order Number: ${poNumber}
Date: ${new Date().toLocaleDateString()}
Expected Delivery: ${new Date(poForm.expectedDelivery).toLocaleDateString()}

*Supplier Details:*
Name: ${supplier.name}
Mobile: ${supplier.phone || 'N/A'}

*Items Ordered:*
- ${selectedPOProduct.name}: ${poForm.quantity} ${selectedPOProduct.unitType || 'Units'} @ ₹${selectedPOProduct.purchasePrice}/unit (Total: ₹${totalCost})

*Notes:*
${poForm.notes}

*Terms & Conditions:*
1. Items must be fresh and within shelf life.
2. Invoice copy must accompany deliveries.`;

    if (type === 'whatsapp') {
      const waPhone = supplier.whatsapp || supplier.phone || '';
      const cleanPhone = waPhone.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    } else if (type === 'email') {
      const mailto = `mailto:${supplier.email || ''}?subject=Purchase Order ${poNumber}&body=${encodeURIComponent(messageText)}`;
      window.open(mailto, '_blank');
    } else if (type === 'print') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase Order ${poNumber}</title>
              <style>
                body { font-family: 'Outfit', sans-serif; padding: 40px; color: #000; }
                .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f5f5f5; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>PURCHASE ORDER</h2>
                <p>Order Number: ${poNumber} | Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <h3>Supplier details:</h3>
              <p>Name: ${supplier.name}<br/>Mobile: ${supplier.phone}</p>
              
              <h3>Ordered Items:</h3>
              <table>
                <thead>
                  <tr><th>Item Name</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${selectedPOProduct.name}</td>
                    <td>${poForm.quantity} ${selectedPOProduct.unitType}</td>
                    <td>₹${selectedPOProduct.purchasePrice}</td>
                    <td>₹${totalCost}</td>
                  </tr>
                </tbody>
              </table>
              <p><strong>Notes:</strong> ${poForm.notes}</p>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    setShowPOModal(false);
    fetchData();
  };

  // Calculations
  const totalItems = products.length;
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= (p.minimumStock || 10)).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
  const expiringSoonCount = products.filter(p => {
    const diff = getDaysDiff(p.expiryDate);
    return diff >= 0 && diff <= 30;
  }).length;

  const totalInventoryUnits = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);

  // Quick Stats
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.purchasePrice || 0)), 0);
  const productsAddedThisWeek = 5;
  const productsExpiringThisMonth = expiringSoonCount;

  // Specific Expiry Tracker counts
  const expiry30Count = products.filter(p => {
    const diff = getDaysDiff(p.expiryDate);
    return diff >= 0 && diff <= 30;
  }).length;

  const expiry15Count = products.filter(p => {
    const diff = getDaysDiff(p.expiryDate);
    return diff >= 0 && diff <= 15;
  }).length;

  const expiry7Count = products.filter(p => {
    const diff = getDaysDiff(p.expiryDate);
    return diff >= 0 && diff <= 7;
  }).length;

  // Filter products list
  const filteredProducts = products.filter(p => {
    // Search filter
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

    // Status filter dropdown
    let matchesStatusDropdown = true;
    if (selectedStatusFilter === 'InStock') {
      matchesStatusDropdown = p.currentStock > (p.minimumStock || 10);
    } else if (selectedStatusFilter === 'LowStock') {
      matchesStatusDropdown = p.currentStock > 0 && p.currentStock <= (p.minimumStock || 10);
    } else if (selectedStatusFilter === 'OutOfStock') {
      matchesStatusDropdown = p.currentStock <= 0;
    }

    // Supplier filter
    const matchesSupplier = selectedSupplier === 'All' || p.supplierId === selectedSupplier || p.supplierName === selectedSupplier;

    // Expiry dropdown filter
    const diff = getDaysDiff(p.expiryDate);
    let matchesExpiryDropdown = true;
    if (selectedExpiryFilter === 'Expired') {
      matchesExpiryDropdown = diff < 0;
    } else if (selectedExpiryFilter === '7Days') {
      matchesExpiryDropdown = diff >= 0 && diff <= 7;
    } else if (selectedExpiryFilter === '15Days') {
      matchesExpiryDropdown = diff >= 0 && diff <= 15;
    } else if (selectedExpiryFilter === '30Days') {
      matchesExpiryDropdown = diff >= 0 && diff <= 30;
    }

    return matchesSearch && matchesStatusDropdown && matchesSupplier && matchesExpiryDropdown;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'expiryDate') {
      const diffA = getDaysDiff(a.expiryDate);
      const diffB = getDaysDiff(b.expiryDate);
      return sortOrder === 'asc' ? diffA - diffB : diffB - diffA;
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    }
  });

  // Paginated products
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Sections data lists
  const lowStockItems = products.filter(p => p.currentStock > 0 && p.currentStock <= (p.minimumStock || 10));
  const outOfStockItems = products.filter(p => p.currentStock <= 0);
  const expiringItems = products.filter(p => {
    const diff = getDaysDiff(p.expiryDate);
    return diff >= 0 && diff <= 30;
  });

  // Mock Activity Feed if DB log is empty
  const mockActivities = [
    { id: 'act-1', time: '10 mins ago', productName: 'Milk', type: 'Quantity Changed' },
    { id: 'act-2', time: '1 hour ago', productName: 'Fresh Paneer', type: 'Product Updated' },
    { id: 'act-3', time: '3 hours ago', productName: 'Cooking Oil', type: 'Quantity Changed' },
    { id: 'act-4', time: 'Yesterday', productName: 'Tomato', type: 'Supplier Assigned' },
    { id: 'act-5', time: '2 days ago', productName: 'Ginger', type: 'Product Added' }
  ];

  // Supplier cards list details
  const supplierOverviewList = [
    { name: 'Fresh Farm Traders', count: 12, date: '2026-06-23', status: 'Active' },
    { name: 'Punjab Grains Co.', count: 8, date: '2026-06-20', status: 'Active' },
    { name: 'Amul Dairy Dist.', count: 6, date: '2026-06-22', status: 'Active' },
    { name: 'Spice Route Exporters', count: 10, date: '2026-06-18', status: 'Active' }
  ];

  return (
    <div className="py-6 space-y-8 md:space-y-10 text-black min-h-screen w-full text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-wide">Inventory Management</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Monitor kitchen stock, expiry dates, supplier orders, and inventory health in real time.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdForm({
                  name: '',
                  currentStock: '0',
                  minimumStock: '10',
                  purchasePrice: '0',
                  unitType: 'Kg',
                  supplierId: '',
                  expiryDate: '',
                  notes: '',
                  newSupplierName: '',
                  newSupplierMobile: '',
                  isNewSupplier: false
                });
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (4 large colorful accent cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Products', count: totalItems, desc: 'All kitchen ingredients', target: 'main-inventory-table', border: 'border-blue-200 bg-blue-50/10', text: 'text-blue-600', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Low Stock', count: lowStockCount, desc: 'Items requiring reorder', target: 'low-stock-section', border: 'border-amber-200 bg-amber-50/10', text: 'text-amber-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Out Of Stock', count: outOfStockCount, desc: 'Urgent purchasing required', target: 'out-of-stock-section', border: 'border-red-200 bg-red-50/10', text: 'text-red-600', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
          { label: 'Expiring Soon', count: expiringSoonCount, desc: 'Expiring within 30 days', target: 'expiry-tracking-section', border: 'border-purple-200 bg-purple-50/10', text: 'text-purple-600', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' }
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (card.target === 'low-stock-section') {
                setSelectedStatusFilter('LowStock');
              } else if (card.target === 'out-of-stock-section') {
                setSelectedStatusFilter('OutOfStock');
              } else if (card.target === 'expiry-tracking-section') {
                setSelectedExpiryFilter('30Days');
              } else {
                setSelectedStatusFilter('All');
                setSelectedExpiryFilter('All');
              }
              handleScrollToSection(card.target);
            }}
            className="p-5 bg-white rounded-2xl border border-slate-100 text-left transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between h-32 cursor-pointer w-full"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-xs md:text-sm font-semibold text-black">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className={`text-2xl md:text-3xl font-bold block leading-none ${card.text}`}>{card.count}</span>
              <span className="text-xs text-slate-500 font-normal block mt-1">{card.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats Bar in One Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Inventory Value', value: `₹${totalInventoryValue.toLocaleString()}`, sub: 'Capital locked in kitchen stock', icon: <DollarSign className="w-5 h-5 text-emerald-600" /> },
          { label: 'Total Units Available', value: `${totalInventoryUnits} Units`, sub: 'Cumulative ingredients count', icon: <Package className="w-5 h-5 text-emerald-600" /> },
          { label: 'Added This Week', value: `${productsAddedThisWeek} Products`, sub: 'Newly added ingredients', icon: <Plus className="w-5 h-5 text-emerald-600" /> },
          { label: 'Expiring This Month', value: `${productsExpiringThisMonth} Items`, sub: 'Requires immediate usage', icon: <Calendar className="w-5 h-5 text-emerald-600" /> }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between items-center text-center h-28">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{stat.label}</span>
            <span className="text-lg md:text-xl font-bold text-black">{stat.value}</span>
            <span className="text-xs text-slate-400 font-semibold">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Expiry Alert Tracker (3 cards, styled like KPI with colorful icons/borders) */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-black uppercase tracking-wider mb-4">Expiry Alert Tracker</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Expiring in 7 Days', count: expiry7Count, days: 'Critical alert level', filter: '7Days', border: 'border-red-200 bg-red-50/10', countText: 'text-red-600', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
            { label: 'Expiring in 15 Days', count: expiry15Count, days: 'Near expiry window', filter: '15Days', border: 'border-amber-200 bg-amber-50/10', countText: 'text-amber-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
            { label: 'Expiring in 30 Days', count: expiry30Count, days: 'Needs attention', filter: '30Days', border: 'border-blue-200 bg-blue-50/10', countText: 'text-blue-600', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }
          ].map((card, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedExpiryFilter(card.filter);
                handleScrollToSection('expiry-tracking-section');
              }}
              className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full h-28"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <span className="text-xs md:text-sm font-semibold text-black block">{card.label}</span>
                  <span className="text-xs text-slate-500 font-normal block mt-0.5">{card.days}</span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="text-2xl md:text-3xl font-bold block leading-none text-black">{card.count}</span>
                <span className="text-xs uppercase tracking-widest font-semibold text-slate-500 block mt-1.5">Quick View</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-1 flex-wrap gap-3 items-center w-full">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Inventory..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-black focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-black focus:outline-none cursor-pointer"
          >
            <option value="All">All Stock Statuses</option>
            <option value="InStock">In Stock</option>
            <option value="LowStock">Low Stock</option>
            <option value="OutOfStock">Out of Stock</option>
          </select>

          {/* Supplier Dropdown */}
          <select
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-black focus:outline-none cursor-pointer"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Expiry Dropdown */}
          <select
            value={selectedExpiryFilter}
            onChange={(e) => {
              setSelectedExpiryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-black focus:outline-none cursor-pointer"
          >
            <option value="All">All Expiries</option>
            <option value="Expired">Expired Only</option>
            <option value="7Days">Expiring in 7 Days</option>
            <option value="15Days">Expiring in 15 Days</option>
            <option value="30Days">Expiring in 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Table Section */}
      <div 
        id="main-inventory-table"
        className={`bg-white rounded-3xl border shadow-sm overflow-hidden p-6 transition-all duration-500 ${highlightTable ? 'border-emerald-500 ring-4 ring-emerald-100 scale-[1.002]' : 'border-slate-100'}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg md:text-xl font-bold text-black uppercase tracking-wider">Product Catalog</h3>
          <span className="text-xs md:text-sm text-slate-500 font-semibold">{sortedProducts.length} items registered</span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs md:text-sm font-bold text-black uppercase tracking-wide sticky top-0 z-10 whitespace-nowrap">
                <th onClick={() => handleSort('name')} className="py-2.5 px-3 text-black cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap">
                  <div className="flex items-center gap-1">Product Name <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th onClick={() => handleSort('currentStock')} className="py-2.5 px-3 text-black cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">Quantity <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-black whitespace-nowrap text-center">Unit</th>
                <th onClick={() => handleSort('purchasePrice')} className="py-2.5 px-3 text-center text-black cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">Purchase Price <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-black whitespace-nowrap">Supplier</th>
                <th onClick={() => handleSort('expiryDate')} className="py-2.5 px-3 text-black cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1">Expiry Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center text-black whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 text-center text-black whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">Loading kitchen stock registry...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">No kitchen raw materials matched filters.</td>
                </tr>
              ) : (
                currentItems.map(p => {
                  const qty = p.currentStock !== undefined ? p.currentStock : 0;
                  const minAlert = p.minimumStock || 10;
                  const daysToExpiry = getDaysDiff(p.expiryDate);

                  // Status badges
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 whitespace-nowrap">In Stock</span>
                  );
                  if (qty <= 0) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 whitespace-nowrap">Out of Stock</span>
                    );
                  } else if (qty <= minAlert) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 whitespace-nowrap">Low Stock</span>
                    );
                  } else if (daysToExpiry >= 0 && daysToExpiry <= 30) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-50 text-yellow-800 whitespace-nowrap">Expiring Soon</span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition duration-150 h-12 text-xs md:text-sm">
                      <td className="py-2 px-3 font-medium text-black whitespace-nowrap" title={p.name}>{p.name}</td>
                      <td className="py-2 px-3 font-semibold text-black text-center">{qty}</td>
                      <td className="py-2 px-3 text-slate-500 font-semibold text-center">{p.unitType || 'Kg'}</td>
                      <td className="py-2 px-3 text-center text-black font-bold whitespace-nowrap">₹{p.purchasePrice || 0}</td>
                      <td className="py-2 px-3 font-semibold text-black whitespace-nowrap" title={p.supplierName}>{p.supplierName || 'N/A'}</td>
                      <td className="py-2 px-3 text-black font-normal whitespace-nowrap text-center">
                        {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">{statusBadge}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {qty <= 0 ? (
                            <button
                              onClick={() => handleOpenPO(p)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Reorder
                            </button>
                          ) : qty <= minAlert ? (
                            <button
                              onClick={() => handleOpenPO(p)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Order
                            </button>
                          ) : p.expiryDate && new Date(p.expiryDate) < new Date() ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleWriteOff(p)}
                                className="px-1.5 py-0.5 bg-red-600 text-white hover:bg-red-700 rounded text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Write Off
                              </button>
                              <button
                                onClick={() => handleReturnSupplier(p)}
                                className="px-1.5 py-0.5 bg-slate-600 text-white hover:bg-slate-700 rounded text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Return
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {isAdmin && (
                                <button
                                  onClick={() => handleEditClick(p)}
                                  className="p-1 bg-slate-50 hover:bg-slate-100 text-black rounded border border-slate-200 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedProducts.length)} of {sortedProducts.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-black" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Section Fix - Compact Table Layout & Max Width container */}
      <div
        id="low-stock-section"
        className={`bg-white rounded-3xl border p-4 shadow-sm transition-all duration-500 w-full ${highlightLowStock ? 'border-amber-500 ring-4 ring-amber-100 scale-[1.002]' : 'border-slate-100'}`}
      >
        <div className="flex items-center gap-2 mb-3 border-b pb-2">
          <h3 className="text-sm md:text-base font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
            Low Stock Products
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 shrink-0">
              {lowStockItems.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left border-collapse table-layout-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-black text-xs md:text-sm uppercase tracking-wide">
                <th className="py-2 px-2.5 w-[30%]">Product Name</th>
                <th className="py-2 px-2.5 w-[20%]">Quantity</th>
                <th className="py-2 px-2.5 w-[35%]">Supplier</th>
                <th className="py-2 px-2.5 w-[15%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-[11px] text-slate-400 italic">All product quantities are in healthy stock levels.</td>
                </tr>
              ) : (
                lowStockItems.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition duration-150 h-10">
                    <td className="py-1.5 px-2.5 font-medium text-black">{p.name}</td>
                    <td className="py-1.5 px-2.5 font-semibold text-amber-600">{p.currentStock} / {p.minimumStock} {p.unitType}</td>
                    <td className="py-1.5 px-2.5 text-slate-600">{p.supplierName || 'N/A'}</td>
                    <td className="py-1.5 px-2.5 text-center">
                      <button
                        onClick={() => handleOpenPO(p)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Out Of Stock Section Fix - Compact Table Layout & Max Width container */}
      <div
        id="out-of-stock-section"
        className={`bg-white rounded-3xl border p-4 shadow-sm transition-all duration-500 w-full ${highlightOutOfStock ? 'border-red-500 ring-4 ring-red-100 scale-[1.002]' : 'border-slate-100'}`}
      >
        <div className="flex items-center gap-2 mb-3 border-b pb-2">
          <h3 className="text-sm md:text-base font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
            Out Of Stock Products
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 shrink-0">
              {outOfStockItems.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left border-collapse table-layout-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-black text-xs md:text-sm uppercase tracking-wide">
                <th className="py-2 px-2.5 w-[30%]">Product Name</th>
                <th className="py-2 px-2.5 w-[35%]">Supplier</th>
                <th className="py-2 px-2.5 w-[20%]">Last Purchase Date</th>
                <th className="py-2 px-2.5 w-[15%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outOfStockItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-xs text-slate-400 italic">No items are currently out of stock.</td>
                </tr>
              ) : (
                outOfStockItems.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition duration-150 h-10">
                    <td className="py-1.5 px-2.5 font-medium text-black">{p.name}</td>
                    <td className="py-1.5 px-2.5 text-slate-600">{p.supplierName || 'N/A'}</td>
                    <td className="py-1.5 px-2.5 text-slate-500">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-1.5 px-2.5 text-center">
                      <button
                        onClick={() => handleOpenPO(p)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase transition cursor-pointer"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiry Tracking Section */}
      <div
        id="expiry-tracking-section"
        className={`bg-white rounded-3xl border p-4 shadow-sm transition-all duration-500 ${highlightExpiry ? 'border-yellow-500 ring-4 ring-yellow-100 scale-[1.002]' : 'border-slate-100'}`}
      >
        <h3 className="text-sm md:text-base font-bold text-black uppercase tracking-wider mb-3 border-b pb-2">Expiry Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expiringItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic col-span-2">No products expiring in the next 30 days.</p>
          ) : (
            expiringItems.map(p => {
              const diff = getDaysDiff(p.expiryDate);
              const daysText = diff < 0 ? 'Expired' : `${diff} days remaining`;

              return (
                <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <strong className="text-xs md:text-sm font-semibold text-black block">{p.name}</strong>
                    <span className="text-[11px] md:text-xs text-slate-500 font-semibold block mt-0.5">
                      Expiry Date: <span className="font-bold text-black">{p.expiryDate ? p.expiryDate.split('T')[0] : 'N/A'}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] md:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${diff < 0 ? 'bg-red-50 text-red-700' : diff <= 7 ? 'bg-rose-50 text-rose-700' : 'bg-yellow-50 text-yellow-800'}`}>
                      {daysText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Activities and Supplier Overview Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent Inventory Activity */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3 border-b pb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm md:text-base font-bold text-black uppercase tracking-wider">Inventory Activity</h3>
          </div>
          <div className="space-y-3">
            {(activities.length > 0 ? activities.slice(0, 5) : mockActivities).map((act: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs md:text-sm">
                <div>
                  <strong className="text-black font-normal block">{act.item?.name || act.productName}</strong>
                  <span className="text-[10px] md:text-xs text-slate-400 font-semibold block mt-0.5">{act.createdAt ? new Date(act.createdAt).toLocaleTimeString() : act.time}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-50 rounded font-bold text-[10px] md:text-xs text-black">
                  {act.type || 'Adjustment'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Overview */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3 border-b pb-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm md:text-base font-bold text-black uppercase tracking-wider">Suppliers</h3>
          </div>
          <div className="space-y-3">
            {(suppliers.length > 0 ? suppliers.slice(0, 4) : supplierOverviewList).map((sup: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs md:text-sm">
                <div>
                  <strong className="text-black font-semibold block">{sup.name}</strong>
                  <span className="text-[10px] md:text-xs text-slate-500 font-semibold block mt-0.5">
                    Products: {sup.count || sup.items?.length || 0} supplied | Last Order: {sup.lastPurchaseDate ? new Date(sup.lastPurchaseDate).toLocaleDateString() : (sup.date || 'N/A')}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold text-[10px] md:text-xs">
                  {sup.status || 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-black hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="font-normal text-black text-lg uppercase tracking-wider mb-4 border-b pb-2">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-normal text-black">

                <div>
                  <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomato, Potato"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 100"
                      value={prodForm.currentStock}
                      onChange={(e) => setProdForm({ ...prodForm, currentStock: String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Unit *</label>
                    <select
                      value={prodForm.unitType}
                      onChange={(e) => setProdForm({ ...prodForm, unitType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-black focus:outline-none cursor-pointer focus:border-emerald-600"
                    >
                      <option value="Kg">Kg</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="ml">ml</option>
                      <option value="Piece">Piece</option>
                      <option value="Packet">Packet</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Minimum Stock Level *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 20"
                      value={prodForm.minimumStock}
                      onChange={(e) => setProdForm({ ...prodForm, minimumStock: String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Purchase Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 25"
                      value={prodForm.purchasePrice}
                      onChange={(e) => setProdForm({ ...prodForm, purchasePrice: String(Math.max(0, parseFloat(e.target.value) || 0)) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Supplier *</label>
                  <select
                    required
                    value={prodForm.isNewSupplier ? 'NEW_SUPPLIER' : prodForm.supplierId}
                    onChange={(e) => {
                      if (e.target.value === 'NEW_SUPPLIER') {
                        setProdForm({ ...prodForm, isNewSupplier: true, supplierId: '' });
                      } else {
                        setProdForm({ ...prodForm, isNewSupplier: false, supplierId: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-black focus:outline-none cursor-pointer focus:border-emerald-600"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="NEW_SUPPLIER">Add New Supplier Inline...</option>
                  </select>
                </div>

                {prodForm.isNewSupplier && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        placeholder="Supplier Name"
                        value={prodForm.newSupplierName}
                        onChange={(e) => setProdForm({ ...prodForm, newSupplierName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Mobile / WhatsApp *</label>
                      <input
                        type="text"
                        placeholder="Phone"
                        value={prodForm.newSupplierMobile}
                        onChange={(e) => setProdForm({ ...prodForm, newSupplierMobile: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={prodForm.expiryDate}
                      onChange={(e) => setProdForm({ ...prodForm, expiryDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-black focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-normal text-black uppercase tracking-widest block mb-1">Notes</label>
                  <textarea
                    placeholder="Additional storage notes..."
                    value={prodForm.notes}
                    onChange={(e) => setProdForm({ ...prodForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-black focus:outline-none h-16 resize-none focus:border-emerald-600"
                  />
                </div>

              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 shrink-0 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all duration-200"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-transparent border border-slate-350 text-black font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Purchase Order Modal */}
      {showPOModal && selectedPOProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 relative my-auto max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowPOModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-normal text-black text-lg uppercase tracking-wider mb-2 border-b pb-2 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Generate Purchase Order
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mb-4">Prefills ingredient details automatically to streamline sourcing.</p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 text-xs">
              <div className="flex justify-between mb-1"><span className="text-slate-455 font-bold">Item Name:</span> <strong className="text-black">{selectedPOProduct.name}</strong></div>
              <div className="flex justify-between mb-1"><span className="text-slate-455 font-bold">Current Stock:</span> <strong className="text-black">{selectedPOProduct.currentStock} {selectedPOProduct.unitType}</strong></div>
              <div className="flex justify-between"><span className="text-slate-455 font-bold">Purchase Price:</span> <strong className="text-black">₹{selectedPOProduct.purchasePrice} / {selectedPOProduct.unitType}</strong></div>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700 overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Select Supplier *</label>
                <select
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">Choose partner...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Order Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: String(Math.max(0, parseInt(e.target.value, 10) || 0)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={poForm.expectedDelivery}
                    onChange={(e) => setPoForm({ ...poForm, expectedDelivery: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Procurement Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deliver Order Document:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleGeneratePO('whatsapp')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleGeneratePO('email')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    onClick={() => handleGeneratePO('print')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="w-full bg-slate-150 text-slate-700 hover:bg-slate-200 font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer text-center"
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
