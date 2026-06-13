import { Router } from 'express';
import {
  getDashboardMetrics,
  getInventoryInsights,
  postInventoryAIChat,
  getDashboardSummary,
  searchBills,
  getDashboardCritical,
  getDashboardSecondary,
  getDashboardActivities
} from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken as any, getDashboardSummary as any);
router.get('/metrics', authenticateToken as any, getDashboardMetrics as any);
router.get('/metrics/critical', authenticateToken as any, getDashboardCritical as any);
router.get('/metrics/secondary', authenticateToken as any, getDashboardSecondary as any);
router.get('/metrics/activities', authenticateToken as any, getDashboardActivities as any);
router.get('/inventory-insights', authenticateToken as any, getInventoryInsights as any);
router.post('/ai-chat', authenticateToken as any, postInventoryAIChat as any);
router.get('/search', authenticateToken as any, searchBills as any);

export default router;
