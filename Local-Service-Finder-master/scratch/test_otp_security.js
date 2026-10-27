const http = require('http');

function post(path, data) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting OTP Email Verification Tests...\n');

  // Test 1: Attempt registration when SMTP credentials are not set
  console.log('TEST 1: Registration with unconfigured SMTP:');
  const regRes = await post('/api/auth/register', {
    name: 'Aaditya Test User',
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'Password@1234!',
    confirmPassword: 'Password@1234!',
    role: 'client',
  });
  console.log('Status code:', regRes.status);
  console.log('Response body:', JSON.stringify(regRes.data, null, 2));

  if (regRes.status === 503 && regRes.data.success === false) {
    console.log('✅ TEST 1 PASSED: False success prevented! Returns 503 and success: false.\n');
  } else {
    console.log('❌ TEST 1 FAILED: Unexpected response\n');
  }

  // Test 2: Resend OTP when SMTP credentials are not set
  console.log('TEST 2: Resend OTP with unconfigured SMTP:');
  const resendRes = await post('/api/auth/resend-registration-otp', {
    email: 'aadityakumarr712@gmail.com',
  });
  console.log('Status code:', resendRes.status);
  console.log('Response body:', JSON.stringify(resendRes.data, null, 2));

  if (resendRes.status === 503 && resendRes.data.success === false) {
    console.log('✅ TEST 2 PASSED: Resend also strictly rejects false success!\n');
  } else {
    console.log('❌ TEST 2 FAILED: Unexpected response\n');
  }

  // Test 3: Password Reset OTP when SMTP credentials are not set
  console.log('TEST 3: Forgot Password OTP with unconfigured SMTP:');
  const forgotRes = await post('/api/auth/forgot-password', {
    email: 'superadmin@instavaliable.com',
  });
  console.log('Status code:', forgotRes.status);
  console.log('Response body:', JSON.stringify(forgotRes.data, null, 2));

  if (forgotRes.status === 503 && forgotRes.data.success === false) {
    console.log('✅ TEST 3 PASSED: Forgot Password strictly prevents false success!\n');
  } else {
    console.log('❌ TEST 3 FAILED: Unexpected response\n');
  }

  // Test 4: OTP Verification logic (Unit test with simulated valid & invalid OTP)
  console.log('TEST 4: OTP verification logic:');
  const mongoose = require('../server/node_modules/mongoose');
  await mongoose.connect('mongodb://localhost:27017/instavaliable');
  const Otp = require('../server/models/Otp');

  const testEmail = 'otp_unit_test@example.com';
  const plainCode = await Otp.generateAndSaveOtp({
    email: testEmail,
    purpose: 'email_verification',
    validityMinutes: 5,
  });

  console.log('Generated 5-minute OTP for unit test');

  // Test invalid OTP
  const invalidCheck = await Otp.verifyOtp({
    email: testEmail,
    enteredOtp: '000000',
    purpose: 'email_verification',
  });
  console.log('Invalid OTP result:', invalidCheck);
  if (invalidCheck.success === false) {
    console.log('✅ Correctly rejected invalid OTP.');
  }

  // Test valid OTP
  const validCheck = await Otp.verifyOtp({
    email: testEmail,
    enteredOtp: plainCode,
    purpose: 'email_verification',
  });
  console.log('Valid OTP result:', validCheck);
  if (validCheck.success === true) {
    console.log('✅ Correctly accepted valid OTP.');
  }

  // Test replay attack (cannot reuse)
  const reuseCheck = await Otp.verifyOtp({
    email: testEmail,
    enteredOtp: plainCode,
    purpose: 'email_verification',
  });
  console.log('Reused OTP result:', reuseCheck);
  if (reuseCheck.success === false) {
    console.log('✅ Correctly rejected OTP reuse attack.');
  }

  await mongoose.disconnect();
  console.log('\nAll tests complete!');
}

runTests();
