import { Request, Response } from 'express';
import prisma from '../config/db';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { addClient, removeClient, broadcast } from '../utils/realtime';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
      
      // 1. Deduct from original Ingredient table
      await prisma.ingredient.update({
        where: { id: ri.ingredientId },
        data: {
          stock: {
            decrement: reduction
          }
        }
      });
      console.log(`[Inventory Auto] Deducted ${reduction} of ${ri.ingredient.name} from original stock`);

      // 2. Deduct from new RestaurantInventoryItem table if it exists
      const invItem = await prisma.restaurantInventoryItem.findFirst({
        where: { name: { equals: ri.ingredient.name, mode: 'insensitive' } }
      });
      if (invItem) {
        const newStock = Math.max(0, invItem.currentStock - reduction);
        
        // Recalculate status
        let newStatus = 'Normal';
        if (newStock <= 0) {
          newStatus = 'Out Of Stock';
        } else if (newStock <= invItem.minimumStock) {
          newStatus = 'Low Stock';
        } else if (invItem.expiryDate) {
          const now = new Date();
          const expiry = new Date(invItem.expiryDate);
          const diffTime = expiry.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) newStatus = 'Expired';
          else if (diffDays <= 3) newStatus = 'Expiring Soon';
        }

        await prisma.restaurantInventoryItem.update({
          where: { id: invItem.id },
          data: {
            currentStock: newStock,
            status: newStatus,
            lastUsedAt: new Date()
          }
        });

        // Log movement
        await prisma.restaurantInventoryMovement.create({
          data: {
            itemId: invItem.id,
            type: 'Usage',
            quantity: reduction,
            notes: `Auto-deducted for MenuItem: ${recipe.name || 'Dish'}`
          }
        });

        // If stock became low/out, generate a purchase request if one doesn't exist
        if (newStatus === 'Low Stock' || newStatus === 'Out Of Stock') {
          const existingReq = await prisma.restaurantPurchaseRequest.findFirst({
            where: { itemId: invItem.id, status: 'Pending' }
          });
          if (!existingReq) {
            await prisma.restaurantPurchaseRequest.create({
              data: {
                itemId: invItem.id,
                itemName: invItem.name,
                quantityRequired: invItem.minimumStock * 2,
                reason: newStatus
              }
            });
          }
        }
        console.log(`[Inventory Auto] Deducted ${reduction} of ${invItem.name} from Restaurant Inventory`);
      }
    }
  } catch (err) {
    console.error('[Inventory Error] Failed to deduct ingredients:', err);
  }
}

async function getActualRestaurantId(clientRestaurantId?: string | any): Promise<string> {
  let restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Central Diner',
        type: 'RESTAURANT',
        address: '123 Main St'
      }
    });
  }
  return restaurant.id;
}

let kitchenDummyDataEnsured = false;

export async function ensureKitchenDummyDataExists() {
  if (kitchenDummyDataEnsured) return;
  try {
    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: 'Central Diner',
          type: 'RESTAURANT',
          address: '123 Main St'
        }
      });
    }
    const restId = restaurant.id;

    // Ensure standard waiters
    const waiters = ['Rahul', 'Akshay', 'Ritesh', 'Adesh', 'Sagar', 'Pratik', 'Rohan', 'Amit'];
    const waiterIds: string[] = [];
    for (const name of waiters) {
      let waiter = await prisma.restaurantWaiter.findFirst({
        where: { name, restaurantId: restId }
      });
      if (!waiter) {
        waiter = await prisma.restaurantWaiter.create({
          data: {
            restaurantId: restId,
            name,
            mobile: '98765432' + Math.floor(10 + Math.random() * 90),
            employeeCode: 'WT' + Math.floor(100 + Math.random() * 900),
            email: name.toLowerCase() + '@restaurant.com',
            status: 'ACTIVE'
          }
        });
      }
      waiterIds.push(waiter.id);
    }

    // Ensure tables
    const tableIds: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const tableNumber = `Table ${i}`;
      let table = await prisma.restaurantTable.findFirst({
        where: { tableNumber, restaurantId: restId }
      });
      if (!table) {
        table = await prisma.restaurantTable.create({
          data: {
            restaurantId: restId,
            tableNumber,
            capacity: 4,
            status: 'AVAILABLE'
          }
        });
      }
      tableIds.push(table.id);
    }

    // Ensure Menu Category
    let category = await prisma.menuCategory.findFirst({
      where: { restaurantId: restId }
    });
    if (!category) {
      category = await prisma.menuCategory.create({
        data: {
          restaurantId: restId,
          name: 'Main Course'
        }
      });
    }

    // Ensure Menu Items
    const itemsData = [
      { name: 'Chicken Biryani', price: 250 },
      { name: 'Paneer Butter Masala', price: 220 },
      { name: 'Veg Crispy', price: 160 },
      { name: 'Fish Fry', price: 220 },
      { name: 'Hakka Noodles', price: 150 },
      { name: 'Cheese Burger', price: 140 },
      { name: 'Butter Naan', price: 40 },
      { name: 'Coke', price: 40 }
    ];
    const menuItems: any[] = [];
    for (const item of itemsData) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id }
      });
      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            price: item.price,
            status: 'AVAILABLE'
          }
        });
      }
      menuItems.push(menuItem);
    }

    // Seed KitchenOrders
    const orderCount = await prisma.kitchenOrder.count();
    if (orderCount === 0) {
      console.log('[Seed] Seeding realistic dummy kitchen orders...');
      // Seed 20 NEW orders
      for (let i = 1; i <= 20; i++) {
        const waiterId = waiterIds[Math.floor(Math.random() * waiterIds.length)];
        const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        await prisma.kitchenOrder.create({
          data: {
            tableId,
            waiterId,
            source: ['WALK_IN', 'QR', 'SWIGGY', 'ZOMATO'][Math.floor(Math.random() * 4)],
            status: 'NEW',
            totalAmount: item.price,
            items: {
              create: [
                {
                  menuItemId: item.id,
                  quantity: 1,
                  unitPrice: item.price
                }
              ]
            }
          }
        });
      }

      // Seed 15 PREPARING orders
      for (let i = 1; i <= 15; i++) {
        const waiterId = waiterIds[Math.floor(Math.random() * waiterIds.length)];
        const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        await prisma.kitchenOrder.create({
          data: {
            tableId,
            waiterId,
            source: ['WALK_IN', 'QR', 'SWIGGY', 'ZOMATO'][Math.floor(Math.random() * 4)],
            status: 'PREPARING',
            totalAmount: item.price,
            items: {
              create: [
                {
                  menuItemId: item.id,
                  quantity: 1,
                  unitPrice: item.price
                }
              ]
            }
          }
        });
      }

      // Seed 10 READY orders
      for (let i = 1; i <= 10; i++) {
        const waiterId = waiterIds[Math.floor(Math.random() * waiterIds.length)];
        const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        await prisma.kitchenOrder.create({
          data: {
            tableId,
            waiterId,
            source: ['WALK_IN', 'QR', 'SWIGGY', 'ZOMATO'][Math.floor(Math.random() * 4)],
            status: 'READY',
            totalAmount: item.price,
            items: {
              create: [
                {
                  menuItemId: item.id,
                  quantity: 1,
                  unitPrice: item.price
                }
              ]
            }
          }
        });
      }

      // Seed 12 COMPLETED/SERVED orders
      for (let i = 1; i <= 12; i++) {
        const waiterId = waiterIds[Math.floor(Math.random() * waiterIds.length)];
        const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        await prisma.kitchenOrder.create({
          data: {
            tableId,
            waiterId,
            source: ['WALK_IN', 'QR', 'SWIGGY', 'ZOMATO'][Math.floor(Math.random() * 4)],
            status: 'SERVED',
            totalAmount: item.price,
            items: {
              create: [
                {
                  menuItemId: item.id,
                  quantity: 1,
                  unitPrice: item.price
                }
              ]
            }
          }
        });
      }
    }

    // Seed KitchenStockRequest
    const requestCount = await prisma.kitchenStockRequest.count();
    if (requestCount === 0) {
      console.log('[Seed] Seeding realistic dummy kitchen stock requests...');
      const year = new Date().getFullYear();

      // 10 Pending requests
      for (let i = 1; i <= 10; i++) {
        const requestNo = `KR-${year}-PEND-${String(i).padStart(3, '0')}`;
        await prisma.kitchenStockRequest.create({
          data: {
            requestNo,
            requestedBy: 'Chef Deepak',
            createdBy: 'Kitchen',
            status: 'Pending Approval',
            items: [
              { productName: 'Premium Basmati Rice', quantity: 25, unit: 'Kg', notes: 'Urgent requirement for biryani section.' },
              { productName: 'Refined Sugar', quantity: 10, unit: 'Kg', notes: 'For desserts.' }
            ]
          }
        });
      }

      // 8 Approved requests (4 Kitchen, 4 Admin)
      for (let i = 1; i <= 8; i++) {
        const requestNo = `KR-${year}-APPR-${String(i).padStart(3, '0')}`;
        const creator = i <= 4 ? 'Kitchen' : 'Admin';
        await prisma.kitchenStockRequest.create({
          data: {
            requestNo,
            requestedBy: creator === 'Kitchen' ? 'Chef Deepak' : 'Admin User',
            createdBy: creator,
            status: 'Approved',
            items: [
              { productName: 'Sunflower Cooking Oil', quantity: 15, unit: 'Liters', notes: 'Weekly replenishment.' }
            ]
          }
        });
      }

      // 5 Rejected requests
      for (let i = 1; i <= 5; i++) {
        const requestNo = `KR-${year}-REJ-${String(i).padStart(3, '0')}`;
        await prisma.kitchenStockRequest.create({
          data: {
            requestNo,
            requestedBy: 'Chef Deepak',
            createdBy: 'Kitchen',
            status: 'Rejected',
            items: [
              { productName: 'Truffle Oil', quantity: 2, unit: 'Bottles', notes: 'For special event pasta.' }
          ]
        }
      });
    }
  }
  kitchenDummyDataEnsured = true;
  } catch (err) {
    console.error('[Seed Error] Failed to seed kitchen dummy data:', err);
  }
}

