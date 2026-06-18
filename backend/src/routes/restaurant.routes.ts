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
  handleRealtime
} from '../controllers/restaurant.controller';

const router = Router();

router.get('/realtime', handleRealtime);

// Dashboard
router.get('/dashboard', getDashboardMetrics);

// Tables
router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:id/status', updateTableStatus);
router.post('/tables/transfer', transferTable);
router.post('/tables/merge', mergeTables);
router.post('/tables/split', splitTableBill);

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
router.get('/orders/:id', getKitchenOrderById);
router.put('/orders/:id/status', updateOrderStatus);

// Waitstaff
router.get('/waiters', getWaiters);
router.post('/waiters', createWaiter);

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

export default router;
