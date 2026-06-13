import { PrismaClient, Role, StockStatus, PaymentMethod, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding POS database with complete sourcing and customer data...');

  // 1. Clean existing records (dependent first to prevent foreign key errors)
  await prisma.supplierNote.deleteMany({});
  await prisma.supplierDocument.deleteMany({});
  await prisma.supplierLedger.deleteMany({});
  await prisma.supplierPayment.deleteMany({});
  await prisma.supplierInvoice.deleteMany({});
  await prisma.goodsReceiveNote.deleteMany({});
  await prisma.goodsReceivedNotes.deleteMany({});
  await prisma.deliveryTracking.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.refundLog.deleteMany({});
  await prisma.replacement.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.supplierProductMapping.deleteMany({});
  
  await prisma.inventoryMovement.deleteMany({});
  await prisma.expiryManagement.deleteMany({});
  await prisma.supplierPerformance.deleteMany({});
  await prisma.aIInsight.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productBranchStock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.customerNote.deleteMany({});
  await prisma.customerTimeline.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  // 2. Create Branch
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'Main Branch',
      location: 'New York, USA',
    },
  });

  // 3. Create Users
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const johnDoe = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'admin@pos.com',
      password: hashedPassword,
      role: Role.ADMIN,
      mobile: '9876543210',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      branchId: mainBranch.id,
    },
  });

  console.log('Users seeded...');

  // 4. Create Categories
  const categoriesData = [
    { name: 'Fruits & Vegetables', description: 'Fresh fruits and vegetables', sortOrder: 1, status: 'Active' },
    { name: 'Beverages', description: 'Soft drinks, juices, and more', sortOrder: 2, status: 'Active' },
    { name: 'Snacks & Chips', description: 'Chips, biscuits, and snacks', sortOrder: 3, status: 'Active' },
    { name: 'Dairy Products', description: 'Milk, cheese, butter, etc.', sortOrder: 4, status: 'Active' },
    { name: 'Bakery', description: 'Bread, cakes, biscuits, etc.', sortOrder: 5, status: 'Active' },
    { name: 'Household', description: 'Cleaning and household items', sortOrder: 6, status: 'Active' },
    { name: 'Electronics', description: 'Electronic items and gadgets', sortOrder: 7, status: 'Active' },
    { name: 'Clothing', description: 'Men, women and kids clothing', sortOrder: 8, status: 'Active' },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.category.create({
      data: cat,
    });
  }

  console.log('Categories seeded...');

  // 5. Create Suppliers
  const s1 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-001',
      name: 'Reliance Retail Wholesale',
      companyName: 'Reliance Retail Ventures Ltd',
      contactPerson: 'Mukesh Patel',
      mobile: '9820012345',
      email: 'sourcing@relianceretail.com',
      gstNumber: '27AAAAA1111A1Z1',
      panNumber: 'ABCDE1111A',
      address: 'Reliance Corporate Park, Ghansoli',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400701',
      status: 'Active',
      rating: 4.8,
      deliveryScore: 98.5,
      qualityScore: 99.0,
      returnScore: 97.5
    }
  });

  const s2 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-002',
      name: 'Amul Dairy Distributors',
      companyName: 'Gujarat Cooperative Milk Marketing Federation',
      contactPerson: 'Jayen Mehta',
      mobile: '9898012345',
      email: 'distributor@amul.coop',
      gstNumber: '24AAAAA2222B1Z2',
      panNumber: 'BCDEF2222B',
      address: 'Amul Dairy Road',
      city: 'Anand',
      state: 'Gujarat',
      country: 'India',
      pincode: '388001',
      status: 'Active',
      rating: 4.9,
      deliveryScore: 99.0,
      qualityScore: 98.5,
      returnScore: 99.0
    }
  });

  const s3 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-003',
      name: 'Fresh Farms Produce',
      companyName: 'Fresh Farms Agro Private Limited',
      contactPerson: 'Sanjay Dutt',
      mobile: '9845012345',
      email: 'sourcing@freshfarms.in',
      gstNumber: '29AAAAA3333C1Z3',
      panNumber: 'CDEFG3333C',
      address: '24, Yashwantpur Market Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560022',
      status: 'Active',
      rating: 4.2,
      deliveryScore: 88.0,
      qualityScore: 92.5,
      returnScore: 94.0
    }
  });

  console.log('Suppliers seeded...');

  // 6. Create Products
  const productsData = [
    {
      name: 'Red Apple',
      sku: 'APL-001',
      barcode: '8901234567890',
      categoryName: 'Fruits & Vegetables',
      brand: 'Fresh Farms',
      sellingPrice: 2.50,
      costPrice: 1.20,
      unit: 'Per Kg',
      quantity: 120,
      lowStockAlert: 10,
      status: StockStatus.IN_STOCK,
      supplierId: s3.id
    },
    {
      name: 'Banana',
      sku: 'BAN-002',
      barcode: '8901234567891',
      categoryName: 'Fruits & Vegetables',
      brand: 'Fresh Farms',
      sellingPrice: 1.20,
      costPrice: 0.60,
      unit: 'Per Kg',
      quantity: 85,
      lowStockAlert: 10,
      status: StockStatus.IN_STOCK,
      supplierId: s3.id
    },
    {
      name: 'Milk 1L',
      sku: 'MLK-003',
      barcode: '8901234567892',
      categoryName: 'Dairy Products',
      brand: 'Amul',
      sellingPrice: 1.80,
      costPrice: 1.10,
      unit: 'Per PCS',
      quantity: 60,
      lowStockAlert: 15,
      status: StockStatus.IN_STOCK,
      supplierId: s2.id
    },
    {
      name: 'Coca Cola 500ml',
      sku: 'CCD-004',
      barcode: '8901234567893',
      categoryName: 'Beverages',
      brand: 'Coca Cola',
      sellingPrice: 1.50,
      costPrice: 0.80,
      unit: 'Per PCS',
      quantity: 95,
      lowStockAlert: 20,
      status: StockStatus.IN_STOCK,
      supplierId: s1.id
    },
    {
      name: "Lay's Classic",
      sku: 'LAY-005',
      barcode: '8901234567894',
      categoryName: 'Snacks & Chips',
      brand: "Lay's",
      sellingPrice: 1.30,
      costPrice: 0.70,
      unit: 'Per PCS',
      quantity: 5,
      lowStockAlert: 10,
      status: StockStatus.LOW_STOCK,
      supplierId: s1.id
    }
  ];

  const dbProducts: any[] = [];
  for (const prod of productsData) {
    const category = categories[prod.categoryName];
    const dbProd = await prisma.product.create({
      data: {
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        categoryId: category.id,
        brand: prod.brand,
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice,
        unit: prod.unit,
        status: prod.status,
        supplierId: prod.supplierId,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
    });

    await prisma.productBranchStock.create({
      data: {
        productId: dbProd.id,
        branchId: mainBranch.id,
        quantity: prod.quantity,
        lowStockAlert: prod.lowStockAlert,
      },
    });
    dbProducts.push({ ...dbProd, quantity: prod.quantity });
  }

  console.log('Products seeded...');

  // 7. Create Supplier Product Mapping
  for (const prod of dbProducts) {
    await prisma.supplierProductMapping.create({
      data: {
        supplierId: prod.supplierId!,
        productId: prod.id,
        productName: prod.name,
        costPrice: prod.costPrice,
        minOrderQty: 10.0,
        leadTime: prod.name.includes('Apple') ? 5 : 3
      }
    });
  }

  // 8. Create Purchase Orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s1.id,
      orderNumber: 'PO-10001',
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      subtotal: 350.00,
      taxAmount: 63.00,
      discountAmount: 13.00,
      totalAmount: 400.00,
      status: 'Received',
      items: [
        { productId: dbProducts[3].id, productName: dbProducts[3].name, quantity: 500, purchasePrice: dbProducts[3].costPrice }
      ]
    }
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      supplierId: s2.id,
      orderNumber: 'PO-10002',
      orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      subtotal: 550.00,
      taxAmount: 99.00,
      discountAmount: 0.00,
      totalAmount: 649.00,
      status: 'Dispatched',
      items: [
        { productId: dbProducts[2].id, productName: dbProducts[2].name, quantity: 500, purchasePrice: dbProducts[2].costPrice }
      ]
    }
  });

  // Relational PO Items
  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po1.id,
      productId: dbProducts[3].id,
      quantity: 500,
      purchasePrice: dbProducts[3].costPrice,
      tax: 63.00,
      total: 400.00
    }
  });

  // 9. Delivery Tracking
  await prisma.deliveryTracking.create({
    data: {
      purchaseOrderId: po1.id,
      supplierId: s1.id,
      currentStatus: 'Received',
      dispatchDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receivedBy: 'John Doe',
      notes: 'GRN completed. No damages.'
    }
  });

  // 10. Goods Received Notes (GRN)
  await prisma.goodsReceiveNote.create({
    data: {
      purchaseOrderId: po1.id,
      grnNumber: 'GRN-99887',
      receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: [
        { productId: dbProducts[3].id, productName: dbProducts[3].name, quantityReceived: 500, quantityDamaged: 0 }
      ],
      branchId: mainBranch.id
    }
  });

  // 11. Supplier Invoice & Payment
  const invoice = await prisma.supplierInvoice.create({
    data: {
      invoiceNumber: 'INV-SUP-8871',
      purchaseOrderId: po1.id,
      supplierId: s1.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalAmount: 400.00,
      gstAmount: 63.00,
      status: 'Paid'
    }
  });

  await prisma.supplierPayment.create({
    data: {
      supplierInvoiceId: invoice.id,
      amountPaid: 400.00,
      remainingAmount: 0.00,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TXN-99882233'
    }
  });

  // 12. Returns Ledger
  const retObj = await prisma.return.create({
    data: {
      returnNumber: 'RET-88273',
      purchaseOrderId: po1.id,
      supplierId: s1.id,
      productId: dbProducts[3].id,
      quantity: 10,
      purchasePrice: dbProducts[3].costPrice,
      refundAmount: 8.0,
      reason: 'Slightly damaged packaging',
      status: 'Completed',
      requestedBy: 'John Doe',
      requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      approvedBy: 'John Doe',
      approvedDate: new Date()
    }
  });

  // 13. Refund Log
  await prisma.refundLog.create({
    data: {
      returnId: retObj.id,
      supplierId: s1.id,
      refundAmount: 8.0,
      paymentMethod: 'UPI',
      status: 'Completed',
      requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      receivedDate: new Date()
    }
  });

  // 14. Inventory Movements
  await prisma.inventoryMovement.create({
    data: {
      productId: dbProducts[3].id,
      movementType: 'Purchase',
      quantity: 500,
      referenceId: po1.id,
      notes: 'Initial purchase batch.'
    }
  });

  // 15. Expiry Management
  await prisma.expiryManagement.create({
    data: {
      productId: dbProducts[2].id,
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      quantity: 20,
      riskLevel: 'High',
      estimatedLoss: 22.0
    }
  });

  // 16. Supplier Performance
  await prisma.supplierPerformance.create({
    data: {
      supplierId: s1.id,
      totalOrders: 10,
      completedOrders: 9,
      delayedOrders: 0,
      returnsCount: 1,
      replacementCount: 0,
      damageCount: 2,
      deliveryScore: 99.0,
      qualityScore: 98.0,
      overallRating: 4.8
    }
  });

  // 17. AI Insights
  await prisma.aIInsight.create({
    data: {
      supplierId: s1.id,
      insightType: 'Performance',
      title: 'Top Reliability Rating',
      description: 'Excellent lead times and low return rate this month.',
      severity: 'Info'
    }
  });

  // 18. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: johnDoe.id,
      action: 'PO Approved',
      module: 'Sourcing',
      recordId: po1.id,
      newData: JSON.stringify({ poId: po1.id, status: 'Received' })
    }
  });

  // 19. Documents Table
  await prisma.document.create({
    data: {
      supplierId: s1.id,
      purchaseOrderId: po1.id,
      documentType: 'Invoice',
      filePath: '/docs/inv-8871.pdf',
      uploadedBy: 'John Doe'
    }
  });

  // 20. Notifications Table
  await prisma.notification.create({
    data: {
      userId: johnDoe.id,
      title: 'Low Stock: Coca Cola',
      message: 'Coca Cola is below minimum threshold levels.',
      status: 'Unread'
    }
  });

  // ============================================
  // CUSTOMERS MODULE SEED DATA
  // ============================================
  console.log('Seeding Customers and dependencies...');

  const c1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh@gmail.com',
      phone: '9845099887',
      dob: new Date('1990-05-15'),
      gender: 'Male',
      address: 'Flat 302, Green Glen Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      customerType: 'VIP',
      notes: 'Prefers premium products. Frequent weekend shopper.',
      status: 'Active',
      balance: 1500.0,
      loyaltyPoints: 1250
    }
  });

  const c2 = await prisma.customer.create({
    data: {
      name: 'Sarah Wilson',
      email: 'sarah.w@hotmail.com',
      phone: '9812233445',
      dob: new Date('1995-06-10'), // Upcoming birthday!
      gender: 'Female',
      address: '22, Main Street Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      customerType: 'Regular',
      notes: 'Buys healthy snacks and organic dairy products.',
      status: 'Active',
      balance: 0.0,
      loyaltyPoints: 340
    }
  });

  const c3 = await prisma.customer.create({
    data: {
      name: 'John Smith',
      email: 'john.smith@yahoo.com',
      phone: '9765432109',
      dob: new Date('1985-08-20'),
      gender: 'Male',
      address: '77, Park Lane Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      customerType: 'Regular',
      notes: 'Buys household groceries in bulk.',
      status: 'Active',
      balance: 100.00,
      loyaltyPoints: 150
    }
  });

  const c4 = await prisma.customer.create({
    data: {
      name: 'David Miller',
      email: 'david.miller@work.com',
      phone: '9555662233',
      dob: new Date('1978-11-04'),
      gender: 'Male',
      address: 'A-4, Industrial Area Phase 1',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      customerType: 'Wholesale',
      notes: 'Wholesale buyer. Requires tax invoice receipts.',
      status: 'Inactive', // Inactive customer
      balance: 5400.0,
      loyaltyPoints: 95
    }
  });

  // Seed Customer Notes
  await prisma.customerNote.create({
    data: {
      customerId: c1.id,
      note: 'Prefers online payment (UPI/Card). Regular weekend buyer.'
    }
  });

  await prisma.customerNote.create({
    data: {
      customerId: c2.id,
      note: 'Prefers home delivery. Likes beverages and juices.'
    }
  });

  // Seed Customer Timelines
  await prisma.customerTimeline.create({
    data: {
      customerId: c1.id,
      eventType: 'Customer Created',
      details: 'Customer profile registered under VIP tier.',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.customerTimeline.create({
    data: {
      customerId: c1.id,
      eventType: 'Purchase Completed',
      details: 'Purchased items worth ₹8,450.00. Invoice INV-10001.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.customerTimeline.create({
    data: {
      customerId: c1.id,
      eventType: 'Reward Earned',
      details: 'Earned 1,250 loyalty reward points.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  });

  // Create multiple orders and purchase orders across different dates to populate reports page
  const createOrder = async (
    daysOffset: number,
    invoiceNumber: string,
    customerId: string | null,
    paymentMethod: PaymentMethod,
    itemsList: { product: any; quantity: number }[]
  ) => {
    let subtotal = 0;
    itemsList.forEach((item) => {
      subtotal += item.product.sellingPrice * item.quantity;
    });
    const discount = parseFloat((subtotal * 0.05).toFixed(2));
    const tax = parseFloat(((subtotal - discount) * 0.18).toFixed(2));
    const totalPayable = parseFloat((subtotal - discount + tax).toFixed(2));

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysOffset);

    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        customerId,
        cashierId: johnDoe.id,
        branchId: mainBranch.id,
        subtotal,
        discount,
        tax,
        totalPayable,
        status: OrderStatus.COMPLETED,
        paymentMethod,
        createdAt: orderDate,
        updatedAt: orderDate
      }
    });

    for (const item of itemsList) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          total: parseFloat((item.product.sellingPrice * item.quantity).toFixed(2))
        }
      });
    }
    return order;
  };

  const createPurchaseOrder = async (
    daysOffset: number,
    orderNumber: string,
    supplierId: string,
    product: any,
    quantity: number
  ) => {
    const cost = product.costPrice * quantity;
    const subtotal = cost;
    const taxAmount = parseFloat((subtotal * 0.18).toFixed(2));
    const discountAmount = 0.0;
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    const poDate = new Date();
    poDate.setDate(poDate.getDate() - daysOffset);

    const expectedDate = new Date(poDate);
    expectedDate.setDate(expectedDate.getDate() + 3);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber,
        orderDate: poDate,
        expectedDeliveryDate: expectedDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        status: 'Received',
        items: [
          { productId: product.id, productName: product.name, quantity, purchasePrice: product.costPrice }
        ]
      }
    });

    await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: po.id,
        productId: product.id,
        quantity,
        purchasePrice: product.costPrice,
        tax: taxAmount,
        total: totalAmount
      }
    });

    return po;
  };

  console.log('Generating batch orders across different report date filters...');

  // 1. TODAY
  await createOrder(0, 'INV-2026-0001', c2.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 2 }, // Red Apple
    { product: dbProducts[2], quantity: 1 }  // Milk 1L
  ]);
  await createOrder(0, 'INV-2026-0002', c1.id, PaymentMethod.CASH, [
    { product: dbProducts[3], quantity: 5 }, // Coca Cola
    { product: dbProducts[4], quantity: 3 }  // Lay's
  ]);
  await createOrder(0, 'INV-2026-0003', c3.id, PaymentMethod.CARD, [
    { product: dbProducts[1], quantity: 2 }, // Banana
    { product: dbProducts[2], quantity: 2 }  // Milk 1L
  ]);

  // 2. YESTERDAY
  await createOrder(1, 'INV-2026-0004', null, PaymentMethod.CASH, [
    { product: dbProducts[2], quantity: 1 }, // Milk 1L
    { product: dbProducts[3], quantity: 1 }  // Coca Cola
  ]);
  await createOrder(1, 'INV-2026-0005', c2.id, PaymentMethod.UPI, [
    { product: dbProducts[1], quantity: 4 }  // Banana
  ]);

  // 3. LAST 7 DAYS (Offsets: 3, 4, 5)
  await createOrder(3, 'INV-2026-0006', c1.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 3 }, // Red Apple
    { product: dbProducts[4], quantity: 2 }  // Lay's
  ]);
  await createOrder(4, 'INV-2026-0007', c3.id, PaymentMethod.CARD, [
    { product: dbProducts[0], quantity: 1 }, // Red Apple
    { product: dbProducts[1], quantity: 1 }, // Banana
    { product: dbProducts[2], quantity: 1 }  // Milk 1L
  ]);
  await createOrder(5, 'INV-2026-0008', null, PaymentMethod.UPI, [
    { product: dbProducts[3], quantity: 10 } // Coca Cola
  ]);

  // 4. LAST 30 DAYS (Offsets: 10, 15, 20, 25)
  await createOrder(10, 'INV-2026-0009', c1.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 10 },
    { product: dbProducts[1], quantity: 5 }
  ]);
  await createOrder(15, 'INV-2026-0010', c2.id, PaymentMethod.CARD, [
    { product: dbProducts[2], quantity: 3 },
    { product: dbProducts[4], quantity: 2 }
  ]);
  await createOrder(20, 'INV-2026-0011', c4.id, PaymentMethod.CASH, [
    { product: dbProducts[2], quantity: 20 },
    { product: dbProducts[3], quantity: 20 }
  ]);
  await createOrder(25, 'INV-2026-0012', c3.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 4 }
  ]);

  // 5. LAST MONTH (Offsets: 40, 45)
  await createOrder(40, 'INV-2026-0013', c1.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 15 },
    { product: dbProducts[1], quantity: 10 }
  ]);
  await createOrder(45, 'INV-2026-0014', null, PaymentMethod.CASH, [
    { product: dbProducts[3], quantity: 8 }
  ]);

  // 6. QUARTER (Offsets: 70, 80)
  await createOrder(70, 'INV-2026-0015', c2.id, PaymentMethod.CARD, [
    { product: dbProducts[2], quantity: 6 }
  ]);
  await createOrder(80, 'INV-2026-0016', c4.id, PaymentMethod.CASH, [
    { product: dbProducts[4], quantity: 30 }
  ]);

  // 7. YEAR (Offsets: 120, 200, 300)
  await createOrder(120, 'INV-2026-0017', c1.id, PaymentMethod.UPI, [
    { product: dbProducts[0], quantity: 20 }
  ]);
  await createOrder(200, 'INV-2026-0018', c3.id, PaymentMethod.CARD, [
    { product: dbProducts[1], quantity: 12 }
  ]);
  await createOrder(300, 'INV-2026-0019', c2.id, PaymentMethod.CASH, [
    { product: dbProducts[2], quantity: 10 }
  ]);

  console.log('Generating batch purchase orders across different report date filters...');
  await createPurchaseOrder(0, 'PO-10003', s1.id, dbProducts[3], 100);
  await createPurchaseOrder(1, 'PO-10004', s2.id, dbProducts[2], 50);
  await createPurchaseOrder(4, 'PO-10005', s3.id, dbProducts[0], 200);
  await createPurchaseOrder(15, 'PO-10006', s1.id, dbProducts[4], 80);
  await createPurchaseOrder(42, 'PO-10007', s2.id, dbProducts[2], 120);
  await createPurchaseOrder(75, 'PO-10008', s3.id, dbProducts[1], 300);
  await createPurchaseOrder(150, 'PO-10009', s1.id, dbProducts[3], 500);


  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
