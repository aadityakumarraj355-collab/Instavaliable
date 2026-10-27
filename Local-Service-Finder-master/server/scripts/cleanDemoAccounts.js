const path = require('path');
const mongoose = require(path.join(__dirname, '../node_modules/mongoose'));
require(path.join(__dirname, '../node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Report = require('../models/Report');
const ModerationHistory = require('../models/ModerationHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavaliable';

// Confirmed list of seeded/demo account emails
const DEMO_EMAILS = [
  // Demo Customers
  'aarav.client@instavaliable.com',
  'priya.client@instavaliable.com',
  'rohan.client@instavaliable.com',
  'emily.client@gmail.com',

  // Demo Service Providers
  'rajesh.plumbing@instavaliable.com',
  'vikram.electric@instavaliable.com',
  'sunita.cleaning@instavaliable.com',
  'sarah.plumbing@instavaliable.com',
  'david.electric@instavaliable.com',

  // Default seed Admin with insecure hardcoded credentials
  'admin@instavaliable.com',
];

async function cleanDemoData() {
  console.log('========================================================');
  console.log('INSTAVALIABLE — SECURE DEMO ACCOUNT PURGE & AUDIT');
  console.log('========================================================\n');

  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  // 1. Find all demo user records
  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } });
  console.log(`Identified ${demoUsers.length} confirmed demo user account(s):`);
  demoUsers.forEach((u) => {
    console.log(`  - [${u.role.toUpperCase()}] ${u.name} <${u.email}> (ID: ${u._id})`);
  });

  if (demoUsers.length === 0) {
    console.log('No demo accounts found. Database is already clean.');
    await mongoose.disconnect();
    return;
  }

  const demoUserIds = demoUsers.map((u) => u._id);

  // 2. Identify associated demo records
  const [
    demoProfilesCount,
    demoServicesCount,
    demoBookingsCount,
    demoFeedbacksCount,
    demoReportsCount,
    demoModerationsCount,
  ] = await Promise.all([
    WorkerProfile.countDocuments({ userId: { $in: demoUserIds } }),
    Service.countDocuments({ workerId: { $in: demoUserIds } }),
    Booking.countDocuments({
      $or: [{ clientId: { $in: demoUserIds } }, { workerId: { $in: demoUserIds } }],
    }),
    Feedback.countDocuments({
      $or: [{ clientId: { $in: demoUserIds } }, { workerId: { $in: demoUserIds } }],
    }),
    Report.countDocuments({
      $or: [{ reporterId: { $in: demoUserIds } }, { providerId: { $in: demoUserIds } }],
    }),
    ModerationHistory.countDocuments({ targetUserId: { $in: demoUserIds } }),
  ]);

  console.log('\nAssociated Demo Records Identified:');
  console.log(`  - Worker Profiles: ${demoProfilesCount}`);
  console.log(`  - Service Listings: ${demoServicesCount}`);
  console.log(`  - Bookings: ${demoBookingsCount}`);
  console.log(`  - Customer Feedback: ${demoFeedbacksCount}`);
  console.log(`  - Incident Reports: ${demoReportsCount}`);
  console.log(`  - Moderation History Logs: ${demoModerationsCount}`);

  // 3. Delete demo records safely
  await Promise.all([
    WorkerProfile.deleteMany({ userId: { $in: demoUserIds } }),
    Service.deleteMany({ workerId: { $in: demoUserIds } }),
    Booking.deleteMany({
      $or: [{ clientId: { $in: demoUserIds } }, { workerId: { $in: demoUserIds } }],
    }),
    Feedback.deleteMany({
      $or: [{ clientId: { $in: demoUserIds } }, { workerId: { $in: demoUserIds } }],
    }),
    Report.deleteMany({
      $or: [{ reporterId: { $in: demoUserIds } }, { providerId: { $in: demoUserIds } }],
    }),
    ModerationHistory.deleteMany({ targetUserId: { $in: demoUserIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  console.log('\n✅ All confirmed demo records successfully purged from MongoDB.');

  // 4. Verify remaining genuine database accounts
  const remainingUsers = await User.find({}).select('name email role accountStatus createdAt');
  console.log(`\nRemaining Genuine Accounts in System (${remainingUsers.length}):`);
  remainingUsers.forEach((u) => {
    console.log(`  ✔ [${u.role.toUpperCase()}] ${u.name} <${u.email}> (Status: ${u.accountStatus || 'active'})`);
  });

  const remainingServices = await Service.find({}).select('title price workerId');
  console.log(`\nRemaining Genuine Services (${remainingServices.length}):`);
  remainingServices.forEach((s) => {
    console.log(`  ✔ ${s.title} (Price: ₹${s.price})`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase cleanup complete. Disconnected.');
}

cleanDemoData().catch((err) => {
  console.error('Purge error:', err);
  process.exit(1);
});
