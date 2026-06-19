const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date();
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    console.log("Fetching DB data...");
    const [
      todayOrders,
      yesterdayOrders,
      weeklyOrders,
      monthlyOrders,
      stocks,
      lowStockCount,
      pendingSupplierPaymentsCount,
      pendingPurchaseOrdersVal,
      outOfStockCount,
      pendingCustomerOrdersCount,
      topSellingItemsGrouped,
      lowStockProds,
      outstandingInvoices,
      recentOrders,
      recentMovements,
      recentSupplierPayments,
      recentCustomers,
      recentPO,
      recentReturns
    ] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: startOfToday }, status: 'COMPLETED' } }),
      prisma.order.findMany({ where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday }, status: 'COMPLETED' } }),
      prisma.order.findMany({ where: { createdAt: { gte: startOfWeek }, status: 'COMPLETED' } }),
      prisma.order.findMany({ where: { createdAt: { gte: startOfMonth }, status: 'COMPLETED' } }),
      prisma.productBranchStock.findMany({ where: { product: { isDeleted: false } }, include: { product: true } }),
      prisma.product.count({ where: { status: 'LOW_STOCK', isDeleted: false } }),
      prisma.supplierInvoice.count({ where: { status: { in: ['Unpaid', 'Partial'] } } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['Pending', 'Draft', 'Ordered'] } } }),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK', isDeleted: false } }),
      prisma.order.count({ where: { status: { in: ['DRAFT', 'PARKED'] } } }).then(async (c) => {
        const hb = await prisma.heldBill.count({ where: { status: 'Held' } });
        return c + hb;
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.product.findMany({
        where: { status: 'LOW_STOCK', isDeleted: false },
        include: { stocks: true },
        take: 5
      }),
      prisma.supplierInvoice.aggregate({
        where: { status: { in: ['Unpaid', 'Partial'] } },
        _sum: { totalAmount: true }
      }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.inventoryMovement.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { product: true } }),
      prisma.supplierPayment.findMany({ take: 5, orderBy: { paymentDate: 'desc' }, include: { invoice: { include: { supplier: true } } } }),
      prisma.customer.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.purchaseOrder.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { supplier: true } }),
      prisma.return.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { product: true } })
    ]);

    console.log("Successfully fetched all metrics data!");
    console.log("lowStockCount:", lowStockCount);
  } catch (err) {
    console.error("METRICS ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
