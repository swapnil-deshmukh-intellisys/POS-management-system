import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getReturns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returns = await prisma.return.findMany({
      include: {
        supplier: true,
        purchaseOrder: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(returns);
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createReturn = async (req: AuthenticatedRequest, res: Response) => {
  const { purchaseOrderId, supplierId, productId, quantity, purchasePrice, refundAmount, reason, requestedBy } = req.body;
  try {
    const returnNumber = `RET-${Math.floor(10000 + Math.random() * 90000)}`;
    const ret = await prisma.return.create({
      data: {
        returnNumber,
        purchaseOrderId,
        supplierId,
        productId,
        quantity: parseInt(String(quantity)),
        purchasePrice: parseFloat(String(purchasePrice)),
        refundAmount: parseFloat(String(refundAmount || 0)),
        reason,
        status: 'Pending',
        requestedBy,
        requestedDate: new Date()
      }
    });

    // Write log/movement: decrement product stock and register movement if approved.
    // We will do that inside updateReturn (approval phase).

    return res.status(201).json(ret);
  } catch (error: any) {
    console.error('Error creating return:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateReturn = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, approvedBy, refundPaymentMethod } = req.body;

  try {
    const existing = await prisma.return.findUnique({
      where: { id },
      include: { product: true }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Return record not found' });
    }

    const updated = await prisma.return.update({
      where: { id },
      data: {
        status: status || undefined,
        approvedBy: approvedBy || undefined,
        approvedDate: status === 'Approved' ? new Date() : undefined
      }
    });

    // If status became Approved, let's create a Refund record or register stock changes
    if (status === 'Approved' && existing.status !== 'Approved') {
      // 1. Create a Refund log
      await prisma.refundLog.create({
        data: {
          returnId: id,
          supplierId: existing.supplierId,
          refundAmount: existing.refundAmount,
          paymentMethod: refundPaymentMethod || 'BANK_TRANSFER',
          status: 'Paid',
          requestedDate: new Date(),
          receivedDate: new Date(),
          purchaseOrderId: existing.purchaseOrderId
        }
      });

      // 2. Adjust inventory stock (decrease due to return)
      const defaultBranch = await prisma.branch.findFirst();
      if (defaultBranch) {
        await prisma.productBranchStock.upsert({
          where: {
            productId_branchId: {
              productId: existing.productId,
              branchId: defaultBranch.id
            }
          },
          create: {
            productId: existing.productId,
            branchId: defaultBranch.id,
            quantity: 0
          },
          update: {
            quantity: { decrement: existing.quantity }
          }
        });
      }

      // 3. Log movement
      await prisma.inventoryMovement.create({
        data: {
          productId: existing.productId,
          movementType: 'Return',
          quantity: -existing.quantity,
          referenceId: id,
          notes: `Return approved (${existing.returnNumber}). Qty decreased by ${existing.quantity}.`
        }
      });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating return:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
