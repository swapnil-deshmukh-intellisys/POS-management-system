import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addSupplierNote,
  uploadSupplierDocument,
  getSupplierAnalytics,
  getAISuggestions,
  getPurchaseOrders,
  createPurchaseOrder,
  payPurchaseOrder,
  updatePurchaseOrderStatus,
  getGRNs,
  createGRN,
  getSupplierInvoices,
  createSupplierInvoice,
  createSupplierPayment,
  getSupplierReturns,
  createSupplierReturn,
  updateSupplierReturnStatus,
  createSupplierProductMapping,
  receivePurchaseOrder,
  approveSupplierReturn,
  getExpiryRisks,
  getAISourcingAnalytics
} from '../controllers/supplier.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticateToken as any);

router.get('/', getSuppliers as any);
router.get('/analytics', getSupplierAnalytics as any);
router.get('/ai-suggestions', getAISuggestions as any);

// Custom Analytics
router.get('/analytics/expiry-risks', getExpiryRisks as any);
router.get('/analytics/ai-analytics', getAISourcingAnalytics as any);

// Purchase Orders
router.get('/pos', getPurchaseOrders as any);
router.post('/pos', createPurchaseOrder as any);
router.put('/pos/:id/status', updatePurchaseOrderStatus as any);
router.put('/pos/:id/receive', receivePurchaseOrder as any);
router.put('/pos/:id/pay', payPurchaseOrder as any);

// GRNs
router.get('/grns', getGRNs as any);
router.post('/grns', createGRN as any);

// Invoices & Payments
router.get('/invoices', getSupplierInvoices as any);
router.post('/invoices', createSupplierInvoice as any);
router.post('/payments', createSupplierPayment as any);

// Returns
router.get('/returns', getSupplierReturns as any);
router.post('/returns', createSupplierReturn as any);
router.put('/returns/:id/status', updateSupplierReturnStatus as any);
router.post('/returns/:id/approve', approveSupplierReturn as any);

// Product Mappings
router.post('/mappings', createSupplierProductMapping as any);

// Basic CRUD
router.get('/:id', getSupplierById as any);
router.post('/', createSupplier as any);
router.put('/:id', updateSupplier as any);
router.delete('/:id', deleteSupplier as any);
router.post('/:id/note', addSupplierNote as any);
router.post('/:id/document', uploadSupplierDocument as any);

export default router;
