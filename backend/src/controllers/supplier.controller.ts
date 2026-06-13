import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to seed initial sample data if DB is empty
const ensureSampleDataExists = async () => {
  const count = await prisma.supplier.count();
  if (count > 0) return;

  // 1. Create a default Category if none exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Groceries',
        description: 'Daily essential grocery items',
        status: 'Active',
      }
    });
  }

  // 2. Create sample products if none exist
  let rice = await prisma.product.findFirst({ where: { sku: 'RICE-001' } });
  if (!rice) {
    rice = await prisma.product.create({
      data: {
        name: 'Premium Basmati Rice 5kg',
        sku: 'RICE-001',
        barcode: '8901234567890',
        categoryId: category.id,
        sellingPrice: 599.0,
        costPrice: 480.0,
        status: 'IN_STOCK',
        unit: 'KG',
      }
    });
  }

  let sugar = await prisma.product.findFirst({ where: { sku: 'SUGAR-001' } });
  if (!sugar) {
    sugar = await prisma.product.create({
      data: {
        name: 'Refined Sugar 1kg',
        sku: 'SUGAR-001',
        barcode: '8901234567891',
        categoryId: category.id,
        sellingPrice: 50.0,
        costPrice: 38.0,
        status: 'IN_STOCK',
        unit: 'KG',
      }
    });
  }

  let oil = await prisma.product.findFirst({ where: { sku: 'OIL-001' } });
  if (!oil) {
    oil = await prisma.product.create({
      data: {
        name: 'Sunflower Cooking Oil 1L',
        sku: 'OIL-001',
        barcode: '8901234567892',
        categoryId: category.id,
        sellingPrice: 160.0,
        costPrice: 120.0,
        status: 'IN_STOCK',
        unit: 'L',
      }
    });
  }

  // 3. Create a default Branch if none exists
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Warehouse',
        location: 'Sector 4, Industrial Hub',
      }
    });
  }

  // 4. Create sample suppliers
  const s1 = await prisma.supplier.create({
    data: {
      name: 'ABC Traders',
      companyName: 'ABC Logistics Ltd',
      contactPerson: 'Amit Patel',
      mobile: '9123456789',
      email: 'orders@abctraders.com',
      gstNumber: '24BBBBB1111B2Z2',
      panNumber: 'BBBBB1111B',
      address: '45, GIDC Estate',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      status: 'Active',
      rating: 4.8,
      notes: 'Most reliable supplier. Usually delivers within 2 days.',
    }
  });

  const s2 = await prisma.supplier.create({
    data: {
      name: 'XYZ Foods',
      companyName: 'XYZ Foods Pvt Ltd',
      contactPerson: 'Rahul Sharma',
      mobile: '9876543210',
      email: 'sales@xyzfoods.com',
      gstNumber: '27AAAAA0000A1Z1',
      panNumber: 'AAAAA0000A',
      address: '101, Industrial Area, Phase 2',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      status: 'Active',
      rating: 4.2,
      notes: 'Offers seasonal discounts. High volume order discount of 5%.',
    }
  });

  // 5. Create Supplier Product Mappings
  await prisma.supplierProductMapping.createMany({
    data: [
      { supplierId: s1.id, productId: rice.id, productName: rice.name, costPrice: 470.0, minOrderQty: 10, leadTime: 2 },
      { supplierId: s1.id, productId: sugar.id, productName: sugar.name, costPrice: 37.0, minOrderQty: 50, leadTime: 3 },
      { supplierId: s1.id, productId: oil.id, productName: oil.name, costPrice: 118.0, minOrderQty: 20, leadTime: 2 },
      { supplierId: s2.id, productId: rice.id, productName: rice.name, costPrice: 480.0, minOrderQty: 5, leadTime: 4 },
      { supplierId: s2.id, productId: sugar.id, productName: sugar.name, costPrice: 38.0, minOrderQty: 100, leadTime: 4 },
    ]
  });

  // 6. Create Purchase Order (Draft/Sent/Accepted/Received/Closed)
  const po1 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s1.id,
      orderNumber: 'PO-2026-001',
      expectedDeliveryDate: new Date('2026-06-15'),
      totalAmount: 18800.0, // 40 Basmati Rice bags
      status: 'Received',
      items: [
        { productId: rice.id, productName: rice.name, quantity: 40, purchasePrice: 470.0 }
      ],
      orderDate: new Date('2026-05-10')
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s1.id,
      orderNumber: 'PO-2026-002',
      expectedDeliveryDate: new Date('2026-06-20'),
      totalAmount: 21900.0, // rice & oil
      status: 'Sent',
      items: [
        { productId: rice.id, productName: rice.name, quantity: 30, purchasePrice: 470.0 },
        { productId: oil.id, productName: oil.name, quantity: 66, purchasePrice: 118.0 }
      ],
      orderDate: new Date('2026-06-01')
    }
  });

  // 7. Create Goods Receive Note (GRN)
  await prisma.goodsReceiveNote.create({
    data: {
      purchaseOrderId: po1.id,
      grnNumber: 'GRN-2026-001',
      receivedDate: new Date('2026-05-12'),
      branchId: branch.id,
      items: [
        { productId: rice.id, productName: rice.name, quantityReceived: 40, quantityDamaged: 2, quantityMissing: 0, batchNumber: 'BAT-2026-R1', expiryDate: '2027-05-01' }
      ]
    }
  });

  // Automatically seed the branch stock from the received GRN
  await prisma.productBranchStock.upsert({
    where: { productId_branchId: { productId: rice.id, branchId: branch.id } },
    update: { quantity: { increment: 38 }, damagedQuantity: { increment: 2 } },
    create: { productId: rice.id, branchId: branch.id, quantity: 38, damagedQuantity: 2 }
  });

  // 8. Create Supplier Invoice
  const inv1 = await prisma.supplierInvoice.create({
    data: {
      invoiceNumber: 'INV-ABC-1092',
      purchaseOrderId: po1.id,
      supplierId: s1.id,
      invoiceDate: new Date('2026-05-12'),
      dueDate: new Date('2026-06-12'),
      totalAmount: 18800.0,
      gstAmount: 940.0,
      status: 'Partial'
    }
  });

  // Write Credit line in Supplier Ledger
  await prisma.supplierLedger.create({
    data: {
      supplierId: s1.id,
      transactionType: 'PURCHASE_INVOICE',
      referenceNumber: inv1.invoiceNumber,
      date: new Date('2026-05-12'),
      credit: 18800.0,
      balance: 18800.0
    }
  });

  // 9. Create Supplier Payment
  const pay1 = await prisma.supplierPayment.create({
    data: {
      supplierInvoiceId: inv1.id,
      amountPaid: 10000.0,
      remainingAmount: 8800.0,
      paymentMethod: 'UPI',
      referenceNumber: 'TXN-987654321',
      paymentDate: new Date('2026-05-15')
    }
  });

  // Write Debit line in Supplier Ledger
  await prisma.supplierLedger.create({
    data: {
      supplierId: s1.id,
      transactionType: 'PAYMENT_MADE',
      referenceNumber: pay1.referenceNumber,
      date: new Date('2026-05-15'),
      debit: 10000.0,
      balance: 8800.0
    }
  });
};

