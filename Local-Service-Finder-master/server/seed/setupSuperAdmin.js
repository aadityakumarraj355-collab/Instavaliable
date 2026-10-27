const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const AuditLog = require('../models/AuditLog');

const ALL_ADMIN_PERMISSIONS = [
  'manage_customers',
  'manage_workers',
  'manage_services',
  'manage_bookings',
  'manage_whatsapp',
  'manage_database',
  'view_audit_logs',
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavaliable';

async function setupSuperAdmin() {
  console.log('======================================================');
  console.log('INSTAVALIABLE — INITIAL SUPER ADMIN SETUP PROCESS');
  console.log('======================================================\n');

  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    console.error('❌ ERROR: ADMIN_SETUP_SECRET is not configured in server/.env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);

  // 1. Check if setup is already locked
  let config = await SystemConfig.findOne();
  if (config && (config.isInitialSuperAdminCreated || config.initialSetupDisabled)) {
    console.error('❌ ACCESS DENIED: Initial Super Admin setup is permanently locked.');
    console.error(`A Super Admin (${config.superAdminEmail}) was already created on ${config.superAdminCreatedAt}.`);
    console.error('No further Super Admin accounts can be initialized through setup.');
    process.exit(1);
  }

  // 2. Check if a super_admin user already exists in the database
  const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    if (!config) config = await SystemConfig.create({});
    config.isInitialSuperAdminCreated = true;
    config.initialSetupDisabled = true;
    config.superAdminEmail = existingSuperAdmin.email;
    config.superAdminCreatedAt = existingSuperAdmin.createdAt;
    await config.save();

    console.error('❌ ACCESS DENIED: A Super Admin already exists in the database.');
    console.error(`Super Admin Email: ${existingSuperAdmin.email}`);
    console.error('The setup process has been permanently locked.');
    process.exit(1);
  }

  // 3. Read environment configuration
  const name = process.env.ADMIN_NAME || 'Instavaliable Super Admin';
  const email = (process.env.ADMIN_EMAIL || 'superadmin@instavaliable.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error('❌ ERROR: ADMIN_PASSWORD must be at least 8 characters in server/.env');
    process.exit(1);
  }

  console.log(`Setting up Initial Super Admin for: ${email}`);

  // 4. Create or upgrade the Super Admin account
  let superAdmin = await User.findOne({ email });
  if (superAdmin) {
    superAdmin.name = name;
    superAdmin.password = password; // pre-save will bcrypt hash
    superAdmin.role = 'super_admin';
    superAdmin.permissions = ALL_ADMIN_PERMISSIONS;
    superAdmin.isVerified = true;
    superAdmin.isSuspended = false;
    superAdmin.tokenVersion = 0;
    await superAdmin.save();
  } else {
    superAdmin = await User.create({
      name,
      email,
      password,
      role: 'super_admin',
      permissions: ALL_ADMIN_PERMISSIONS,
      isVerified: true,
      isSuspended: false,
      tokenVersion: 0,
    });
  }

  // 5. Permanently lock setup in SystemConfig
  if (!config) config = await SystemConfig.create({});
  config.isInitialSuperAdminCreated = true;
  config.initialSetupDisabled = true;
  config.superAdminEmail = superAdmin.email;
  config.superAdminCreatedAt = new Date();
  await config.save();

  // 6. Record Audit Log
  await AuditLog.create({
    actorId: superAdmin._id,
    actorName: superAdmin.name,
    actorEmail: superAdmin.email,
    actorRole: 'super_admin',
    action: 'SETUP_INITIAL_SUPER_ADMIN_CLI',
    targetType: 'Administrator',
    targetId: String(superAdmin._id),
    details: {
      email: superAdmin.email,
      timestamp: new Date(),
      status: 'Initial Super Admin established. Setup permanently disabled.',
    },
    ipAddress: '127.0.0.1 (CLI)',
  });

  console.log('\n✅ Initial Super Admin created successfully!');
  console.log('------------------------------------------------------');
  console.log(`Name        : ${superAdmin.name}`);
  console.log(`Email       : ${superAdmin.email}`);
  console.log(`Role        : ${superAdmin.role}`);
  console.log(`Permissions : All Administrative Privileges Granted`);
  console.log('------------------------------------------------------');
  console.log('🔒 SECURITY NOTICE: The setup process is now permanently disabled.');
  console.log('Duplicate super admin creation is strictly blocked.');
  console.log('======================================================\n');

  process.exit(0);
}

setupSuperAdmin().catch((err) => {
  console.error('Fatal error during setup:', err);
  process.exit(1);
});
