import { Response } from 'express';
import prisma from '../config/db';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { OrderStatus, PaymentMethod, StockStatus } from '@prisma/client';
import { sendAutomaticWhatsAppInvoice } from '../utils/whatsapp';

export const createBillingOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, items, discount, tax, paymentMethod, couponCode, isDraft, heldBillId, splitPayments, customerMobile } = req.body;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    const defaultBranch = await prisma.branch.findFirst();
    if (!defaultBranch) {
      return res.status(500).json({ message: 'No branch setup available' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    let subtotal = 0;
    const orderItemsToCreate: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stocks: { where: { branchId: defaultBranch.id } } },
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      const qty = parseInt(String(item.quantity));
      if (qty <= 0) continue;

      const branchStock = product.stocks[0];
      if (!isDraft && (!branchStock || branchStock.quantity < qty)) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${branchStock?.quantity || 0}` });
      }

      let itemUnitPrice = product.sellingPrice;
      let itemTotal = product.sellingPrice * qty;
      let itemDiscount = 0;

      // Check for offers
      const activeOffer = await prisma.offer.findFirst({
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          OR: [{ productId: product.id }, { categoryId: product.categoryId }],
        },
        orderBy: [{ discountValue: 'desc' }, { startDate: 'desc' }],
      });

      if (activeOffer) {
        if (activeOffer.offerMode === 'BOGO' || activeOffer.offerMode === 'BUNDLE') {
          const buyQty = activeOffer.buyQuantity || 1;
          const freeQty = activeOffer.freeQuantity || 1;
          const groupSize = buyQty + freeQty;
          const groups = Math.floor(qty / groupSize);
          const remainder = qty % groupSize;
          const paidQty = groups * buyQty + Math.min(remainder, buyQty);
          itemTotal = product.sellingPrice * paidQty;
          itemDiscount = product.sellingPrice * (qty - paidQty);
        } else if (activeOffer.discountType === 'PERCENT') {
          itemUnitPrice = product.sellingPrice * (1 - activeOffer.discountValue / 100);
          itemTotal = itemUnitPrice * qty;
          itemDiscount = (product.sellingPrice - itemUnitPrice) * qty;
        } else {
          itemUnitPrice = Math.max(0, product.sellingPrice - activeOffer.discountValue);
          itemTotal = itemUnitPrice * qty;
          itemDiscount = (product.sellingPrice - itemUnitPrice) * qty;
        }
      }

      subtotal += itemTotal;
      orderItemsToCreate.push({
        productId: product.id,
        quantity: qty,
        unitPrice: itemUnitPrice,
        discount: itemDiscount,
        total: itemTotal,
      });
    }

    const discAmount = parseFloat(String(discount || 0));
    const taxAmount = parseFloat(String(tax || 0));
    const totalPayable = Math.max(0, subtotal - discAmount + taxAmount);

    const orderStatus = isDraft ? OrderStatus.DRAFT : OrderStatus.COMPLETED;

    let dbPaymentMethod: PaymentMethod = PaymentMethod.CASH;
    const pmUpper = String(paymentMethod || '').toUpperCase();
    if (pmUpper === 'CASH') dbPaymentMethod = PaymentMethod.CASH;
    else if (pmUpper === 'UPI') dbPaymentMethod = PaymentMethod.UPI;
    else if (pmUpper === 'CARD' || pmUpper === 'NETBANKING' || pmUpper === 'NET BANKING') dbPaymentMethod = PaymentMethod.CARD;
    else if (pmUpper === 'WALLET') dbPaymentMethod = PaymentMethod.WALLET;
    else if (pmUpper === 'SPLIT') dbPaymentMethod = PaymentMethod.SPLIT;

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
          paymentMethod: dbPaymentMethod,
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

      // Update Inventory
      if (orderStatus === OrderStatus.COMPLETED) {
        for (const item of orderItemsToCreate) {
          const updatedStock = await tx.productBranchStock.update({
            where: { productId_branchId: { productId: item.productId, branchId: defaultBranch.id } },
            data: { quantity: { decrement: item.quantity } },
          });

          let stockStatus: StockStatus = StockStatus.IN_STOCK;
          if (updatedStock.quantity <= 0) {
            stockStatus = StockStatus.OUT_OF_STOCK;
          } else if (updatedStock.quantity <= updatedStock.lowStockAlert) {
            stockStatus = StockStatus.LOW_STOCK;
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              status: stockStatus,
              lastSoldDate: new Date(),
              totalSalesQuantity: { increment: item.quantity }
            },
          });
        }

        // Customer loyalty points (1 point per ₹100), totalOrders, and totalSpent
        if (customerId) {
          const pointsEarned = Math.floor(totalPayable / 100);
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: { increment: pointsEarned },
              totalOrders: { increment: 1 },
              totalSpent: { increment: totalPayable }
            },
          });
          if (pointsEarned > 0) {
            await tx.loyaltyTransaction.create({
              data: {
                customerId,
                points: pointsEarned,
                type: 'EARNED',
                description: `Points earned on purchase invoice ${invoiceNumber}`,
              },
            });
          }
        }

        // Create Invoice record
        const qrToken = crypto.randomUUID();
        const invoiceUrl = `/invoice/${invoiceNumber}?token=${qrToken}`;
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            invoiceType: 'GST',
            qrToken,
            invoiceUrl,
          },
        });

        // Create standard payment record
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            invoiceId: invoice.id,
            customerId: customerId || null,
            amount: totalPayable,
            paymentMethod: dbPaymentMethod,
            status: 'SUCCESS',
            cashierId: req.user!.id,
          },
        });

        // Split payments handling
        if (paymentMethod === PaymentMethod.SPLIT && splitPayments && Array.isArray(splitPayments)) {
          for (const split of splitPayments) {
            await tx.splitPayment.create({
              data: {
                paymentId: payment.id,
                method: split.method,
                amount: parseFloat(String(split.amount)),
                transactionId: split.transactionId || null,
              },
            });
          }
        }
      }

      // If heldBillId provided, mark it as Completed
      if (heldBillId) {
        await tx.heldBill.updateMany({
          where: { id: heldBillId },
          data: { status: 'Completed' }
        });
      }

      // Create Invoice record if it does not exist yet (e.g. for non-completed draft/parked bills)
      const existingInvoice = await tx.invoice.findUnique({
        where: { orderId: order.id }
      });
      if (!existingInvoice) {
        const qrToken = crypto.randomUUID();
        const invoiceUrl = `/invoice/${invoiceNumber}?token=${qrToken}`;
        await tx.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            invoiceType: 'GST',
            qrToken,
            invoiceUrl,
          },
        });
      }

      return order;
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: orderStatus === OrderStatus.COMPLETED ? 'Sale Completed' : 'Saved Draft Sale',
        details: `Invoice: ${invoiceNumber} | Total: ₹${totalPayable.toFixed(2)}`,
      },
    });

    const completedOrder = await prisma.order.findUnique({
      where: { id: finalOrder.id },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true,
      }
    });

    // Send automatic WhatsApp notification if completed
    if (orderStatus === OrderStatus.COMPLETED) {
      const createdInvoice = await prisma.invoice.findFirst({
        where: { orderId: completedOrder!.id }
      });
      if (createdInvoice) {
        let phone = customerMobile;
        if (!phone && customerId) {
          const cust = await prisma.customer.findUnique({ where: { id: customerId } });
          phone = cust?.phone || '';
        }
        if (phone) {
          sendAutomaticWhatsAppInvoice(createdInvoice.id, phone).catch(err => {
            console.error('Failed to send auto WhatsApp invoice:', err);
          });
        }
      }
    }

    return res.status(201).json(completedOrder);
  } catch (error: any) {
    console.error('Error in createBillingOrder:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const holdBill = async (req: AuthenticatedRequest, res: Response) => {
  const { customerId, customerName, items, subtotal, discount, tax, totalPayable, notes } = req.body;
  try {
    const lastHeldBill = await prisma.heldBill.findFirst({
      where: { billNumber: { startsWith: 'HB-' } },
      orderBy: { createdAt: 'desc' }
    });
    let nextNum = 1001;
    if (lastHeldBill) {
      const match = lastHeldBill.billNumber.match(/HB-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const billNumber = `HB-${nextNum}`;

    const now = new Date();
    const createdDate = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const createdTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const cashier = req.user?.name || 'Admin';

    const held = await prisma.heldBill.create({
      data: {
        billNumber,
        customerId: customerId || null,
        customerName: customerName || 'Walk-in Customer',
        items: items || [],
        subtotal: parseFloat(String(subtotal || 0)),
        discount: parseFloat(String(discount || 0)),
        tax: parseFloat(String(tax || 0)),
        totalPayable: parseFloat(String(totalPayable || 0)),
        notes: notes || '',
        cashier,
        status: 'Held',
        createdDate,
        createdTime
      },
    });
    return res.status(201).json(held);
  } catch (error: any) {
    console.error('Error holding bill:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const resumeBill = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const heldBills = await prisma.heldBill.findMany({
      where: { status: 'Held' },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(heldBills);
  } catch (error: any) {
    console.error('Error resuming bill list:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteHeldBill = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.heldBill.update({
      where: { id },
      data: { status: 'Cancelled' }
    });
    return res.status(200).json({ message: 'Held bill cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling held bill:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const offlineSync = async (req: AuthenticatedRequest, res: Response) => {
  const { orders } = req.body;
  try {
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ message: 'Orders list is required for sync' });
    }

    const syncResults = [];
    const defaultBranch = await prisma.branch.findFirst();

    for (const offlineOrder of orders) {
      try {
        const { localId, customerId, items, discount, tax, paymentMethod, couponCode, createdAt } = offlineOrder;

        // Check if invoice number or localId already synced
        const checkExists = await prisma.order.findUnique({
          where: { invoiceNumber: offlineOrder.invoiceNumber || '' },
        });

        if (checkExists) {
          syncResults.push({ localId, status: 'SUCCESS', message: 'Already synced' });
          continue;
        }

        const invoiceNumber = offlineOrder.invoiceNumber || `OFF-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let subtotal = 0;
        const orderItemsToCreate: any[] = [];

        for (const item of items) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (!product) continue;

          const qty = parseInt(String(item.quantity));
          const itemTotal = product.sellingPrice * qty;

          subtotal += itemTotal;
          orderItemsToCreate.push({
            productId: product.id,
            quantity: qty,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: itemTotal,
          });
        }

        const discAmount = parseFloat(String(discount || 0));
        const taxAmount = parseFloat(String(tax || 0));
        const totalPayable = Math.max(0, subtotal - discAmount + taxAmount);

        await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              invoiceNumber,
              customerId: customerId || null,
              cashierId: req.user!.id,
              branchId: defaultBranch?.id || null,
              subtotal,
              discount: discAmount,
              tax: taxAmount,
              totalPayable,
              status: OrderStatus.COMPLETED,
              paymentMethod: paymentMethod || PaymentMethod.CASH,
              couponCode: couponCode || null,
              createdAt: createdAt ? new Date(createdAt) : new Date(),
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
          });

          // Permanently reduce inventory
          if (defaultBranch) {
            for (const item of orderItemsToCreate) {
              const updatedStock = await tx.productBranchStock.update({
                where: { productId_branchId: { productId: item.productId, branchId: defaultBranch.id } },
                data: { quantity: { decrement: item.quantity } },
              });
              let stockStatus: StockStatus = StockStatus.IN_STOCK;
              if (updatedStock.quantity <= 0) {
                stockStatus = StockStatus.OUT_OF_STOCK;
              } else if (updatedStock.quantity <= updatedStock.lowStockAlert) {
                stockStatus = StockStatus.LOW_STOCK;
              }
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  status: stockStatus,
                  lastSoldDate: new Date(),
                  totalSalesQuantity: { increment: item.quantity }
                },
              });
            }
          }

          // Payment log
          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: totalPayable,
              paymentMethod: paymentMethod || PaymentMethod.CASH,
              status: 'SUCCESS',
            },
          });

          // Invoice log
          const qrToken = crypto.randomUUID();
          const invoiceUrl = `/invoice/${invoiceNumber}?token=${qrToken}`;
          await tx.invoice.create({
            data: {
              invoiceNumber,
              orderId: order.id,
              qrToken,
              invoiceUrl,
            },
          });
        });

        // Add to offline sync history log with SUCCESS
        await prisma.offlineSync.upsert({
          where: { localId },
          create: { localId, payload: offlineOrder, status: 'SUCCESS' },
          update: { status: 'SUCCESS' },
        });

        syncResults.push({ localId, status: 'SUCCESS' });
      } catch (err: any) {
        console.error('Failed to sync offline order:', err);
        await prisma.offlineSync.upsert({
          where: { localId: offlineOrder.localId },
          create: { localId: offlineOrder.localId, payload: offlineOrder, status: 'FAILED', errorMessage: err.message },
          update: { status: 'FAILED', errorMessage: err.message },
        });
        syncResults.push({ localId: offlineOrder.localId, status: 'FAILED', error: err.message });
      }
    }

    return res.status(200).json({ message: 'Sync processed', results: syncResults });
  } catch (error: any) {
    console.error('Offline Sync Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getBillingHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        cashier: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createBillingPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, amount, paymentMethod, transactionId } = req.body;
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const invoice = await prisma.invoice.findFirst({ where: { orderId } });
    const payment = await prisma.payment.create({
      data: {
        orderId,
        invoiceId: invoice?.id || null,
        customerId: order.customerId || null,
        amount: parseFloat(String(amount)),
        paymentMethod: paymentMethod,
        transactionId: transactionId || null,
        status: 'SUCCESS',
        cashierId: order.cashierId || null,
      }
    });
    return res.status(200).json({ message: 'Payment recorded successfully', payment });
  } catch (error: any) {
    console.error('Error in createBillingPayment:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getBillingInvoice = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { orderId: id },
          { invoiceNumber: id }
        ]
      },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            customer: true,
            cashier: { select: { name: true } }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    return res.status(200).json(invoice);
  } catch (error: any) {
    console.error('Error in getBillingInvoice:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

