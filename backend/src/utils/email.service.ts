import nodemailer from 'nodemailer';

// Transporter cache
let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log(`[SMTP] Using configured SMTP server: ${host}:${port} (${user})`);
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: { user, pass }
      });
    }

    console.warn('[SMTP] No SMTP credentials configured in .env. Initializing Ethereal Test Email account...');
    // Create Ethereal test account on the fly
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[SMTP Ethereal Config] Created test account:`);
    console.log(`  User: ${testAccount.user}`);
    console.log(`  Pass: ${testAccount.pass}`);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();

  return transporterPromise;
}

export async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; previewUrl?: string }> {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"POS Inventory" <noreply@pos.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `[POS] Secure OTP Verification Code: ${otp}`,
      text: `Hello,

Your 6-digit OTP verification code is: ${otp}

This code is valid for 10 minutes and can only be used once. If you did not request this code, please ignore this email.

Best regards,
POS Inventory Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-card: 12px; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center; margin-bottom: 24px;">Secure OTP Verification</h2>
          <p style="font-size: 14px; color: #475569;">Hello,</p>
          <p style="font-size: 14px; color: #475569;">Use the following 6-digit OTP to complete your password reset process. This code is only valid for <b>10 minutes</b> and can be used once.</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 32px;">If you did not request this, please secure your account credentials immediately.</p>
        </div>
      `
    });

    console.log(`[SMTP] OTP Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    
    // Retrieve Ethereal URL if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`[SMTP Ethereal Preview] View sent email here: ${previewUrl}`);
    }
    
    return { success: true, previewUrl };
  } catch (error) {
    console.error('[SMTP Error] Failed to send OTP email:', error);
    return { success: false };
  }
}
