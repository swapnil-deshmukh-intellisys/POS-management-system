import dotenv from 'dotenv';
// Load environment variables immediately before other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

// Trigger hot reload for dotenv updates: 2026-06-04

// Import routes
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import offerRoutes from './routes/offer.routes';
import orderRoutes from './routes/order.routes';
import dashboardRoutes from './routes/dashboard.routes';
import billingRoutes from './routes/billing.routes';
import paymentRoutes from './routes/payment.routes';
import invoiceRoutes from './routes/invoice.routes';
import returnsRoutes from './routes/returns.routes';
import analyticsRoutes from './routes/analytics.routes';
import supplierRoutes from './routes/supplier.routes';
import assistantRoutes from './routes/assistant.routes';
import purchaseOrderRoutes from './routes/purchase-order.routes';
import customerRoutes from './routes/customer.routes';
import barcodeRoutes from './routes/barcode.routes';
import exchangeRoutes from './routes/exchange.routes';
import settingsRoutes from './routes/settings.routes';
import publicInvoiceRoutes from './routes/publicInvoice.routes';
import restaurantRoutes from './routes/restaurant.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public-invoice', publicInvoiceRoutes);
app.use('/api/restaurant', restaurantRoutes);


// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

import prisma from './config/db';

// Start Server & Run DB soft-delete cleanup
const startServer = async () => {
  try {
    // Release SKU/Barcode unique constraints of existing soft-deleted products
    const softDeletedProducts = await prisma.product.findMany({
      where: {
        isDeleted: true
      }
    });
    for (const p of softDeletedProducts) {
      const needsSkuSuffix = p.sku && !p.sku.includes('-deleted-');
      const needsBarcodeSuffix = p.barcode && !p.barcode.includes('-deleted-');
      if (needsSkuSuffix || needsBarcodeSuffix) {
        const uniqueSuffix = `-deleted-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await prisma.product.update({
          where: { id: p.id },
          data: {
            sku: needsSkuSuffix ? `${p.sku}${uniqueSuffix}` : undefined,
            barcode: needsBarcodeSuffix ? `${p.barcode}${uniqueSuffix}` : undefined
          }
        });
        console.log(`[CLEANUP] Suffixed soft-deleted product ID ${p.id} (SKU: ${needsSkuSuffix}, Barcode: ${needsBarcodeSuffix}) to release unique constraints`);
      }
    }
  } catch (err) {
    console.error('[CLEANUP ERROR] Failed to run unique constraint cleanup on start:', err);
  }

  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`  POS Backend API Running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===========================================`);
  });
};

startServer();
