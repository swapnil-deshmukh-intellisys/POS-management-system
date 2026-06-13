import { Router } from 'express';
import { getReturns, createReturn, updateReturn } from '../controllers/returns.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getReturns as any);
router.post('/', createReturn as any);
router.put('/:id', updateReturn as any);

export default router;
