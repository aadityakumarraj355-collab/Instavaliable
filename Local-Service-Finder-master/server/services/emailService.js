const nodemailer = require('nodemailer');

/**
 * Mask an email address for safe logging without exposing personal data
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.substring(0, 2) + '***' : '***';
  return `${visible}@${domain}`;
}

/**
 * Build and return a configured Nodemailer transporter
 * Configured by default for Gmail SMTP (smtp.gmail.com:587 TLS)
 * and supports any standard custom SMTP provider.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : port === 465;

  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  // Gmail App Passwords often have spaces (e.g. "abcd efgh ijkl mnop") - strip spaces cleanly
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '').trim() : '';

  if (!user || !pass) {
    return null;
  }

  const transportConfig = {
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15000, // 15s connection timeout
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };

  return nodemailer.createTransport(transportConfig);
}

/**
 * Test SMTP connectivity without sending an email
 */
async function verifySmtpConnection() {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      connected: false,
      message: 'SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in server/.env',
    };
  }

  try {
    await transporter.verify();
    return { connected: true, message: 'SMTP connection verified successfully.' };
  } catch (error) {
    console.error('[EmailService] SMTP verification failed:', error.message);
    return { connected: false, message: error.message };
  }
}

/**
 * Dispatch an OTP verification email to a recipient
 * Strictly waits for confirmation from the mail server.
 * Throws on failure — NEVER returns a fake success.
 */
async function sendOtpEmail({ to, otp, purpose = 'email_verification', name = 'User' }) {
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    const err = new Error('Invalid recipient email address');
    err.code = 'INVALID_RECIPIENT';
    throw err;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error(
      `[EmailService] Cannot send OTP to ${maskEmail(to)}: SMTP credentials missing (SMTP_USER / SMTP_PASS).`
    );
    const err = new Error(
      'Email service is not configured. Please set SMTP credentials (SMTP_USER and SMTP_PASS) in server/.env.'
    );
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  let fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  // If authenticating via Gmail, ensure fromAddress uses the authenticated Gmail account
  // to prevent Gmail SMTP 550 sender rejection or spam quarantine
  if (!fromAddress || fromAddress.includes('no-reply@instavaliable.com')) {
    fromAddress = user ? `"Instavaliable" <${user}>` : '"Instavaliable" <no-reply@instavaliable.com>';
  }

  // Subject and title based on verification purpose
  let subject = 'Verify your Instavaliable account';
  let heading = 'Welcome to Instavaliable!';
  let instruction = 'Your email verification OTP is:';

  if (purpose === 'password_reset') {
    subject = 'Reset your Instavaliable password - Verification Code';
    heading = 'Reset Your Password';
    instruction = 'Your password reset OTP is:';
  } else if (purpose === 'password_change') {
    subject = 'Verify your Instavaliable password change';
    heading = 'Confirm Password Change';
    instruction = 'Your password change authorization OTP is:';
  }

  // HTML Email Layout (Instavaliable Branding, Responsive, Modern)
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; line-height: 1.5; }
        .wrapper { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .header { background: #059669; padding: 28px 32px; text-align: left; }
        .logo-text { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
        .tagline { font-size: 11px; color: #d1fae5; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .content { padding: 32px; }
        .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        .subtext { font-size: 14px; color: #475569; margin-bottom: 24px; line-height: 1.6; }
        .otp-container { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #047857; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-number { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #047857; letter-spacing: 8px; margin: 4px 0; }
        .expiry-notice { font-size: 13px; font-weight: 600; color: #059669; margin-top: 8px; }
        .security-box { background: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; margin: 24px 0; font-size: 12px; color: #64748b; line-height: 1.6; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo-text">Instavaliable</div>
          <div class="tagline">Local Services · On Demand</div>
        </div>
        <div class="content">
          <h2 class="greeting">${heading}</h2>
          <p class="subtext">
            Hello ${name || 'User'},<br>
            ${instruction}
          </p>

          <div class="otp-container">
            <div class="otp-label">Verification OTP</div>
            <div class="otp-number">${otp}</div>
            <div class="expiry-notice">⏱ This OTP is valid for 5 minutes.</div>
          </div>

          <div class="security-box">
            <strong>Security Notice:</strong> If you did not request this verification, please ignore this email. Never share your verification OTP with anyone under any circumstances.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Instavaliable Marketplace · All rights reserved.<br>
          This is an automated security notification. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain Text Layout
  const text = `
Welcome to Instavaliable!

${instruction}

${otp}

This OTP is valid for 5 minutes.

If you did not request this verification, please ignore this email.

---
Instavaliable · Local Services On Demand
© ${new Date().getFullYear()} All rights reserved.
  `.trim();

  try {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    console.log(`[EmailService] Attempting to dispatch OTP email to ${maskEmail(to)} via ${host}:${port}...`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    if (info.rejected && info.rejected.length > 0) {
      console.error(`[EmailService] SMTP recipient rejected by mail server: ${info.rejected.join(', ')}`);
      const err = new Error(`Recipient was rejected by mail server: ${info.rejected.join(', ')}`);
      err.code = 'RECIPIENT_REJECTED';
      throw err;
    }

    if (!info.accepted || info.accepted.length === 0) {
      console.error(`[EmailService] SMTP server did not accept message for ${maskEmail(to)}`);
      const err = new Error('SMTP server did not accept the message');
      err.code = 'MESSAGE_NOT_ACCEPTED';
      throw err;
    }

    console.log(`[EmailService] OTP email successfully accepted by SMTP server for ${maskEmail(to)}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  } catch (error) {
    console.error(`[EmailService] SMTP delivery failed for ${maskEmail(to)}:`, error.message);
    const deliveryError = new Error(`Email delivery failed: ${error.message}`);
    deliveryError.code = error.code || 'SMTP_DELIVERY_FAILED';
    deliveryError.originalMessage = error.message;
    throw deliveryError;
  }
}

module.exports = {
  sendOtpEmail,
  verifySmtpConnection,
  createTransporter,
};
