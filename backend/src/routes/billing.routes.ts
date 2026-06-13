import { Router } from 'express';
import { createBillingOrder, holdBill, resumeBill, deleteHeldBill, offlineSync, getBillingHistory, createBillingPayment, getBillingInvoice } from '../controllers/billing.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.post('/create', createBillingOrder as any);
router.post('/payment', createBillingPayment as any);
router.get('/invoice/:id', getBillingInvoice as any);
router.post('/hold', holdBill as any);
router.get('/resume', resumeBill as any);
router.delete('/held/:id', deleteHeldBill as any);
router.post('/offline-sync', offlineSync as any);
router.get('/history', getBillingHistory as any);
router.get('/', getBillingHistory as any); // general list

export default router;
