import { Request, Response } from 'express';
import prisma from '../config/db';

export const scanBarcode = async (req: Request, res: Response) => {
  const { barcode } = req.body;
  if (!barcode) {
    return res.status(400).json({ message: 'Barcode is required' });
  }

  // Sanitize: remove carriage returns, newlines, tabs, and trim surrounding whitespaces
  const cleanBarcode = String(barcode).replace(/[\r\n\t]/g, '').trim();
  console.log('[DEBUG] Barcode Scan Triggered:', {
    raw: barcode,
    clean: cleanBarcode
  });

  try {
    // 1. Try exact match
    console.log('[DEBUG] Executing exact barcode match query for:', cleanBarcode);
    let product = await prisma.product.findFirst({
      where: { barcode: cleanBarcode, isDeleted: false },
      include: {
        stocks: true
      }
    });
    console.log('[DEBUG] Exact match result product ID:', product?.id || 'null');
 
    // 2. Fallback: Match without leading zeros (e.g. database has '123' and input has '00123')
    if (!product && /^\d+$/.test(cleanBarcode)) {
      const strippedBarcode = cleanBarcode.replace(/^0+/, '');
      console.log('[DEBUG] Exact match failed. Trying stripped leading zeros fallback with:', strippedBarcode);
      product = await prisma.product.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { barcode: strippedBarcode },
            { barcode: { endsWith: strippedBarcode } }
          ]
        },
        include: {
          stocks: true
        }
      });
      console.log('[DEBUG] Stripped leading zeros query result product ID:', product?.id || 'null');
    }
 
    // 3. Fallback: Match database barcode with leading zeros (e.g. database has '00123' and input has '123')
    if (!product && /^\d+$/.test(cleanBarcode)) {
      console.log('[DEBUG] Stripped leading zeros failed. Trying database endsWith query for:', cleanBarcode);
      product = await prisma.product.findFirst({
        where: {
          isDeleted: false,
          barcode: {
            endsWith: cleanBarcode
          }
        },
        include: {
          stocks: true
        }
      });
      console.log('[DEBUG] Database endsWith query result product ID:', product?.id || 'null');
    }

    if (!product) {
      console.warn('[WARN] Product not found in database for barcode query:', cleanBarcode);
      return res.status(404).json({ message: 'Product Not Found', scannedBarcode: cleanBarcode });
    }

    console.log('[DEBUG] Barcode Lookup Successful:', {
      productId: product.id,
      productName: product.name,
      barcodeInDb: product.barcode
    });

    const stockQty = product.stocks && product.stocks[0] ? product.stocks[0].quantity : 0;
    return res.status(200).json({
      product,
      price: product.sellingPrice,
      stock: stockQty,
      tax: 18 // Default 18% standard tax
    });
  } catch (error: any) {
    console.error('Barcode scan error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
