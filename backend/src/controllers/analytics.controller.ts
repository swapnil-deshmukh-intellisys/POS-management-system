import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const updateSalesAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany();
    const totalSales = orders.reduce((sum, order) => sum + order.totalPayable, 0);

    return res.status(200).json({
      message: 'Sales analytics computed successfully',
      totalSales,
      orderCount: orders.length,
      averageOrderValue: orders.length ? totalSales / orders.length : 0,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSeasonalAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Group sales by month to find seasonal demand
    const orders = await prisma.order.findMany({
      select: { totalPayable: true, createdAt: true },
    });

    const monthlyTrends: { [key: string]: number } = {};
    orders.forEach((o) => {
      const month = o.createdAt.toLocaleString('en-US', { month: 'long' });
      monthlyTrends[month] = (monthlyTrends[month] || 0) + o.totalPayable;
    });

    return res.status(200).json({
      message: 'Seasonal analytics computed successfully',
      monthlyTrends,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateCustomerPattern = async (req: AuthenticatedRequest, res: Response) => {
  const { customerId } = req.body;
  try {
    if (!customerId) {
      return res.status(400).json({ message: 'CustomerId is required' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
    });

    const categoriesBought: { [key: string]: number } = {};
    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        const catName = item.product.categoryId; // can link name if joined
        categoriesBought[catName] = (categoriesBought[catName] || 0) + item.quantity;
      });
    });

    return res.status(200).json({
      message: 'Customer buying patterns calculated',
      customerId,
      visitCount: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalPayable, 0),
      preferredCategories: categoriesBought,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getERPReports = async (req: AuthenticatedRequest, res: Response) => {
  const filter = (req.query.filter as string) || 'Last 7 Days';
  const startDateParam = req.query.startDate as string;
  const endDateParam = req.query.endDate as string;

  try {
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'Today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'Last 7 Days':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'Last 30 Days':
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'This Month':
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      case 'Last Month':
        start = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        end = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'Quarter':
        start.setMonth(start.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        break;
      case 'Year':
        start = new Date(start.getFullYear(), 0, 1);
        break;
      case 'Custom Date Range':
        if (startDateParam) start = new Date(startDateParam);
        if (endDateParam) {
          end = new Date(endDateParam);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }

    // 1. Fetch Orders in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Products & Stocks
    const products = await prisma.product.findMany({
      include: {
        stocks: true,
        orderItems: {
          where: {
            order: {
              createdAt: { gte: start, lte: end }
            }
          },
          include: {
            order: true
          }
        }
      }
    });

    // 3. Fetch Suppliers & Purchase Orders
    const suppliers = await prisma.supplier.findMany({
      include: {
        orders: {
          where: {
            orderDate: { gte: start, lte: end }
          }
        },
        invoices: true
      }
    });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: start, lte: end }
      },
      include: {
        supplier: true
      },
      orderBy: { orderDate: 'desc' }
    });

    // 4. Fetch Customers
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          where: {
            createdAt: { gte: start, lte: end }
          }
        }
      }
    });

    // --- AGGREGATION & DERIVATIVE CALCULATIONS ---

    // A. Sales Report
    const salesReport = orders.map(order => ({
      id: order.invoiceNumber || order.id.slice(0, 8),
      date: order.createdAt.toISOString().slice(0, 10),
      customer: order.customer ? order.customer.name : 'Walk-in Customer',
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.totalPayable,
      status: order.status,
      mode: order.paymentMethod
    }));

    // B. Profit & Loss calculation
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalDiscount = 0;
    let totalGST = 0;

    orders.forEach(order => {
      totalRevenue += order.totalPayable;
      totalDiscount += order.discount;
      totalGST += order.tax;
      order.items.forEach(item => {
        totalCOGS += item.quantity * (item.product?.costPrice || 0);
      });
    });

    const profitAndLoss = {
      revenue: parseFloat(totalRevenue.toFixed(2)),
      cogs: parseFloat(totalCOGS.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      gst: parseFloat(totalGST.toFixed(2)),
      profit: parseFloat((totalRevenue - totalCOGS - totalDiscount).toFixed(2)),
      margin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCOGS - totalDiscount) / totalRevenue) * 100) : 0
    };

    // C. Inventory Report
    const inventoryReport = products.map(p => {
      const stock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const sellsCount = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
      
      let status = 'In Stock';
      if (stock <= 0) {
        status = 'Out Of Stock';
      } else if (stock <= 10) {
        status = 'Low Stock';
      } else if (sellsCount === 0) {
        status = 'Dead Stock';
      }

      return {
        name: p.name,
        stock,
        purchasePrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        value: stock * p.costPrice,
        lastSale: p.orderItems[0] ? p.orderItems[0].order.createdAt.toISOString().slice(0,10) : 'No recent sales',
        status,
        movement: sellsCount > 5 ? 'Fast Moving' : 'Slow Moving',
        category: p.categoryId,
        soldQty: sellsCount
      };
    });

    // D. Supplier Report
    const supplierReport = suppliers.map(s => {
      const totalPurchases = s.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const outstanding = s.invoices
        .filter(inv => inv.status !== 'Paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        name: s.name,
        orders: s.orders.length,
        value: totalPurchases,
        outstanding,
        lastDate: s.orders[0] ? s.orders[0].orderDate.toISOString().slice(0, 10) : 'No orders',
        rating: `${s.rating || '4.5'} ★`,
        returns: s.orders.filter(o => o.status === 'Returned').length
      };
    });

    // E. Customer Report
    const customerReport = customers.map(c => {
      const spent = c.orders.reduce((sum, o) => sum + o.totalPayable, 0);
      
      let tier = 'Gold';
      if (spent > 20000) tier = 'Elite';
      else if (spent > 10000) tier = 'Platinum';

      return {
        name: c.name,
        orders: c.orders.length,
        spent,
        outstanding: c.balance,
        lastDate: c.orders[0] ? c.orders[0].createdAt.toISOString().slice(0, 10) : 'No transactions',
        tier
      };
    });

    // F. GST Report
    const gstReport = orders.map(order => {
      const taxable = parseFloat((order.totalPayable - order.tax).toFixed(2));
      const splitTax = parseFloat((order.tax / 2).toFixed(2));

      return {
        invoice: order.invoiceNumber || order.id.slice(0, 8),
        date: order.createdAt.toISOString().slice(0, 10),
        taxable,
        cgst: splitTax,
        sgst: splitTax,
        igst: 0,
        total: order.tax
      };
    });

    // G. Purchase Report
    const purchaseReport = purchaseOrders.map(po => ({
      id: po.orderNumber,
      date: po.orderDate.toISOString().slice(0, 10),
      supplier: po.supplier ? po.supplier.name : 'Unknown Vendor',
      qty: po.subtotal > 0 ? Math.round(po.totalAmount / 20) : 0, // estimation fallback
      status: po.status,
      itemsCount: po.items ? (typeof po.items === 'string' ? JSON.parse(po.items).length : (po.items as any).length || 2) : 1,
      cost: po.totalAmount
    }));

    // H. Payment Report
    const paymentModes = ['CASH', 'UPI', 'CARD'];
    const paymentReport = paymentModes.map(mode => {
      const modeOrders = orders.filter(o => o.paymentMethod === mode);
      const revenue = modeOrders.reduce((sum, o) => sum + o.totalPayable, 0);
      const totalRev = orders.reduce((sum, o) => sum + o.totalPayable, 0);
      const share = totalRev > 0 ? `${Math.round((revenue / totalRev) * 100)}%` : '0%';
      
      let speed = 'Instant';
      if (mode === 'CASH') speed = 'Cash Drawer';
      else if (mode === 'CARD') speed = 'T+1 Settlement';

      let label = 'Physical Cash';
      if (mode === 'UPI') label = 'UPI / QR Scan';
      else if (mode === 'CARD') label = 'Credit/Debit Card';

      return {
        mode: label,
        count: modeOrders.length,
        revenue,
        share,
        speed
      };
    });

    return res.status(200).json({
      filter,
      salesReport,
      profitAndLoss,
      inventoryReport,
      supplierReport,
      customerReport,
      gstReport,
      purchaseReport,
      paymentReport
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
