import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockStatus } from '@prisma/client';

export const createExchange = async (req: AuthenticatedRequest, res: Response) => {
  const { invoiceNumber, originalProductId, originalQuantity, replacementProductId, replacementQuantity, reason } = req.body;

  try {
    if (!invoiceNumber || !originalProductId || !originalQuantity || !replacementProductId || !replacementQuantity) {
      return res.status(400).json({ message: 'All parameters (invoiceNumber, originalProductId, originalQuantity, replacementProductId, replacementQuantity) are required' });
    }

    const order = await prisma.order.findUnique({
      where: { invoiceNumber },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ message: `Invoice ${invoiceNumber} not found` });
    }

    const defaultBranch = await prisma.branch.findFirst();
    if (!defaultBranch) {
      return res.status(500).json({ message: 'No branch setup available' });
    }

    const originalProduct = await prisma.product.findUnique({ where: { id: originalProductId } });
    const replacementProduct = await prisma.product.findUnique({ where: { id: replacementProductId } });

    if (!originalProduct || !replacementProduct) {
      return res.status(404).json({ message: 'Original or replacement product not found' });
    }

    // Check replacement stock level before executing exchange
    const replacementStock = await prisma.productBranchStock.findUnique({
      where: { productId_branchId: { productId: replacementProductId, branchId: defaultBranch.id } }
    });

    if (!replacementStock || replacementStock.quantity < replacementQuantity) {
      return res.status(400).json({ message: `Insufficient stock for replacement product ${replacementProduct.name}. Available: ${replacementStock?.quantity || 0}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Restore original product stock
      const updatedOriginalStock = await tx.productBranchStock.update({
        where: { productId_branchId: { productId: originalProductId, branchId: defaultBranch.id } },
        data: { quantity: { increment: originalQuantity } }
      });

      let origStatus: StockStatus = StockStatus.IN_STOCK;
      if (updatedOriginalStock.quantity <= 0) {
        origStatus = StockStatus.OUT_OF_STOCK;
      } else if (updatedOriginalStock.quantity <= updatedOriginalStock.lowStockAlert) {
        origStatus = StockStatus.LOW_STOCK;
      }

      await tx.product.update({
        where: { id: originalProductId },
        data: { status: origStatus }
      });

      // 2. Deduct replacement product stock
      const updatedReplacementStock = await tx.productBranchStock.update({
        where: { productId_branchId: { productId: replacementProductId, branchId: defaultBranch.id } },
        data: { quantity: { decrement: replacementQuantity } }
      });

      let replStatus: StockStatus = StockStatus.IN_STOCK;
      if (updatedReplacementStock.quantity <= 0) {
        replStatus = StockStatus.OUT_OF_STOCK;
      } else if (updatedReplacementStock.quantity <= updatedReplacementStock.lowStockAlert) {
        replStatus = StockStatus.LOW_STOCK;
      }

      await tx.product.update({
        where: { id: replacementProductId },
        data: { status: replStatus }
      });

      // 3. Create Exchange entry
      const exchange = await tx.productExchange.create({
        data: {
          invoiceNumber,
          customerId: order.customerId,
          handledById: req.user!.id,
          reason: reason || 'Product damaged/incorrect size',
          items: {
            create: {
              originalProductId,
              originalQuantity,
              replacementProductId,
              replacementQuantity
            }
          }
        },
        include: {
          items: {
            include: {
              originalProduct: true,
              replacementProduct: true
            }
          },
          handledBy: { select: { name: true } },
          customer: true
        }
      });

      // 4. Log Inventory Movements
      await tx.inventoryMovement.create({
        data: {
          productId: originalProductId,
          movementType: 'Exchange_Return',
          quantity: originalQuantity,
          referenceId: exchange.id,
          notes: `Returned damaged item from exchange of invoice ${invoiceNumber}`
        }
      });

      await tx.inventoryMovement.create({
        data: {
          productId: replacementProductId,
          movementType: 'Exchange_Issue',
          quantity: replacementQuantity,
          referenceId: exchange.id,
          notes: `Issued replacement item for exchange of invoice ${invoiceNumber}`
        }
      });

      return exchange;
    });

    // 5. Activity Log
    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'Product Exchanged',
        details: `Invoice: ${invoiceNumber} | Exchanged: ${originalProduct.name} for ${replacementProduct.name}`
      }
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error executing exchange:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getExchangeHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exchanges = await prisma.productExchange.findMany({
      include: {
        items: {
          include: {
            originalProduct: true,
            replacementProduct: true
          }
        },
        handledBy: { select: { name: true } },
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(exchanges);
  } catch (error: any) {
    console.error('Error fetching exchange history:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
