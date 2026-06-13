import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { OrderStatus, PaymentMethod, StockStatus } from '@prisma/client';

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        cashier: { select: { id: true, name: true } },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, items, discount, tax, paymentMethod, couponCode, isDraft, isParked } = req.body;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const defaultBranch = await prisma.branch.findFirst();
    if (!defaultBranch) {
      return res.status(500).json({ message: 'No branch setup available' });
    }

    // 1. Generate unique invoice number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // 2. Compute order totals
    let subtotal = 0;
    const orderItemsToCreate: { productId: string; quantity: number; unitPrice: number; total: number; discount: number }[] = [];

    // Verify products exist and prepare items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stocks: { where: { branchId: defaultBranch.id } } },
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const quantity = parseInt(String(item.quantity));
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
      }

      const branchStock = product.stocks[0];
      if (!isDraft && !isParked && (!branchStock || branchStock.quantity < quantity)) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${branchStock?.quantity || 0}` });
      }

      const activeOffer = await prisma.offer.findFirst({
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          OR: [{ productId: product.id }, { categoryId: product.categoryId }],
        },
        orderBy: [{ discountValue: 'desc' }, { startDate: 'desc' }],
      });

      let itemUnitPrice = product.sellingPrice;
      let itemTotal = product.sellingPrice * quantity;
      let itemDiscount = 0;

      if (activeOffer) {
        if (activeOffer.offerMode === 'BOGO' || activeOffer.offerMode === 'BUNDLE') {
          const buyQty = activeOffer.buyQuantity || 1;
          const freeQty = activeOffer.freeQuantity || 1;
          const groupSize = buyQty + freeQty;
          const groups = Math.floor(quantity / groupSize);
          const remainder = quantity % groupSize;
          const paidQuantity = groups * buyQty + Math.min(remainder, buyQty);
          itemTotal = product.sellingPrice * paidQuantity;
          itemDiscount = product.sellingPrice * (quantity - paidQuantity);
        } else if (activeOffer.discountType === 'PERCENT') {
          itemUnitPrice = product.sellingPrice * (1 - activeOffer.discountValue / 100);
          itemTotal = itemUnitPrice * quantity;
          itemDiscount = (product.sellingPrice - itemUnitPrice) * quantity;
        } else {
          itemUnitPrice = Math.max(0, product.sellingPrice - activeOffer.discountValue);
          itemTotal = itemUnitPrice * quantity;
          itemDiscount = (product.sellingPrice - itemUnitPrice) * quantity;
        }
      }

      subtotal += itemTotal;

      orderItemsToCreate.push({
        productId: product.id,
        quantity,
        unitPrice: itemUnitPrice,
        total: itemTotal,
        discount: itemDiscount,
      });
    }

    const discAmount = discount ? parseFloat(String(discount)) : 0.0;
    const taxAmount = tax ? parseFloat(String(tax)) : 0.0;
    const totalPayable = subtotal - discAmount + taxAmount;

    let orderStatus: OrderStatus = OrderStatus.COMPLETED;
    if (isDraft) orderStatus = OrderStatus.DRAFT;
    if (isParked) orderStatus = OrderStatus.PARKED;

    // 3. Atomically create Order and decrement product stock levels
    const finalOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          invoiceNumber,
          customerId: customerId || null,
          cashierId: req.user!.id,
          branchId: defaultBranch.id,
          subtotal,
          discount: discAmount,
          tax: taxAmount,
          totalPayable,
          status: orderStatus,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          couponCode: couponCode || null,
          items: {
            create: orderItemsToCreate.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      // Only decrement stock if the sale is completed
      if (orderStatus === OrderStatus.COMPLETED) {
        for (const item of orderItemsToCreate) {
          const updatedStock = await tx.productBranchStock.update({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId: defaultBranch.id,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Update product alert state dynamically
          let productStatus: StockStatus = StockStatus.IN_STOCK;
          if (updatedStock.quantity <= 0) {
            productStatus = StockStatus.OUT_OF_STOCK;
          } else if (updatedStock.quantity <= updatedStock.lowStockAlert) {
            productStatus = StockStatus.LOW_STOCK;
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { status: productStatus },
          });
        }
      }

      return order;
    });

    // 4. Log checkout activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: orderStatus === OrderStatus.COMPLETED ? 'Sale Completed' : orderStatus === OrderStatus.DRAFT ? 'Saved Draft Sale' : 'Parked Sale',
        details: `Checkout invoice: ${invoiceNumber} | Total: $${totalPayable.toFixed(2)}`,
      },
    });

    return res.status(201).json(finalOrder);
  } catch (error: any) {
    console.error('Error checkout order:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, address } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    if (email) {
      const exists = await prisma.customer.findUnique({ where: { email } });
      if (exists) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, address },
    });

    return res.status(201).json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
