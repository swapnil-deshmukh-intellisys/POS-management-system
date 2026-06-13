import { Router } from 'express';
import { getInvoices, sendWhatsAppInvoice, sendEmailInvoice } from '../controllers/invoice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getInvoices as any);
router.post('/send-whatsapp', sendWhatsAppInvoice as any);
router.post('/send-email', sendEmailInvoice as any);

export default router;
