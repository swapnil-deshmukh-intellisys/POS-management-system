import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getOffers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const offers = await prisma.offer.findMany({
      include: {
        product: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(offers);
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createOffer = async (req: AuthenticatedRequest, res: Response) => {
  const { title, discountType, discountValue, offerMode, buyQuantity, freeQuantity, startDate, endDate, productId, categoryId, isActive } = req.body;

  if (!title || !discountType || discountValue === undefined || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, discount type, discount value, start date, and end date are required' });
  }

  if (discountValue < 0) {
    return res.status(400).json({ message: 'Discount value must be a positive number' });
  }

  if (productId && categoryId) {
    return res.status(400).json({ message: 'Offer must target either a product or a category, not both' });
  }

  try {
    const offer = await prisma.offer.create({
      data: {
        title,
        discountType,
        discountValue: Number(discountValue),
        offerMode: offerMode || 'STANDARD',
        buyQuantity: buyQuantity ? Number(buyQuantity) : undefined,
        freeQuantity: freeQuantity ? Number(freeQuantity) : undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        productId: productId || null,
        categoryId: categoryId || null,
      },
    });

    return res.status(201).json(offer);
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateOffer = async (req: AuthenticatedRequest, res: Response) => {
  const offerId = req.params.id;
  const { title, discountType, discountValue, offerMode, buyQuantity, freeQuantity, startDate, endDate, productId, categoryId, isActive } = req.body;

  if (!offerId) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  if (productId && categoryId) {
    return res.status(400).json({ message: 'Offer must target either a product or a category, not both' });
  }

  try {
    const existingOffer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existingOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        title,
        discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : existingOffer.discountValue,
        offerMode: offerMode || existingOffer.offerMode,
        buyQuantity: buyQuantity !== undefined ? Number(buyQuantity) : existingOffer.buyQuantity,
        freeQuantity: freeQuantity !== undefined ? Number(freeQuantity) : existingOffer.freeQuantity,
        startDate: startDate ? new Date(startDate) : existingOffer.startDate,
        endDate: endDate ? new Date(endDate) : existingOffer.endDate,
        isActive: isActive !== undefined ? Boolean(isActive) : existingOffer.isActive,
        productId: productId || null,
        categoryId: categoryId || null,
      },
    });

    return res.status(200).json(updatedOffer);
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteOffer = async (req: AuthenticatedRequest, res: Response) => {
  const offerId = req.params.id;

  if (!offerId) {
    return res.status(400).json({ message: 'Offer ID is required' });
  }

  try {
    await prisma.offer.delete({ where: { id: offerId } });
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