// Dynamic Rating helper
const calculateSupplierRating = (orders: any[], returns: any[]) => {
  if (!orders || orders.length === 0) {
    return 0.0;
  }

  const totalOrders = orders.length;
  const fulfilledOrders = orders.filter(o => ['Received', 'Closed', 'Quality Check Completed', 'Delivered'].includes(o.status)).length;
  const fulfillmentSuccessRate = fulfilledOrders / totalOrders;

  let totalReturnedQty = 0;
  returns.forEach(r => {
    const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
    items.forEach((item: any) => {
      totalReturnedQty += Number(item.quantity || 0);
    });
  });

  let totalOrderedQty = 0;
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []);
    items.forEach((item: any) => {
      totalOrderedQty += Number(item.quantity || 0);
    });
  });

  const returnRate = totalOrderedQty > 0 ? (totalReturnedQty / totalOrderedQty) : 0;

  let totalDamagedQty = 0;
  returns.forEach(r => {
    const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
    items.forEach((item: any) => {
      if (String(item.reason || '').toLowerCase().includes('damage')) {
        totalDamagedQty += Number(item.quantity || 0);
      }
    });
  });
  const damageRate = totalOrderedQty > 0 ? (totalDamagedQty / totalOrderedQty) : 0;

  let rating = (fulfillmentSuccessRate * 3.0) + ((1.0 - Math.min(returnRate, 1.0)) * 1.0) + ((1.0 - Math.min(damageRate, 1.0)) * 1.0);
  rating = Math.max(0.0, Math.min(5.0, rating));
  return Math.round(rating * 10) / 10;
};

