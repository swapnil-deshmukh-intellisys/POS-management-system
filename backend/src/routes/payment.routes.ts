import { Router } from 'express';
import { createPayment, verifyPayment, createRefund, logPaymentEvent } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.post('/create', createPayment as any);
router.post('/verify', verifyPayment as any);
router.post('/refund', createRefund as any);
router.post('/log', logPaymentEvent as any);

export default router;
