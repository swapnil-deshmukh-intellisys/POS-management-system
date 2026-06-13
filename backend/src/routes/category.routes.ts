import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all category routes
router.use(authenticateToken as any);

router.get('/', getCategories as any);
router.post('/', createCategory as any);
router.put('/:id', updateCategory as any);
router.delete('/:id', deleteCategory as any);

export default router;