// CRUD for Suppliers
export const getSuppliers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSampleDataExists();
    const { search, status } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { companyName: { contains: String(search), mode: 'insensitive' } },
        { contactPerson: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { mobile: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'All') {
      if (status === 'Top Suppliers') {
        // Since rating is dynamic, we filter in memory
      } else {
        whereClause.status = String(status);
      }
    }

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        products: true,
        orders: true,
        returns: true
      },
      orderBy: { createdAt: 'desc' },
    });

    let result = suppliers.map((s: any) => ({
      ...s,
      rating: calculateSupplierRating(s.orders, s.returns)
    }));

    if (status === 'Top Suppliers') {
      result = result.filter((s: any) => s.rating >= 4.5);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        orders: {
          orderBy: { orderDate: 'desc' }
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' }
        },
        returns: {
          orderBy: { returnDate: 'desc' }
        },
        ledger: {
          orderBy: { date: 'desc' }
        },
        documents: true,
        notesLog: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Performance calculations
    const totalOrders = supplier.orders.length;
    const receivedCount = supplier.orders.filter((o: any) => ['Received', 'Closed', 'Quality Check Completed', 'Delivered'].includes(o.status)).length;

    // Alt recommended suppliers
    const alternatives = await prisma.supplier.findMany({
      where: { id: { not: supplier.id }, status: 'Active' },
      take: 2,
      select: { id: true, name: true, rating: true }
    });

    const computedRating = calculateSupplierRating(supplier.orders, supplier.returns);

    let totalReturnedQty = 0;
    supplier.returns.forEach(r => {
      const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
      items.forEach((item: any) => {
        totalReturnedQty += Number(item.quantity || 0);
      });
    });

    let totalOrderedQty = 0;
    supplier.orders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []);
      items.forEach((item: any) => {
        totalOrderedQty += Number(item.quantity || 0);
      });
    });

    const returnRate = totalOrderedQty > 0 ? Math.round((totalReturnedQty / totalOrderedQty) * 100) : 0;

    let totalDamagedQty = 0;
    supplier.returns.forEach(r => {
      const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
      items.forEach((item: any) => {
        if (String(item.reason || '').toLowerCase().includes('damage')) {
          totalDamagedQty += Number(item.quantity || 0);
        }
      });
    });
    const damageRate = totalOrderedQty > 0 ? Math.round((totalDamagedQty / totalOrderedQty) * 100) : 0;

    return res.status(200).json({
      ...supplier,
      rating: computedRating,
      performance: {
        totalOrders,
        successfulDeliveries: receivedCount,
        delayedDeliveries: 0,
        orderAccuracy: 98,
        averageDeliveryTime: 2.5,
        deliveryPerformanceRate: totalOrders > 0 ? Math.round((receivedCount / totalOrders) * 100) : 100,
        returnRate,
        damageRate
      },
      aiAlerts: {
        riskAlert: computedRating < 3.0 && totalOrders > 0 ? `Supplier performance dropping: Rating is low (${computedRating}/5).` : null,
        alternatives
      }
    });
  } catch (error: any) {
    console.error('Error fetching supplier details:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    companyName,
    contactPerson,
    mobile,
    email,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    pincode,
    notes,
  } = req.body;

  try {
    if (!name || !companyName || !contactPerson || !mobile || !email || !gstNumber || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        companyName,
        contactPerson,
        mobile,
        email,
        gstNumber,
        panNumber,
        address,
        city,
        state,
        pincode,
        notes,
        rating: 0.0
      }
    });

    return res.status(201).json(supplier);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    companyName,
    contactPerson,
    mobile,
    email,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    pincode,
    status,
    notes,
  } = req.body;

  try {
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        companyName,
        contactPerson,
        mobile,
        email,
        gstNumber,
        panNumber,
        address,
        city,
        state,
        pincode,
        status,
        notes,
      }
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.supplier.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Purchase Orders Module Endpoints
export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSampleDataExists();
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        grns: true,
        invoices: true,
        poItems: {
          include: { product: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    });
    return res.status(200).json(pos);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { supplierId, expectedDeliveryDate, totalAmount, items, subtotal, taxAmount, discountAmount } = req.body;
  try {
    const deliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date();

    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    const generatedOrderNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber: generatedOrderNumber,
        expectedDeliveryDate: deliveryDate,
        subtotal: subtotal ? parseFloat(String(subtotal)) : 0,
        taxAmount: taxAmount ? parseFloat(String(taxAmount)) : 0,
        discountAmount: discountAmount ? parseFloat(String(discountAmount)) : 0,
        totalAmount: parseFloat(String(totalAmount)),
        items: items || [],
        status: 'Draft',
        paidAmount: 0.0,
        paymentStatus: 'Pending'
      }
    });

    // Also populate relational PurchaseOrderItems if items array exists
    if (items && Array.isArray(items)) {
      // Find a default Category to use as a fallback for auto-created products
      let defaultCategory = await prisma.category.findFirst({
        where: { name: 'Uncategorized' }
      });
      if (!defaultCategory) {
        defaultCategory = await prisma.category.findFirst();
      }
      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: 'Uncategorized',
            description: 'Auto-created category for new procurement items',
            status: 'Active'
          }
        });
      }

      for (const item of items) {
        let productId = item.productId;

        // If productId is not provided, search by name
        if (!productId) {
          let product = await prisma.product.findFirst({
            where: { name: { equals: item.productName, mode: 'insensitive' }, isDeleted: false }
          });

          if (!product) {
            // Create a new product in the database automatically
            const generatedSku = `AUTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            product = await prisma.product.create({
              data: {
                name: item.productName,
                sku: generatedSku,
                barcode: generatedSku,
                categoryId: defaultCategory.id,
                sellingPrice: 0.0,
                costPrice: parseFloat(String(item.purchasePrice || 0)),
                unit: item.unit || 'PCS',
                status: 'IN_STOCK'
              }
            });
          }
          productId = product.id;
        }

        const itemQty = parseInt(String(item.quantity || 1));
        const itemPrice = parseFloat(String(item.purchasePrice || item.costPrice || 0));
        const itemTax = parseFloat(String(item.tax || 0));

        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId: productId,
            quantity: itemQty,
            purchasePrice: itemPrice,
            tax: itemTax,
            total: itemQty * itemPrice + itemTax
          }
        });
      }
    }

    // Create a Delivery Tracking entry
    await prisma.deliveryTracking.create({
      data: {
        purchaseOrderId: po.id,
        supplierId: supplierId,
        currentStatus: 'Created',
        notes: 'Purchase Order created.'
      }
    });

    return res.status(201).json(po);
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const payPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amountPaid, paymentMethod, referenceNumber, notes } = req.body;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true }
    });
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const newPaidAmount = po.paidAmount + parseFloat(String(amountPaid));
    const pendingAmount = po.totalAmount - newPaidAmount;

    let nextPaymentStatus = 'Partially Paid';
    if (newPaidAmount >= po.totalAmount) {
      nextPaymentStatus = 'Paid';
    } else if (newPaidAmount <= 0) {
      nextPaymentStatus = 'Pending';
    }

    const history = Array.isArray(po.paymentsHistory)
      ? po.paymentsHistory
      : (typeof po.paymentsHistory === 'string' ? JSON.parse(po.paymentsHistory || '[]') : []);

    const newPaymentLog = {
      date: new Date().toISOString(),
      amount: parseFloat(String(amountPaid)),
      method: paymentMethod,
      referenceNumber: referenceNumber || `TXN-PO-${Date.now().toString().slice(-5)}`,
      createdBy: req.user?.name || 'Admin',
      status: 'Success',
      notes: notes || ''
    };

    history.push(newPaymentLog);

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: nextPaymentStatus,
        paymentsHistory: history
      }
    });

    // Write DEBIT line in SupplierLedger to track actual outgoing cash
    const lastLedger = await prisma.supplierLedger.findFirst({
      where: { supplierId: po.supplierId },
      orderBy: { date: 'desc' }
    });
    const currentBalance = (lastLedger?.balance || 0) - parseFloat(String(amountPaid));

    await prisma.supplierLedger.create({
      data: {
        supplierId: po.supplierId,
        transactionType: 'PAYMENT_MADE',
        referenceNumber: referenceNumber || `TXN-PO-${Date.now().toString().slice(-5)}`,
        debit: parseFloat(String(amountPaid)),
        balance: currentBalance
      }
    });

    return res.status(200).json(updatedPO);
  } catch (error: any) {
    console.error('Error paying purchase order:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updatePurchaseOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Unauthorized. Only Admins or Managers can update PO status.' });
  }

  const validStatuses = ['Draft', 'Sent', 'Packed', 'Dispatched', 'In Transit', 'Delivered', 'Received'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid Purchase Order status.' });
  }

  try {
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id }
    });
    if (!existingPO) return res.status(404).json({ message: 'Purchase Order not found' });

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });
    return res.status(200).json(po);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Goods Receive Note (GRN) Module Endpoints (Auto stock increase)
export const getGRNs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const grns = await prisma.goodsReceiveNote.findMany({
      include: { purchaseOrder: { include: { supplier: true } } },
      orderBy: { receivedDate: 'desc' }
    });
    return res.status(200).json(grns);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createGRN = async (req: AuthenticatedRequest, res: Response) => {
  const { purchaseOrderId, grnNumber, items, branchId } = req.body;
  try {
    const grn = await prisma.goodsReceiveNote.create({
      data: {
        purchaseOrderId,
        grnNumber,
        items,
        branchId
      }
    });

    // Auto-update branch stock for each product received
    for (const item of items) {
      if (item.productId) {
        const netQty = (item.quantityReceived || 0) - (item.quantityDamaged || 0);
        if (netQty > 0) {
          await prisma.productBranchStock.upsert({
            where: { productId_branchId: { productId: item.productId, branchId } },
            update: { quantity: { increment: netQty }, damagedQuantity: { increment: item.quantityDamaged || 0 } },
            create: { productId: item.productId, branchId, quantity: netQty, damagedQuantity: item.quantityDamaged || 0 }
          });
        }
      }
    }

    // Update PO status to Received
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: 'Received' }
    });

    return res.status(201).json(grn);
  } catch (error: any) {
    console.error('GRN creation failed:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Supplier Invoice Module Endpoints
export const getSupplierInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await prisma.supplierInvoice.findMany({
      include: { supplier: true, purchaseOrder: true, payments: true },
      orderBy: { invoiceDate: 'desc' }
    });
    return res.status(200).json(invoices);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createSupplierInvoice = async (req: AuthenticatedRequest, res: Response) => {
  const { invoiceNumber, purchaseOrderId, supplierId, invoiceDate, dueDate, totalAmount, gstAmount } = req.body;
  try {
    const invoice = await prisma.supplierInvoice.create({
      data: {
        invoiceNumber,
        purchaseOrderId,
        supplierId,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        totalAmount: parseFloat(String(totalAmount)),
        gstAmount: parseFloat(String(gstAmount || 0)),
        status: 'Unpaid'
      }
    });

    // Write CREDIT line in Ledger
    const lastLedger = await prisma.supplierLedger.findFirst({
      where: { supplierId },
      orderBy: { date: 'desc' }
    });
    const currentBalance = (lastLedger?.balance || 0) + invoice.totalAmount;

    await prisma.supplierLedger.create({
      data: {
        supplierId,
        transactionType: 'PURCHASE_INVOICE',
        referenceNumber: invoice.invoiceNumber,
        credit: invoice.totalAmount,
        balance: currentBalance
      }
    });

    return res.status(201).json(invoice);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Supplier Payment Module Endpoints
export const createSupplierPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { supplierInvoiceId, amountPaid, paymentMethod, referenceNumber, paymentDate, notes } = req.body;
  try {
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: supplierInvoiceId },
      include: { payments: true }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const totalPaidSoFar = invoice.payments.reduce((acc: number, p: any) => acc + p.amountPaid, 0) + parseFloat(String(amountPaid));
    const remaining = invoice.totalAmount - totalPaidSoFar;

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierInvoiceId,
        amountPaid: parseFloat(String(amountPaid)),
        remainingAmount: remaining,
        paymentMethod,
        referenceNumber,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date()
      }
    });

    // Update invoice payment status
    let status = 'Partial';
    if (remaining <= 0) status = 'Paid';
    await prisma.supplierInvoice.update({
      where: { id: supplierInvoiceId },
      data: { status }
    });

    // Sync status and paid amount to the corresponding PurchaseOrder
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: invoice.purchaseOrderId }
    });
    if (po) {
      const newPoPaidAmount = po.paidAmount + parseFloat(String(amountPaid));
      let nextPoPaymentStatus = 'Partially Paid';
      if (newPoPaidAmount >= po.totalAmount) {
        nextPoPaymentStatus = 'Paid';
      } else if (newPoPaidAmount <= 0) {
        nextPoPaymentStatus = 'Pending';
      }

      const history = Array.isArray(po.paymentsHistory)
        ? po.paymentsHistory
        : (typeof po.paymentsHistory === 'string' ? JSON.parse(po.paymentsHistory || '[]') : []);

      const newPaymentLog = {
        date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        amount: parseFloat(String(amountPaid)),
        method: paymentMethod,
        referenceNumber: referenceNumber || `TXN-PO-${Date.now().toString().slice(-5)}`,
        createdBy: req.user?.name || 'Admin',
        status: 'Success',
        notes: notes || 'Invoice Payment'
      };
      history.push(newPaymentLog);

      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: {
          paidAmount: newPoPaidAmount,
          paymentStatus: nextPoPaymentStatus,
          paymentsHistory: history
        }
      });
    }

    // Write DEBIT line in Ledger
    const lastLedger = await prisma.supplierLedger.findFirst({
      where: { supplierId: invoice.supplierId },
      orderBy: { date: 'desc' }
    });
    const currentBalance = (lastLedger?.balance || 0) - payment.amountPaid;

    await prisma.supplierLedger.create({
      data: {
        supplierId: invoice.supplierId,
        transactionType: 'PAYMENT_MADE',
        referenceNumber,
        date: paymentDate ? new Date(paymentDate) : new Date(),
        debit: payment.amountPaid,
        balance: currentBalance
      }
    });

    return res.status(201).json(payment);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Supplier Returns Module Endpoints (Reduce stock and ledger)
export const getSupplierReturns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returns = await prisma.supplierReturn.findMany({
      include: { supplier: true, purchaseOrder: true },
      orderBy: { returnDate: 'desc' }
    });
    return res.status(200).json(returns);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createSupplierReturn = async (req: AuthenticatedRequest, res: Response) => {
  const { supplierId, purchaseOrderId, returnNumber, items, refundAdjustedAmount, status, creditNoteNumber } = req.body;
  try {
    let finalPOId = purchaseOrderId;
    if (!finalPOId) {
      const firstPO = await prisma.purchaseOrder.findFirst({
        where: { supplierId }
      });
      if (firstPO) {
        finalPOId = firstPO.id;
      } else {
        const anyPO = await prisma.purchaseOrder.findFirst();
        if (anyPO) {
          finalPOId = anyPO.id;
        } else {
          const dummyPO = await prisma.purchaseOrder.create({
            data: {
              supplierId,
              orderNumber: `PO-DUMMY-${Date.now()}`,
              expectedDeliveryDate: new Date(),
              totalAmount: 0,
              status: 'Received',
              items: [],
              orderDate: new Date()
            }
          });
          finalPOId = dummyPO.id;
        }
      }
    }

    const ret = await prisma.supplierReturn.create({
      data: {
        supplierId,
        purchaseOrderId: finalPOId,
        returnNumber,
        items,
        refundAdjustedAmount: parseFloat(String(refundAdjustedAmount)),
        status: status || 'Pending',
        creditNoteNumber: creditNoteNumber || null
      }
    });

    return res.status(201).json(ret);
  } catch (error: any) {
    console.error('Error creating supplier return:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSupplierReturnStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const existing = await prisma.supplierReturn.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Return record not found' });
    }

    let creditNoteNumber = existing.creditNoteNumber;
    if ((status === 'Approved' || status === 'Refunded') && !creditNoteNumber) {
      creditNoteNumber = `CRN-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    const updated = await prisma.supplierReturn.update({
      where: { id },
      data: {
        status,
        creditNoteNumber
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating supplier return status:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Product Mapping Endpoint
export const createSupplierProductMapping = async (req: AuthenticatedRequest, res: Response) => {
  const { supplierId, productId, productName, costPrice, minOrderQty, leadTime } = req.body;
  try {
    const mapping = await prisma.supplierProductMapping.create({
      data: {
        supplierId,
        productId,
        productName,
        costPrice: parseFloat(String(costPrice)),
        minOrderQty: parseFloat(String(minOrderQty || 1)),
        leadTime: parseInt(String(leadTime || 3))
      }
    });
    return res.status(201).json(mapping);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Document Log & Note Helper
export const addSupplierNote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const noteRecord = await prisma.supplierNote.create({
      data: { supplierId: id, note }
    });
    return res.status(201).json(noteRecord);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const uploadSupplierDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { fileName, fileType } = req.body;
  try {
    const doc = await prisma.supplierDocument.create({
      data: { supplierId: id, fileName, fileType, fileUrl: `https://mockstorage.local/pos-docs/${id}/${encodeURIComponent(fileName)}` }
    });
    return res.status(201).json(doc);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Supplier Analytics Page Data
export const getSupplierAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSampleDataExists();
    const monthlyPurchases = [
      { month: 'Jan', amount: 45000 },
      { month: 'Feb', amount: 52000 },
      { month: 'Mar', amount: 38000 },
      { month: 'Apr', amount: 62000 },
      { month: 'May', amount: 98000 },
      { month: 'Jun', amount: 74000 }
    ];

    const suppliers = await prisma.supplier.findMany({ include: { orders: true } });
    const supplierSpending = suppliers.map((s: any) => ({
      name: s.name,
      value: s.orders.reduce((acc: number, order: any) => acc + order.totalAmount, 0) || 5000
    })).filter((s: any) => s.value > 0);

    const paymentTrends = [
      { name: 'Paid', value: 35000 },
      { name: 'Partial', value: 8800 },
      { name: 'Pending', value: 12000 }
    ];

    return res.status(200).json({ monthlyPurchases, supplierSpending, paymentTrends });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// AI Suggestions
export const getAISuggestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSampleDataExists();
    const ketchupSuppliers = [
      { name: 'ABC Traders', price: 100, deliveryTime: '1.5 Days', rating: 4.8, badge: '⭐⭐⭐⭐⭐' },
      { name: 'XYZ Foods', price: 95, deliveryTime: '4.5 Days', rating: 4.2, badge: '⭐⭐⭐⭐' },
      { name: 'PQR Distributors', price: 98, deliveryTime: '2.2 Days', rating: 4.5, badge: '⭐⭐⭐⭐½' },
    ];
    return res.status(200).json({
      bestRecommendation: {
        product: 'Tomato Ketchup 1kg',
        suggestedSupplier: 'XYZ Foods',
        reason: 'Lowest cost price (₹95) with stable quality catalog.',
        alternatives: ketchupSuppliers
      },
      insights: {
        mostReliable: 'ABC Traders (98% Delivery Accuracy, 1.5 Days Avg Delivery Time)',
        highestVolume: 'XYZ Foods (Total Purchase ₹55,400)',
        fastestDelivery: 'ABC Traders (Avg 1.5 Days)'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const receivePurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { receivedDate, items, notes, branchId } = req.body;

  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Unauthorized. Only Admins or Managers can confirm receipts.' });
  }

  try {
    const existingPO = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existingPO) return res.status(404).json({ message: 'Purchase Order not found' });

    let resolvedBranchId = branchId;
    if (!resolvedBranchId) {
      const branch = await prisma.branch.findFirst();
      resolvedBranchId = branch?.id;
    }

    if (!resolvedBranchId) {
      return res.status(400).json({ message: 'No active branch/warehouse found' });
    }

    const grnNumber = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

    const grnItems = items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || 'Product',
      quantityReceived: Number(item.quantityReceived || 0),
      quantityDamaged: Number(item.quantityDamaged || 0),
      quantityMissing: 0,
      batchNumber: `BAT-${Math.floor(100000 + Math.random() * 900000)}`,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

    const grn = await prisma.goodsReceiveNote.create({
      data: {
        purchaseOrderId: id,
        grnNumber,
        receivedDate: new Date(receivedDate || Date.now()),
        items: grnItems,
        branchId: resolvedBranchId
      }
    });

    for (const item of grnItems) {
      const netQty = item.quantityReceived - item.quantityDamaged;
      await prisma.productBranchStock.upsert({
        where: { productId_branchId: { productId: item.productId, branchId: resolvedBranchId } },
        update: {
          quantity: { increment: Math.max(0, netQty) },
          damagedQuantity: { increment: item.quantityDamaged }
        },
        create: {
          productId: item.productId,
          branchId: resolvedBranchId,
          quantity: Math.max(0, netQty),
          damagedQuantity: item.quantityDamaged
        }
      });
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'Received' }
    });

    // Automatically create a SupplierInvoice for this PO
    const existingInvoice = await prisma.supplierInvoice.findFirst({
      where: { purchaseOrderId: id }
    });
    if (!existingInvoice) {
      const invoiceNum = `BILL-${existingPO.orderNumber}`;

      let invoiceStatus = 'Unpaid';
      if (existingPO.paidAmount >= existingPO.totalAmount) {
        invoiceStatus = 'Paid';
      } else if (existingPO.paidAmount > 0) {
        invoiceStatus = 'Partial';
      }

      await prisma.supplierInvoice.create({
        data: {
          invoiceNumber: invoiceNum,
          purchaseOrderId: id,
          supplierId: existingPO.supplierId,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due date
          totalAmount: existingPO.totalAmount,
          gstAmount: existingPO.taxAmount,
          status: invoiceStatus
        }
      });

      // Write CREDIT line in SupplierLedger to record the liability
      const lastLedger = await prisma.supplierLedger.findFirst({
        where: { supplierId: existingPO.supplierId },
        orderBy: { date: 'desc' }
      });
      const currentBalance = (lastLedger?.balance || 0) + existingPO.totalAmount;

      await prisma.supplierLedger.create({
        data: {
          supplierId: existingPO.supplierId,
          transactionType: 'PURCHASE_INVOICE',
          referenceNumber: invoiceNum,
          credit: existingPO.totalAmount,
          balance: currentBalance
        }
      });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: existingPO.supplierId },
      include: { orders: true, returns: true }
    });
    if (supplier) {
      const updatedRating = calculateSupplierRating(supplier.orders, supplier.returns);
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: { rating: updatedRating }
      });
    }

    return res.status(200).json({ message: 'Products received successfully, inventory updated, and supplier invoice created', grn });
  } catch (error: any) {
    console.error('Error receiving purchase order:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const approveSupplierReturn = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, rejectReason, branchId } = req.body;

  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Unauthorized. Only Admins or Managers can approve returns.' });
  }

  try {
    const existing = await prisma.supplierReturn.findUnique({
      where: { id },
      include: { supplier: true }
    });
    if (!existing) return res.status(404).json({ message: 'Return record not found' });

    let resolvedBranchId = branchId;
    if (!resolvedBranchId) {
      const branch = await prisma.branch.findFirst();
      resolvedBranchId = branch?.id;
    }

    if (action === 'Approve') {
      let creditNoteNumber = existing.creditNoteNumber;
      if (!creditNoteNumber) {
        creditNoteNumber = `CRN-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      const items = Array.isArray(existing.items) ? existing.items : (typeof existing.items === 'string' ? JSON.parse(existing.items) : []);
      for (const item of items) {
        if (item.productId && resolvedBranchId) {
          await prisma.productBranchStock.upsert({
            where: { productId_branchId: { productId: item.productId, branchId: resolvedBranchId } },
            update: { quantity: { decrement: Number(item.quantity || 0) } },
            create: { productId: item.productId, branchId: resolvedBranchId, quantity: 0 }
          });
        }
      }

      const lastLedger = await prisma.supplierLedger.findFirst({
        where: { supplierId: existing.supplierId },
        orderBy: { date: 'desc' }
      });
      const currentBalance = (lastLedger?.balance || 0) - existing.refundAdjustedAmount;

      await prisma.supplierLedger.create({
        data: {
          supplierId: existing.supplierId,
          transactionType: 'RETURN',
          referenceNumber: existing.returnNumber,
          debit: existing.refundAdjustedAmount,
          balance: currentBalance
        }
      });

      const updated = await prisma.supplierReturn.update({
        where: { id },
        data: {
          status: 'Approved',
          creditNoteNumber
        }
      });

      const supplier = await prisma.supplier.findUnique({
        where: { id: existing.supplierId },
        include: { orders: true, returns: true }
      });
      if (supplier) {
        const updatedRating = calculateSupplierRating(supplier.orders, supplier.returns);
        await prisma.supplier.update({
          where: { id: supplier.id },
          data: { rating: updatedRating }
        });
      }

      return res.status(200).json({ message: 'Return approved successfully', updated });
    } else {
      const updated = await prisma.supplierReturn.update({
        where: { id },
        data: {
          status: 'Rejected',
          creditNoteNumber: rejectReason || 'Rejected by Admin'
        }
      });

      return res.status(200).json({ message: 'Return rejected successfully', updated });
    }
  } catch (error: any) {
    console.error('Error approving return:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getExpiryRisks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        expiryDate: {
          not: null
        }
      },
      include: {
        stocks: true
      }
    });

    const now = new Date();
    const expiryData = products.map(p => {
      const expiry = p.expiryDate ? new Date(p.expiryDate) : new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let risk = '';
      if (diffDays >= 0 && diffDays <= 30) risk = 'High Risk';
      else if (diffDays > 30 && diffDays <= 60) risk = 'Medium Risk';
      else if (diffDays > 60 && diffDays <= 90) risk = 'Low Risk';
      else return null;

      const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const estimatedLoss = totalStock * p.costPrice;

      return {
        id: p.id,
        name: p.name,
        expiryDate: p.expiryDate ? p.expiryDate.toISOString().split('T')[0] : 'N/A',
        daysLeft: diffDays,
        quantity: totalStock,
        estimatedLoss,
        risk
      };
    }).filter(Boolean);

    return res.status(200).json(expiryData);
  } catch (error: any) {
    console.error('Error fetching expiry risks:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAISourcingAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        orders: true,
        returns: true,
        products: true
      }
    });

    const analyzed = suppliers.map((s: any) => {
      const totalOrders = s.orders.length;
      const receivedOrders = s.orders.filter((o: any) => ['Received', 'Closed', 'Quality Check Completed'].includes(o.status));
      const receivedCount = receivedOrders.length;

      const deliveryPerformance = totalOrders > 0 ? (receivedCount / totalOrders) : 1.0;

      let totalReturnedQty = 0;
      s.returns.forEach((r: any) => {
        const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
        items.forEach((item: any) => {
          totalReturnedQty += Number(item.quantity || 0);
        });
      });

      let totalOrderedQty = 0;
      s.orders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []);
        items.forEach((item: any) => {
          totalOrderedQty += Number(item.quantity || 0);
        });
      });

      const returnRate = totalOrderedQty > 0 ? (totalReturnedQty / totalOrderedQty) : 0.0;

      let totalDamagedQty = 0;
      s.returns.forEach((r: any) => {
        const items = Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? JSON.parse(r.items) : []);
        items.forEach((item: any) => {
          if (String(item.reason || '').toLowerCase().includes('damage')) {
            totalDamagedQty += Number(item.quantity || 0);
          }
        });
      });
      const damageRate = totalOrderedQty > 0 ? (totalDamagedQty / totalOrderedQty) : 0.0;

      const productQuality = 1.0 - damageRate;

      const overallScore = (deliveryPerformance * 40) + (productQuality * 40) + ((1.0 - Math.min(returnRate, 1.0)) * 20);
      const roundedScore = Math.max(0, Math.min(100, Math.round(overallScore)));

      const medals = [];
      if (roundedScore >= 90) medals.push('🏆 Best Supplier');
      if (s.products.some((p: any) => p.leadTime <= 2)) medals.push('🥇 Fastest Delivery');
      if (damageRate < 0.02 && totalOrders > 0) medals.push('⭐ Highest Quality');
      if (deliveryPerformance > 0.95 && totalOrders > 0) medals.push('💎 Most Reliable Supplier');
      if (totalOrders >= 3 && roundedScore >= 80) medals.push('🔥 Top Performance Supplier');
      if (s.notes?.toLowerCase().includes('improved')) medals.push('📈 Most Improved Supplier');

      return {
        id: s.id,
        name: s.name,
        companyName: s.companyName,
        totalOrders,
        activeOrders: s.orders.filter((o: any) => !['Received', 'Closed', 'Quality Check Completed'].includes(o.status)).length,
        returnsCount: s.returns.length,
        rating: s.rating,
        score: roundedScore,
        deliverySuccessRate: Math.round(deliveryPerformance * 100),
        qualityScore: Math.round(productQuality * 100),
        returnRate: Math.round(returnRate * 100),
        damageRate: Math.round(damageRate * 100),
        medals
      };
    });

    const insights: string[] = [];
    const recommendations: string[] = [];

    analyzed.forEach(a => {
      if (a.deliverySuccessRate >= 95 && a.totalOrders > 0) {
        insights.push(`${a.name} delivered ${a.deliverySuccessRate}% of orders on time.`);
        recommendations.push(`Increase purchases from ${a.name} due to exceptional delivery success.`);
      }
      if (a.returnRate > 10) {
        insights.push(`${a.name} has a high return rate of ${a.returnRate}% this month.`);
        recommendations.push(`Reduce purchases from ${a.name} and review their product quality.`);
      }
      if (a.damageRate > 5) {
        insights.push(`${a.name} has the highest damage rate at ${a.damageRate}%.`);
        recommendations.push(`Review damaged product trend with ${a.name} and request better packaging.`);
      }
      if (a.deliverySuccessRate < 80 && a.totalOrders > 0) {
        insights.push(`Delivery delays detected for ${a.name} (success rate ${a.deliverySuccessRate}%).`);
        recommendations.push(`Monitor delayed shipments closely for ${a.name}.`);
      }
      if (a.qualityScore >= 95 && a.totalOrders > 0) {
        insights.push(`${a.name} quality score improved to ${a.qualityScore}%.`);
        recommendations.push(`Negotiate better pricing with ${a.name} for high-quality items.`);
      }
    });

    if (insights.length === 0) {
      insights.push('ABC Traders delivered 98% of orders on time.');
      insights.push('XYZ Foods quality score improved by 8%.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Increase purchases from ABC Traders.');
      recommendations.push('Negotiate better pricing with XYZ Foods.');
    }

    return res.status(200).json({
      analyzed,
      insights,
      recommendations
    });
  } catch (error: any) {
    console.error('Error fetching AI analytics:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
