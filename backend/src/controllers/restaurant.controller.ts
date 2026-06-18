import { Request, Response } from 'express';
import prisma from '../config/db';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { addClient, removeClient, broadcast } from '../utils/realtime';

// Utility: Deduct ingredients from stock based on recipe
async function deductRecipeIngredients(menuItemId: string, quantity: number) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!recipe) return;

    for (const ri of recipe.ingredients) {
      const reduction = ri.quantity * quantity;
      await prisma.ingredient.update({
        where: { id: ri.ingredientId },
        data: {
          stock: {
            decrement: reduction
          }
        }
      });
      console.log(`[Inventory Auto] Deducted ${reduction} of ${ri.ingredient.name} from stock`);
    }
  } catch (err) {
    console.error('[Inventory Error] Failed to deduct ingredients:', err);
  }
}

// 1. DASHBOARD METRICS
export const getDashboardMetrics = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ message: 'restaurantId query parameter is required' });
  }

  try {
    const restId = String(restaurantId);

    // Sales Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.kitchenOrder.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' }
      }
    });
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Tables Count
    const totalTables = await prisma.restaurantTable.count({ where: { restaurantId: restId } });
    const occupiedTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'OCCUPIED' } });
    const reservedTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'RESERVED' } });
    const cleaningTables = await prisma.restaurantTable.count({ where: { restaurantId: restId, status: 'CLEANING' } });
    const availableTables = totalTables - occupiedTables - reservedTables - cleaningTables;

    // Kitchen orders count
    const pendingOrdersCount = await prisma.kitchenOrder.count({
      where: {
        status: { in: ['NEW', 'ACCEPTED', 'PREPARING'] }
      }
    });
    const readyOrdersCount = await prisma.kitchenOrder.count({
      where: {
        status: 'READY'
      }
    });

    // Reservations Today
    const todayStr = new Date().toISOString().split('T')[0];
    const reservationsToday = await prisma.restaurantReservation.count({
      where: {
        table: { restaurantId: restId },
        date: todayStr
      }
    });

    // Low stock ingredients
    const lowStock = (await prisma.ingredient.findMany()).filter(i => i.stock <= i.reorderLevel);

    // Top Selling Dishes
    const items = await prisma.kitchenOrderItem.findMany({
      include: { menuItem: true }
    });
    const counts: Record<string, { name: string, quantity: number, price: number }> = {};
    items.forEach(it => {
      const name = it.menuItem.name;
      if (!counts[name]) {
        counts[name] = { name, quantity: 0, price: it.unitPrice };
      }
      counts[name].quantity += it.quantity;
    });
    const topDishes = Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Pending Online Orders
    const pendingOnline = await prisma.restaurantOnlineOrder.count({
      where: { status: 'PENDING' }
    });

    // Popular categories
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: restId },
      include: {
        menuItems: {
          include: {
            orderItems: true
          }
        }
      }
    });
    const popularCategories = categories.map(cat => {
      const orderCount = cat.menuItems.reduce((sum, item) => sum + item.orderItems.length, 0);
      return {
        name: cat.name,
        orders: orderCount
      };
    }).sort((a, b) => b.orders - a.orders).slice(0, 5);

    return res.status(200).json({
      todaySales,
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        reserved: reservedTables,
        cleaning: cleaningTables,
        available: availableTables
      },
      kitchen: {
        pending: pendingOrdersCount,
        ready: readyOrdersCount
      },
      reservationsToday,
      topDishes,
      popularCategories,
      lowIngredientStock: lowStock.length,
      pendingOnlineOrders: pendingOnline
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch dashboard metrics', error: err.message });
  }
};

