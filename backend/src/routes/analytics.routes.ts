import { Router } from 'express';
import { updateSalesAnalytics, updateSeasonalAnalytics, updateCustomerPattern, getERPReports } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/reports', getERPReports as any);
router.post('/update-sales', updateSalesAnalytics as any);
router.post('/update-seasonal', updateSeasonalAnalytics as any);
router.post('/update-customer-pattern', updateCustomerPattern as any);

export default router;
