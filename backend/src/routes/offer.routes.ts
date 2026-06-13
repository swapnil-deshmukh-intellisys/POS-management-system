import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offer.controller';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getOffers as any);
router.post('/', createOffer as any);
router.put('/:id', updateOffer as any);
router.delete('/:id', deleteOffer as any);

export default router;
