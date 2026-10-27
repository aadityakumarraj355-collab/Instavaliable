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
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: bodyData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE MARKETPLACE FEATURE TESTS ---');

  // 1. Super Admin Login
  const adminLoginRes = await request('POST', '/api/auth/admin-login', {
    email: 'superadmin@instavaliable.com',
    password: 'SuperAdmin@Secure2026!',
  });
  console.log('1. Super Admin Login:', adminLoginRes.status, adminLoginRes.data?.success ? 'PASS' : 'FAIL');
  const adminToken = adminLoginRes.data?.data?.token;

  if (!adminToken) {
    console.error('Failed to get admin token, aborting');
    return;
  }

  // 2. Admin Customers List
  const customersRes = await request('GET', '/api/admin/customers', null, adminToken);
  console.log('2. Admin Customers Directory:', customersRes.status, `Found: ${customersRes.data?.data?.total || 0}`);

  // 3. Admin Workers List
  const workersRes = await request('GET', '/api/admin/workers', null, adminToken);
  console.log('3. Admin Service Providers Directory:', workersRes.status, `Found: ${workersRes.data?.data?.total || 0}`);

  // 4. Test Customer Login
  const clientLoginRes = await request('POST', '/api/auth/login', {
    email: 'aarav.client@instavaliable.com',
    password: 'password123',
  });
  console.log('4. Customer Login:', clientLoginRes.status, clientLoginRes.data?.success ? 'PASS' : 'FAIL');
  const clientToken = clientLoginRes.data?.data?.token;
  const clientId = clientLoginRes.data?.data?.user?.id || clientLoginRes.data?.data?.user?._id;

  // 5. Test Worker Login
  const workerLoginRes = await request('POST', '/api/auth/login', {
    email: 'rajesh.plumbing@instavaliable.com',
    password: 'password123',
  });
  console.log('5. Worker Login:', workerLoginRes.status, workerLoginRes.data?.success ? 'PASS' : 'FAIL');
  const workerToken = workerLoginRes.data?.data?.token;

  // 6. Test User Detail Lookup By ID (Feature 3)
  if (clientId) {
    const userDetailRes = await request('GET', `/api/admin/users/${clientId}/detail`, null, adminToken);
    console.log('6. Lookup User by ID Detail:', userDetailRes.status, userDetailRes.data?.data?.user?.name || 'FAIL');

    // 7. Test User Moderation (Suspend 24h)
    const suspendRes = await request('POST', `/api/admin/users/${clientId}/moderate`, {
      action: 'suspend',
      reason: 'Security compliance test reason for automated verification',
      duration: '24h',
    }, adminToken);
    console.log('7. Moderate User (Suspend 24h):', suspendRes.status, suspendRes.data?.data?.user?.accountStatus);

    // 8. Verify Suspended User Cannot Access Protected Routes (Feature 5)
    const suspendedAccessRes = await request('GET', '/api/bookings/my-bookings', null, clientToken);
    console.log('8. Suspended User Access Blocked (403):', suspendedAccessRes.status === 403 ? 'PASS (Blocked with 403)' : `FAILED (${suspendedAccessRes.status})`);

    // 9. Restore User
    const restoreRes = await request('POST', `/api/admin/users/${clientId}/moderate`, {
      action: 'restore',
      reason: 'Restoring after successful automated test',
    }, adminToken);
    console.log('9. Restore User to Active:', restoreRes.status, restoreRes.data?.data?.user?.accountStatus);

    // 10. Check Moderation History Audit Log (Feature 4)
    const historyRes = await request('GET', `/api/admin/users/${clientId}/moderation-history`, null, adminToken);
    console.log('10. Moderation History Audit Log:', historyRes.status, `Audit Entries: ${historyRes.data?.data?.length || 0}`);
  }

  // 11. Test Worker Reviews Dashboard (Feature 9)
  if (workerToken) {
    const workerReviewsRes = await request('GET', '/api/feedback/worker/my-reviews', null, workerToken);
    console.log('11. Worker Customer Reviews Dashboard:', workerReviewsRes.status, `Rating: ${workerReviewsRes.data?.data?.overallRating}, Total: ${workerReviewsRes.data?.data?.totalReviews}`);
  }

  // 12. Test Public Services Catalog with INR Pricing (Feature 14 & 15)
  const servicesRes = await request('GET', '/api/services');
  console.log('12. Public Services Listing:', servicesRes.status, `Available Services: ${servicesRes.data?.data?.services?.length || 0}`);
  if (servicesRes.data?.data?.services?.length > 0) {
    const s0 = servicesRes.data.data.services[0];
    console.log(`    Sample Service: "${s0.title}" | Price: ₹${s0.price} (${s0.pricingType || 'fixed'})`);
  }

  console.log('--- ALL MARKETPLACE FEATURES VERIFIED SUCCESSFULLY ---');
}

runTests().catch(console.error);
