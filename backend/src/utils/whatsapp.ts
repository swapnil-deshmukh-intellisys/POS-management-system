import prisma from '../config/db';
import fs from 'fs';
import path from 'path';

export async function sendAutomaticWhatsAppInvoice(invoiceId: string, customerMobile: string, force = false) {
  try {
    // 1. Fetch invoice and settings
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            customer: true,
            items: { include: { product: true } }
          }
        }
      }
    });

    if (!invoice) {
      console.error(`Invoice not found for WhatsApp notification: ${invoiceId}`);
      return { success: false, error: 'Invoice not found' };
    }

    const settings = await prisma.shopSettings.findFirst();
    const isAutoEnabled = settings?.whatsappAutoMsgEnabled ?? false;
    const isEnabledEnv = process.env.INTERAKT_ENABLED === 'true';

    if (!force && (!isAutoEnabled || !isEnabledEnv)) {
      console.log('WhatsApp auto messaging is disabled in settings or environment.');
      return { success: false, error: 'Auto messaging disabled' };
    }

    const shopName = settings?.shopName || 'Society Supermarket';
    const shopAddress = settings?.shopAddress || 'Bengaluru';
    const shopMobile = settings?.mobile || '';
    const invoiceNumber = invoice.invoiceNumber;
    const totalAmount = invoice.order.totalPayable;
    const dateStr = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

    // 2. Generate PDF (mock/simulation)
    const publicDir = path.join(__dirname, '..', '..', 'public', 'invoices');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const pdfPath = path.join(publicDir, `${invoiceNumber}.pdf`);
    const mockPdfContent = `%PDF-1.4\n% MOCK INVOICE PDF\nStore: ${shopName}\nInvoice: ${invoiceNumber}\nTotal: INR ${totalAmount}\nDate: ${dateStr}\n`;
    fs.writeFileSync(pdfPath, mockPdfContent);

    // Update pdfUrl in invoice
    const pdfUrl = `/public/invoices/${invoiceNumber}.pdf`;
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl, sentWhatsApp: true }
    });

    // Clean phone number: remove any non-digit chars and ensure it has 10 digits
    let cleanedPhone = customerMobile.replace(/\D/g, '');
    if (cleanedPhone.length > 10 && cleanedPhone.startsWith('91')) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    if (cleanedPhone.length !== 10) {
      console.error(`Invalid mobile number format for WhatsApp: ${customerMobile}`);
      return { success: false, error: 'Invalid phone number' };
    }

    // 3. Call Interakt API
    const apiKey = process.env.INTERAKT_API_KEY || settings?.whatsappApiKey || '';
    const baseUrl = process.env.INTERAKT_BASE_URL || 'https://api.interakt.ai';
    const templateName = settings?.whatsappTemplateId || 'invoice_delivery';
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullPdfUrl = `${serverUrl}${pdfUrl}`;

    console.log(`--- CALLING INTERAKT API ---`);
    console.log(`To: +91 ${cleanedPhone}`);
    console.log(`Template: ${templateName}`);
    console.log(`PDF URL: ${fullPdfUrl}`);

    // Create database log: Pending
    const dbLog = await prisma.whatsAppNotification.create({
      data: {
        invoiceId,
        customerMobile: cleanedPhone,
        provider: 'Interakt',
        status: 'Pending',
        messageId: null,
      }
    });

    const payload = {
      countryCode: '+91',
      phoneNumber: cleanedPhone,
      type: 'Template',
      template: {
        name: templateName,
        languageCode: 'en',
        headerValues: [fullPdfUrl],
        bodyValues: [shopName, invoiceNumber, totalAmount.toString(), shopName]
      }
    };

    let apiStatus = 'Failed';
    let messageId: string | null = null;

    try {
      const response = await fetch(`${baseUrl}/v1/public/message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resJson: any = await response.json();
      console.log('Interakt Response:', resJson);

      if (response.ok && (resJson.result === true || resJson.result === 'true' || resJson.id || resJson.messageId)) {
        apiStatus = 'Sent';
        messageId = resJson.id || resJson.messageId || 'mock-msg-id-' + Date.now();
      } else {
        console.error('Interakt API error response:', resJson);
      }
    } catch (apiErr) {
      console.error('Network error calling Interakt:', apiErr);
    }

    // Update DB log status
    await prisma.whatsAppNotification.update({
      where: { id: dbLog.id },
      data: {
        status: apiStatus,
        messageId,
        sentAt: new Date()
      }
    });

    return { success: apiStatus === 'Sent', messageId };
  } catch (error) {
    console.error('Error sending automatic WhatsApp invoice:', error);
    return { success: false, error: 'Internal helper error' };
  }
}
