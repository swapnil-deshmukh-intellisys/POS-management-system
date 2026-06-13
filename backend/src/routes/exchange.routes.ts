import { Router } from 'express';
import { createExchange, getExchangeHistory } from '../controllers/exchange.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createExchange as any);
router.get('/history', getExchangeHistory as any);

export default router;
