import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPurchaseOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        poItems: {
          include: { product: true }
        },
        grns: true,
        invoices: true
      },
      orderBy: { orderDate: 'desc' }
    });
    return res.status(200).json(pos);
  } catch (error: any) {
    console.error('Error getting purchase orders:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getPurchaseOrderById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        poItems: {
          include: { product: true }
        },
        grns: true,
        invoices: true,
        deliveries: true,
        goodsReceivedNotes: true,
        returnsList: true,
        replacements: true,
        refundsList: true
      }
    });
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    return res.status(200).json(po);
  } catch (error: any) {
    console.error('Error getting purchase order by ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createPurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { supplierId, orderNumber, expectedDeliveryDate, totalAmount, items, subtotal, taxAmount, discountAmount } = req.body;
  try {
    // Make sure expectedDeliveryDate is valid
    const deliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date();

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber,
        expectedDeliveryDate: deliveryDate,
        subtotal: subtotal ? parseFloat(String(subtotal)) : 0,
        taxAmount: taxAmount ? parseFloat(String(taxAmount)) : 0,
        discountAmount: discountAmount ? parseFloat(String(discountAmount)) : 0,
        totalAmount: parseFloat(String(totalAmount)),
        items: items || [], // Store inside JSON block for backward compatibility
        status: 'Draft'
      }
    });

    // Also populate relational PurchaseOrderItems if items array exists
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemQty = parseInt(String(item.quantity || 1));
        const itemPrice = parseFloat(String(item.purchasePrice || item.costPrice || 0));
        const itemTax = parseFloat(String(item.tax || 0));
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId: item.productId,
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

export const updatePurchaseOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, expectedDeliveryDate, subtotal, taxAmount, discountAmount, totalAmount } = req.body;

  try {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: status || undefined,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        subtotal: subtotal !== undefined ? parseFloat(String(subtotal)) : undefined,
        taxAmount: taxAmount !== undefined ? parseFloat(String(taxAmount)) : undefined,
        discountAmount: discountAmount !== undefined ? parseFloat(String(discountAmount)) : undefined,
        totalAmount: totalAmount !== undefined ? parseFloat(String(totalAmount)) : undefined
      }
    });

    // If status changed, create a Delivery Tracking entry log
    if (status && status !== existing.status) {
      await prisma.deliveryTracking.create({
        data: {
          purchaseOrderId: id,
          supplierId: existing.supplierId,
          currentStatus: status,
          notes: `Purchase Order status updated to ${status}.`
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
