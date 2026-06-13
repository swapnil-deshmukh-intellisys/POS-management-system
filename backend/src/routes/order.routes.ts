import { Router } from 'express';
import { getOrders, createOrder, getCustomers, createCustomer } from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getOrders as any);
router.post('/checkout', createOrder as any);
router.get('/customers', getCustomers as any);
router.post('/customers', createCustomer as any);

export default router;