// 1. DASHBOARD METRICS
export const getDashboardMetrics = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ message: 'restaurantId query parameter is required' });
  }

  try {
    await ensureKitchenDummyDataExists();
    const restId = await getActualRestaurantId(restaurantId);

    // Sales Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: 'COMPLETED'
      }
    });

    const todayRevenue = completedToday.reduce((sum, o) => sum + o.totalPayable, 0);
    const todayOrdersCount = completedToday.length;
    const todayProfit = todayRevenue * 0.4; // 40% margin
    const todayExpenses = todayRevenue * 0.6; // 60% expenses
    const netProfit = todayProfit;

    // Weekly and Monthly Metrics
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedWeekly = await prisma.order.findMany({
      where: {
        createdAt: { gte: oneWeekAgo },
        status: 'COMPLETED'
      }
    });
    const weeklyRevenue = completedWeekly.reduce((sum, o) => sum + o.totalPayable, 0);
    const weeklyProfit = weeklyRevenue * 0.4;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const completedMonthly = await prisma.order.findMany({
      where: {
        createdAt: { gte: oneMonthAgo },
        status: 'COMPLETED'
      }
    });
    const monthlyRevenue = completedMonthly.reduce((sum, o) => sum + o.totalPayable, 0);
    const monthlyProfit = monthlyRevenue * 0.4;

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

    // Most Active Tables
    const histories = await prisma.billingHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const tableCounts: Record<string, number> = {};
    histories.forEach(h => {
      tableCounts[h.tableNumber] = (tableCounts[h.tableNumber] || 0) + 1;
    });
    const mostActiveTables = Object.entries(tableCounts)
      .map(([tableNumber, count]) => ({ tableNumber, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most Active Waiters
    const mostActiveWaiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: restId },
      orderBy: { ordersServed: 'desc' },
      take: 5
    });

    return res.status(200).json({
      todayRevenue,
      todayOrders: todayOrdersCount,
      todayProfit,
      todayExpenses,
      netProfit,
      weeklyRevenue,
      weeklyProfit,
      monthlyRevenue,
      monthlyProfit,
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
      mostActiveTables,
      mostActiveWaiters,
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

  try {
    const restId = await getActualRestaurantId(restaurantId);
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: restId },
      include: {
        qrCode: true,
        kitchenOrders: {
          where: {
            status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVING'] }
          },
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
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
    const restId = await getActualRestaurantId(restaurantId);
    // Check if tableNumber already exists for this restaurant (case-insensitive)
    const existing = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId: restId,
        tableNumber: {
          equals: tableNumber,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      if (existing.status === 'DEACTIVATED') {
        const reactivated = await prisma.restaurantTable.update({
          where: { id: existing.id },
          data: { status: 'AVAILABLE' }
        });
        return res.status(200).json(reactivated);
      }
      return res.status(200).json(existing);
    }

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId: restId,
        tableNumber,
        capacity: Number(capacity) || 4,
        status: 'AVAILABLE'
      }
    });

    // Create QR Code entry
    const qrToken = `QR_${table.tableNumber.replace(/\s+/g, '_')}_${restaurantId.slice(0, 4)}`;
    const existingQR = await prisma.tableQRCode.findUnique({
      where: { qrToken }
    });

    if (!existingQR) {
      await prisma.tableQRCode.create({
        data: {
          tableId: table.id,
          qrToken,
          qrCodeUrl: `/menu/${table.id}`
        }
      });
    }

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

  try {
    let table = await prisma.restaurantTable.findUnique({ where: { id: tableId } }).catch(() => null);
    if (!table) {
      table = await prisma.restaurantTable.findFirst({
        where: { status: { not: 'DEACTIVATED' } },
        orderBy: { tableNumber: 'asc' }
      });
      if (!table) {
        const restId = await getActualRestaurantId();
        table = await prisma.restaurantTable.create({
          data: {
            restaurantId: restId,
            tableNumber: 'Table 1',
            capacity: 4,
            status: 'AVAILABLE'
          }
        });
      }
    }
    const resolvedTableId = table.id;

    let total = 0;
    const consolidatedItemsMap = new Map<string, any>();
    for (const it of items) {
      const key = it.menuItemId;
      if (consolidatedItemsMap.has(key)) {
        const existing = consolidatedItemsMap.get(key);
        existing.quantity += it.quantity;
        if (it.notes) {
          existing.notes = existing.notes ? `${existing.notes}; ${it.notes}` : it.notes;
        }
      } else {
        consolidatedItemsMap.set(key, {
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          notes: it.notes || '',
          unitPrice: it.unitPrice
        });
      }
    }
    const orderItemsData = Array.from(consolidatedItemsMap.values()).map((it: any) => {
      total += it.unitPrice * it.quantity;
      return it;
    });

    const order = await prisma.kitchenOrder.create({
      data: {
        tableId: resolvedTableId,
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

    await prisma.restaurantTable.update({
      where: { id: resolvedTableId },
      data: {
        status: 'OCCUPIED',
        activeOrderId: order.id
      }
    });

    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    const defaultBranch = await prisma.branch.findFirst();
    const branchId = defaultBranch ? defaultBranch.id : null;
    const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
    const cashierId = defaultUser ? defaultUser.id : 'default-cashier';

    const discount = total * 0.10;
    const tax = (total - discount) * 0.18;
    const totalPayable = total - discount + tax;

    const posOrderItems = [];
    for (const it of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: it.menuItemId } });
      const itemName = menuItem ? menuItem.name : 'Restaurant Dish';
      const itemPrice = menuItem ? menuItem.price : it.unitPrice;

      let product = await prisma.product.findFirst({ where: { name: itemName } });
      if (!product) {
        let category = await prisma.category.findFirst({ where: { name: 'Restaurant Menu' } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: 'Restaurant Menu', status: 'Active' }
          });
        }
        product = await prisma.product.create({
          data: {
            name: itemName,
            sku: `REST-${it.menuItemId.slice(0, 8).toUpperCase()}`,
            sellingPrice: itemPrice,
            costPrice: itemPrice * 0.5,
            categoryId: category.id,
            status: 'IN_STOCK'
          }
        });
      }

      posOrderItems.push({
        productId: product.id,
        quantity: it.quantity,
        unitPrice: itemPrice,
        discount: 0,
        total: itemPrice * it.quantity
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    const posOrder = await prisma.order.create({
      data: {
        invoiceNumber,
        cashierId,
        branchId,
        subtotal: total,
        discount,
        tax,
        totalPayable,
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        items: {
          create: posOrderItems
        }
      }
    });

    const qrToken = crypto.randomUUID();
    const invoiceUrl = `/invoice/${invoiceNumber}?token=${qrToken}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: posOrder.id,
        invoiceType: 'GST',
        qrToken,
        invoiceUrl
      }
    });

    await prisma.payment.create({
      data: {
        orderId: posOrder.id,
        invoiceId: invoice.id,
        amount: totalPayable,
        paymentMethod: 'UPI',
        status: 'SUCCESS',
        cashierId
      }
    });

    const publicInvoicesDir = path.join(__dirname, '..', '..', 'public', 'invoices');
    if (!fs.existsSync(publicInvoicesDir)) {
      fs.mkdirSync(publicInvoicesDir, { recursive: true });
    }

    const pdfPath = path.join(publicInvoicesDir, `${invoiceNumber}.pdf`);
    const doc = new PDFDocument({ margin: 30 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('GOURMET BISTRO', { align: 'center' });
    doc.fontSize(9).text('123 Main St, Central Diner', { align: 'center' });
    doc.text('GSTIN: 27AAAAA1111A1Z1', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(10).text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Order Number: ${posOrder.id.slice(-6).toUpperCase()}`);
    doc.text(`Table Number: ${table.tableNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
    doc.text(`Payment Method: Online (UPI/Razorpay)`);
    doc.moveDown(1);

    doc.text('-----------------------------------------------------------------------------------');
    doc.text('Item Description                     Qty       Unit Price      Total');
    doc.text('-----------------------------------------------------------------------------------');

    for (const it of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: it.menuItemId } });
      const name = menuItem ? menuItem.name : 'Item';
      const line = `${name.padEnd(35)} ${String(it.quantity).padEnd(9)} ₹${String(it.unitPrice).padEnd(14)} ₹${String(it.unitPrice * it.quantity)}`;
      doc.text(line);
    }

    doc.text('-----------------------------------------------------------------------------------');
    doc.moveDown(0.5);
    doc.text(`Subtotal: ₹${total.toFixed(2)}`, { align: 'right' });
    doc.text(`Dine-in Discount (10%): -₹${discount.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (18%): ₹${tax.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).text(`Grand Total Paid: ₹${totalPayable.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for dining with us!', { align: 'center' });

    doc.end();

    const pdfUrl = `/public/invoices/${invoiceNumber}.pdf`;
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl }
    });

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

    return res.status(201).json({
      ...order,
      invoice: {
        id: invoice.id,
        invoiceNumber,
        pdfUrl
      }
    });
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
    await ensureKitchenDummyDataExists();
    const restId = await getActualRestaurantId(restaurantId);
    const statusFilter = includeServed === 'true'
      ? undefined
      : { not: 'SERVED' };

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        OR: [
          { tableId: null }, // Delivery / Walkin
          {
            table: { restaurantId: restId }
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
        table: true,
        waiter: true
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

    // Sync individual items' status to maintain integrity
    if (status === 'ACCEPTED' || status === 'PREPARING') {
      await prisma.kitchenOrderItem.updateMany({
        where: { kitchenOrderId: id },
        data: { status: 'PREPARING' }
      });
    } else if (status === 'READY') {
      await prisma.kitchenOrderItem.updateMany({
        where: { kitchenOrderId: id },
        data: { status: 'READY' }
      });
    } else if (status === 'NEW') {
      await prisma.kitchenOrderItem.updateMany({
        where: { kitchenOrderId: id },
        data: { status: 'PENDING' }
      });
    }

    // Create a waiter notification if status is READY
    if (status === 'READY') {
      const tableName = order.table?.tableNumber || 'Takeaway';

      // System Automatically Creates Service Task
      // Find waiter assigned to this table
      const cleanTableNum = tableName.replace(/\s+/g, '').toLowerCase();
      const restaurantId = order.table?.restaurantId || undefined;
      const resolvedRestId = restaurantId || await getActualRestaurantId();

      const waitersWithAssignments = await prisma.restaurantWaiter.findMany({
        where: {
          restaurantId: resolvedRestId,
          status: 'ACTIVE'
        },
        include: { tableAssignments: true }
      });

      let assignedWaiterId: string | null = null;
      for (const waiter of waitersWithAssignments) {
        const hasAssignment = waiter.tableAssignments.some(assign => {
          const cleanAssign = assign.tableNumber.replace(/\s+/g, '').toLowerCase();
          if (cleanAssign === cleanTableNum) return true;

          const assignDigits = cleanAssign.match(/\d+/)?.[0];
          const tableDigits = cleanTableNum.match(/\d+/)?.[0];
          if (assignDigits && tableDigits && assignDigits === tableDigits) return true;
          return false;
        });
        if (hasAssignment) {
          assignedWaiterId = waiter.id;
          break;
        }
      }

      let serviceTask = await prisma.serviceTask.findFirst({
        where: { orderId: order.id }
      });

      if (!serviceTask) {
        serviceTask = await prisma.serviceTask.create({
          data: {
            orderId: order.id,
            tableNumber: tableName,
            waiterId: assignedWaiterId,
            status: 'ready'
          }
        });
      } else {
        serviceTask = await prisma.serviceTask.update({
          where: { id: serviceTask.id },
          data: {
            status: 'ready',
            waiterId: assignedWaiterId
          }
        });
      }

      // Update the KitchenOrder in database to link the waiter if matched
      if (assignedWaiterId) {
        await prisma.kitchenOrder.update({
          where: { id: order.id },
          data: { waiterId: assignedWaiterId }
        });
        order.waiterId = assignedWaiterId;

        // Create waiter notification record if it doesn't already exist
        const existingWaiterNotif = await prisma.waiterNotification.findFirst({
          where: {
            waiterId: assignedWaiterId,
            orderId: order.id,
            title: 'New Ready Order'
          }
        });
        if (!existingWaiterNotif) {
          await prisma.waiterNotification.create({
            data: {
              waiterId: assignedWaiterId,
              orderId: order.id,
              title: 'New Ready Order',
              message: `${tableName} - Order #${order.id.slice(-4).toUpperCase()}`
            }
          });
        }
      }

      const existingOrderNotif = await prisma.orderNotification.findFirst({
        where: {
          orderId: order.id,
          type: 'ORDER_READY'
        }
      });
      if (!existingOrderNotif) {
        await prisma.orderNotification.create({
          data: {
            orderId: order.id,
            type: 'ORDER_READY',
            message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`
          }
        });
      }

      const fullServiceTask = await prisma.serviceTask.findUnique({
        where: { id: serviceTask.id },
        include: {
          waiter: true,
          kitchenOrder: {
            include: {
              items: {
                include: { menuItem: true }
              },
              table: true
            }
          }
        }
      });

      // Broadcast service task created
      broadcast('NEW_SERVICE_TASK', {
        task: fullServiceTask || serviceTask,
        order,
        assignedWaiterId
      });

      // Also broadcast the notification
      broadcast('NOTIFICATION', {
        id: `notif_${Date.now()}`,
        orderId: order.id,
        type: 'ORDER_READY',
        message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`,
        assignedWaiterId,
        tableNumber: tableName
      });
    }

    // Sync order status changes with corresponding table status
    if (order.tableId) {
      let tableStatusUpdate = 'OCCUPIED';
      if (status === 'PREPARING') {
        tableStatusUpdate = 'COOKING';
      } else if (status === 'READY') {
        tableStatusUpdate = 'READY';
      } else if (status === 'SERVED' || status === 'SERVING') {
        tableStatusUpdate = 'SERVED';
      } else if (status === 'CANCELLED') {
        tableStatusUpdate = 'AVAILABLE';
      }

      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: {
          status: tableStatusUpdate,
          ...(status === 'CANCELLED' ? { activeOrderId: null } : {})
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

export const updateOrderItemStatus = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { status } = req.body; // PENDING, PREPARING, READY
  try {
    const item = await prisma.kitchenOrderItem.update({
      where: { id: itemId },
      data: { status },
      include: { kitchenOrder: { include: { items: true, table: true } } }
    });

    const order = item.kitchenOrder;
    const allItems = order.items;

    // Determine overall order status
    let nextOrderStatus = 'NEW';
    const isAllPending = allItems.every(it => it.status === 'PENDING');
    const isAllReady = allItems.every(it => it.status === 'READY');
    const hasAnyPreparing = allItems.some(it => it.status === 'PREPARING');
    const hasAnyReady = allItems.some(it => it.status === 'READY');

    if (isAllReady) {
      nextOrderStatus = 'READY';
    } else if (hasAnyPreparing && hasAnyReady) {
      nextOrderStatus = 'PARTIALLY_READY';
    } else if (hasAnyPreparing) {
      nextOrderStatus = 'PREPARING';
    } else if (hasAnyReady) {
      nextOrderStatus = 'PARTIALLY_READY';
    } else if (isAllPending) {
      nextOrderStatus = 'NEW';
    } else {
      nextOrderStatus = 'PREPARING';
    }

    const updatedOrder = await prisma.kitchenOrder.update({
      where: { id: order.id },
      data: { status: nextOrderStatus },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        waiter: true
      }
    });

    // Sync table status
    if (updatedOrder.tableId) {
      let tableStatusUpdate = 'OCCUPIED';
      if (nextOrderStatus === 'PREPARING' || nextOrderStatus === 'PARTIALLY_READY') {
        tableStatusUpdate = 'COOKING';
      } else if (nextOrderStatus === 'READY') {
        tableStatusUpdate = 'READY';
      }

      await prisma.restaurantTable.update({
        where: { id: updatedOrder.tableId },
        data: { status: tableStatusUpdate }
      });
    }

    // Send notifications if the order becomes completely READY
    if (nextOrderStatus === 'READY') {
      const tableName = updatedOrder.table?.tableNumber || 'Takeaway';
      const orderShort = updatedOrder.id.slice(-4).toUpperCase();
      
      let serviceTask = await prisma.serviceTask.findFirst({
        where: { orderId: updatedOrder.id }
      });
      if (!serviceTask) {
        serviceTask = await prisma.serviceTask.create({
          data: {
            orderId: updatedOrder.id,
            tableNumber: tableName,
            waiterId: updatedOrder.waiterId,
            status: 'ready'
          }
        });
      }

      broadcast('NOTIFICATION', {
        id: `notif_${Date.now()}`,
        orderId: updatedOrder.id,
        type: 'ORDER_READY',
        message: `${tableName.toUpperCase()} - ORDER READY - Serve Now`,
        assignedWaiterId: updatedOrder.waiterId,
        tableNumber: tableName,
        kotNumber: orderShort
      });
    }

    // Broadcast update to all listeners (KDS, Waiter Dashboard, Manager, etc.)
    broadcast('NEW_ORDER', updatedOrder);

    return res.status(200).json(updatedOrder);
  } catch (err: any) {
    console.error('Error in updateOrderItemStatus:', err);
    return res.status(500).json({ error: err.message });
  }
};

// 6. WAITER MANAGEMENT
export const getWaiters = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: 'restaurantId is required' });
  }
  try {
    const restId = await getActualRestaurantId(restaurantId);
    let waiters = await prisma.restaurantWaiter.findMany({
      where: { restaurantId: restId },
      include: { tableAssignments: true },
      orderBy: { name: 'asc' }
    });

    if (waiters.length === 0) {
      // Auto seed standard waiters Rahul, Amit, Suresh, Priya
      const standardWaiters = [
        { name: 'Rahul', employeeCode: 'WT001', email: 'rahul@restaurant.com', mobile: '9876543210', tables: ['1', '2', 'Table 1', 'Table 2'] },
        { name: 'Ritesh', employeeCode: 'WT002', email: 'ritesh@restaurant.com', mobile: '9876543211', tables: ['3', '4', 'Table 3', 'Table 4'] },
        { name: 'Akshay', employeeCode: 'WT003', email: 'akshay@restaurant.com', mobile: '9876543212', tables: ['5', '6', 'Table 5', 'Table 6'] },
        { name: 'Adesh', employeeCode: 'WT004', email: 'adesh@restaurant.com', mobile: '9876543213', tables: ['7', '8', 'Table 7', 'Table 8'] },
        { name: 'Sagar', employeeCode: 'WT005', email: 'sagar@restaurant.com', mobile: '9876543214', tables: ['9', '10', 'Table 9', 'Table 10'] },
        { name: 'Pratik', employeeCode: 'WT006', email: 'pratik@restaurant.com', mobile: '9876543215', tables: ['11', '12', 'Table 11', 'Table 12'] },
        { name: 'Rohan', employeeCode: 'WT007', email: 'rohan@restaurant.com', mobile: '9876543216', tables: ['13', '14', 'Table 13', 'Table 14'] },
        { name: 'Amit', employeeCode: 'WT008', email: 'amit@restaurant.com', mobile: '9876543217', tables: ['15', '16', 'Table 15', 'Table 16'] },
        { name: 'Vikas', employeeCode: 'WT009', email: 'vikas@restaurant.com', mobile: '9876543218', tables: [] },
        { name: 'Nikhil', employeeCode: 'WT010', email: 'nikhil@restaurant.com', mobile: '9876543219', tables: [] },
        { name: 'Mahesh', employeeCode: 'WT011', email: 'mahesh@restaurant.com', mobile: '9876543220', tables: [] },
      ];

      for (const w of standardWaiters) {
        const waiter = await prisma.restaurantWaiter.create({
          data: {
            restaurantId: restId,
            name: w.name,
            mobile: w.mobile,
            employeeCode: w.employeeCode,
            email: w.email,
            status: 'ACTIVE'
          }
        });

        await prisma.waiterTableAssignment.createMany({
          data: w.tables.map(t => ({
            waiterId: waiter.id,
            tableNumber: t,
            businessId: restId
          }))
        });
      }

      // Re-fetch
      waiters = await prisma.restaurantWaiter.findMany({
        where: { restaurantId: restId },
        include: { tableAssignments: true },
        orderBy: { name: 'asc' }
      });
    }

    return res.status(200).json(waiters);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createWaiter = async (req: Request, res: Response) => {
  const { restaurantId, name, mobile, role, employeeCode } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Mobile number must contain exactly 10 digits.' });
  }
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const waiter = await prisma.restaurantWaiter.create({
      data: {
        restaurantId: restId,
        name,
        mobile,
        role: role || 'Waiter',
        status: 'ACTIVE',
        employeeCode: employeeCode || undefined
      }
    });
    return res.status(201).json(waiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateWaiterAssignments = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tableNumbers } = req.body;
  try {
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }
    const businessId = waiter.restaurantId;

    await prisma.waiterTableAssignment.deleteMany({
      where: { waiterId: id }
    });

    if (Array.isArray(tableNumbers) && tableNumbers.length > 0) {
      const dataToInsert: any[] = [];
      const seen = new Set<string>();

      for (const t of tableNumbers) {
        const cleanT = String(t).trim();
        if (!cleanT) continue;

        if (!seen.has(cleanT)) {
          seen.add(cleanT);
          dataToInsert.push({ waiterId: id, tableNumber: cleanT, businessId });
        }

        const digitMatch = cleanT.match(/\d+/);
        if (digitMatch) {
          const digit = digitMatch[0];
          const alt1 = `Table ${digit}`;
          const alt2 = digit;
          if (!seen.has(alt1)) {
            seen.add(alt1);
            dataToInsert.push({ waiterId: id, tableNumber: alt1, businessId });
          }
          if (!seen.has(alt2)) {
            seen.add(alt2);
            dataToInsert.push({ waiterId: id, tableNumber: alt2, businessId });
          }
        }
      }

      await prisma.waiterTableAssignment.createMany({
        data: dataToInsert
      });
    }

    const updatedWaiter = await prisma.restaurantWaiter.findUnique({
      where: { id },
      include: { tableAssignments: true }
    });

    return res.status(200).json(updatedWaiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// SERVICE TASK ENDPOINTS
export const getServiceTasks = async (req: Request, res: Response) => {
  const { restaurantId, waiterId } = req.query;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    
    const whereClause: any = {
      kitchenOrder: {
        table: { restaurantId: restId }
      }
    };

    if (waiterId && typeof waiterId === 'string' && waiterId !== 'null' && waiterId !== 'undefined' && waiterId !== '') {
      whereClause.waiterId = waiterId;
    }

    const tasks = await prisma.serviceTask.findMany({
      where: whereClause,
      include: {
        kitchenOrder: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            },
            table: true
          }
        },
        waiter: {
          include: {
            tableAssignments: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });
    return res.status(200).json(tasks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const pickupServiceTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { waiterId } = req.body;
  try {
    const now = new Date();
    const task = await prisma.serviceTask.update({
      where: { id },
      data: {
        status: 'picked_up',
        pickedUpAt: now,
        waiterId: waiterId || undefined
      },
      include: {
        kitchenOrder: true
      }
    });

    const order = await prisma.kitchenOrder.update({
      where: { id: task.orderId },
      data: {
        status: 'SERVING',
        waiterStatus: 'SERVING',
        waiterId: waiterId || task.waiterId || undefined,
        pickedUpAt: now
      },
      include: { table: true }
    });

    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: 'SERVING',
      waiterStatus: 'SERVING',
      waiterId: order.waiterId,
      pickedUpAt: now,
      task: {
        id: task.id,
        status: 'picked_up',
        pickedUpAt: now,
        waiterId: task.waiterId
      }
    });

    return res.status(200).json({ task, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const serveServiceTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { waiterId } = req.body;
  try {
    const now = new Date();
    const task = await prisma.serviceTask.update({
      where: { id },
      data: {
        status: 'served',
        servedAt: now,
        waiterId: waiterId || undefined
      },
      include: {
        kitchenOrder: true
      }
    });

    const order = await prisma.kitchenOrder.update({
      where: { id: task.orderId },
      data: {
        status: 'SERVED',
        waiterStatus: 'SERVED',
        waiterId: waiterId || task.waiterId || undefined,
        servedAt: now
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (order.tableId) {
      const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS';
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: {
          status: isPaid ? 'CLEANING' : 'BILLING_PENDING',
          activeOrderId: null
        }
      });
    }

    const finalWaiterId = waiterId || task.waiterId;
    if (finalWaiterId) {
      await prisma.restaurantWaiter.update({
        where: { id: finalWaiterId },
        data: {
          ordersServed: { increment: 1 },
          salesHandled: { increment: order.totalAmount }
        }
      });
    }

    // Create Billing History Log permanently
    try {
      const waiter = finalWaiterId ? await prisma.restaurantWaiter.findUnique({ where: { id: finalWaiterId } }) : null;
      const waiterName = waiter ? waiter.name : 'Unknown';
      const itemsList = order.items && Array.isArray(order.items)
        ? order.items.map((it: any) => `${it.menuItem?.name || 'Item'} (Qty ${it.quantity})`).join(', ')
        : 'N/A';

      const billDate = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
      const billTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const invoiceNumber = `INV-REST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await prisma.billingHistory.create({
        data: {
          invoiceNumber,
          tableNumber: order.table?.tableNumber || 'Takeaway',
          orderSource: order.source || 'WALK_IN',
          paymentMode: order.paymentMethod || 'CASH',
          items: itemsList,
          totalAmount: order.totalAmount,
          gst: order.totalAmount * 0.05, // 5% GST for restaurant orders
          waiterName,
          date: billDate,
          time: billTime
        }
      });

      // Create Payment History Log permanently
      await prisma.paymentHistory.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMode: order.paymentMethod || 'CASH',
          paidBy: order.table?.tableNumber || 'Walk-in Customer'
        }
      });
    } catch (e) {
      console.error('Failed to log billing or payment history:', e);
    }

    broadcast('ORDER_STATUS_UPDATE', {
      id: order.id,
      status: 'SERVED',
      waiterStatus: 'SERVED',
      waiterId: order.waiterId,
      servedAt: now,
      task: {
        id: task.id,
        status: 'served',
        servedAt: now,
        waiterId: task.waiterId
      }
    });

    return res.status(200).json({ task, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


export const getWaiterNotifications = async (req: Request, res: Response) => {
  const { waiterId } = req.query;
  if (!waiterId) return res.status(400).json({ error: 'waiterId is required' });
  try {
    const notifications = await prisma.waiterNotification.findMany({
      where: {
        waiterId: String(waiterId)
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(notifications);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const readWaiterNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notification = await prisma.waiterNotification.update({
      where: { id },
      data: { isRead: true }
    });
    return res.status(200).json(notification);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getWaiterTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await prisma.tableTransfer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(transfers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const transferWaiterTable = async (req: Request, res: Response) => {
  const { tableNumber, fromWaiterId, toWaiterId, transferredBy } = req.body;
  if (!tableNumber || !fromWaiterId || !toWaiterId) {
    return res.status(400).json({ error: 'tableNumber, fromWaiterId, and toWaiterId are required' });
  }
  try {
    // 1. Delete assignment from source waiter
    try {
      await prisma.waiterTableAssignment.deleteMany({
        where: {
          waiterId: fromWaiterId,
          tableNumber: tableNumber
        }
      });
    } catch (e) {
      console.warn('No source assignment to delete or failed:', e);
    }

    // 2. Add assignment to target waiter
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id: toWaiterId }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Target waiter not found' });
    }

    const assignment = await prisma.waiterTableAssignment.upsert({
      where: {
        waiterId_tableNumber: {
          waiterId: toWaiterId,
          tableNumber: tableNumber
        }
      },
      update: {},
      create: {
        waiterId: toWaiterId,
        tableNumber: tableNumber,
        businessId: waiter.restaurantId
      }
    });

    // 3. Create transfer log
    const transferLog = await prisma.tableTransfer.create({
      data: {
        tableNumber,
        fromWaiterId,
        toWaiterId,
        transferredBy: transferredBy || 'Admin'
      }
    });

    // 4. Send notification to target waiter
    await prisma.waiterNotification.create({
      data: {
        waiterId: toWaiterId,
        orderId: 'N/A',
        title: 'Table Transferred To You',
        message: `${tableNumber} has been transferred to you.`
      }
    });

    // Broadcast update via SSE
    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      waiterId: toWaiterId,
      message: `${tableNumber} assigned to you.`
    });

    return res.status(200).json({ transferLog, assignment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const assignTable = async (req: Request, res: Response) => {
  const { waiterId, tableNumber } = req.body;
  if (!waiterId || !tableNumber) {
    return res.status(400).json({ error: 'waiterId and tableNumber are required' });
  }
  try {
    const cleanTableNum = String(tableNumber).trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    const existing = await prisma.waiterTableAssignment.findFirst({
      where: {
        tableNumber: { in: lookupNumbers }
      },
      include: { waiter: true }
    });

    let previousWaiterName = "None";
    if (existing) {
      if (existing.waiterId === waiterId) {
        return res.status(200).json({ message: 'Table already assigned to this waiter' });
      }
      previousWaiterName = existing.waiter.name;
      // Delete previous table assignments first to keep ownership unique
      await prisma.waiterTableAssignment.deleteMany({
        where: {
          tableNumber: { in: lookupNumbers }
        }
      });
    }

    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id: waiterId }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }

    const uniqueLookupNumbers = Array.from(new Set(lookupNumbers));

    const existingUserAssignments = await prisma.waiterTableAssignment.findMany({
      where: {
        waiterId,
        tableNumber: { in: uniqueLookupNumbers }
      }
    });
    const existingTableNumbers = new Set(existingUserAssignments.map(a => a.tableNumber));
    const toInsert = uniqueLookupNumbers.filter(num => !existingTableNumbers.has(num));

    if (toInsert.length > 0) {
      const dataToInsert = toInsert.map(num => ({
        waiterId,
        tableNumber: num,
        businessId: waiter.restaurantId
      }));

      await prisma.waiterTableAssignment.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });
    }

    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter: previousWaiterName,
        currentWaiter: waiter.name,
        assignedBy: "Admin"
      }
    });

    await prisma.waiterNotification.create({
      data: {
        waiterId,
        orderId: 'N/A',
        title: 'New Table Assigned',
        message: `${cleanTableNum} has been assigned to you.`
      }
    });

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      waiterId,
      message: `${cleanTableNum} assigned to you.`
    });

    return res.status(200).json({ message: 'Table assigned successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const unassignTable = async (req: Request, res: Response) => {
  const { tableNumber } = req.body;
  if (!tableNumber) {
    return res.status(400).json({ error: 'tableNumber is required' });
  }
  try {
    const cleanTableNum = String(tableNumber).trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    const assignments = await prisma.waiterTableAssignment.findMany({
      where: {
        tableNumber: { in: lookupNumbers }
      },
      include: { waiter: true }
    });

    if (assignments.length === 0) {
      return res.status(400).json({ error: 'No assignments found for this table' });
    }

    const waiterName = assignments[0].waiter.name;

    await prisma.waiterTableAssignment.deleteMany({
      where: {
        tableNumber: { in: lookupNumbers }
      }
    });

    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter: waiterName,
        currentWaiter: "None",
        assignedBy: "Admin"
      }
    });

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `${cleanTableNum} unassigned.`
    });

    return res.status(200).json({ message: 'Table unassigned successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAssignmentHistory = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.tableAssignmentHistory.findMany({
      orderBy: { assignedAt: 'desc' }
    });
    return res.status(200).json(logs);
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
    const consolidatedItemsMap = new Map<string, any>();
    for (const it of items) {
      const key = it.menuItemId;
      if (consolidatedItemsMap.has(key)) {
        const existing = consolidatedItemsMap.get(key);
        existing.quantity += it.quantity;
      } else {
        consolidatedItemsMap.set(key, {
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        });
      }
    }
    const orderItemsData = Array.from(consolidatedItemsMap.values()).map((it: any) => {
      total += it.unitPrice * it.quantity;
      return it;
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

export const createKitchenOrder = async (req: Request, res: Response) => {
  const { tableId, source, items, notes, waiterId, waiterName, paymentMethod, paymentStatus } = req.body;
  try {
    let tableName = 'Takeaway';
    let existingOrder = null;

    if (tableId) {
      const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
      if (table) {
        tableName = table.tableNumber;
        if (table.activeOrderId) {
          existingOrder = await prisma.kitchenOrder.findUnique({
            where: { id: table.activeOrderId },
            include: { items: true }
          });
        }
      }
    }

    // Resolve waiter ID from name or ID
    let resolvedWaiterId = waiterId || null;
    if (!resolvedWaiterId && waiterName) {
      const waiter = await prisma.restaurantWaiter.findFirst({
        where: {
          name: {
            equals: waiterName,
            mode: 'insensitive'
          }
        }
      });
      if (waiter) {
        resolvedWaiterId = waiter.id;
      }
    }

    const kotNum = Math.floor(100 + Math.random() * 900);
    const kotLabel = `KOT-${kotNum}`;

    if (existingOrder) {
      // Append items to existing occupied table order
      let newTotal = existingOrder.totalAmount;
      const addedItems = [];

      for (const it of items) {
        let uPrice = it.unitPrice;
        if (uPrice === undefined || uPrice === null || isNaN(uPrice) || uPrice === 0) {
          const dbItem = await prisma.menuItem.findUnique({ where: { id: it.menuItemId } });
          uPrice = dbItem ? dbItem.price : 0;
        }

        newTotal += uPrice * it.quantity;
        const createdItem = await prisma.kitchenOrderItem.create({
          data: {
            kitchenOrderId: existingOrder.id,
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            notes: it.notes ? `[${kotLabel}] ${it.notes}` : `[${kotLabel}]`,
            unitPrice: uPrice
          },
          include: { menuItem: true }
        });
        addedItems.push(createdItem);
        await deductRecipeIngredients(it.menuItemId, it.quantity);
      }

      // Update order status back to NEW so kitchen displays it as a fresh order batch
      const updatedOrder = await prisma.kitchenOrder.update({
        where: { id: existingOrder.id },
        data: {
          totalAmount: newTotal,
          status: 'NEW',
          notes: notes ? (existingOrder.notes ? `${existingOrder.notes}; ${notes}` : notes) : existingOrder.notes,
          waiterId: resolvedWaiterId || existingOrder.waiterId
        },
        include: {
          items: { include: { menuItem: true } },
          table: true
        }
      });

      broadcast('NEW_ORDER', updatedOrder);
      return res.status(200).json(updatedOrder);
    }

    // Normal new order creation flow
    let total = 0;
    const consolidatedItemsMap = new Map<string, any>();
    for (const it of items) {
      const key = it.menuItemId;
      let uPrice = it.unitPrice;
      if (uPrice === undefined || uPrice === null || isNaN(uPrice) || uPrice === 0) {
        const dbItem = await prisma.menuItem.findUnique({ where: { id: it.menuItemId } });
        uPrice = dbItem ? dbItem.price : 0;
      }

      if (consolidatedItemsMap.has(key)) {
        const existing = consolidatedItemsMap.get(key);
        existing.quantity += it.quantity;
        if (it.notes) {
          existing.notes = existing.notes ? `${existing.notes}; ${it.notes}` : it.notes;
        }
      } else {
        consolidatedItemsMap.set(key, {
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          notes: it.notes ? `[${kotLabel}] ${it.notes}` : `[${kotLabel}]`,
          unitPrice: uPrice
        });
      }
    }
    const orderItemsData = Array.from(consolidatedItemsMap.values()).map((it: any) => {
      total += it.unitPrice * it.quantity;
      return it;
    });

    const order = await prisma.kitchenOrder.create({
      data: {
        tableId: tableId || null,
        source: source || 'WAITER',
        status: 'NEW',
        notes: notes || null,
        waiterId: resolvedWaiterId,
        totalAmount: total,
        paymentStatus: paymentStatus || 'PENDING',
        paymentMethod: paymentMethod || 'CASH',
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: {
          status: 'OCCUPIED',
          activeOrderId: order.id
        }
      });
    }

    for (const it of items) {
      await deductRecipeIngredients(it.menuItemId, it.quantity);
    }

    const fullOrder = await prisma.kitchenOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true,
        waiter: true
      }
    });

    broadcast('NEW_ORDER', fullOrder);

    return res.status(201).json(order);
  } catch (err: any) {
    console.error('Error in createKitchenOrder:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getRestaurantBillingHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.billingHistory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getTableHistoryLogs = async (req: Request, res: Response) => {
  const { tableNumber } = req.params;
  try {
    const cleanNum = tableNumber.replace('Table ', '');
    const bills = await prisma.billingHistory.findMany({
      where: {
        OR: [
          { tableNumber: `Table ${cleanNum}` },
          { tableNumber: cleanNum }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(bills);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const editWaiter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, mobile, role, status, employeeCode } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Mobile number must contain exactly 10 digits.' });
  }
  try {
    const waiter = await prisma.restaurantWaiter.update({
      where: { id },
      data: {
        name,
        mobile,
        role: role || undefined,
        status: status || undefined,
        employeeCode: employeeCode === null ? null : (employeeCode || undefined)
      }
    });
    return res.status(200).json(waiter);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteWaiter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transferToWaiterId, reason } = req.body;
  try {
    const waiter = await prisma.restaurantWaiter.findUnique({
      where: { id }
    });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }

    const assignments = await prisma.waiterTableAssignment.findMany({
      where: { waiterId: id }
    });

    if (transferToWaiterId && transferToWaiterId !== 'remove') {
      const targetWaiter = await prisma.restaurantWaiter.findUnique({
        where: { id: transferToWaiterId }
      });
      if (!targetWaiter) {
        return res.status(404).json({ error: 'Target waiter for transfer not found' });
      }

      // Transfer assignments
      for (const assignment of assignments) {
        // Check if target waiter already has this table assigned
        const alreadyAssigned = await prisma.waiterTableAssignment.findFirst({
          where: { waiterId: transferToWaiterId, tableNumber: assignment.tableNumber }
        });
        if (!alreadyAssigned) {
          await prisma.waiterTableAssignment.update({
            where: { id: assignment.id },
            data: { waiterId: transferToWaiterId }
          });
        } else {
          // Delete the redundant assignment
          await prisma.waiterTableAssignment.delete({
            where: { id: assignment.id }
          });
        }

        await prisma.tableAssignmentHistory.create({
          data: {
            tableNumber: assignment.tableNumber,
            previousWaiter: waiter.name,
            currentWaiter: targetWaiter.name,
            assignedBy: "Admin"
          }
        });
      }
    } else {
      // Remove assignments
      for (const assignment of assignments) {
        await prisma.tableAssignmentHistory.create({
          data: {
            tableNumber: assignment.tableNumber,
            previousWaiter: waiter.name,
            currentWaiter: "None",
            assignedBy: "Admin"
          }
        });
      }
      await prisma.waiterTableAssignment.deleteMany({
        where: { waiterId: id }
      });
    }

    // Delete waiter
    await prisma.restaurantWaiter.delete({
      where: { id }
    });

    // Write Audit Log
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const auditId = require('crypto').randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO audit_history (id, action, target_id, target_name, deleted_by, date, time, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      auditId,
      'DELETE_WAITER',
      id,
      waiter.name,
      'Admin',
      dateStr,
      timeStr,
      reason || 'Staff Resigned/No longer working'
    );

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `Waiter ${waiter.name} deleted.`
    });

    return res.status(200).json({ message: 'Waiter deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const editTable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tableNumber, capacity } = req.body;
  try {
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: {
        tableNumber,
        capacity: Number(capacity) || 4
      }
    });
    return res.status(200).json(table);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id }
    });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const cleanTableNum = table.tableNumber.trim();
    const digitMatch = cleanTableNum.match(/\d+/);
    const digit = digitMatch ? digitMatch[0] : null;
    const lookupNumbers = [cleanTableNum];
    if (digit) {
      lookupNumbers.push(digit);
      lookupNumbers.push(`Table ${digit}`);
    }

    // Find existing assignments to log previous waiter
    const assignments = await prisma.waiterTableAssignment.findMany({
      where: { tableNumber: { in: lookupNumbers } },
      include: { waiter: true }
    });

    let previousWaiter = "None";
    if (assignments.length > 0) {
      previousWaiter = assignments[0].waiter.name;
    }

    // Delete assignments
    await prisma.waiterTableAssignment.deleteMany({
      where: { tableNumber: { in: lookupNumbers } }
    });

    // Write assignment history
    await prisma.tableAssignmentHistory.create({
      data: {
        tableNumber: cleanTableNum,
        previousWaiter,
        currentWaiter: "None",
        assignedBy: "Admin"
      }
    });

    // Delete table
    await prisma.restaurantTable.delete({
      where: { id }
    });

    // Write Audit Log
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const auditId = require('crypto').randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO audit_history (id, action, target_id, target_name, deleted_by, date, time, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      auditId,
      'DELETE_TABLE',
      id,
      table.tableNumber,
      'Admin',
      dateStr,
      timeStr,
      reason || 'Removed from layout'
    );

    broadcast('NOTIFICATION', {
      type: 'TABLE_ASSIGNMENT_CHANGE',
      message: `Table ${table.tableNumber} deleted.`
    });

    return res.status(200).json({ message: 'Table deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const seedDummyReadyOrders = async (req: Request, res: Response) => {
  try {
    // 1. Get or create a restaurant
    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: 'Central Diner',
          type: 'RESTAURANT',
          address: '123 Main St'
        }
      });
    }
    const restId = restaurant.id;

    // 2. Create standard waiters Rahul, Akshay, Ritesh, Adesh if they don't exist
    const waiterMap: Record<string, string> = {};
    const waiterNames = ['Rahul', 'Akshay', 'Ritesh', 'Adesh'];
    for (const name of waiterNames) {
      let waiter = await prisma.restaurantWaiter.findFirst({
        where: { name, restaurantId: restId }
      });
      if (!waiter) {
        const lastDigit = name === 'Rahul' ? '0' : name === 'Akshay' ? '3' : name === 'Ritesh' ? '2' : '4';
        waiter = await prisma.restaurantWaiter.create({
          data: {
            restaurantId: restId,
            name,
            mobile: '987654321' + lastDigit,
            employeeCode: name === 'Rahul' ? 'WT001' : name === 'Ritesh' ? 'WT002' : name === 'Akshay' ? 'WT003' : 'WT004',
            email: name.toLowerCase() + '@restaurant.com',
            status: 'ACTIVE'
          }
        });
      }
      waiterMap[name] = waiter.id;
    }

    // 3. Create tables T1 to T20 and assignments
    const tablesMap: Record<string, string> = {};
    const tableAssignments = [
      { num: '1', waiter: 'Rahul' },
      { num: '2', waiter: 'Rahul' },
      { num: '3', waiter: 'Akshay' },
      { num: '4', waiter: 'Ritesh' },
      { num: '5', waiter: 'Akshay' },
      { num: '6', waiter: 'Akshay' },
      { num: '7', waiter: 'Ritesh' },
      { num: '8', waiter: 'Ritesh' },
      { num: '9', waiter: 'Rahul' },
      { num: '10', waiter: 'Akshay' },
      { num: '11', waiter: 'Ritesh' },
      { num: '12', waiter: 'Adesh' },
      { num: '13', waiter: 'Rahul' },
      { num: '14', waiter: 'Akshay' },
      { num: '15', waiter: 'Ritesh' },
      { num: '16', waiter: 'Adesh' },
      { num: '17', waiter: 'Rahul' },
      { num: '18', waiter: 'Akshay' },
      { num: '19', waiter: 'Ritesh' },
      { num: '20', waiter: 'Adesh' }
    ];

    for (const item of tableAssignments) {
      const tableNumber = `Table ${item.num}`;
      let table = await prisma.restaurantTable.findFirst({
        where: { tableNumber, restaurantId: restId }
      });
      if (!table) {
        table = await prisma.restaurantTable.create({
          data: {
            restaurantId: restId,
            tableNumber,
            capacity: 4,
            status: 'AVAILABLE'
          }
        });
      }
      tablesMap[item.num] = table.id;

      // Ensure assignment exists
      const waiterId = waiterMap[item.waiter];
      const existingAssign = await prisma.waiterTableAssignment.findFirst({
        where: { waiterId, tableNumber }
      });
      if (!existingAssign) {
        await prisma.waiterTableAssignment.create({
          data: {
            waiterId,
            tableNumber,
            businessId: restId
          }
        });
      }
    }

    // 4. Create Menu Category if not exists
    let category = await prisma.menuCategory.findFirst({
      where: { restaurantId: restId }
    });
    if (!category) {
      category = await prisma.menuCategory.create({
        data: {
          restaurantId: restId,
          name: 'Main Course'
        }
      });
    }

    // 5. Create Menu Items if not exist
    const itemsData = [
      { name: 'Fish Fry', price: 220 },
      { name: 'Roti', price: 15 },
      { name: 'Water Bottle', price: 20 },
      { name: 'Paneer Masala', price: 180 },
      { name: 'Butter Naan', price: 40 },
      { name: 'Chicken Biryani', price: 250 },
      { name: 'Coke', price: 40 },
      { name: 'Veg Crispy', price: 160 },
      { name: 'Manchurian', price: 150 },
      { name: 'Pomfret Fry', price: 320 },
      { name: 'Jeera Rice Full', price: 120 },
      { name: 'Garlic Bread', price: 99 },
      { name: 'Chicken Kadai', price: 240 },
      { name: 'Butter Roti', price: 20 },
      { name: 'Veg Fried Rice', price: 140 },
      { name: 'Sprite', price: 40 },
      { name: 'Margherita Pizza', price: 299 },
      { name: 'Pepsi', price: 40 },
      { name: 'Paneer Butter Masala', price: 220 },
      { name: 'Lassi', price: 60 },
      { name: 'Paneer Tikka', price: 199 },
      { name: 'Prawns Masala', price: 280 },
      { name: 'Hakka Noodles', price: 150 },
      { name: 'Cheese Burger', price: 140 },
      { name: 'Chicken Burger', price: 160 },
      { name: 'Chicken Pizza', price: 349 },
      { name: 'French Fries', price: 90 }
    ];

    const menuItemsMap: Record<string, string> = {};
    for (const item of itemsData) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id }
      });
      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            price: item.price,
            status: 'AVAILABLE'
          }
        });
      }
      menuItemsMap[item.name] = menuItem.id;
    }

    // 6. Delete existing orders & service tasks to avoid bloat
    const existingOrders = await prisma.kitchenOrder.findMany();
    const orderIdsToDelete = existingOrders.map(o => o.id);
    if (orderIdsToDelete.length > 0) {
      await prisma.serviceTask.deleteMany({
        where: { orderId: { in: orderIdsToDelete } }
      });
      await prisma.kitchenOrderItem.deleteMany({
        where: { kitchenOrderId: { in: orderIdsToDelete } }
      });
      await prisma.kitchenOrder.deleteMany({
        where: { id: { in: orderIdsToDelete } }
      });
    }

    // Reset table statuses and activeOrderIds first
    await prisma.restaurantTable.updateMany({
      where: { restaurantId: restId },
      data: {
        status: 'AVAILABLE',
        activeOrderId: null
      }
    });

    // 7. Insert the 4 specific dummy orders matching requirements exactly
    const dummyOrders = [
      {
        tableNum: '1',
        waiter: 'Rahul',
        status: 'READY',
        items: [
          { name: 'Chicken Biryani', qty: 2 },
          { name: 'Coke', qty: 2 }
        ]
      },
      {
        tableNum: '2',
        waiter: 'Rahul',
        status: 'PREPARING',
        items: [
          { name: 'Paneer Tikka', qty: 1 },
          { name: 'Butter Naan', qty: 3 }
        ]
      },
      {
        tableNum: '3',
        waiter: 'Akshay',
        status: 'SERVED',
        items: [
          { name: 'Fish Fry', qty: 2 },
          { name: 'Roti', qty: 4 }
        ]
      },
      {
        tableNum: '4',
        waiter: 'Ritesh',
        status: 'SERVED',
        items: [
          { name: 'Veg Crispy', qty: 1 },
          { name: 'Manchurian', qty: 1 }
        ]
      }
    ];

    for (const dOrder of dummyOrders) {
      const waiterId = waiterMap[dOrder.waiter];
      const tableId = tablesMap[dOrder.tableNum];
      const tableNumber = `Table ${dOrder.tableNum}`;

      // Calculate total amount
      let totalAmount = 0;
      const orderItemsData = dOrder.items.map(it => {
        const menuItemId = menuItemsMap[it.name];
        const menuItem = itemsData.find(i => i.name === it.name);
        const unitPrice = menuItem ? menuItem.price : 0;
        totalAmount += unitPrice * it.qty;

        return {
          menuItemId,
          quantity: it.qty,
          unitPrice
        };
      });

      const orderIdx = dummyOrders.indexOf(dOrder);
      const now = new Date();
      const createdAtTime = new Date(now.getTime() - (orderIdx * 2 * 60 * 1000) - 10 * 60 * 1000);
      const readyAtTime = dOrder.status === 'READY' ? new Date(createdAtTime.getTime() + 8 * 60 * 1000) : null;

      const kOrder = await prisma.kitchenOrder.create({
        data: {
          tableId,
          waiterId,
          status: dOrder.status,
          createdAt: createdAtTime,
          acceptedAt: dOrder.status !== 'NEW' ? new Date(createdAtTime.getTime() + 2 * 60 * 1000) : null,
          preparingAt: dOrder.status !== 'NEW' ? new Date(createdAtTime.getTime() + 2 * 60 * 1000) : null,
          readyAt: readyAtTime,
          totalAmount,
          items: {
            create: orderItemsData
          }
        }
      });

      // Update table to link activeOrderId and set corresponding table status
      let tableStatus = 'AVAILABLE';
      if (dOrder.status === 'NEW' || dOrder.status === 'ACCEPTED') {
        tableStatus = 'OCCUPIED';
      } else if (dOrder.status === 'PREPARING') {
        tableStatus = 'COOKING';
      } else if (dOrder.status === 'READY') {
        tableStatus = 'READY';
      } else if (dOrder.status === 'SERVED' || dOrder.status === 'SERVING') {
        tableStatus = 'SERVED';
      }

      if (dOrder.tableNum === '4') {
        tableStatus = 'BILLING_PENDING';
      }

      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: {
          status: tableStatus,
          activeOrderId: kOrder.id
        }
      });

      // If status is READY, create ServiceTask & WaiterNotification
      if (dOrder.status === 'READY') {
        const readyTime = readyAtTime || new Date();
        await prisma.serviceTask.create({
          data: {
            orderId: kOrder.id,
            tableNumber,
            waiterId,
            status: 'ready',
            assignedAt: readyTime
          }
        });

        await prisma.waiterNotification.create({
          data: {
            waiterId,
            orderId: kOrder.id,
            title: 'Order Ready',
            message: `${tableNumber} - Order Ready`
          }
        });
      }
    }

    // Broadcast updates to reload KDS and Waiter Console
    broadcast('NEW_ORDER', {
      type: 'SEED_NEW_ORDERS',
      message: 'Seeded new orders'
    });
    broadcast('NEW_SERVICE_TASK', {
      type: 'SEED_READY_ORDERS',
      message: 'Seeded dummy ready orders'
    });

    return res.status(200).json({ message: 'Dummy orders seeded successfully for T1-T4 matching your test scenario!' });
  } catch (err: any) {
    console.error('Seeding error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const settleTableBill = async (req: Request, res: Response) => {
  const { tableId, paymentMethod, discount, serviceCharge, tax, customerId, cashierName, customerMobile } = req.body;
  try {
    if (!tableId) {
      return res.status(400).json({ message: 'tableId is required' });
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (!table.activeOrderId) {
      return res.status(400).json({ message: 'No active order for this table' });
    }

    const kitchenOrder = await prisma.kitchenOrder.findUnique({
      where: { id: table.activeOrderId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        waiter: true
      }
    });

    if (!kitchenOrder) {
      return res.status(404).json({ message: 'Active kitchen order not found' });
    }

    const subtotal = kitchenOrder.totalAmount;
    const discAmount = parseFloat(String(discount || 0));
    const scAmount = parseFloat(String(serviceCharge || 0));
    const taxAmount = parseFloat(String(tax || 0));
    const totalPayable = Math.max(0, subtotal - discAmount + scAmount + taxAmount);

    const defaultBranch = await prisma.branch.findFirst();
    const branchId = defaultBranch ? defaultBranch.id : null;
    const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
    const cashierId = defaultUser ? defaultUser.id : 'default-cashier';

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Settle Order and save POS models
    const posOrderItems = [];
    for (const it of kitchenOrder.items) {
      const itemName = it.menuItem?.name || 'Restaurant Dish';
      const itemPrice = it.menuItem?.price || it.unitPrice;

      let product = await prisma.product.findFirst({ where: { name: itemName } });
      if (!product) {
        let category = await prisma.category.findFirst({ where: { name: 'Restaurant Menu' } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: 'Restaurant Menu', status: 'Active' }
          });
        }
        product = await prisma.product.create({
          data: {
            name: itemName,
            sku: `REST-${it.menuItemId.slice(0, 8).toUpperCase()}`,
            sellingPrice: itemPrice,
            costPrice: itemPrice * 0.5,
            categoryId: category.id,
            status: 'IN_STOCK'
          }
        });
      }

      posOrderItems.push({
        productId: product.id,
        quantity: it.quantity,
        unitPrice: itemPrice,
        discount: 0,
        total: itemPrice * it.quantity
      });
    }

    const posOrder = await prisma.order.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        branchId,
        cashierId,
        subtotal,
        discount: discAmount,
        tax: taxAmount,
        totalPayable,
        status: 'COMPLETED',
        paymentMethod: paymentMethod || 'CASH',
        items: {
          create: posOrderItems
        }
      }
    });

    const qrToken = crypto.randomUUID();
    const invoiceUrl = `/invoice/${invoiceNumber}?token=${qrToken}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: posOrder.id,
        invoiceType: 'GST',
        qrToken,
        invoiceUrl
      }
    });

    await prisma.payment.create({
      data: {
        orderId: posOrder.id,
        invoiceId: invoice.id,
        amount: totalPayable,
        paymentMethod: paymentMethod || 'CASH',
        status: 'SUCCESS',
        cashierId
      }
    });

    // Create PDF Invoice
    const publicInvoicesDir = path.join(__dirname, '..', '..', 'public', 'invoices');
    if (!fs.existsSync(publicInvoicesDir)) {
      fs.mkdirSync(publicInvoicesDir, { recursive: true });
    }

    const pdfPath = path.join(publicInvoicesDir, `${invoiceNumber}.pdf`);
    const doc = new PDFDocument({ margin: 30 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('GOURMET BISTRO', { align: 'center' });
    doc.fontSize(9).text('123 Main St, Central Diner', { align: 'center' });
    doc.text('GSTIN: 27AAAAA1111A1Z1', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(10).text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Order Number: ${posOrder.id.slice(-6).toUpperCase()}`);
    doc.text(`Table Number: ${table.tableNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
    doc.text(`Payment Method: ${paymentMethod}`);
    doc.moveDown(1);

    doc.text('-----------------------------------------------------------------------------------');
    doc.text('Item Description                     Qty       Unit Price      Total');
    doc.text('-----------------------------------------------------------------------------------');

    for (const it of kitchenOrder.items) {
      const name = it.menuItem?.name || 'Dish';
      const line = `${name.padEnd(35)} ${String(it.quantity).padEnd(9)} ₹${String(it.unitPrice).padEnd(14)} ₹${String(it.unitPrice * it.quantity)}`;
      doc.text(line);
    }

    doc.text('-----------------------------------------------------------------------------------');
    doc.moveDown(0.5);
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, { align: 'right' });
    if (discAmount > 0) doc.text(`Discount: -₹${discAmount.toFixed(2)}`, { align: 'right' });
    if (scAmount > 0) doc.text(`Service Charge: ₹${scAmount.toFixed(2)}`, { align: 'right' });
    doc.text(`GST (${taxAmount > 0 ? '18%' : '0%'}): ₹${taxAmount.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).text(`Grand Total Paid: ₹${totalPayable.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for dining with us!', { align: 'center' });

    doc.end();

    const pdfUrl = `/public/invoices/${invoiceNumber}.pdf`;
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl }
    });

    // Update table status to AVAILABLE and clear activeOrderId
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status: 'AVAILABLE',
        activeOrderId: null
      }
    });

    // Update KitchenOrder status to PAID / COMPLETED
    await prisma.kitchenOrder.update({
      where: { id: kitchenOrder.id },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        status: 'SERVED'
      }
    });

    // Update waiter stats
    if (kitchenOrder.waiterId) {
      await prisma.restaurantWaiter.update({
        where: { id: kitchenOrder.waiterId },
        data: {
          ordersServed: { increment: 1 },
          salesHandled: { increment: totalPayable }
        }
      });
    }

    // Save to BillingHistory model
    const itemsStr = kitchenOrder.items.map(it => `${it.menuItem?.name || 'Dish'} x ${it.quantity}`).join(', ');
    const history = await prisma.billingHistory.create({
      data: {
        invoiceNumber,
        tableNumber: table.tableNumber,
        orderSource: kitchenOrder.source || 'WALK_IN',
        paymentMode: paymentMethod || 'CASH',
        items: itemsStr,
        totalAmount: totalPayable,
        gst: taxAmount,
        waiterName: kitchenOrder.waiter?.name || 'Self Service',
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      }
    });

    broadcast('NOTIFICATION', {
      type: 'TABLE_STATUS_CHANGE',
      tableId,
      status: 'AVAILABLE',
      message: `${table.tableNumber} bill settled.`
    });

    return res.status(200).json({
      success: true,
      message: 'Bill settled and table is now in AVAILABLE status.',
      invoice: {
        invoiceNumber,
        pdfUrl,
        totalAmount: totalPayable
      },
      history
    });
  } catch (err: any) {
    console.error('Error settling table bill:', err);
    return res.status(500).json({ error: err.message });
  }
};

// 12. EMPLOYEE MANAGEMENT
async function seedThirtyEmployees(restaurantId: string) {
  const count = await prisma.employee.count({ where: { restaurantId } });
  if (count >= 30) return;

  console.log('[SEED] Starting automatic seed of 30 restaurant employees...');

  // 1. Ensure we have shifts
  const shiftData = [
    { name: 'Morning', startTime: '09:00 AM', endTime: '05:00 PM', breakTime: '30 mins' },
    { name: 'Evening', startTime: '05:00 PM', endTime: '01:00 AM', breakTime: '30 mins' },
    { name: 'Night', startTime: '10:00 PM', endTime: '06:00 AM', breakTime: '30 mins' },
    { name: 'General', startTime: '10:00 AM', endTime: '07:00 PM', breakTime: '1 hour' }
  ];

  for (const s of shiftData) {
    await prisma.employeeShift.upsert({
      where: { name: s.name },
      update: {},
      create: {
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        breakTime: s.breakTime,
        applicableRoles: ['Waiter', 'Senior Waiter', 'Captain', 'Chef', 'Head Chef', 'Sous Chef', 'Kitchen Staff', 'Helper', 'Cashier', 'Billing Executive', 'Manager', 'Assistant Manager', 'Inventory Manager', 'Store Keeper', 'Cleaner', 'Housekeeping', 'Security Guard', 'Supervisor'],
        restaurantId
      }
    });
  }

  // 2. Define 30 employees
  const staff = [
    // 6 Waiters / Service
    { name: 'Anushka Kanherkar', role: 'Waiter', dept: 'Service', salary: 18000, shift: 'Morning' },
    { name: 'Rahul Sharma', role: 'Senior Waiter', dept: 'Service', salary: 22000, shift: 'Evening' },
    { name: 'Priya Patel', role: 'Waiter', dept: 'Service', salary: 19000, shift: 'Morning' },
    { name: 'Amit Mishra', role: 'Captain', dept: 'Service', salary: 25000, shift: 'General' },
    { name: 'Sneha Reddy', role: 'Waiter', dept: 'Service', salary: 18500, shift: 'Evening' },
    { name: 'Vikram Malhotra', role: 'Senior Waiter', dept: 'Service', salary: 21000, shift: 'General' },
    
    // 6 Kitchen Staff
    { name: 'Sanjay Dutt', role: 'Kitchen Staff', dept: 'Kitchen', salary: 22000, shift: 'Morning' },
    { name: 'Pooja Hegde', role: 'Helper', dept: 'Kitchen', salary: 16000, shift: 'Evening' },
    { name: 'Rohan Joshi', role: 'Kitchen Staff', dept: 'Kitchen', salary: 22500, shift: 'Morning' },
    { name: 'Neha Sen', role: 'Helper', dept: 'Kitchen', salary: 16500, shift: 'General' },
    { name: 'Arjun Kapoor', role: 'Kitchen Staff', dept: 'Kitchen', salary: 21500, shift: 'Night' },
    { name: 'Kriti Sanon', role: 'Kitchen Staff', dept: 'Kitchen', salary: 23000, shift: 'Evening' },

    // 4 Chefs
    { name: 'Chef Vikas Khanna', role: 'Head Chef', dept: 'Kitchen', salary: 85000, shift: 'General' },
    { name: 'Chef Ranveer Brar', role: 'Sous Chef', dept: 'Kitchen', salary: 65000, shift: 'Evening' },
    { name: 'Chef Kunal Kapur', role: 'Chef', dept: 'Kitchen', salary: 55000, shift: 'Morning' },
    { name: 'Chef Garima Arora', role: 'Chef', dept: 'Kitchen', salary: 58000, shift: 'General' },

    // 3 Cashiers / Billing
    { name: 'Rajesh Kumar', role: 'Cashier', dept: 'Billing', salary: 25000, shift: 'General' },
    { name: 'Sunita Gupta', role: 'Billing Executive', dept: 'Billing', salary: 22000, shift: 'Morning' },
    { name: 'Anil Mehta', role: 'Cashier', dept: 'Billing', salary: 26000, shift: 'Evening' },

    // 3 Managers
    { name: 'Vikram Singh', role: 'Manager', dept: 'Management', salary: 80000, shift: 'General' },
    { name: 'Meera Nair', role: 'Assistant Manager', dept: 'Management', salary: 60000, shift: 'General' },
    { name: 'Kavita Rao', role: 'Manager', dept: 'Management', salary: 78000, shift: 'Evening' },

    // 3 Inventory
    { name: 'Ramesh Patil', role: 'Inventory Manager', dept: 'Inventory', salary: 30000, shift: 'General' },
    { name: 'Suresh Iyer', role: 'Store Keeper', dept: 'Inventory', salary: 22000, shift: 'Morning' },
    { name: 'Divya Teja', role: 'Inventory Manager', dept: 'Inventory', salary: 32000, shift: 'General' },

    // 3 Cleaning Staff
    { name: 'Raju Prasad', role: 'Cleaner', dept: 'Cleaning', salary: 14000, shift: 'Morning' },
    { name: 'Sham Lal', role: 'Housekeeping', dept: 'Cleaning', salary: 15000, shift: 'Evening' },
    { name: 'Geeta Devi', role: 'Cleaner', dept: 'Cleaning', salary: 14500, shift: 'General' },

    // 2 Security Staff
    { name: 'Balwan Singh', role: 'Security Guard', dept: 'Security', salary: 17005, shift: 'Night' },
    { name: 'Jaggu Dada', role: 'Supervisor', dept: 'Security', salary: 22000, shift: 'Night' }
  ];

  // Fetch some tables to assign to waiters
  const tables = await prisma.restaurantTable.findMany({ where: { restaurantId }, take: 15 });

  let empIndex = 1;
  for (const s of staff) {
    const employeeId = 'EMP-' + String(1000 + empIndex).padStart(4, '0');
    const phone = '98765' + String(10000 + empIndex);
    const email = `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@restaurant.com`;
    
    // Safety check: Skip if employee already exists with employeeId, phone, or email
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId },
          { phone },
          { email }
        ]
      }
    });
    if (existing) {
      empIndex++;
      continue;
    }

    // Ensure user exists for this email to support employee login
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      let dbRole: 'ADMIN' | 'MANAGER' | 'CASHIER' = 'CASHIER';
      if (s.role === 'Manager') {
        dbRole = 'MANAGER';
      } else if (s.role === 'Head Chef' || s.role === 'Inventory Manager') {
        dbRole = 'MANAGER';
      }
      
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      const businessName = restaurant ? restaurant.name : 'My Restaurant';
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: s.name,
          role: dbRole,
          mobile: phone,
          status: 'Active',
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${s.name.replace(/\s+/g, '')}`,
          businessType: 'Restaurant',
          businessName,
          branchId: null
        }
      });
    }

    // Create Employee
    const emp = await prisma.employee.create({
      data: {
        employeeId,
        name: s.name,
        phone,
        email,
        department: s.dept,
        role: s.role,
        joiningDate: new Date(Date.now() - (empIndex * 5 * 24 * 60 * 60 * 1000)), // staggered joining
        shift: s.shift,
        employmentType: 'Full-time',
        salary: s.salary,
        status: 'Active',
        restaurantId,
        userId: user.id
      }
    });

    // Create Waiter Profile if Waiter
    if (['Waiter', 'Senior Waiter', 'Captain'].includes(s.role)) {
      const waiter = await prisma.restaurantWaiter.create({
        data: {
          restaurantId,
          name: s.name,
          mobile: phone,
          employeeCode: employeeId,
          email,
          status: 'ACTIVE',
          employeeId: emp.id,
          ordersServed: Math.floor(Math.random() * 80) + 10,
          salesHandled: Math.floor(Math.random() * 15000) + 2000
        }
      });

      // Assign 1-2 tables
      const tableCount = tables.length;
      if (tableCount > 0) {
        const table1 = tables[(empIndex) % tableCount];
        const table2 = tables[(empIndex + 1) % tableCount];
        
        await prisma.waiterTableAssignment.createMany({
          data: [
            { waiterId: waiter.id, tableNumber: table1.tableNumber, businessId: restaurantId },
            { waiterId: waiter.id, tableNumber: table2.tableNumber, businessId: restaurantId }
          ]
        });
      }
    }

    // Seed Attendance for past 10 days
    const attendanceRecords = [];
    for (let d = 0; d < 10; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0,0,0,0);

      // Random status
      let status = 'Present';
      let checkIn: string | null = '09:02 AM';
      let checkOut: string | null = '05:05 PM';
      let workHours = 8.0;
      let overtime = 0.0;

      const rand = Math.random();
      if (rand > 0.9) {
        status = 'Absent';
        checkIn = null;
        checkOut = null;
        workHours = 0;
      } else if (rand > 0.8) {
        status = 'Late';
        checkIn = '09:45 AM';
        workHours = 7.25;
      } else if (rand > 0.75) {
        status = 'Half Day';
        checkIn = '09:00 AM';
        checkOut = '01:00 PM';
        workHours = 4.0;
      } else if (rand > 0.7) {
        status = 'Leave';
        checkIn = null;
        checkOut = null;
        workHours = 0;
      } else if (Math.random() > 0.5) {
        // Normal day with overtime
        overtime = Math.random() > 0.7 ? 1.5 : 0.0;
        workHours = 8.0 + overtime;
        checkOut = overtime > 0 ? '06:30 PM' : '05:00 PM';
      }

      attendanceRecords.push({
        employeeId: emp.id,
        date,
        status,
        checkIn,
        checkOut,
        workHours,
        overtime,
        notes: status === 'Late' ? 'Late arrival' : (status === 'Half Day' ? 'Doctor appointment' : null)
      });
    }
    await prisma.employeeAttendance.createMany({ data: attendanceRecords });

    // Seed 1-2 Leaves
    await prisma.employeeLeave.create({
      data: {
        employeeId: emp.id,
        leaveType: 'Sick Leave',
        reason: 'Fever and cold',
        startDate: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)),
        endDate: new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)),
        status: Math.random() > 0.5 ? 'Approved' : 'Rejected',
        restaurantId
      }
    });

    if (Math.random() > 0.7) {
      await prisma.employeeLeave.create({
        data: {
          employeeId: emp.id,
          leaveType: 'Casual Leave',
          reason: 'Family function',
          startDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + (6 * 24 * 60 * 60 * 1000)),
          status: 'Pending',
          restaurantId
        }
      });
    }

    // Seed Salaries for past 2 months
    const months = [
      { name: 'May 2026', date: new Date('2026-05-31'), status: 'Paid' },
      { name: 'June 2026', date: new Date('2026-06-30'), status: Math.random() > 0.3 ? 'Paid' : 'Unpaid' }
    ];

    for (const m of months) {
      const basic = s.salary;
      const allowances = Math.floor(basic * 0.1);
      const deductions = Math.floor(basic * 0.05);
      const otAmt = Math.random() > 0.5 ? 1200 : 0;
      const bonus = Math.random() > 0.8 ? 2000 : 0;
      const net = basic + allowances + otAmt + bonus - deductions;

      await prisma.employeeSalary.create({
        data: {
          employeeId: emp.id,
          basicSalary: basic,
          allowances,
          deductions,
          overtime: otAmt,
          bonus,
          netSalary: net,
          paymentStatus: m.status,
          paymentDate: m.status === 'Paid' ? m.date : null,
          restaurantId,
          createdAt: m.date
        }
      });
    }

    // Seed Activity Logs
    await prisma.employeeActivity.createMany({
      data: [
        { employeeId: emp.id, action: 'Profile Created', details: `Registered as ${s.role} in ${s.dept} department.`, timestamp: emp.createdAt },
        { employeeId: emp.id, action: 'Shift Assigned', details: `Assigned to ${s.shift} shift.`, timestamp: new Date(emp.createdAt.getTime() + 60000) }
      ]
    });

    empIndex++;
  }

  console.log(`[SEED] Successfully seeded ${empIndex - 1} employees.`);
}

export const getEmployees = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: 'restaurantId is required' });
  }

  try {
    const restId = await getActualRestaurantId(restaurantId);
    
    // Auto-seed if database doesn't have 30 employees yet
    await seedThirtyEmployees(restId);

    const employees = await prisma.employee.findMany({
      where: { restaurantId: restId },
      include: {
        waiterProfile: {
          include: {
            tableAssignments: true
          }
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(employees);
  } catch (err: any) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  const {
    restaurantId,
    name,
    phone,
    email,
    department,
    role,
    joiningDate,
    shift,
    employmentType,
    salary,
    notes,
    createLogin,
    password,
    photo
  } = req.body;

  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must contain exactly 10 digits.' });
  }

  if (salary && parseFloat(salary) < 0) {
    return res.status(400).json({ error: 'Salary cannot be a negative value.' });
  }

  const join = new Date(joiningDate || Date.now());
  if (join > new Date()) {
    return res.status(400).json({ error: 'Joining date cannot be in the future.' });
  }

  try {
    const restId = await getActualRestaurantId(restaurantId);

    // Check unique phone/email
    const existingPhone = await prisma.employee.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'An employee with this phone number already exists.' });
    }

    if (email) {
      const existingEmail = await prisma.employee.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'An employee with this email address already exists.' });
      }
    }

    // Generate Employee ID
    const count = await prisma.employee.count();
    const employeeId = 'EMP-' + String(1001 + count).padStart(4, '0');

    let userId: string | undefined;

    if (createLogin && email && password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      let userRole: 'ADMIN' | 'MANAGER' | 'CASHIER' = 'CASHIER';
      if (role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'MANAGER') {
        userRole = role.toUpperCase() as any;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'A login account with this email already exists.' });
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
          mobile: phone,
          status: 'Active',
          businessType: 'Restaurant',
          avatar: photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s+/g, '')}`
        }
      });
      userId = user.id;
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        phone,
        email: email || undefined,
        department,
        role,
        joiningDate: join,
        shift: shift || 'General',
        employmentType: employmentType || 'Full-time',
        salary: salary ? parseFloat(salary) : null,
        notes,
        photo: photo || null,
        restaurantId: restId,
        userId
      }
    });

    if (['Waiter', 'Senior Waiter', 'Captain'].includes(role)) {
      await prisma.restaurantWaiter.create({
        data: {
          restaurantId: restId,
          name,
          mobile: phone,
          employeeCode: employeeId,
          email: email || undefined,
          status: 'ACTIVE',
          employeeId: employee.id
        }
      });
    }

    await prisma.employeeActivity.create({
      data: {
        employeeId: employee.id,
        action: 'Profile Created',
        details: `Employee profile registered as ${role} in ${department} department.`
      }
    });

    return res.status(201).json(employee);
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const editEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    phone,
    email,
    department,
    role,
    joiningDate,
    shift,
    employmentType,
    salary,
    notes,
    photo
  } = req.body;

  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must contain exactly 10 digits.' });
  }

  if (salary && parseFloat(salary) < 0) {
    return res.status(400).json({ error: 'Salary cannot be a negative value.' });
  }

  if (joiningDate) {
    const join = new Date(joiningDate);
    if (join > new Date()) {
      return res.status(400).json({ error: 'Joining date cannot be in the future.' });
    }
  }

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { waiterProfile: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (phone && phone !== existing.phone) {
      const existingPhone = await prisma.employee.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'An employee with this phone number already exists.' });
      }
    }

    if (email && email !== existing.email) {
      const existingEmail = await prisma.employee.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'An employee with this email address already exists.' });
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        phone,
        email: email || undefined,
        department,
        role,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        shift,
        employmentType,
        salary: salary ? parseFloat(salary) : null,
        notes,
        photo: photo !== undefined ? photo : undefined
      }
    });

    if (updated.userId && photo) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: { avatar: photo }
      });
    }

    if (['Waiter', 'Senior Waiter', 'Captain'].includes(role)) {
      if (existing.waiterProfile) {
        await prisma.restaurantWaiter.update({
          where: { id: existing.waiterProfile.id },
          data: {
            name,
            mobile: phone || existing.phone,
            email: email || undefined
          }
        });
      } else {
        await prisma.restaurantWaiter.create({
          data: {
            restaurantId: existing.restaurantId,
            name,
            mobile: phone || existing.phone,
            employeeCode: existing.employeeId,
            email: email || undefined,
            status: 'ACTIVE',
            employeeId: id
          }
        });
      }
    } else {
      if (existing.waiterProfile) {
        await prisma.restaurantWaiter.delete({
          where: { id: existing.waiterProfile.id }
        });
      }
    }

    await prisma.employeeActivity.create({
      data: {
        employeeId: id,
        action: 'Profile Updated',
        details: `Employee profile updated. Department: ${department}, Role: ${role}.`
      }
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Error updating employee:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true, waiterProfile: true }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (employee.userId) {
      await prisma.user.delete({ where: { id: employee.userId } });
    }

    if (employee.waiterProfile) {
      await prisma.restaurantWaiter.delete({ where: { id: employee.waiterProfile.id } });
    }

    await prisma.employee.delete({ where: { id } });

    return res.status(200).json({ message: 'Employee profile deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting employee:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const resetAndSeedEmployees = async (req: Request, res: Response) => {
  const { restaurantId } = req.body;
  if (!restaurantId) {
    return res.status(400).json({ error: 'restaurantId is required' });
  }

  try {
    const restId = await getActualRestaurantId(restaurantId);

    // Get all employees to delete their linked users and waiter profiles manually
    const allEmployees = await prisma.employee.findMany({
      where: { restaurantId: restId }
    });

    const userIds = allEmployees.map(e => e.userId).filter(Boolean) as string[];
    
    // Delete linked users
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }

    // Delete linked waiter profiles (which will cascade to waiter table assignments, etc.)
    await prisma.restaurantWaiter.deleteMany({
      where: { restaurantId: restId }
    });

    // Delete all employee records (which will cascade to attendance, leaves, salaries, activities)
    await prisma.employee.deleteMany({
      where: { restaurantId: restId }
    });

    // Run seed to create 30 new employees with the synchronized roles
    await seedThirtyEmployees(restId);

    return res.status(200).json({
      success: true,
      message: 'Successfully reset and seeded employee database with 30 synchronized roles.'
    });
  } catch (err: any) {
    console.error('Error resetting employee database:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getEmployeeStats = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: 'restaurantId is required' });
  }

  try {
    const restId = await getActualRestaurantId(restaurantId);
    
    await seedThirtyEmployees(restId);

    const totalEmployees = await prisma.employee.count({
      where: { restaurantId: restId }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // On Duty = Present today
    const presentToday = await prisma.employeeAttendance.count({
      where: {
        employee: { restaurantId: restId },
        date: { gte: today },
        status: 'Present'
      }
    });

    // Leave Requests = Pending leaves
    const leaveRequests = await prisma.employeeLeave.count({
      where: {
        restaurantId: restId,
        status: 'Pending'
      }
    });

    // Salary Processing = Unpaid salaries in current month
    const salaryProcessing = await prisma.employeeSalary.count({
      where: {
        restaurantId: restId,
        paymentStatus: 'Unpaid'
      }
    });

    const recentActivities = await prisma.employeeActivity.findMany({
      where: { employee: { restaurantId: restId } },
      orderBy: { timestamp: 'desc' },
      take: 15,
      include: {
        employee: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      totalEmployees,
      activeEmployees: presentToday, // maps to "On Duty"
      presentToday,
      onLeaveToday: leaveRequests, // maps to "Leave Requests"
      salaryProcessing,
      recentActivities
    });
  } catch (err: any) {
    console.error('Error fetching employee stats:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getEmployeeProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        },
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 30
        },
        leaves: {
          orderBy: { startDate: 'desc' },
          take: 10
        },
        salaries: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        waiterProfile: {
          include: {
            tableAssignments: true,
            kitchenOrders: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.status(200).json(employee);
  } catch (err: any) {
    console.error('Error fetching employee profile:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateEmployeeAttendance = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes, checkIn, checkOut, workHours, overtime } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.employeeAttendance.findFirst({
      where: {
        employeeId: id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let attendance;
    if (existing) {
      attendance = await prisma.employeeAttendance.update({
        where: { id: existing.id },
        data: {
          status,
          notes,
          checkIn,
          checkOut,
          workHours: workHours ? parseFloat(workHours) : undefined,
          overtime: overtime ? parseFloat(overtime) : undefined
        }
      });
    } else {
      attendance = await prisma.employeeAttendance.create({
        data: {
          employeeId: id,
          date: new Date(),
          status,
          notes,
          checkIn,
          checkOut,
          workHours: workHours ? parseFloat(workHours) : undefined,
          overtime: overtime ? parseFloat(overtime) : undefined
        }
      });
    }

    await prisma.employeeActivity.create({
      data: {
        employeeId: id,
        action: 'Attendance Marked',
        details: `Marked as ${status}. Check-In: ${checkIn || 'N/A'}, Check-Out: ${checkOut || 'N/A'}`
      }
    });

    return res.status(200).json(attendance);
  } catch (err: any) {
    console.error('Error updating attendance:', err);
    return res.status(500).json({ error: err.message });
  }
};

// --- SHIFTS CONTROLLERS ---
export const getShifts = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const shifts = await prisma.employeeShift.findMany({
      where: { restaurantId: restId },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(shifts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createShift = async (req: Request, res: Response) => {
  const { name, startTime, endTime, breakTime, applicableRoles, restaurantId } = req.body;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    
    // Validate shift time overlaps
    const existing = await prisma.employeeShift.findFirst({
      where: { name, restaurantId: restId }
    });
    if (existing) {
      return res.status(400).json({ error: 'A shift with this name already exists.' });
    }

    const shift = await prisma.employeeShift.create({
      data: {
        name,
        startTime,
        endTime,
        breakTime,
        applicableRoles: applicableRoles || [],
        restaurantId: restId
      }
    });
    return res.status(201).json(shift);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const editShift = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, startTime, endTime, breakTime, applicableRoles } = req.body;
  try {
    const shift = await prisma.employeeShift.update({
      where: { id },
      data: {
        name,
        startTime,
        endTime,
        breakTime,
        applicableRoles: applicableRoles || []
      }
    });
    return res.status(200).json(shift);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.employeeShift.delete({ where: { id } });
    return res.status(200).json({ message: 'Shift deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// --- LEAVES CONTROLLERS ---
export const getLeaves = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const leaves = await prisma.employeeLeave.findMany({
      where: { restaurantId: restId },
      include: {
        employee: {
          select: { name: true, role: true, employeeId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(leaves);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createLeave = async (req: Request, res: Response) => {
  const { employeeId, leaveType, reason, startDate, endDate, restaurantId } = req.body;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const leave = await prisma.employeeLeave.create({
      data: {
        employeeId,
        leaveType,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restId,
        status: 'Pending'
      }
    });
    return res.status(201).json(leave);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Approved, Rejected
  try {
    const leave = await prisma.employeeLeave.update({
      where: { id },
      data: { status }
    });

    await prisma.employeeActivity.create({
      data: {
        employeeId: leave.employeeId,
        action: `Leave ${status}`,
        details: `${leave.leaveType} from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} was ${status.toLowerCase()}.`
      }
    });

    return res.status(200).json(leave);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// --- SALARIES CONTROLLERS ---
export const getSalaries = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const salaries = await prisma.employeeSalary.findMany({
      where: { restaurantId: restId },
      include: {
        employee: {
          select: { name: true, role: true, employeeId: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(salaries);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const processSalary = async (req: Request, res: Response) => {
  const { employeeId, basicSalary, allowances, deductions, overtime, bonus, restaurantId } = req.body;
  try {
    const restId = await getActualRestaurantId(restaurantId);
    const basic = parseFloat(basicSalary || 0);
    const allow = parseFloat(allowances || 0);
    const deduct = parseFloat(deductions || 0);
    const ot = parseFloat(overtime || 0);
    const bon = parseFloat(bonus || 0);
    const net = basic + allow + ot + bon - deduct;

    const salary = await prisma.employeeSalary.create({
      data: {
        employeeId,
        basicSalary: basic,
        allowances: allow,
        deductions: deduct,
        overtime: ot,
        bonus: bon,
        netSalary: net,
        paymentStatus: 'Paid',
        paymentDate: new Date(),
        restaurantId: restId
      }
    });

    await prisma.employeeActivity.create({
      data: {
        employeeId,
        action: 'Salary Processed',
        details: `Processed salary of ₹${net.toLocaleString()} for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.`
      }
    });

    return res.status(201).json(salary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateSalaryStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body; // Paid, Unpaid
  try {
    const salary = await prisma.employeeSalary.update({
      where: { id },
      data: {
        paymentStatus,
        paymentDate: paymentStatus === 'Paid' ? new Date() : null
      }
    });
    return res.status(200).json(salary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


