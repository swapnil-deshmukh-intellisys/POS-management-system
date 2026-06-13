import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await prisma.shopSettings.findFirst();
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.shopSettings.create({
        data: {
          shopName: 'Society Supermarket',
          shopAddress: 'Sector 15, HSR Layout, Bengaluru',
          gstNumber: '29AAAAA1111A1Z1',
          mobile: '+91 99999 88888',
          email: 'info@societysupermarket.com',
          logo: null,
          footerMessage: 'Thank you for visiting our store'
        }
      });
    }
    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  const {
    shopName,
    shopAddress,
    gstNumber,
    mobile,
    email,
    logo,
    footerMessage,
    whatsappBusinessNumber,
    whatsappApiProvider,
    whatsappApiKey,
    whatsappTemplateId,
    whatsappAutoMsgEnabled
  } = req.body;
  try {
    const existing = await prisma.shopSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.shopSettings.update({
        where: { id: existing.id },
        data: {
          shopName,
          shopAddress,
          gstNumber,
          mobile,
          email,
          logo,
          footerMessage,
          whatsappBusinessNumber,
          whatsappApiProvider,
          whatsappApiKey,
          whatsappTemplateId,
          whatsappAutoMsgEnabled: whatsappAutoMsgEnabled !== undefined ? Boolean(whatsappAutoMsgEnabled) : undefined
        }
      });
    } else {
      settings = await prisma.shopSettings.create({
        data: {
          shopName,
          shopAddress,
          gstNumber,
          mobile,
          email,
          logo,
          footerMessage,
          whatsappBusinessNumber,
          whatsappApiProvider,
          whatsappApiKey,
          whatsappTemplateId,
          whatsappAutoMsgEnabled: Boolean(whatsappAutoMsgEnabled)
        }
      });
    }
    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
