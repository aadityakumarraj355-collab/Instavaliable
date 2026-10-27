/**
 * Direct SMTP & Email Delivery Test Diagnostic Script
 *
 * Usage:
 *   node test-email.js [target_email]
 *
 * Example:
 *   node test-email.js aadityakumarrraj355@gmail.com
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const nodemailer = require('nodemailer');

function maskValue(val) {
  if (!val || typeof val !== 'string') return '(empty)';
  if (val.length <= 4) return '****';
  return val.substring(0, 2) + '****' + val.substring(val.length - 2);
}

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '(empty)';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.substring(0, 2) + '***' : '***';
  return `${visible}@${domain}`;
}

async function runEmailDiagnostics() {
  console.log('========================================================');
  console.log('       INSTAVALIABLE EMAIL & SMTP DIAGNOSTICS TEST       ');
  console.log('========================================================');
  console.log(`Loading .env from: ${envPath}`);

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : port === 465;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '').trim();

  // Target recipient
  const targetEmail =
    process.argv[2] ||
    'aadityakumarrraj355@gmail.com';

  console.log('\n--- 1. CONFIGURATION CHECK ---');
  console.log(`SMTP_HOST   : ${host}`);
  console.log(`SMTP_PORT   : ${port}`);
  console.log(`SMTP_SECURE : ${isSecure}`);
  console.log(`SMTP_USER   : ${user ? maskEmail(user) : '❌ EMPTY (NOT CONFIGURED)'}`);
  console.log(`SMTP_PASS   : ${cleanPass ? '✅ SET (' + cleanPass.length + ' chars)' : '❌ EMPTY (NOT CONFIGURED)'}`);
  console.log(`TARGET EMAIL: ${maskEmail(targetEmail)} (${targetEmail})`);

  if (!user || !cleanPass) {
    console.error('\n❌ ERROR: SMTP credentials missing!');
    console.error('Please configure SMTP_USER and SMTP_PASS in server/.env.');
    console.error('For Gmail, SMTP_PASS must be a 16-character Google App Password (not your Gmail account password).');
    process.exit(1);
  }

  console.log('\n--- 2. CREATING TRANSPORTER & VERIFYING CONNECTION ---');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  try {
    console.log(`Connecting to ${host}:${port}...`);
    await transporter.verify();
    console.log('✅ SMTP Connection & Authentication Successful!');
  } catch (verifyError) {
    console.error('❌ SMTP Connection / Authentication FAILED:');
    console.error(`Error Code   : ${verifyError.code || 'UNKNOWN'}`);
    console.error(`Error Message: ${verifyError.message}`);
    if (verifyError.response) {
      console.error(`SMTP Response: ${verifyError.response}`);
    }
    process.exit(1);
  }

  console.log('\n--- 3. DISPATCHING TEST EMAIL ---');
  let fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (!fromAddress || fromAddress.includes('no-reply@instavaliable.com')) {
    fromAddress = `"Instavaliable" <${user}>`;
  }
  console.log(`From        : ${fromAddress}`);
  console.log(`To          : ${targetEmail}`);

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: fromAddress,
    to: targetEmail,
    subject: 'Instavaliable SMTP Test & OTP Verification Test',
    text: `Hello,\n\nThis is a direct SMTP test from Instavaliable.\nYour test OTP is: ${testOtp}\nValid for 5 minutes.\n\nTimestamp: ${new Date().toISOString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-top: 0;">Instavaliable SMTP Delivery Test</h2>
        <p>This is a live test email sent to verify Gmail SMTP delivery.</p>
        <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 12px; color: #047857; text-transform: uppercase; font-weight: bold;">Test Verification OTP</span><br>
          <span style="font-size: 32px; font-family: monospace; font-weight: bold; color: #047857; letter-spacing: 6px;">${testOtp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('\n--- 4. SMTP DELIVERY RESPONSE ---');
    console.log('✅ Email successfully accepted by mail server!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Accepted  : ${JSON.stringify(info.accepted)}`);
    console.log(`Rejected  : ${JSON.stringify(info.rejected)}`);
    console.log(`Response  : ${info.response}`);

    if (info.rejected && info.rejected.length > 0) {
      console.warn(`⚠️ Warning: Recipient was rejected by mail server: ${info.rejected.join(', ')}`);
    } else {
      console.log('\n🎉 TEST COMPLETED: Mail server accepted message without rejection.');
    }
  } catch (sendError) {
    console.error('\n❌ SEND MAIL FAILED:');
    console.error(`Error Code   : ${sendError.code || 'UNKNOWN'}`);
    console.error(`Error Message: ${sendError.message}`);
    if (sendError.response) {
      console.error(`SMTP Response: ${sendError.response}`);
    }
    process.exit(1);
  }
}

runEmailDiagnostics();
