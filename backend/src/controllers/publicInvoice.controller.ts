import { Request, Response } from 'express';
import prisma from '../config/db';

export const getPublicInvoiceDetails = async (req: Request, res: Response) => {
  const { invoiceNumber } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        order: {
          include: {
            customer: true,
            cashier: { select: { name: true } },
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    if (invoice.qrToken !== token) {
      return res.status(403).json({ message: 'Invalid or expired verification token.' });
    }

    const settings = await prisma.shopSettings.findFirst();

    return res.status(200).json({
      invoice,
      settings: settings || {
        shopName: 'Society Supermarket',
        shopAddress: 'Sector 15, HSR Layout, Bengaluru',
        gstNumber: '29AAAAA1111A1Z1',
        mobile: '+91 99999 88888',
        email: 'info@societysupermarket.com',
        logo: '',
        footerMessage: 'Thank you for visiting our store',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
