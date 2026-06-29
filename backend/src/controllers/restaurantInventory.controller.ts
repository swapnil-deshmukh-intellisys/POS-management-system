import { Request, Response } from 'express';
import prisma from '../config/db';
import PDFDocument from 'pdfkit';

// Helper to determine status based on current stock, minimum stock, and expiry date
function getItemStatus(currentStock: number, minimumStock: number, expiryDate: Date | null): string {
  if (currentStock <= 0) return 'Out Of Stock';
  
  if (expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays <= 3) return 'Expired'; // Expired or Expiring in 3 Days
    if (diffDays <= 7) return 'Expiring Soon'; // Expiring in 7 Days
  }
  
  if (currentStock <= minimumStock) return 'Low Stock';
  
  return 'Normal';
}

// Helper to seed initial dummy data if inventory is empty
async function seedInitialInventoryIfNeeded() {
  // Seeding disabled to keep inventory manually managed by admin
  return;
}

// 1. DASHBOARD METRICS
export const getInventoryDashboard = async (req: Request, res: Response) => {
  try {
    await seedInitialInventoryIfNeeded();

    const totalItems = await prisma.restaurantInventoryItem.count();
    const lowStock = await prisma.restaurantInventoryItem.count({ where: { status: 'Low Stock' } });
    const outOfStock = await prisma.restaurantInventoryItem.count({ where: { status: 'Out Of Stock' } });
    const expired = await prisma.restaurantInventoryItem.count({ where: { status: 'Expired' } });
    const expiringSoon = await prisma.restaurantInventoryItem.count({ where: { status: 'Expiring Soon' } });
    const deadStock = await prisma.restaurantInventoryItem.count({ where: { status: 'Dead Stock' } });
    const purchaseRequired = await prisma.restaurantInventoryItem.count({
      where: {
        status: { in: ['Low Stock', 'Out Of Stock', 'Expired', 'Expiring Soon'] }
      }
    });

    return res.status(200).json({
      totalItems,
      lowStock,
      outOfStock,
      expiringSoon,
      expired,
      deadStock,
      purchaseRequired
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. INVENTORY ITEMS (CRUD)
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    await seedInitialInventoryIfNeeded();
    const { categoryId, status, location } = req.query;

    const filter: any = {};
    if (categoryId) filter.categoryId = String(categoryId);
    if (status) filter.status = String(status);
    if (location) filter.storageLocation = String(location);

    const items = await prisma.restaurantInventoryItem.findMany({
      where: filter,
      include: {
        category: true,
        supplier: true,
        batches: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove purchasePrice and sellingPrice from items if not required
    const sanitizedItems = items.map(item => {
      const { purchasePrice, sellingPrice, ...rest } = item;
      return rest;
    });

    return res.status(200).json(sanitizedItems);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// Add Product API
export const createInventoryItem = async (req: Request, res: Response) => {
  const {
    name,
    categoryName,
    unitType,
    currentStock,
    minimumStock,
    supplierName,
    supplierMobile,
    supplierId,
    expiryDate,
    storageLocation,
    batchNumber,
    notes
  } = req.body;

  try {
    const cStock = Number(currentStock) || 0;
    const mStock = Number(minimumStock) || 0;
    const expDate = expiryDate ? new Date(expiryDate) : null;
    const itemStatus = getItemStatus(cStock, mStock, expDate);

    // Resolve Category
    let category = null;
    const catName = categoryName || 'General';
    category = await prisma.restaurantInventoryCategory.findFirst({
      where: { name: { equals: catName, mode: 'insensitive' } }
    });
    if (!category) {
      category = await prisma.restaurantInventoryCategory.create({
        data: { name: catName }
      });
    }

    // Resolve Supplier
    let supplier = null;
    if (supplierName) {
      supplier = await prisma.restaurantInventorySupplier.findFirst({
        where: { name: { equals: supplierName, mode: 'insensitive' } }
      });
      if (!supplier) {
        supplier = await prisma.restaurantInventorySupplier.create({
          data: {
            name: supplierName,
            phone: supplierMobile || null,
            whatsapp: supplierMobile || null,
            productsSupplied: name,
            lastPurchaseDate: new Date()
          }
        });
      } else {
        const updateData: any = {};
        if (supplierMobile) {
          updateData.phone = supplierMobile;
          updateData.whatsapp = supplierMobile;
        }
        updateData.lastPurchaseDate = new Date();
        supplier = await prisma.restaurantInventorySupplier.update({
          where: { id: supplier.id },
          data: updateData
        });
      }
    }

    const resolvedSupplierId = supplierId || (supplier ? supplier.id : null);

    // Check if item already exists by name
    let item = await prisma.restaurantInventoryItem.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (item) {
      const newStock = item.currentStock + cStock;
      const resolvedStatus = getItemStatus(newStock, item.minimumStock, expDate || item.expiryDate);
      item = await prisma.restaurantInventoryItem.update({
        where: { id: item.id },
        data: {
          currentStock: newStock,
          purchasePrice: 0,
          supplierId: resolvedSupplierId || item.supplierId,
          expiryDate: expDate || item.expiryDate,
          batchNumber: batchNumber || item.batchNumber,
          status: resolvedStatus
        }
      });
    } else {
      item = await prisma.restaurantInventoryItem.create({
        data: {
          name,
          categoryId: category.id,
          unitType,
          minimumStock: mStock,
          currentStock: cStock,
          purchasePrice: 0,
          sellingPrice: null,
          supplierId: resolvedSupplierId,
          expiryDate: expDate,
          storageLocation: storageLocation || 'Kitchen Store',
          batchNumber: batchNumber || null,
          status: itemStatus
        }
      });
    }

    // Create Initial Movement
    await prisma.restaurantInventoryMovement.create({
      data: {
        itemId: item.id,
        type: 'Purchase',
        quantity: cStock,
        notes: notes || 'Initial product setup'
      }
    });

    // Create Batch
    if (batchNumber) {
      await prisma.restaurantInventoryBatch.create({
        data: {
          itemId: item.id,
          batchNumber,
          quantity: cStock,
          expiryDate: expDate
        }
      });
    }

    const { purchasePrice: pPrice, sellingPrice: sPrice, ...sanitizedItem } = item;
    return res.status(201).json(sanitizedItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, categoryId, unitType, minimumStock, supplierId, expiryDate, storageLocation, status, batchNumber } = req.body;
  try {
    const existing = await prisma.restaurantInventoryItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    const expDate = expiryDate ? new Date(expiryDate) : null;
    const mStock = minimumStock !== undefined ? Number(minimumStock) : existing.minimumStock;
    const resolvedStatus = status || getItemStatus(existing.currentStock, mStock, expDate);

    const item = await prisma.restaurantInventoryItem.update({
      where: { id },
      data: {
        name: name || undefined,
        categoryId: categoryId || undefined,
        unitType: unitType || undefined,
        minimumStock: mStock,
        purchasePrice: 0,
        sellingPrice: null,
        supplierId: supplierId || null,
        expiryDate: expDate,
        storageLocation: storageLocation || null,
        batchNumber: batchNumber || null,
        status: resolvedStatus
      }
    });

    const { purchasePrice: pPrice, sellingPrice: sPrice, ...sanitizedItem } = item;
    return res.status(200).json(sanitizedItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// Stock Adjustment / Stock In / Stock Out / Purchase Entry
export const adjustInventoryStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, quantity, notes, batchNumber, expiryDate } = req.body; // type: Purchase, Usage, Waste, Adjustment, Expiry
  try {
    const existing = await prisma.restaurantInventoryItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    const qty = Number(quantity);
    let newStock = existing.currentStock;

    if (type === 'Purchase' || type === 'Adjustment') {
      newStock += qty;
    } else {
      newStock = Math.max(0, newStock - qty);
    }

    const resolvedStatus = getItemStatus(newStock, existing.minimumStock, expiryDate ? new Date(expiryDate) : existing.expiryDate);

    const updatedItem = await prisma.restaurantInventoryItem.update({
      where: { id },
      data: {
        currentStock: newStock,
        status: resolvedStatus,
        lastUsedAt: (type === 'Usage' || type === 'Waste') ? new Date() : existing.lastUsedAt,
        expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
        batchNumber: batchNumber || existing.batchNumber
      }
    });

    // Log movement
    await prisma.restaurantInventoryMovement.create({
      data: {
        itemId: id,
        type,
        quantity: qty,
        notes: notes || `Stock Adjusted (${type})`
      }
    });

    // Update Supplier Last Purchase
    if (type === 'Purchase' && existing.supplierId) {
      await prisma.restaurantInventorySupplier.update({
        where: { id: existing.supplierId },
        data: { lastPurchaseDate: new Date() }
      });
    }

    // Create Batch if Purchase
    if (type === 'Purchase' && batchNumber) {
      await prisma.restaurantInventoryBatch.create({
        data: {
          itemId: id,
          batchNumber,
          quantity: qty,
          expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate
        }
      });
    }

    // Create Consumption record if Usage
    if (type === 'Usage') {
      await prisma.restaurantInventoryConsumption.create({
        data: {
          itemId: id,
          quantity: qty,
          notes: notes || 'Manual Consumption'
        }
      });
    }

    // Generate Purchase Request if Low / Out of stock
    if (resolvedStatus === 'Low Stock' || resolvedStatus === 'Out Of Stock') {
      const existingReq = await prisma.restaurantPurchaseRequest.findFirst({
        where: { itemId: id, status: 'Pending' }
      });
      if (!existingReq) {
        await prisma.restaurantPurchaseRequest.create({
          data: {
            itemId: id,
            itemName: existing.name,
            quantityRequired: existing.minimumStock * 2,
            reason: resolvedStatus
          }
        });
      }
    }

    return res.status(200).json(updatedItem);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. CATEGORIES & SUPPLIERS
export const getInventoryCategories = async (req: Request, res: Response) => {
  try {
    const cats = await prisma.restaurantInventoryCategory.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json(cats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createInventoryCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const cat = await prisma.restaurantInventoryCategory.create({ data: { name } });
    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getInventorySuppliers = async (req: Request, res: Response) => {
  try {
    const sups = await prisma.restaurantInventorySupplier.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(sups);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createInventorySupplier = async (req: Request, res: Response) => {
  const { name, phone, whatsapp, email, address, productsSupplied, notes } = req.body;
  try {
    const sup = await prisma.restaurantInventorySupplier.create({
      data: {
        name,
        phone,
        whatsapp,
        email,
        address,
        productsSupplied,
        notes,
        lastPurchaseDate: new Date()
      }
    });
    return res.status(201).json(sup);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


// 4. REPORTS & ALERTS
export const getExpiryAlerts = async (req: Request, res: Response) => {
  try {
    const items = await prisma.restaurantInventoryItem.findMany({
      where: {
        expiryDate: { not: null },
        status: { in: ['Expired', 'Expiring Soon'] }
      },
      include: { category: true }
    });
    return res.status(200).json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getDeadStockReport = async (req: Request, res: Response) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days without usage is dead stock

    const deadItems = await prisma.restaurantInventoryItem.findMany({
      where: {
        lastUsedAt: { lt: cutoff },
        currentStock: { gt: 0 }
      },
      include: { category: true }
    });

    const report = deadItems.map(item => {
      const diffTime = Math.abs(new Date().getTime() - item.lastUsedAt.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...item,
        daysWithoutUsage: days
      };
    });

    return res.status(200).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPurchaseRequirements = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.restaurantPurchaseRequest.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(requests);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createPurchaseRequest = async (req: Request, res: Response) => {
  const { itemId, itemName, quantityRequired, reason } = req.body;
  try {
    const reqst = await prisma.restaurantPurchaseRequest.create({
      data: {
        itemId,
        itemName,
        quantityRequired: Number(quantityRequired),
        reason,
        status: 'Pending'
      }
    });
    return res.status(201).json(reqst);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const resolvePurchaseRequest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // status: Ordered, Completed
  try {
    const reqst = await prisma.restaurantPurchaseRequest.update({
      where: { id },
      data: { status }
    });
    return res.status(200).json(reqst);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getInventoryMovements = async (req: Request, res: Response) => {
  try {
    const movements = await prisma.restaurantInventoryMovement.findMany({
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.status(200).json(movements);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// Consumption Reports
export const getConsumptionReports = async (req: Request, res: Response) => {
  try {
    const allItems = await prisma.restaurantInventoryItem.findMany({
      include: { supplier: true }
    });

    const usageMovements = await prisma.restaurantInventoryMovement.findMany({
      where: { type: 'Usage' },
      include: { item: true },
      orderBy: { createdAt: 'desc' }
    });

    const wasteMovements = await prisma.restaurantInventoryMovement.findMany({
      where: { type: 'Waste' },
      include: { item: true },
      orderBy: { createdAt: 'desc' }
    });

    const purchaseMovements = await prisma.restaurantInventoryMovement.findMany({
      where: { type: 'Purchase' },
      include: { item: true },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    const isToday = (d: Date) => d.toDateString() === now.toDateString();
    const isThisWeek = (d: Date) => {
      const diff = now.getTime() - d.getTime();
      return diff <= (7 * 24 * 60 * 60 * 1000);
    };
    const isThisMonth = (d: Date) => {
      const diff = now.getTime() - d.getTime();
      return diff <= (30 * 24 * 60 * 60 * 1000);
    };

    // Consumption summaries
    const dailyConsumption = usageMovements.filter(m => isToday(m.createdAt));
    const weeklyConsumption = usageMovements.filter(m => isThisWeek(m.createdAt));
    const monthlyConsumption = usageMovements.filter(m => isThisMonth(m.createdAt));

    const dailyWaste = wasteMovements.filter(m => isToday(m.createdAt));
    const weeklyWaste = wasteMovements.filter(m => isThisWeek(m.createdAt));
    const monthlyWaste = wasteMovements.filter(m => isThisMonth(m.createdAt));

    const dailyPurchase = purchaseMovements.filter(m => isToday(m.createdAt));
    const weeklyPurchase = purchaseMovements.filter(m => isThisWeek(m.createdAt));
    const monthlyPurchase = purchaseMovements.filter(m => isThisMonth(m.createdAt));

    // Expiry alerts calculation
    const expiredCount = await prisma.restaurantInventoryItem.count({ where: { status: 'Expired' } });
    const expiringSoonCount = await prisma.restaurantInventoryItem.count({ where: { status: 'Expiring Soon' } });
    const lowStockCount = await prisma.restaurantInventoryItem.count({ where: { status: 'Low Stock' } });
    const outOfStockCount = await prisma.restaurantInventoryItem.count({ where: { status: 'Out Of Stock' } });
    const deadStockCount = await prisma.restaurantInventoryItem.count({ where: { status: 'Dead Stock' } });

    // Top Consumed Ingredients (by quantity)
    const consumedMap: Record<string, { name: string; qty: number; unit: string; cost: number }> = {};
    usageMovements.forEach(m => {
      if (!consumedMap[m.itemId]) {
        consumedMap[m.itemId] = { name: m.item.name, qty: 0, unit: m.item.unitType, cost: 0 };
      }
      consumedMap[m.itemId].qty += m.quantity;
      consumedMap[m.itemId].cost += m.quantity * m.item.purchasePrice;
    });
    const topConsumedIngredients = Object.values(consumedMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Most Expensive Ingredients
    const mostExpensiveIngredients = allItems
      .map(i => ({ name: i.name, price: i.purchasePrice, unit: i.unitType }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 10);

    // Monthly Purchase Cost
    const monthlyPurchaseCost = monthlyPurchase.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0);

    // Damaged Stock Tracking
    const damagedStockMovements = wasteMovements.filter(m => 
      m.notes?.toLowerCase().includes('damage') || m.notes?.toLowerCase().includes('broken') || m.notes?.toLowerCase().includes('spill')
    ).map(m => ({
      id: m.id,
      itemName: m.item.name,
      quantity: m.quantity,
      unit: m.item.unitType,
      cost: m.quantity * m.item.purchasePrice,
      notes: m.notes,
      date: m.createdAt
    }));

    // Supplier Performance (based on order counts & last purchase amount)
    const suppliersList = await prisma.restaurantInventorySupplier.findMany({
      include: { items: true }
    });
    const supplierPerformance = suppliersList.map(sup => {
      // Find all purchase movements for items supplied by this supplier
      const itemIds = sup.items.map(i => i.id);
      const supPurchases = purchaseMovements.filter(m => itemIds.includes(m.itemId));
      const totalSpend = supPurchases.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0);

      return {
        id: sup.id,
        name: sup.name,
        mobile: sup.phone,
        whatsapp: sup.whatsapp,
        productsCount: sup.items.length,
        totalPurchasesCount: supPurchases.length,
        totalSpend,
        lastPurchaseDate: sup.lastPurchaseDate,
        lastPurchaseAmount: sup.lastPurchaseAmount || (supPurchases[0] ? (supPurchases[0].quantity * supPurchases[0].item.purchasePrice) : 0)
      };
    });

    // Item Analytics (Average usage and estimated days remaining)
    const itemAnalytics = allItems.map(item => {
      const itemUsage = usageMovements.filter(m => m.itemId === item.id);
      const totalUsedInMonth = itemUsage
        .filter(m => isThisMonth(m.createdAt))
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const averageDailyUsage = parseFloat((totalUsedInMonth / 30).toFixed(2));
      let estimatedDaysRemaining = 999;
      if (averageDailyUsage > 0) {
        estimatedDaysRemaining = Math.max(0, Math.round(item.currentStock / averageDailyUsage));
      }

      return {
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        unitType: item.unitType,
        averageDailyUsage,
        estimatedDaysRemaining
      };
    });

    return res.status(200).json({
      dailyConsumption: {
        qty: dailyConsumption.reduce((sum, m) => sum + m.quantity, 0),
        cost: dailyConsumption.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      weeklyConsumption: {
        qty: weeklyConsumption.reduce((sum, m) => sum + m.quantity, 0),
        cost: weeklyConsumption.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      monthlyConsumption: {
        qty: monthlyConsumption.reduce((sum, m) => sum + m.quantity, 0),
        cost: monthlyConsumption.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      dailyWaste: {
        qty: dailyWaste.reduce((sum, m) => sum + m.quantity, 0),
        cost: dailyWaste.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      weeklyWaste: {
        qty: weeklyWaste.reduce((sum, m) => sum + m.quantity, 0),
        cost: weeklyWaste.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      monthlyWaste: {
        qty: monthlyWaste.reduce((sum, m) => sum + m.quantity, 0),
        cost: monthlyWaste.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      dailyPurchase: {
        qty: dailyPurchase.reduce((sum, m) => sum + m.quantity, 0),
        cost: dailyPurchase.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      weeklyPurchase: {
        qty: weeklyPurchase.reduce((sum, m) => sum + m.quantity, 0),
        cost: weeklyPurchase.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      monthlyPurchase: {
        qty: monthlyPurchase.reduce((sum, m) => sum + m.quantity, 0),
        cost: monthlyPurchase.reduce((sum, m) => sum + (m.quantity * m.item.purchasePrice), 0)
      },
      alertsSummary: {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        expired: expiredCount,
        expiringSoon: expiringSoonCount,
        deadStock: deadStockCount
      },
      topConsumedIngredients,
      mostExpensiveIngredients,
      monthlyPurchaseCost,
      damagedStockMovements,
      supplierPerformance,
      itemAnalytics
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// --- PURCHASE ORDER CONTROL FLOWS ---

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const pos = await prisma.restaurantPurchaseOrder.findMany({
      include: {
        items: { include: { product: true } },
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(pos);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  const { supplierId, items } = req.body; // items: [{ productId, quantityOrdered }]
  try {
    const count = await prisma.restaurantPurchaseOrder.count();
    const poNum = `PO-2026-${String(count + 1).padStart(3, '0')}`;

    const po = await prisma.restaurantPurchaseOrder.create({
      data: {
        poNumber: poNum,
        supplierId,
        status: 'Pending',
        items: {
          create: items.map((it: any) => ({
            productId: it.productId,
            quantityOrdered: Number(it.quantityOrdered)
          }))
        }
      },
      include: {
        items: { include: { product: true } },
        supplier: true
      }
    });

    return res.status(201).json(po);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updatePOStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const po = await prisma.restaurantPurchaseOrder.update({
      where: { id },
      data: { status }
    });
    return res.status(200).json(po);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const downloadPOPdf = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const po = await prisma.restaurantPurchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: true
      }
    });

    if (!po) return res.status(404).json({ message: 'PO not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${po.poNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(10).font('Helvetica-Bold').text('RESTAURANT DETAILS:');
    doc.font('Helvetica').text('Gourmet Kitchen POS');
    doc.text('123 Culinary Boulevard, Suite 500');
    doc.text('GSTIN: 27AAAAA1111A1Z1');
    doc.moveDown();

    doc.font('Helvetica-Bold').text('SUPPLIER DETAILS:');
    doc.font('Helvetica').text(`Name: ${po.supplier.name}`);
    doc.text(`Mobile: ${po.supplier.phone || 'N/A'}`);
    doc.text(`Email: ${po.supplier.email || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text(`PO Number: ${po.poNumber}`);
    doc.text(`Date: ${po.createdAt.toLocaleDateString()}`);
    doc.text(`Status: ${po.status}`);
    doc.moveDown();

    // Table Header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item Name', 50, 320);
    doc.text('Qty Ordered', 350, 320, { width: 100, align: 'right' });
    
    doc.moveTo(50, 335).lineTo(550, 335).stroke();
    
    let y = 345;
    doc.fontSize(10).font('Helvetica');

    po.items.forEach(it => {
      doc.text(it.product.name, 50, y);
      doc.text(`${it.quantityOrdered} ${it.product.unitType}`, 350, y, { width: 100, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();

    doc.end();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const downloadPODocx = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const po = await prisma.restaurantPurchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: true
      }
    });

    if (!po) return res.status(404).json({ message: 'PO not found' });

    const itemRows = po.items.map(it => {
      return `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${it.product.name}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">${it.quantityOrdered} ${it.product.unitType}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Purchase Order ${po.poNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { text-align: right; color: #333; }
          .header-table { width: 100%; margin-bottom: 20px; }
          .item-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .item-table th { background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
          .total-box { text-align: right; margin-top: 20px; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>PURCHASE ORDER</h1>
        <p><strong>PO Number:</strong> ${po.poNumber}</p>
        <p><strong>Date:</strong> ${po.createdAt.toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${po.status}</p>
        
        <hr/>
        
        <h3>Restaurant Details:</h3>
        <p>Gourmet Kitchen POS<br/>123 Culinary Boulevard, Suite 500<br/>GSTIN: 27AAAAA1111A1Z1</p>
        
        <h3>Supplier Details:</h3>
        <p>Name: ${po.supplier.name}<br/>Mobile: ${po.supplier.phone || 'N/A'}<br/>Email: ${po.supplier.email || 'N/A'}</p>
        
        <table class="item-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="text-align:right;">Qty Ordered</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-word');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${po.poNumber}.doc`);
    return res.send(html);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const receivePODelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body; // items: [{ productId, quantityReceived, expiryDate, batchNumber }]
  try {
    const po = await prisma.restaurantPurchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });
    if (!po) return res.status(404).json({ message: 'PO not found' });

    let allDelivered = true;
    let totalReceivedCost = 0;

    for (const it of items) {
      const dbItem = po.items.find(pi => pi.productId === it.productId);
      if (!dbItem) continue;

      const qtyRec = Number(it.quantityReceived);
      const qtyOrd = dbItem.quantityOrdered;

      if (qtyRec < qtyOrd) {
        allDelivered = false;
      }

      // Update PO Item
      const expDate = it.expiryDate ? new Date(it.expiryDate) : null;
      await prisma.restaurantPurchaseOrderItem.update({
        where: { id: dbItem.id },
        data: {
          quantityReceived: qtyRec,
          expiryDate: expDate,
          batchNumber: it.batchNumber || null
        }
      });

      // Update Inventory Product Stock
      const itemStock = dbItem.product.currentStock + qtyRec;
      const resolvedStatus = getItemStatus(itemStock, dbItem.product.minimumStock, expDate || dbItem.product.expiryDate);

      await prisma.restaurantInventoryItem.update({
        where: { id: it.productId },
        data: {
          currentStock: itemStock,
          status: resolvedStatus,
          expiryDate: expDate || dbItem.product.expiryDate,
          batchNumber: it.batchNumber || dbItem.product.batchNumber
        }
      });

      // Create Batch
      if (it.batchNumber) {
        await prisma.restaurantInventoryBatch.create({
          data: {
            itemId: it.productId,
            batchNumber: it.batchNumber,
            quantity: qtyRec,
            expiryDate: expDate
          }
        });
      }

      // Log movement
      await prisma.restaurantInventoryMovement.create({
        data: {
          itemId: it.productId,
          type: 'Purchase',
          quantity: qtyRec,
          notes: `Received from PO: ${po.poNumber}`
        }
      });

      totalReceivedCost += qtyRec * dbItem.product.purchasePrice;
    }

    const nextStatus = allDelivered ? 'Delivered' : 'Partially Delivered';
    const updatedPO = await prisma.restaurantPurchaseOrder.update({
      where: { id },
      data: { status: nextStatus }
    });

    // Update Supplier last purchase info
    await prisma.restaurantInventorySupplier.update({
      where: { id: po.supplierId },
      data: {
        lastPurchaseDate: new Date(),
        lastPurchaseAmount: totalReceivedCost
      }
    });

    return res.status(200).json(updatedPO);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


