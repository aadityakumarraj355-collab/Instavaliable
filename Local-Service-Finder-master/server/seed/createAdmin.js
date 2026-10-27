require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/local_services_marketplace';

async function createAdmin() {
  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email: 'admin@instavaliable.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Instavaliable Admin',
    email: 'admin@instavaliable.com',
    password: 'admin123',
    role: 'admin',
  });

  console.log('Admin created:');
  console.log('  Email   :', admin.email);
  console.log('  Password: admin123');
  process.exit(0);
}

createAdmin().catch((err) => { console.error(err); process.exit(1); });