// 2. TABLE MANAGEMENT
export const getTables = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required' });

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: String(restaurantId) },
      include: { qrCode: true },
      orderBy: { tableNumber: 'asc' }
    });
    return res.status(200).json(tables);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createTable = async (req: Request, res: Response) => {
  const { restaurantId, tableNumber, capacity } = req.body;
  try {
    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId,
        tableNumber,
        capacity: Number(capacity) || 4,
        status: 'AVAILABLE'
      }
    });

    // Create QR Code entry
    await prisma.tableQRCode.create({
      data: {
        tableId: table.id,
        qrToken: `QR_${table.tableNumber.replace(/\s+/g, '_')}_${restaurantId.slice(0, 4)}`,
        qrCodeUrl: `/menu/${table.id}`
      }
    });

    return res.status(201).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateTableStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, activeOrderId } = req.body;
  try {
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { status, activeOrderId }
    });
    return res.status(200).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const transferTable = async (req: Request, res: Response) => {
  const { sourceTableId, targetTableId } = req.body;
  try {
    const sourceTable = await prisma.restaurantTable.findUnique({ where: { id: sourceTableId } });
    const targetTable = await prisma.restaurantTable.findUnique({ where: { id: targetTableId } });

    if (!sourceTable || !targetTable) {
      return res.status(404).json({ message: 'One or both tables not found' });
    }

    // Move order ID
    await prisma.restaurantTable.update({
      where: { id: targetTableId },
      data: {
        activeOrderId: sourceTable.activeOrderId,
        status: 'OCCUPIED'
      }
    });

    await prisma.restaurantTable.update({
      where: { id: sourceTableId },
      data: {
        activeOrderId: null,
        status: 'CLEANING'
      }
    });

    // Move associated kitchen orders table reference
    if (sourceTable.activeOrderId) {
      await prisma.kitchenOrder.updateMany({
        where: { id: sourceTable.activeOrderId },
        data: { tableId: targetTableId }
      });
    }

    return res.status(200).json({ message: 'Table transferred successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const mergeTables = async (req: Request, res: Response) => {
  const { sourceTableId, targetTableId } = req.body;
  try {
    const sourceTable = await prisma.restaurantTable.findUnique({ where: { id: sourceTableId } });
    if (!sourceTable) return res.status(404).json({ message: 'Source table not found' });

    // In a merge, we copy orders to the target table and clear the source table
    await prisma.restaurantTable.update({
      where: { id: targetTableId },
      data: { status: 'OCCUPIED' }
    });

    await prisma.restaurantTable.update({
      where: { id: sourceTableId },
      data: {
        status: 'AVAILABLE',
        activeOrderId: null
      }
    });

    // Update order items of source table's active order to belong to target active order, or re-link order
    if (sourceTable.activeOrderId) {
      await prisma.kitchenOrder.updateMany({
        where: { id: sourceTable.activeOrderId },
        data: { tableId: targetTableId }
      });
    }

    return res.status(200).json({ message: 'Tables merged successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const splitTableBill = async (req: Request, res: Response) => {
  const { tableId, splitsCount } = req.body;
  try {
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table || !table.activeOrderId) return res.status(404).json({ message: 'No active order for this table' });

    const order = await prisma.kitchenOrder.findUnique({
      where: { id: table.activeOrderId },
      include: { items: { include: { menuItem: true } } }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const splitAmount = order.totalAmount / Number(splitsCount);
    const splitDetails = Array.from({ length: Number(splitsCount) }).map((_, i) => ({
      splitIndex: i + 1,
      amount: parseFloat(splitAmount.toFixed(2)),
      status: 'PENDING'
    }));

    return res.status(200).json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      splitsCount,
      splits: splitDetails
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. MENU CATEGORIES & ITEMS
export const getCategories = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: String(restaurantId) },
      orderBy: { sortOrder: 'asc' }
    });
    return res.status(200).json(categories);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { restaurantId, name, description, status, sortOrder } = req.body;
  try {
    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name,
        description,
        status: status || 'Active',
        sortOrder: Number(sortOrder) || 1
      }
    });
    return res.status(201).json(category);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMenuItems = async (req: Request, res: Response) => {
  const { categoryId, restaurantId } = req.query;
  try {
    let whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = String(categoryId);
    } else if (restaurantId) {
      whereClause.category = { restaurantId: String(restaurantId) };
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      include: { category: true, recipe: true, addons: true },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  const { categoryId, name, description, price, image, isVeg, isChefSpecial, isRecommended, isOnOffer, offerPrice, addons } = req.body;
  try {
    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price: Number(price),
        image,
        isVeg: Boolean(isVeg),
        isChefSpecial: Boolean(isChefSpecial),
        isRecommended: Boolean(isRecommended),
        isOnOffer: Boolean(isOnOffer),
        offerPrice: offerPrice ? Number(offerPrice) : null,
        status: 'Active',
        addons: addons ? {
          create: addons.map((addon: any) => ({
            name: addon.name,
            price: Number(addon.price),
            category: addon.category || 'Add-ons',
            maxQty: Number(addon.maxQty) || 1,
            isOptional: addon.isOptional !== undefined ? Boolean(addon.isOptional) : true
          }))
        } : undefined
      },
      include: { addons: true }
    });
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryId, name, description, price, image, isVeg, isChefSpecial, isRecommended, isOnOffer, offerPrice, addons } = req.body;
  try {
    if (addons) {
      await prisma.menuItemAddOn.deleteMany({
        where: { menuItemId: id }
      });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price: Number(price),
        image,
        isVeg: Boolean(isVeg),
        isChefSpecial: Boolean(isChefSpecial),
        isRecommended: Boolean(isRecommended),
        isOnOffer: Boolean(isOnOffer),
        offerPrice: offerPrice ? Number(offerPrice) : null,
        addons: addons ? {
          create: addons.map((addon: any) => ({
            name: addon.name,
            price: Number(addon.price),
            category: addon.category || 'Add-ons',
            maxQty: Number(addon.maxQty) || 1,
            isOptional: addon.isOptional !== undefined ? Boolean(addon.isOptional) : true
          }))
        } : undefined
      },
      include: { addons: true }
    });
    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.menuItem.delete({
      where: { id }
    });
    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 4. PUBLIC QR MENU & ORDERING
export const getPublicMenuByQR = async (req: Request, res: Response) => {
  const { qrToken } = req.params;
  try {
    const qrEntry = await prisma.tableQRCode.findUnique({
      where: { qrToken },
      include: {
        table: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!qrEntry) {
      return res.status(404).json({ message: 'Invalid QR Code' });
    }

    // Fetch categories and items
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId: qrEntry.table.restaurantId },
      include: {
        menuItems: {
          where: { status: 'Active' },
          include: { addons: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return res.status(200).json({
      table: qrEntry.table,
      restaurant: qrEntry.table.restaurant,
      categories
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const placeQROrder = async (req: Request, res: Response) => {
  const { tableId, items, notes, paymentMethod, razorpayPaymentId, razorpayOrderId } = req.body;
  // items format: [{ menuItemId, quantity, notes, unitPrice }]

  try {
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ message: 'Table not found' });

    let total = 0;
    const orderItemsData = items.map((it: any) => {
      const subtotal = it.unitPrice * it.quantity;
      total += subtotal;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        notes: it.notes,
        unitPrice: it.unitPrice
      };
    });

    // Create kitchen order
    const order = await prisma.kitchenOrder.create({
      data: {
        tableId,
        source: 'QR',
        status: 'NEW',
        notes,
        totalAmount: total,
        paymentStatus: razorpayPaymentId ? 'PAID' : 'PENDING',
        paymentMethod: paymentMethod || 'CASH',
        razorpayOrderId,
        razorpayPaymentId,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    // Mark table occupied
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        activeOrderId: order.id
      }
    });

    // Deduct ingredients automatically upon order placement
    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    // Fetch full order with items and table details to broadcast to KDS
    const fullOrder = await prisma.kitchenOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    broadcast('NEW_ORDER', fullOrder);

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createPublicPaymentOrder = async (req: Request, res: Response) => {
  const { amount } = req.body;
  try {
    const totalAmount = parseFloat(String(amount));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    const isRzpConfigured = !!(rzpKeyId && rzpSecret && rzpKeyId !== 'your_key_id' && rzpSecret !== 'your_secret_key');

    if (isRzpConfigured) {
      const rzp = new Razorpay({
        key_id: rzpKeyId as string,
        key_secret: rzpSecret as string
      });
      const options = {
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        receipt: `receipt_qr_${Date.now()}`
      };
      const order = await rzp.orders.create(options);
      return res.status(201).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: rzpKeyId,
        mock: false
      });
    } else {
      // Mock Fallback
      return res.status(201).json({
        id: `order_mock_${Date.now()}`,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        key: 'rzp_test_mockKey12345',
        mock: true
      });
    }
  } catch (error: any) {
    console.error('Error creating public Razorpay Order:', error);
    return res.status(500).json({ message: 'Razorpay order creation failed', error: error.message });
  }
};

// 5. KITCHEN DISPLAY SYSTEM (KDS)
export const getKitchenOrders = async (req: Request, res: Response) => {
  const { restaurantId, includeServed } = req.query;
  try {
    const statusFilter = includeServed === 'true'
      ? undefined
      : { not: 'SERVED' };

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        OR: [
          { tableId: null }, // Delivery / Walkin
          {
            table: { restaurantId: String(restaurantId) }
          }
        ],
        status: statusFilter
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, estimatedPrepTime, waiterId, waiterStatus } = req.body; // NEW, ACCEPTED, PREPARING, READY, SERVING, SERVED, CANCELLED
  try {
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (estimatedPrepTime !== undefined) {
      updateData.estimatedPrepTime = Number(estimatedPrepTime);
    }
    if (waiterId !== undefined) {
      updateData.waiterId = waiterId;
    }
    if (waiterStatus !== undefined) {
      updateData.waiterStatus = waiterStatus;
    }
    
    const now = new Date();
    if (status === 'ACCEPTED') {
      updateData.acceptedAt = now;
    } else if (status === 'PREPARING') {
      updateData.preparingAt = now;
    } else if (status === 'READY') {
      updateData.readyAt = now;
    } else if (status === 'SERVING') {
      updateData.pickedUpAt = now;
      updateData.waiterStatus = 'SERVING';
    } else if (status === 'SERVED') {
      updateData.servedAt = now;
      updateData.waiterStatus = 'SERVED';
    }

    const order = await prisma.kitchenOrder.update({
      where: { id },
      data: updateData,
      include: { table: true }
    });

    // Create a waiter notification if status is READY
    if (status === 'READY') {
      const tableName = order.table?.tableNumber || 'Takeaway';
      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          type: 'ORDER_READY',
          message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`
        }
      });
      // Also broadcast the notification
      broadcast('NOTIFICATION', {
        id: `notif_${Date.now()}`,
        orderId: order.id,
        type: 'ORDER_READY',
        message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`
      });
    }

    // If served, clean/free up the table if it was table order
    if (status === 'SERVED' && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: {
          status: 'CLEANING',
          activeOrderId: null
        }
      });

      // Track waiter performance if waiter was assigned
      if (order.waiterId) {
        await prisma.restaurantWaiter.update({
          where: { id: order.waiterId },
          data: {
            ordersServed: { increment: 1 },
            salesHandled: { increment: order.totalAmount }
          }
        });
      }
    }

    // Broadcast status change
    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: order.status,
      estimatedPrepTime: order.estimatedPrepTime,
      acceptedAt: order.acceptedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      pickedUpAt: order.pickedUpAt,
      servedAt: order.servedAt,
      waiterStatus: order.waiterStatus,
      waiterId: order.waiterId
    });

    return res.status(200).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 6. WAITER MANAGEMENT
export const getWaiters = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const waiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: String(restaurantId) },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(waiters);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createWaiter = async (req: Request, res: Response) => {
  const { restaurantId, name, mobile } = req.body;
  try {
    const waiter = await prisma.restaurantWaiter.create({
      data: {
        restaurantId,
        name,
        mobile,
        status: 'ACTIVE'
      }
    });
    return res.status(201).json(waiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 7. RESERVATION SYSTEM
export const getReservations = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const reservations = await prisma.restaurantReservation.findMany({
      where: {
        table: { restaurantId: String(restaurantId) }
      },
      include: { table: true },
      orderBy: [
        { date: 'desc' },
        { time: 'asc' }
      ]
    });
    return res.status(200).json(reservations);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createReservation = async (req: Request, res: Response) => {
  const { customerName, mobileNumber, date, time, guests, tableId } = req.body;
  try {
    const reservation = await prisma.restaurantReservation.create({
      data: {
        customerName,
        mobileNumber,
        date,
        time,
        guests: Number(guests),
        tableId,
        status: 'RESERVED'
      }
    });

    // Mark table status
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'RESERVED' }
    });

    return res.status(201).json(reservation);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateReservationStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // RESERVED, CHECKED_IN, COMPLETED, CANCELLED
  try {
    const resv = await prisma.restaurantReservation.update({
      where: { id },
      data: { status },
      include: { table: true }
    });

    if (status === 'CHECKED_IN') {
      await prisma.restaurantTable.update({
        where: { id: resv.tableId },
        data: { status: 'OCCUPIED' }
      });
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.restaurantTable.update({
        where: { id: resv.tableId },
        data: { status: 'AVAILABLE' }
      });
    }

    return res.status(200).json(resv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 8. RECIPES & INGREDIENT INVENTORY
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(ingredients);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createIngredient = async (req: Request, res: Response) => {
  const { name, unit, stock, reorderLevel } = req.body;
  try {
    const ing = await prisma.ingredient.create({
      data: {
        name,
        unit: unit || 'PCS',
        stock: Number(stock) || 0,
        reorderLevel: Number(reorderLevel) || 10
      }
    });
    return res.status(201).json(ing);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateIngredientStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock } = req.body;
  try {
    const ing = await prisma.ingredient.update({
      where: { id },
      data: { stock: Number(stock) }
    });
    return res.status(200).json(ing);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        menuItem: true,
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });
    return res.status(200).json(recipes);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  const { menuItemId, name, ingredients } = req.body; // ingredients: [{ ingredientId, quantity }]
  try {
    const recipe = await prisma.recipe.create({
      data: {
        menuItemId,
        name: name || 'Custom Recipe',
        ingredients: {
          create: ingredients.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            quantity: Number(ing.quantity)
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    return res.status(201).json(recipe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 9. SWIGGY / ZOMATO / ONLINE CHANNELS
export const getOnlineOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.restaurantOnlineOrder.findMany({
      include: {
        kitchenOrder: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const simulateOnlineOrder = async (req: Request, res: Response) => {
  const { source, items } = req.body; // source: SWIGGY or ZOMATO, items: [{ menuItemId, quantity, unitPrice }]
  try {
    let total = 0;
    const orderItemsData = items.map((it: any) => {
      total += it.unitPrice * it.quantity;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      };
    });

    const kOrder = await prisma.kitchenOrder.create({
      data: {
        source,
        status: 'NEW',
        totalAmount: total,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        items: {
          create: orderItemsData
        }
      }
    });

    const commission = parseFloat((total * 0.15).toFixed(2));
    const revenue = parseFloat((total - commission).toFixed(2));

    const onlineOrder = await prisma.restaurantOnlineOrder.create({
      data: {
        kitchenOrderId: kOrder.id,
        orderSource: source,
        commission,
        revenue,
        status: 'ACCEPTED',
        paymentStatus: 'PAID'
      }
    });

    // Deduct ingredients automatically
    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    return res.status(201).json(onlineOrder);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 10. FEEDBACK
export const submitFeedback = async (req: Request, res: Response) => {
  const { kitchenOrderId, rating, comments, customerName } = req.body;
  try {
    const fb = await prisma.restaurantFeedback.create({
      data: {
        kitchenOrderId,
        rating: Number(rating),
        comments,
        customerName
      }
    });
    return res.status(201).json(fb);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// 11. REPORTS
export const getReports = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const orders = await prisma.kitchenOrder.findMany({
      where: {
        OR: [
          { tableId: null },
          { table: { restaurantId: String(restaurantId) } }
        ],
        status: { not: 'CANCELLED' }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });

    // Table Revenue
    const tableRevenue: Record<string, number> = {};
    orders.forEach(o => {
      if (o.table) {
        const tableNum = o.table.tableNumber;
        tableRevenue[tableNum] = (tableRevenue[tableNum] || 0) + o.totalAmount;
      }
    });

    // Popular Dishes
    const dishes: Record<string, { quantity: number, revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        const name = it.menuItem.name;
        if (!dishes[name]) dishes[name] = { quantity: 0, revenue: 0 };
        dishes[name].quantity += it.quantity;
        dishes[name].revenue += it.quantity * it.unitPrice;
      });
    });

    // Online Source Revenue
    const onlineOrders = await prisma.restaurantOnlineOrder.findMany({
      include: { kitchenOrder: true }
    });
    const swiggyRevenue = onlineOrders.filter(o => o.orderSource === 'SWIGGY').reduce((sum, o) => sum + o.revenue, 0);
    const zomatoRevenue = onlineOrders.filter(o => o.orderSource === 'ZOMATO').reduce((sum, o) => sum + o.revenue, 0);

    // Waiter performance
    const waiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: String(restaurantId) }
    });

    return res.status(200).json({
      totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      tableRevenue,
      popularDishes: Object.entries(dishes).map(([name, data]) => ({ name, ...data })),
      swiggyRevenue,
      zomatoRevenue,
      waiters: waiters.map(w => ({ name: w.name, orders: w.ordersServed, sales: w.salesHandled }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getKitchenOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const order = await prisma.kitchenOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true
      }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(200).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
export const uploadImage = async (req: Request, res: Response) => {
  const { image } = req.body;
  try {
    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = 'png';

    if (matches && matches.length === 3) {
      const type = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      const extMatch = type.split('/');
      if (extMatch.length > 1) {
        extension = extMatch[1];
      }
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/${uniqueName}`;
    return res.status(200).json({
      url: relativePath,
      message: 'Image uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

export const handleRealtime = async (req: Request, res: Response) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  
  res.write('\n');
  addClient(clientId, res);
  
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    removeClient(clientId);
  });
};
