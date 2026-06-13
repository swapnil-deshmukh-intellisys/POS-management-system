import { Router } from 'express';
import { scanBarcode } from '../controllers/barcode.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);
router.post('/scan', scanBarcode as any);

export default router;
