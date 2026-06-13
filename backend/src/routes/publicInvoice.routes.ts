import { Router } from 'express';
import { getPublicInvoiceDetails } from '../controllers/publicInvoice.controller';

const router = Router();

// This endpoint is fully public and verified by secure unique token check
router.get('/:invoiceNumber', getPublicInvoiceDetails as any);

export default router;
