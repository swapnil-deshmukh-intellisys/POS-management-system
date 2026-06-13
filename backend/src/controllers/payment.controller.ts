import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { PaymentMethod, StockStatus } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendAutomaticWhatsAppInvoice } from '../utils/whatsapp';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = !!(
  razorpayKeyId &&
  razorpayKeySecret &&
  razorpayKeyId !== 'your_key_id' &&
  razorpayKeySecret !== 'your_secret_key'
);

let razorpay: any = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId as string,
    key_secret: razorpayKeySecret as string,
  });
}

export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { amount } = req.body;
  try {
    const totalAmount = parseFloat(String(amount));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (isRazorpayConfigured && razorpay) {
      const options = {
        amount: Math.round(totalAmount * 100), // in paisa
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      return res.status(201).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayKeyId,
        mock: false
      });
    } else {
      // Mock Fallback Mode
      const mockOrderId = `order_mock_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      return res.status(201).json({
        id: mockOrderId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        key: 'rzp_test_mockKey12345',
        mock: true
      });
    }
  } catch (error: any) {
    console.error('Error creating Razorpay Order:', error);
    return res.status(500).json({ message: 'Razorpay order creation failed', error: error.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, billingPayload } = req.body;

  try {
    let isValid = false;

    if (isRazorpayConfigured && razorpayKeySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');
      isValid = generatedSignature === razorpaySignature;
    } else {
      // Mock validation
      isValid = !!(razorpayOrderId && razorpayPaymentId && (razorpayOrderId.startsWith('order_mock_') || razorpayOrderId.startsWith('pay_mock_') || razorpayOrderId));
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    // Proceed with POS Billing Order creation, stock updates, invoice generation, etc.
    const { customerId, items, discount, tax, paymentMethod, couponCode, heldBillId, customerMobile } = billingPayload || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    let finalPaymentMethod: PaymentMethod = PaymentMethod.UPI;
    const payMethodStr = String(paymentMethod || '').toUpperCase();
    if (payMethodStr === 'CASH') finalPaymentMethod = PaymentMethod.CASH;
    else if (payMethodStr === 'CARD' || payMethodStr === 'NETBANKING' || payMethodStr === 'NET BANKING') finalPaymentMethod = PaymentMethod.CARD;
    else if (payMethodStr === 'WALLET') finalPaymentMethod = PaymentMethod.WALLET;
    else if (payMethodStr === 'SPLIT') finalPaymentMethod = PaymentMethod.SPLIT;

    if (isRazorpayConfigured && razorpay && razorpayPaymentId) {
      try {
        const rzpPay = await razorpay.payments.fetch(razorpayPaymentId);
        if (rzpPay && rzpPay.method) {
          const m = rzpPay.method.toUpperCase();
          if (m === 'UPI') finalPaymentMethod = PaymentMethod.UPI;
          else if (m === 'CARD') finalPaymentMethod = PaymentMethod.CARD;
          else if (m === 'WALLET') finalPaymentMethod = PaymentMethod.WALLET;
          else if (m === 'NETBANKING') finalPaymentMethod = PaymentMethod.CARD;
        }
      } catch (err) {
        console.error('Error fetching Razorpay payment method details:', err);
      }
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
      if (!branchStock || branchStock.quantity < qty) {
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
          status: 'COMPLETED',
          paymentMethod: finalPaymentMethod,
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
          data: { status: stockStatus },
        });
      }

      // Customer loyalty points (1 point per ₹100) and Transactions
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
        await tx.customerTransaction.create({
          data: {
            customerId,
            type: 'SALE',
            amount: totalPayable,
            points: pointsEarned,
            details: `Invoice: ${invoiceNumber} | Paid via Razorpay`,
          },
        });
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

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          invoiceId: invoice.id,
          customerId: customerId || null,
          amount: totalPayable,
          paymentMethod: finalPaymentMethod,
          status: 'SUCCESS',
          transactionId: razorpayPaymentId || null,
          razorpayOrderId: razorpayOrderId || null,
          razorpayPaymentId: razorpayPaymentId || null,
          cashierId: req.user!.id,
        },
      });

      // If heldBillId provided, mark it as Completed
      if (heldBillId) {
        await tx.heldBill.updateMany({
          where: { id: heldBillId },
          data: { status: 'Completed' }
        });
      }

      return order;
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'Sale Completed (Razorpay)',
        details: `Invoice: ${invoiceNumber} | Total: ₹${totalPayable.toFixed(2)} | Razorpay ID: ${razorpayPaymentId}`,
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

    // Save logs
    await prisma.paymentLog.create({
      data: {
        paymentId: completedOrder?.payments[0]?.id || null,
        gateway: 'RAZORPAY',
        event: 'verify_payment_success',
        payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature, status: 'SUCCESS' },
        paymentMethodSelected: paymentMethod || 'UPI',
        transactionStatus: 'SUCCESS',
      },
    });

    // Send automatic WhatsApp notification
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

    return res.status(200).json({ message: 'Payment verified and order created', order: completedOrder });

  } catch (error: any) {
    console.error('Error in verifyPayment:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createRefund = async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, itemsReturned, amount, method, reason } = req.body;
  try {
    if (!orderId || !itemsReturned || !Array.isArray(itemsReturned)) {
      return res.status(400).json({ message: 'OrderId and itemsReturned are required' });
    }

    const defaultBranch = await prisma.branch.findFirst();
    if (!defaultBranch) {
      return res.status(500).json({ message: 'No branch setup available' });
    }

    const refund = await prisma.$transaction(async (tx) => {
      // 1. Create refund record
      const r = await tx.refund.create({
        data: {
          orderId,
          amount: parseFloat(String(amount || 0)),
          method: method || PaymentMethod.CASH,
          reason: reason || 'Customer Return',
          itemsReturned: itemsReturned,
        },
      });

      // 2. Restore inventory stock
      for (const item of itemsReturned) {
        const updatedStock = await tx.productBranchStock.update({
          where: { productId_branchId: { productId: item.productId, branchId: defaultBranch.id } },
          data: { quantity: { increment: parseInt(String(item.quantity)) } },
        });

        let stockStatus: StockStatus = StockStatus.IN_STOCK;
        if (updatedStock.quantity <= 0) {
          stockStatus = StockStatus.OUT_OF_STOCK;
        } else if (updatedStock.quantity <= updatedStock.lowStockAlert) {
          stockStatus = StockStatus.LOW_STOCK;
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { status: stockStatus },
        });
      }

      return r;
    });

    // 3. Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'Order Refunded',
        details: `Order: ${orderId} | Refund: ₹${amount} | Method: ${method}`,
      },
    });

    return res.status(201).json(refund);
  } catch (error: any) {
    console.error('Error creating refund:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const logPaymentEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { paymentId, gateway, event, payload, paymentMethodSelected, errorCode, errorMessage, transactionStatus, providerResponse } = req.body;
  try {
    const log = await prisma.paymentLog.create({
      data: {
        paymentId: paymentId || null,
        gateway: gateway || 'RAZORPAY',
        event: event || 'payment_failed',
        payload: payload || {},
        paymentMethodSelected: paymentMethodSelected || null,
        errorCode: errorCode ? String(errorCode) : null,
        errorMessage: errorMessage ? String(errorMessage) : null,
        transactionStatus: transactionStatus || 'FAILED',
        providerResponse: providerResponse || null,
      }
    });
    return res.status(201).json(log);
  } catch (error: any) {
    console.error('Error logging payment event:', error);
    return res.status(500).json({ message: 'Failed to create payment log', error: error.message });
  }
};
