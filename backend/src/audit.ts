import prisma from './config/db';

async function audit() {
  console.log('--- START DATABASE AUDIT ---');
  try {
    // 1. Check total, active, and deleted products
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isDeleted: false } });
    const deletedProducts = await prisma.product.count({ where: { isDeleted: true } });

    console.log(`Total Products: ${totalProducts}`);
    console.log(`Active Products: ${activeProducts}`);
    console.log(`Deleted Products: ${deletedProducts}`);

    // 2. Audit product barcodes and SKUs
    const allProducts = await prisma.product.findMany();
    const barcodesMap = new Map<string, any[]>();
    const skusMap = new Map<string, any[]>();

    for (const p of allProducts) {
      if (p.barcode) {
        const list = barcodesMap.get(p.barcode) || [];
        list.push(p);
        barcodesMap.set(p.barcode, list);
      }
      if (p.sku) {
        const list = skusMap.get(p.sku) || [];
        list.push(p);
        skusMap.set(p.sku, list);
      }
    }

    console.log('\n--- Barcode Collision Audit ---');
    let barcodeCollisions = 0;
    for (const [barcode, list] of barcodesMap.entries()) {
      if (list.length > 1) {
        barcodeCollisions++;
        console.log(`Barcode "${barcode}" is duplicated across ${list.length} products:`);
        list.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, isDeleted: ${p.isDeleted}, SKU: ${p.sku}`);
        });
      }
    }
    if (barcodeCollisions === 0) {
      console.log('No barcode collisions found.');
    }

    console.log('\n--- SKU Collision Audit ---');
    let skuCollisions = 0;
    for (const [sku, list] of skusMap.entries()) {
      if (list.length > 1) {
        skuCollisions++;
        console.log(`SKU "${sku}" is duplicated across ${list.length} products:`);
        list.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, isDeleted: ${p.isDeleted}, Barcode: ${p.barcode}`);
        });
      }
    }
    if (skuCollisions === 0) {
      console.log('No SKU collisions found.');
    }

    // 3. Audit relationship integrity
    console.log('\n--- Relationship & Foreign Key Integrity Audit ---');

    // Branch stock check
    const stocks = await prisma.productBranchStock.findMany();
    console.log(`Total ProductBranchStock records: ${stocks.length}`);
    let orphanedStocks = 0;
    for (const s of stocks) {
      const p = await prisma.product.findUnique({ where: { id: s.productId } });
      if (!p) {
        orphanedStocks++;
        console.log(`  - Orphaned Branch Stock: Product ID ${s.productId} not found!`);
      }
    }
    console.log(`Orphaned Branch Stocks: ${orphanedStocks}`);

    // Order items check
    const orderItems = await prisma.orderItem.findMany();
    console.log(`Total OrderItem records: ${orderItems.length}`);
    let orphanedOrderItems = 0;
    for (const item of orderItems) {
      const p = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!p) {
        orphanedOrderItems++;
        console.log(`  - Orphaned OrderItem: Product ID ${item.productId} not found in Order ID ${item.orderId}!`);
      }
    }
    console.log(`Orphaned OrderItems: ${orphanedOrderItems}`);

    // Billing / Sales check
    // Wait, let's see if there are any other relations.
    console.log('--- END DATABASE AUDIT ---');
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
