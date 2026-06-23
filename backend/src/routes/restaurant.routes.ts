import { Router } from 'express';
import {
  getDashboardMetrics,
  getTables,
  createTable,
  updateTableStatus,
  transferTable,
  mergeTables,
  splitTableBill,
  getCategories,
  createCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getPublicMenuByQR,
  placeQROrder,
  createPublicPaymentOrder,
  getKitchenOrders,
  updateOrderStatus,
  getWaiters,
  createWaiter,
  updateWaiterAssignments,
  getServiceTasks,
  pickupServiceTask,
  serveServiceTask,
  getWaiterNotifications,
  readWaiterNotification,
  getReservations,
  createReservation,
  updateReservationStatus,
  getIngredients,
  createIngredient,
  updateIngredientStock,
  getRecipes,
  createRecipe,
  getOnlineOrders,
  simulateOnlineOrder,
  submitFeedback,
  getReports,
  getKitchenOrderById,
  handleRealtime,
  getWaiterTransfers,
  transferWaiterTable,
  createKitchenOrder,
  getRestaurantBillingHistory,
  getTableHistoryLogs,
  assignTable,
  unassignTable,
  getAssignmentHistory,
  editWaiter,
  deleteWaiter,
  editTable,
  deleteTable,
  seedDummyReadyOrders,
  settleTableBill
} from '../controllers/restaurant.controller';
import {
  getInventoryDashboard,
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  getInventoryCategories,
  createInventoryCategory,
  getInventorySuppliers,
  createInventorySupplier,
  getExpiryAlerts,
  getDeadStockReport,
  getPurchaseRequirements,
  createPurchaseRequest,
  resolvePurchaseRequest,
  getInventoryMovements,
  getConsumptionReports,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
  downloadPOPdf,
  downloadPODocx,
  receivePODelivery
} from '../controllers/restaurantInventory.controller';

const router = Router();

router.get('/realtime', handleRealtime);

// Dashboard
router.get('/dashboard', getDashboardMetrics);

// Tables
router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:id/status', updateTableStatus);
router.put('/tables/:id', editTable);
router.delete('/tables/:id', deleteTable);
router.post('/tables/transfer', transferTable);
router.post('/tables/merge', mergeTables);
router.post('/tables/split', splitTableBill);
router.post('/tables/settle', settleTableBill);

// Categories & Menu
router.get('/menu/categories', getCategories);
router.post('/menu/categories', createCategory);
router.get('/menu/items', getMenuItems);
router.post('/menu/items', createMenuItem);
router.put('/menu/items/:id', updateMenuItem);
router.delete('/menu/items/:id', deleteMenuItem);

// Public QR Menu (accessible without login)
router.get('/public/menu/:qrToken', getPublicMenuByQR);
router.post('/public/order', placeQROrder);
router.post('/public/payment/create', createPublicPaymentOrder);

// Kitchen Display System
router.get('/orders', getKitchenOrders);
router.post('/orders', createKitchenOrder);
router.get('/orders/:id', getKitchenOrderById);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/billing-history', getRestaurantBillingHistory);
router.get('/table-history/:tableNumber', getTableHistoryLogs);

// Waitstaff
router.get('/waiters', getWaiters);
router.post('/waiters', createWaiter);
router.put('/waiters/:id', editWaiter);
router.delete('/waiters/:id', deleteWaiter);
router.post('/waiters/:id/assignments', updateWaiterAssignments);
router.get('/waiters/transfers', getWaiterTransfers);
router.post('/waiters/transfer', transferWaiterTable);
router.post('/waiters/assign', assignTable);
router.post('/waiters/unassign', unassignTable);
router.get('/waiters/assignment-history', getAssignmentHistory);

// Service Tasks
router.get('/service-tasks', getServiceTasks);
router.put('/service-tasks/:id/pickup', pickupServiceTask);
router.put('/service-tasks/:id/serve', serveServiceTask);
router.post('/seed-ready-orders', seedDummyReadyOrders);

// Waitstaff Notifications
router.get('/waiter-notifications', getWaiterNotifications);
router.put('/waiter-notifications/:id/read', readWaiterNotification);

// Reservations
router.get('/reservations', getReservations);
router.post('/reservations', createReservation);
router.put('/reservations/:id/status', updateReservationStatus);

// Ingredients & Recipes
router.get('/ingredients', getIngredients);
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id/stock', updateIngredientStock);
router.get('/recipes', getRecipes);
router.post('/recipes', createRecipe);

// Swiggy & Zomato
router.get('/online-orders', getOnlineOrders);
router.post('/online-orders/simulate', simulateOnlineOrder);

// Customer Feedback
router.post('/feedback', submitFeedback);

// Reports
router.get('/reports', getReports);

// Restaurant Inventory Management routes
router.get('/inventory/dashboard', getInventoryDashboard);
router.get('/inventory/items', getInventoryItems);
router.post('/inventory/items', createInventoryItem);
router.put('/inventory/items/:id', updateInventoryItem);
router.post('/inventory/items/:id/movement', adjustInventoryStock);
router.get('/inventory/categories', getInventoryCategories);
router.post('/inventory/categories', createInventoryCategory);
router.get('/inventory/suppliers', getInventorySuppliers);
router.post('/inventory/suppliers', createInventorySupplier);
router.get('/inventory/expiry', getExpiryAlerts);
router.get('/inventory/dead-stock', getDeadStockReport);
router.get('/inventory/purchase-requirements', getPurchaseRequirements);
router.post('/inventory/purchase-requests', createPurchaseRequest);
router.put('/inventory/purchase-requests/:id', resolvePurchaseRequest);
router.get('/inventory/movements', getInventoryMovements);
router.get('/inventory/reports', getConsumptionReports);
router.get('/inventory/purchase-orders', getPurchaseOrders);
router.post('/inventory/purchase-orders', createPurchaseOrder);
router.put('/inventory/purchase-orders/:id/status', updatePOStatus);
router.get('/inventory/purchase-orders/:id/download-pdf', downloadPOPdf);
router.get('/inventory/purchase-orders/:id/download-docx', downloadPODocx);
router.post('/inventory/purchase-orders/:id/receive', receivePODelivery);

export default router;
