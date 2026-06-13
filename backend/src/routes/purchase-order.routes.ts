import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrder } from '../controllers/purchase-order.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getPurchaseOrders as any);
router.get('/:id', getPurchaseOrderById as any);
router.post('/', createPurchaseOrder as any);
router.put('/:id', updatePurchaseOrder as any);

export default router;
