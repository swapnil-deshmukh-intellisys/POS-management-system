import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockStatus } from '@prisma/client';

export const getProductStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        stocks: true,
      },
    });

    let totalProducts = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    products.forEach((prod) => {
      totalProducts++;

      const stockItem = prod.stocks[0];
      const quantity = stockItem ? stockItem.quantity : 0;
      const lowStockAlert = 10;

      if (quantity <= 0) {
        outOfStock++;
      } else if (quantity <= lowStockAlert) {
        lowStock++;
      } else {
        inStock++;
      }

      totalValue += prod.sellingPrice * quantity;
    });

    return res.status(200).json({
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
    });
  } catch (error: any) {
    console.error('Error fetching product stats:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  const { search, categoryId, status, brand } = req.query;

  try {
    const whereClause: any = { isDeleted: false };
    
    console.log('[DEBUG] API Request - getProducts - query params:', { search, categoryId, status, brand });

    if (search) {
      // Sanitize: remove carriage returns, newlines, tabs, and all spaces
      const searchStr = String(search).replace(/[\r\n\t\s]/g, '').trim();
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchStr);
      
      console.log('[DEBUG] Scanned Barcode / Search Term:', searchStr);

      const orConditions: any[] = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { sku: { contains: searchStr, mode: 'insensitive' } },
        { barcode: searchStr },
        { brand: { contains: searchStr, mode: 'insensitive' } }
      ];

      if (isUuid) {
        orConditions.push({ id: searchStr });
      }

      whereClause.OR = orConditions;
    }

    if (categoryId) {
      whereClause.categoryId = String(categoryId);
    }

    if (status) {
      whereClause.status = status as StockStatus;
    }

    if (brand) {
      whereClause.brand = String(brand);
    }

    console.log('[DEBUG] SQL Query - Prisma Where Clause:', JSON.stringify(whereClause, null, 2));

    const currentDate = new Date();
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        stocks: {
          include: { branch: true },
        },
        offers: {
          where: {
            isActive: true,
            startDate: { lte: currentDate },
            endDate: { gte: currentDate },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as any[];

    console.log('[DEBUG] Database Result - Count:', products.length);
    console.log('[DEBUG] Matched Product IDs:', products.map(p => ({ id: p.id, name: p.name, barcode: p.barcode, sku: p.sku })));

    const productIds = products.map((prod) => prod.id);
    const soldGroups = productIds.length
      ? await prisma.orderItem.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _sum: { quantity: true },
      })
      : [];

    const soldCountMap = new Map(soldGroups.map((group) => [group.productId, group._sum.quantity || 0]));

    const formattedProducts = products.map((prod) => {
      const stockItem = prod.stocks[0];
      const quantity = stockItem ? stockItem.quantity : 0;
      const lowStockAlert = 10;

      let calculatedStatus: StockStatus = prod.status;
      if (quantity <= 0) {
        calculatedStatus = StockStatus.OUT_OF_STOCK;
      } else if (quantity <= lowStockAlert) {
        calculatedStatus = StockStatus.LOW_STOCK;
      } else {
        calculatedStatus = StockStatus.IN_STOCK;
      }

      const soldCount = soldCountMap.get(prod.id) || prod.totalSalesQuantity || 0;
      const daysSinceCreated = (Date.now() - new Date(prod.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      let isUnsold = false;
      if (daysSinceCreated >= 30 && soldCount === 0) {
        isUnsold = true;
      } else if (soldCount > 0 && prod.lastSoldDate) {
        const daysSinceLastSold = (Date.now() - new Date(prod.lastSoldDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSold >= 30) {
          isUnsold = true;
        }
      }

      const activeOffer = prod.offers?.[0] || null;
      const offerLabel = activeOffer?.title || prod.offerLabel;
      const offerType = activeOffer?.offerMode?.toLowerCase() || prod.offerType;
      const offerDiscount = activeOffer
        ? activeOffer.discountType === 'PERCENT'
          ? activeOffer.discountValue
          : undefined
        : prod.offerDiscount;
      return {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        brand: prod.brand,
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice,
        expiryDate: prod.expiryDate,
        unit: prod.unit,
        status: calculatedStatus,
        category: prod.category ? { id: prod.category.id, name: prod.category.name } : { id: '', name: 'Uncategorized' },
        quantity,
        soldCount,
        isUnsold,
        isOnOffer: Boolean(activeOffer) || prod.isOnOffer,
        offerPrice: prod.offerPrice,
        offerStartDate: prod.offerStartDate,
        offerEndDate: prod.offerEndDate,
        lastSoldDate: prod.lastSoldDate,
        totalSalesQuantity: prod.totalSalesQuantity,
        activeOffer: activeOffer
          ? {
            id: activeOffer.id,
            title: activeOffer.title,
            discountType: activeOffer.discountType,
            discountValue: activeOffer.discountValue,
            offerMode: activeOffer.offerMode,
            buyQuantity: activeOffer.buyQuantity,
            freeQuantity: activeOffer.freeQuantity,
            startDate: activeOffer.startDate,
            endDate: activeOffer.endDate,
            isActive: activeOffer.isActive,
            productId: activeOffer.productId,
            categoryId: activeOffer.categoryId,
          }
          : null,
        offerDiscount,
        offerType,
        offerBuyQuantity: activeOffer?.buyQuantity ?? prod.offerBuyQuantity,
        offerFreeQuantity: activeOffer?.freeQuantity ?? prod.offerFreeQuantity,
        offerLabel,
        offerEndsAt: activeOffer?.endDate ?? prod.offerEndsAt,
        expiryStatus: prod.expiryStatus,
        batchNumber: prod.batchNumber,
        supplierId: prod.supplierId,
        lastNotificationSent: prod.lastNotificationSent,
        actionTaken: prod.actionTaken,
        resolvedAt: prod.resolvedAt,
        prioritySale: prod.prioritySale,
        returnedStock: prod.returnedStock,
        returnReason: prod.returnReason,
        expiryActionStatus: prod.expiryActionStatus,
        expiryNotificationStage: prod.expiryNotificationStage,
        createdAt: prod.createdAt,
      };
    });

    return res.status(200).json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, barcode, categoryId, brand, sellingPrice, costPrice, unit, quantity, expiryDate, isOnOffer, offerDiscount, offerType, offerBuyQuantity, offerFreeQuantity, offerLabel, offerEndsAt, offerPrice, offerStartDate, offerEndDate } = req.body;

  try {
    if (!name || !sku || !categoryId || sellingPrice === undefined || costPrice === undefined) {
      return res.status(400).json({ message: 'Name, SKU, Category, Selling Price, and Cost Price are required' });
    }

    const parsedSellingPrice = parseFloat(String(sellingPrice));
    const parsedCostPrice = parseFloat(String(costPrice));
    const normalizedBarcode = barcode !== undefined && barcode !== null ? String(barcode).replace(/[\r\n\t\s]/g, '').trim() : '';
    if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      return res.status(400).json({ message: 'Selling price cannot be negative' });
    }
    if (Number.isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      return res.status(400).json({ message: 'Cost price cannot be negative' });
    }

    const parsedExpiryDate = expiryDate ? new Date(String(expiryDate)) : null;
    if (expiryDate && Number.isNaN(parsedExpiryDate?.getTime())) {
      return res.status(400).json({ message: 'Expiry date is invalid' });
    }

    // Check collisions
    const skuExists = await prisma.product.findUnique({ where: { sku } });
    if (skuExists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    if (normalizedBarcode) {
      const barcodeExists = await prisma.product.findUnique({ where: { barcode: normalizedBarcode } });
      if (barcodeExists) {
        return res.status(400).json({ message: 'Product with this barcode already exists' });
      }
    }

    const qty = quantity !== undefined ? parseInt(String(quantity)) : 0;
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    let computedStatus: StockStatus = StockStatus.IN_STOCK;
    if (qty <= 0) {
      computedStatus = StockStatus.OUT_OF_STOCK;
    } else if (qty <= 10) {
      computedStatus = StockStatus.LOW_STOCK;
    }

    const parsedOfferDiscount = offerDiscount !== undefined && offerDiscount !== null ? parseFloat(String(offerDiscount)) : undefined;
    const parsedOfferBuyQuantity = offerBuyQuantity !== undefined && offerBuyQuantity !== null ? parseInt(String(offerBuyQuantity), 10) : undefined;
    const parsedOfferFreeQuantity = offerFreeQuantity !== undefined && offerFreeQuantity !== null ? parseInt(String(offerFreeQuantity), 10) : undefined;
    const parsedOfferEndsAt = offerEndsAt ? new Date(String(offerEndsAt)) : undefined;

    const parsedOfferPrice = offerPrice !== undefined && offerPrice !== null ? parseFloat(String(offerPrice)) : undefined;
    const parsedOfferStartDate = offerStartDate ? new Date(String(offerStartDate)) : undefined;
    const parsedOfferEndDate = offerEndDate ? new Date(String(offerEndDate)) : undefined;

    if (parsedOfferBuyQuantity !== undefined && (Number.isNaN(parsedOfferBuyQuantity) || parsedOfferBuyQuantity <= 0)) {
      return res.status(400).json({ message: 'Offer buy quantity must be a positive integer' });
    }
    if (parsedOfferFreeQuantity !== undefined && (Number.isNaN(parsedOfferFreeQuantity) || parsedOfferFreeQuantity <= 0)) {
      return res.status(400).json({ message: 'Offer free quantity must be a positive integer' });
    }
    if (parsedOfferPrice !== undefined && (Number.isNaN(parsedOfferPrice) || parsedOfferPrice < 0)) {
      return res.status(400).json({ message: 'Offer price cannot be negative' });
    }
    if (offerStartDate && Number.isNaN(parsedOfferStartDate?.getTime())) {
      return res.status(400).json({ message: 'Offer start date is invalid' });
    }
    if (offerEndDate && Number.isNaN(parsedOfferEndDate?.getTime())) {
      return res.status(400).json({ message: 'Offer end date is invalid' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode: normalizedBarcode || null,
        categoryId,
        brand,
        sellingPrice: parsedSellingPrice,
        costPrice: parsedCostPrice,
        expiryDate: parsedExpiryDate,
        unit: unit || 'PCS',
        status: computedStatus,
        isOnOffer: Boolean(isOnOffer),
        offerDiscount: parsedOfferDiscount,
        offerType: offerType?.toString() || null,
        offerBuyQuantity: parsedOfferBuyQuantity,
        offerFreeQuantity: parsedOfferFreeQuantity,
        offerLabel: offerLabel?.toString() || null,
        offerEndsAt: parsedOfferEndsAt,
        offerPrice: parsedOfferPrice,
        offerStartDate: parsedOfferStartDate,
        offerEndDate: parsedOfferEndDate,
      },
    });

    // Create stock entry for default/main branch
    const defaultBranch = await prisma.branch.findFirst();
    if (defaultBranch) {
      await prisma.productBranchStock.create({
        data: {
          productId: product.id,
          branchId: defaultBranch.id,
          quantity: qty,
        },
      });
    }

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Product Added',
          details: `Added new product: ${name} (SKU: ${sku})`,
        },
      });
    }

    return res.status(201).json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, sku, barcode, categoryId, brand, sellingPrice, costPrice, unit, quantity, expiryDate, isOnOffer, offerDiscount, offerType, offerBuyQuantity, offerFreeQuantity, offerLabel, offerEndsAt, expiryStatus, batchNumber, supplierId, lastNotificationSent, actionTaken, resolvedAt, prioritySale, returnedStock, returnReason, expiryActionStatus, expiryNotificationStage, offerPrice, offerStartDate, offerEndDate } = req.body;
  const hasBarcodeField = Object.prototype.hasOwnProperty.call(req.body, 'barcode');
  const normalizedBarcode = hasBarcodeField ? String(barcode ?? '').replace(/[\r\n\t\s]/g, '').trim() : undefined;
  const hasExpiryDateField = Object.prototype.hasOwnProperty.call(req.body, 'expiryDate');
  const hasOfferDiscountField = Object.prototype.hasOwnProperty.call(req.body, 'offerDiscount');
  const hasOfferTypeField = Object.prototype.hasOwnProperty.call(req.body, 'offerType');
  const hasOfferBuyQuantityField = Object.prototype.hasOwnProperty.call(req.body, 'offerBuyQuantity');
  const hasOfferFreeQuantityField = Object.prototype.hasOwnProperty.call(req.body, 'offerFreeQuantity');
  const hasOfferLabelField = Object.prototype.hasOwnProperty.call(req.body, 'offerLabel');
  const hasOfferEndsAtField = Object.prototype.hasOwnProperty.call(req.body, 'offerEndsAt');
  const hasIsOnOfferField = Object.prototype.hasOwnProperty.call(req.body, 'isOnOffer');
  const hasOfferPriceField = Object.prototype.hasOwnProperty.call(req.body, 'offerPrice');
  const hasOfferStartDateField = Object.prototype.hasOwnProperty.call(req.body, 'offerStartDate');
  const hasOfferEndDateField = Object.prototype.hasOwnProperty.call(req.body, 'offerEndDate');

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku } });
      if (skuExists) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
    }

    if (normalizedBarcode && normalizedBarcode !== existing.barcode) {
      const barcodeExists = await prisma.product.findUnique({ where: { barcode: normalizedBarcode } });
      if (barcodeExists) {
        return res.status(400).json({ message: 'Product with this barcode already exists' });
      }
    }

    if (sellingPrice !== undefined) {
      const parsedSellingPrice = parseFloat(String(sellingPrice));
      if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
        return res.status(400).json({ message: 'Selling price cannot be negative' });
      }
    }
    if (costPrice !== undefined) {
      const parsedCostPrice = parseFloat(String(costPrice));
      if (Number.isNaN(parsedCostPrice) || parsedCostPrice < 0) {
        return res.status(400).json({ message: 'Cost price cannot be negative' });
      }
    }

    const parsedExpiryDate = hasExpiryDateField && expiryDate ? new Date(String(expiryDate)) : null;
    if (hasExpiryDateField && expiryDate && Number.isNaN(parsedExpiryDate?.getTime())) {
      return res.status(400).json({ message: 'Expiry date is invalid' });
    }

    const parsedOfferDiscount = hasOfferDiscountField && offerDiscount !== undefined && offerDiscount !== null ? parseFloat(String(offerDiscount)) : undefined;
    if (hasOfferDiscountField && parsedOfferDiscount !== undefined && (Number.isNaN(parsedOfferDiscount) || parsedOfferDiscount < 0 || parsedOfferDiscount > 100)) {
      return res.status(400).json({ message: 'Offer discount must be between 0 and 100' });
    }

    const parsedOfferBuyQuantity = hasOfferBuyQuantityField && offerBuyQuantity !== undefined && offerBuyQuantity !== null ? parseInt(String(offerBuyQuantity), 10) : undefined;
    const parsedOfferFreeQuantity = hasOfferFreeQuantityField && offerFreeQuantity !== undefined && offerFreeQuantity !== null ? parseInt(String(offerFreeQuantity), 10) : undefined;
    if (hasOfferBuyQuantityField && parsedOfferBuyQuantity !== undefined && (Number.isNaN(parsedOfferBuyQuantity) || parsedOfferBuyQuantity <= 0)) {
      return res.status(400).json({ message: 'Offer buy quantity must be a positive integer' });
    }
    if (hasOfferFreeQuantityField && parsedOfferFreeQuantity !== undefined && (Number.isNaN(parsedOfferFreeQuantity) || parsedOfferFreeQuantity <= 0)) {
      return res.status(400).json({ message: 'Offer free quantity must be a positive integer' });
    }

    const parsedOfferEndsAt = hasOfferEndsAtField && offerEndsAt ? new Date(String(offerEndsAt)) : undefined;
    if (hasOfferEndsAtField && offerEndsAt && Number.isNaN(parsedOfferEndsAt?.getTime())) {
      return res.status(400).json({ message: 'Offer end date is invalid' });
    }

    const parsedOfferPrice = hasOfferPriceField && offerPrice !== undefined && offerPrice !== null ? parseFloat(String(offerPrice)) : undefined;
    if (hasOfferPriceField && parsedOfferPrice !== undefined && (Number.isNaN(parsedOfferPrice) || parsedOfferPrice < 0)) {
      return res.status(400).json({ message: 'Offer price cannot be negative' });
    }

    const parsedOfferStartDate = hasOfferStartDateField && offerStartDate ? new Date(String(offerStartDate)) : undefined;
    if (hasOfferStartDateField && offerStartDate && Number.isNaN(parsedOfferStartDate?.getTime())) {
      return res.status(400).json({ message: 'Offer start date is invalid' });
    }

    const parsedOfferEndDate = hasOfferEndDateField && offerEndDate ? new Date(String(offerEndDate)) : undefined;
    if (hasOfferEndDateField && offerEndDate && Number.isNaN(parsedOfferEndDate?.getTime())) {
      return res.status(400).json({ message: 'Offer end date is invalid' });
    }

    const qty = quantity !== undefined ? parseInt(String(quantity)) : undefined;
    if (qty !== undefined && (Number.isNaN(qty) || qty < 0)) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    let computedStatus: StockStatus | undefined;
    if (qty !== undefined) {
      if (qty <= 0) {
        computedStatus = StockStatus.OUT_OF_STOCK;
      } else if (qty <= 10) {
        computedStatus = StockStatus.LOW_STOCK;
      } else {
        computedStatus = StockStatus.IN_STOCK;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        barcode: hasBarcodeField ? normalizedBarcode || null : undefined,
        categoryId,
        brand,
        sellingPrice: sellingPrice !== undefined ? parseFloat(String(sellingPrice)) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(String(costPrice)) : undefined,
        expiryDate: hasExpiryDateField ? parsedExpiryDate : undefined,
        unit,
        status: computedStatus,
        isOnOffer: hasIsOnOfferField ? Boolean(isOnOffer) : undefined,
        offerDiscount: hasOfferDiscountField ? parsedOfferDiscount : undefined,
        offerType: hasOfferTypeField ? (offerType?.toString() || null) : undefined,
        offerBuyQuantity: hasOfferBuyQuantityField ? parsedOfferBuyQuantity : undefined,
        offerFreeQuantity: hasOfferFreeQuantityField ? parsedOfferFreeQuantity : undefined,
        offerLabel: hasOfferLabelField ? (offerLabel?.toString() || null) : undefined,
        offerEndsAt: hasOfferEndsAtField ? parsedOfferEndsAt : undefined,
        expiryStatus: expiryStatus !== undefined ? expiryStatus : undefined,
        batchNumber: batchNumber !== undefined ? batchNumber : undefined,
        supplierId: supplierId !== undefined ? supplierId : undefined,
        lastNotificationSent: lastNotificationSent !== undefined ? (lastNotificationSent ? new Date(lastNotificationSent) : null) : undefined,
        actionTaken: actionTaken !== undefined ? actionTaken : undefined,
        resolvedAt: resolvedAt !== undefined ? (resolvedAt ? new Date(resolvedAt) : null) : undefined,
        prioritySale: prioritySale !== undefined ? Boolean(prioritySale) : undefined,
        returnedStock: returnedStock !== undefined ? Boolean(returnedStock) : undefined,
        returnReason: returnReason !== undefined ? returnReason : undefined,
        expiryActionStatus: expiryActionStatus !== undefined ? expiryActionStatus : undefined,
        expiryNotificationStage: expiryNotificationStage !== undefined ? expiryNotificationStage : undefined,
        offerPrice: hasOfferPriceField ? (parsedOfferPrice !== undefined ? parsedOfferPrice : null) : undefined,
        offerStartDate: hasOfferStartDateField ? (parsedOfferStartDate || null) : undefined,
        offerEndDate: hasOfferEndDateField ? (parsedOfferEndDate || null) : undefined,
      },
    });

    // Update branch stock
    if (qty !== undefined) {
      const defaultBranch = await prisma.branch.findFirst();
      if (defaultBranch) {
        await prisma.productBranchStock.upsert({
          where: {
            productId_branchId: {
              productId: id,
              branchId: defaultBranch.id,
            },
          },
          create: {
            productId: id,
            branchId: defaultBranch.id,
            quantity: qty || 0,
          },
          update: {
            quantity: qty,
          },
        });
      }
    }

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Product Updated',
          details: `Updated product details: ${updated.name}`,
        },
      });
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const uniqueSuffix = `-deleted-${Date.now()}`;
    await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        sku: `${product.sku}${uniqueSuffix}`,
        barcode: product.barcode ? `${product.barcode}${uniqueSuffix}` : null
      }
    });

    // Log Activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'Product Deleted',
          details: `Deleted product: ${product.name}`,
        },
      });
    }

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          include: { branch: true }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
