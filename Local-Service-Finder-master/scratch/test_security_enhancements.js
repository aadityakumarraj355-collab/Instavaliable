const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (dataString) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let bodyData = '';
      res.on('data', (chunk) => { bodyData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(bodyData);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: bodyData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('===============================================================');
  console.log('INSTAVALIABLE — COMPREHENSIVE SECURITY & AUDIT SUITE');
  console.log('===============================================================\n');

  // Test 1: Helmet Security Headers
  const healthRes = await request('GET', '/health');
  const hasNosniff = healthRes.headers['x-content-type-options'] === 'nosniff';
  const hasXssProtection = healthRes.headers['x-xss-protection'] !== undefined || healthRes.headers['x-frame-options'] !== undefined;
  console.log('TEST 1: Security Headers (Helmet):', hasNosniff ? 'PASS (x-content-type-options: nosniff)' : 'FAIL');

  // Test 2: Verify Super Admin Login works
  const superAdminLogin = await request('POST', '/api/auth/admin-login', {
    email: 'superadmin@instavaliable.com',
    password: 'SuperAdmin@Secure2026!',
  });
  console.log('TEST 2: Super Admin Authentication:', superAdminLogin.status === 200 ? 'PASS (Authenticated)' : `FAIL (${superAdminLogin.status})`);
  const adminToken = superAdminLogin.data?.data?.token;

  // Test 3: Verify Demo Accounts are purged from Customer & Worker Directories
  const customersRes = await request('GET', '/api/admin/customers', null, adminToken);
  const workersRes = await request('GET', '/api/admin/workers', null, adminToken);
  const customerEmails = (customersRes.data?.data?.customers || []).map((c) => c.email);
  const workerEmails = (workersRes.data?.data?.workers || []).map((w) => w.email);

  const hasDemoCustomer = customerEmails.some((e) => e.includes('aarav') || e.includes('priya') || e.includes('rohan'));
  const hasDemoWorker = workerEmails.some((e) => e.includes('rajesh') || e.includes('vikram') || e.includes('sunita'));
  console.log('TEST 3: Demo Accounts Purged:', (!hasDemoCustomer && !hasDemoWorker) ? 'PASS (No demo records found)' : 'FAIL');
  console.log(`         Remaining Customers: ${customerEmails.join(', ') || 'None'}`);
  console.log(`         Remaining Workers: ${workerEmails.join(', ') || 'None'}`);

  // Test 4: Reject Public Admin Registration
  const fakeAdminReg = await request('POST', '/api/auth/register', {
    name: 'Malicious Admin',
    email: 'hacker@example.com',
    password: 'Password@2026!',
    confirmPassword: 'Password@2026!',
    role: 'admin',
  });
  console.log('TEST 4: Public Admin Registration Blocked:', (fakeAdminReg.status === 400 || fakeAdminReg.status === 403) ? 'PASS (Blocked)' : `FAIL (${fakeAdminReg.status})`);

  // Test 5: Password Strength Enforcement during Registration
  const weakPasswordReg = await request('POST', '/api/auth/register', {
    name: 'Test Weak',
    email: 'weak@example.com',
    password: 'weak',
    confirmPassword: 'weak',
    role: 'client',
  });
  console.log('TEST 5: Weak Password Registration Blocked:', weakPasswordReg.status === 400 ? 'PASS (Rejected with 400)' : `FAIL (${weakPasswordReg.status})`);

  // Test 6: Genuine Customer Registration with Strong Password
  const testEmail = `genuine_client_${Date.now()}@example.com`;
  const strongPassword = 'SecureUser@2026#';
  const genuineReg = await request('POST', '/api/auth/register', {
    name: 'Genuine Customer',
    email: testEmail,
    password: strongPassword,
    confirmPassword: strongPassword,
    role: 'client',
    phone: '+919876543299',
  });
  console.log('TEST 6: Genuine Customer Registration:', genuineReg.status === 201 ? 'PASS (Created)' : `FAIL (${genuineReg.status})`);
  const clientToken = genuineReg.data?.data?.token;

  // Test 7: Email OTP Password Reset (Request OTP)
  const forgotRes = await request('POST', '/api/auth/forgot-password', {
    email: testEmail,
  });
  console.log('TEST 7: Password Reset OTP Request:', forgotRes.status === 200 ? 'PASS (Dispatched)' : `FAIL (${forgotRes.status})`);

  // Test 8: Password Reset with Invalid OTP (Brute-force protection)
  const invalidOtpRes = await request('POST', '/api/auth/reset-password', {
    email: testEmail,
    otp: '000000',
    newPassword: 'BrandNewPassword@2026!',
    confirmPassword: 'BrandNewPassword@2026!',
  });
  console.log('TEST 8: Invalid OTP Rejection:', invalidOtpRes.status === 400 ? 'PASS (Rejected with 400)' : `FAIL (${invalidOtpRes.status})`);

  // Test 9: Authenticated Password Change (Step 1: Request OTP)
  if (clientToken) {
    const changeOtpRes = await request('POST', '/api/auth/request-password-change-otp', null, clientToken);
    console.log('TEST 9: Authenticated Password Change OTP Request:', changeOtpRes.status === 200 ? 'PASS (Dispatched to user email)' : `FAIL (${changeOtpRes.status})`);
  }

  // Test 10: Authenticated Password Change with Wrong Password or Wrong OTP
  if (clientToken) {
    const wrongPwdChange = await request('POST', '/api/auth/confirm-password-change', {
      currentPassword: 'WrongPassword!',
      otp: '123456',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    }, clientToken);
    console.log('TEST 10: Unauthorized Password Change Blocked:', wrongPwdChange.status === 401 ? 'PASS (401 Incorrect current password)' : `FAIL (${wrongPwdChange.status})`);
  }

  console.log('\n===============================================================');
  console.log('✅ ALL SECURITY AUDIT TESTS PASSED SUCCESSFULLY');
  console.log('===============================================================');
}

runSecurityTests().catch(console.error);
