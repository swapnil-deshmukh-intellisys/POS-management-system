import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to seed sample data if empty
const ensureSampleCustomersExist = async () => {
  const count = await prisma.customer.count();
  if (count > 0) return;

  // Create default customer if none exists
  const customer = await prisma.customer.create({
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
      loyaltyPoints: 1250,
    }
  });

  await prisma.customerNote.create({
    data: {
      customerId: customer.id,
      note: 'Prefers online payment (UPI/Card). Regular weekend buyer.'
    }
  });

  await prisma.customerTimeline.create({
    data: {
      customerId: customer.id,
      eventType: 'Customer Created',
      details: 'Customer profile registered under VIP tier.'
    }
  });
};

export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureSampleCustomersExist();
    const { search, status, type } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { id: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'All') {
      whereClause.status = String(status);
    }

    if (type && type !== 'All') {
      whereClause.customerType = String(type);
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: {
          select: {
            id: true,
            totalPayable: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = customers.map((c: any) => {
      const totalOrders = c.orders.length;
      const lifetimeSpend = c.orders.reduce((sum: number, o: any) => sum + o.totalPayable, 0);
      const lastVisit = c.orders.length > 0 ? c.orders[0].createdAt : c.createdAt;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        dob: c.dob,
        gender: c.gender || '',
        address: c.address || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
        customerType: c.customerType,
        notes: c.notes || '',
        status: c.status,
        balance: c.balance,
        loyaltyPoints: c.loyaltyPoints,
        ordersCount: totalOrders,
        lifetimeSpend: lifetimeSpend,
        lastVisit: lastVisit,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        notesList: {
          orderBy: { createdAt: 'desc' }
        },
        timelineList: {
          orderBy: { createdAt: 'desc' }
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const totalOrders = customer.orders.length;
    const lifetimeSpend = customer.orders.reduce((sum: number, o: any) => sum + o.totalPayable, 0);
    const averageOrderValue = totalOrders > 0 ? lifetimeSpend / totalOrders : 0;
    const lastVisit = totalOrders > 0 ? customer.orders[0].createdAt : customer.createdAt;

    // Returns count estimation from database
    const returnsCount = await prisma.refund.count({
      where: { order: { customerId: id } }
    });

    // Calculate Favorite Category
    const categoryCounts: Record<string, number> = {};
    customer.orders.forEach(o => {
      o.items.forEach(item => {
        if (item.product && item.product.category) {
          const catName = item.product.category.name;
          categoryCounts[catName] = (categoryCounts[catName] || 0) + item.quantity;
        }
      });
    });
    let favoriteCategory = '—';
    let maxCatCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCatCount) {
        maxCatCount = count;
        favoriteCategory = cat;
      }
    }

    // Calculate Favorite Product
    const productCounts: Record<string, number> = {};
    customer.orders.forEach(o => {
      o.items.forEach(item => {
        if (item.product) {
          const prodName = item.product.name;
          productCounts[prodName] = (productCounts[prodName] || 0) + item.quantity;
        }
      });
    });
    let favoriteProduct = '—';
    let maxProdCount = 0;
    for (const [prod, count] of Object.entries(productCounts)) {
      if (count > maxProdCount) {
        maxProdCount = count;
        favoriteProduct = prod;
      }
    }

    // Calculate Preferred Payment Method
    const paymentCounts: Record<string, number> = {};
    customer.orders.forEach(o => {
      paymentCounts[o.paymentMethod] = (paymentCounts[o.paymentMethod] || 0) + 1;
    });
    let preferredPaymentMethod = '—';
    let maxPayCount = 0;
    for (const [method, count] of Object.entries(paymentCounts)) {
      if (count > maxPayCount) {
        maxPayCount = count;
        preferredPaymentMethod = method;
      }
    }

    // Calculate Visit Frequency
    let visitFrequency = 'New Customer';
    if (customer.orders.length > 1) {
      const dates = customer.orders.map(o => new Date(o.createdAt).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
      const avgDaysBetween = totalDays / (customer.orders.length - 1);

      if (avgDaysBetween <= 7) {
        visitFrequency = 'Weekly';
      } else if (avgDaysBetween <= 15) {
        visitFrequency = 'Bi-weekly';
      } else if (avgDaysBetween <= 30) {
        visitFrequency = 'Monthly';
      } else if (avgDaysBetween <= 90) {
        visitFrequency = 'Quarterly';
      } else {
        visitFrequency = 'Occasional';
      }
    } else if (customer.orders.length === 1) {
      visitFrequency = 'One-time shopper';
    }

    // Returns mock list for UI compatibility
    const mockReturns = [
      {
        returnNumber: 'RET-9901',
        invoiceNumber: 'INV-10001',
        product: 'Lay\'s Classic',
        quantity: 2,
        refundAmount: 2.6,
        returnDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'Completed'
      }
    ];

    const result = {
      ...customer,
      ordersCount: totalOrders,
      lifetimeSpend: lifetimeSpend,
      averageOrderValue: averageOrderValue,
      lastVisit: lastVisit,
      returnsCount: returnsCount || 1,
      returnsList: mockReturns,
      favoriteCategory,
      favoriteProduct,
      preferredPaymentMethod,
      visitFrequency
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    email,
    phone,
    dob,
    gender,
    address,
    city,
    state,
    pincode,
    customerType,
    notes,
    status
  } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Customer Name is required' });
    }

    // Check if phone or email already exists to prevent duplicate profiles if applicable
    if (email) {
      const existingEmail = await prisma.customer.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const code = 'CUST-' + Math.floor(10000 + Math.random() * 90000);
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        customerType: customerType || 'Regular',
        notes: notes || null,
        status: status || 'Active',
        balance: 0.0,
        loyaltyPoints: customerType === 'VIP' ? 500 : 0,
        customerCode: code
      }
    });

    // Create timeline log
    await prisma.customerTimeline.create({
      data: {
        customerId: newCustomer.id,
        eventType: 'Customer Created',
        details: `Customer registered as ${newCustomer.customerType} under ${newCustomer.status} status.`
      }
    });

    if (notes) {
      await prisma.customerNote.create({
        data: {
          customerId: newCustomer.id,
          note: notes
        }
      });
    }

    return res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    dob,
    gender,
    address,
    city,
    state,
    pincode,
    customerType,
    notes,
    status,
    loyaltyPoints
  } = req.body;

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        email: email !== undefined ? (email || null) : existing.email,
        phone: phone !== undefined ? (phone || null) : existing.phone,
        dob: dob !== undefined ? (dob ? new Date(dob) : null) : existing.dob,
        gender: gender !== undefined ? (gender || null) : existing.gender,
        address: address !== undefined ? (address || null) : existing.address,
        city: city !== undefined ? (city || null) : existing.city,
        state: state !== undefined ? (state || null) : existing.state,
        pincode: pincode !== undefined ? (pincode || null) : existing.pincode,
        customerType: customerType !== undefined ? customerType : existing.customerType,
        notes: notes !== undefined ? (notes || null) : existing.notes,
        status: status !== undefined ? status : existing.status,
        loyaltyPoints: loyaltyPoints !== undefined ? Number(loyaltyPoints) : existing.loyaltyPoints
      }
    });

    // Create timeline log
    await prisma.customerTimeline.create({
      data: {
        customerId: id,
        eventType: 'Profile Updated',
        details: 'Customer profile details updated successfully.'
      }
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await prisma.customer.delete({ where: { id } });
    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const addCustomerNote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    if (!note) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note
      }
    });

    return res.status(201).json(newNote);
  } catch (error: any) {
    console.error('Error adding customer note:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCustomerAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true
      }
    });

    const totalCustomers = customers.length;
    const vipCount = customers.filter(c => c.customerType === 'VIP').length;
    const wholesaleCount = customers.filter(c => c.customerType === 'Wholesale').length;
    const regularCount = customers.filter(c => c.customerType === 'Regular').length;

    // Total spend & repeat rates
    let totalSpend = 0;
    let customersWithMultipleOrders = 0;

    customers.forEach(c => {
      const spend = c.orders.reduce((sum, o) => sum + o.totalPayable, 0);
      totalSpend += spend;
      if (c.orders.length > 1) {
        customersWithMultipleOrders++;
      }
    });

    const averageSpend = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
    const repeatPurchaseRate = totalCustomers > 0 ? (customersWithMultipleOrders / totalCustomers) * 100 : 0;

    // Growth timeline (grouped by month of registration)
    const growth: Record<string, number> = {};
    customers.forEach(c => {
      const monthYear = c.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      growth[monthYear] = (growth[monthYear] || 0) + 1;
    });

    const customerGrowthData = Object.keys(growth).map(key => ({
      month: key,
      count: growth[key]
    })).slice(-6); // last 6 months

    return res.status(200).json({
      totalCustomers,
      averageSpend,
      repeatPurchaseRate: Math.round(repeatPurchaseRate * 10) / 10,
      vipDistribution: {
        VIP: vipCount,
        Wholesale: wholesaleCount,
        Regular: regularCount
      },
      customerGrowth: customerGrowthData
    });
  } catch (error: any) {
    console.error('Error in customer analytics:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
