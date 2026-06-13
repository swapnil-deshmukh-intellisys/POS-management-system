import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
  getCustomerAnalytics
} from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticateToken as any);

router.get('/', getCustomers as any);
router.get('/analytics', getCustomerAnalytics as any);
router.get('/:id', getCustomerById as any);
router.post('/', createCustomer as any);
router.put('/:id', updateCustomer as any);
router.delete('/:id', deleteCustomer as any);
router.post('/:id/notes', addCustomerNote as any);

export default router;
