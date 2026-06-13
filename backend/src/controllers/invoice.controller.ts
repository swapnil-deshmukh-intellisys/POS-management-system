import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendAutomaticWhatsAppInvoice } from '../utils/whatsapp';

export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            customer: true,
            cashier: { select: { name: true } },
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(invoices);
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const sendWhatsAppInvoice = async (req: AuthenticatedRequest, res: Response) => {
  const { invoiceId, phone } = req.body;
  try {
    let invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { customer: true } } },
    });

    if (!invoice) {
      invoice = await prisma.invoice.findUnique({
        where: { orderId: invoiceId },
        include: { order: { include: { customer: true } } },
      });
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const recipientPhone = phone || invoice.order.customer?.phone;
    if (!recipientPhone) {
      return res.status(400).json({ message: 'Customer phone number is not available' });
    }

    const result = await sendAutomaticWhatsAppInvoice(invoiceId, recipientPhone, true);

    if (result.success) {
      return res.status(200).json({
        message: 'WhatsApp invoice sent successfully via Interakt API',
        recipient: recipientPhone,
        status: 'SENT',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        message: 'Failed to send WhatsApp invoice via Interakt API',
        error: result.error
      });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const sendEmailInvoice = async (req: AuthenticatedRequest, res: Response) => {
  const { invoiceId, email } = req.body;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { customer: true } } },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { sentEmail: true },
    });

    return res.status(200).json({
      message: 'Email invoice sent successfully via mock service',
      recipient: email || invoice.order.customer?.email || 'Walk-in',
      status: 'SENT',
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
