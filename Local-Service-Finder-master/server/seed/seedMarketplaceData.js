const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Strict Production Guard: Prevent accidental demo data insertion in production
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_SEEDING) {
  console.error('⛔ FATAL: Demo seeding is strictly forbidden in production mode.');
  process.exit(1);
}

const mongoose = require('mongoose');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Report = require('../models/Report');
const ModerationHistory = require('../models/ModerationHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavaliable';

async function seedMarketplace() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // Clean demo users only (keep super_admin!)
  await User.deleteMany({ role: { $in: ['client', 'worker'] } });
  await WorkerProfile.deleteMany({});
  await Service.deleteMany({});
  await Booking.deleteMany({});
  await Feedback.deleteMany({});
  await Report.deleteMany({});

  console.log('Creating demo verified Service Providers with INR pricing...');

  // Provider 1: Plumbing Master
  const worker1 = await User.create({
    name: 'Rajesh Sharma',
    email: 'rajesh.plumbing@instavaliable.com',
    password: 'password123',
    role: 'worker',
    phone: '+919810123456',
    location: 'South Delhi & NCR',
    isVerified: true,
    accountStatus: 'active',
  });

  const worker1Profile = await WorkerProfile.create({
    userId: worker1._id,
    skills: ['Pipe Fitting', 'Leak Detection', 'Drain Unclogging', 'Water Heaters'],
    experience: '9+ years of professional certified plumbing experience',
    bio: 'Certified local plumbing expert serving Delhi NCR. Specialized in emergency leak repairs, sanitary installations, water pumps, and drain solutions. 100% genuine parts and on-time service.',
    hourlyRate: 350,
    rating: 4.8,
    ratingCount: 2,
  });

  const service1 = await Service.create({
    title: 'Emergency Pipe Repair & Leak Fix',
    description: 'Fast response for burst pipes, leaking joints, dripping taps, and concealed pipeline repairs. Includes diagnostic inspection and pressure testing.',
    category: 'Plumbing',
    price: 499,
    pricingType: 'starting_at',
    location: 'South Delhi & NCR',
    workerId: worker1._id,
  });

  const service2 = await Service.create({
    title: 'Bathroom Fixture & Tap Installation',
    description: 'Professional fitting of showers, mixers, health faucets, washbasins, and flush tanks with zero leak guarantee.',
    category: 'Plumbing',
    price: 350,
    pricingType: 'per_visit',
    location: 'South Delhi & NCR',
    workerId: worker1._id,
  });

  // Provider 2: Electrical Technician
  const worker2 = await User.create({
    name: 'Vikram Verma',
    email: 'vikram.electric@instavaliable.com',
    password: 'password123',
    role: 'worker',
    phone: '+919820987654',
    location: 'Indiranagar & Koramangala, Bengaluru',
    isVerified: true,
    accountStatus: 'active',
  });

  const worker2Profile = await WorkerProfile.create({
    userId: worker2._id,
    skills: ['MCB Tripping', 'Inverter Wiring', 'Appliance Setup', 'LED Lighting'],
    experience: '7 years electrical contractor experience',
    bio: 'Licensed electrician for residential and commercial wiring, power surges, short circuits, and smart home lighting installations.',
    hourlyRate: 400,
    rating: 5.0,
    ratingCount: 1,
  });

  const service3 = await Service.create({
    title: 'Complete Electrical Diagnostics & Repair',
    description: 'Comprehensive troubleshooting of power fluctuations, tripping circuit breakers, short circuits, and damaged wiring.',
    category: 'Electrical',
    price: 650,
    pricingType: 'fixed',
    location: 'Indiranagar, Bengaluru',
    workerId: worker2._id,
  });

  // Provider 3: Deep Cleaning Specialist
  const worker3 = await User.create({
    name: 'Sunita Patel',
    email: 'sunita.cleaning@instavaliable.com',
    password: 'password123',
    role: 'worker',
    phone: '+919830554433',
    location: 'Bandra & Andheri, Mumbai',
    isVerified: true,
    accountStatus: 'active',
  });

  await WorkerProfile.create({
    userId: worker3._id,
    skills: ['Kitchen Deep Clean', 'Sofa Shampooing', 'Bathroom Descaling', 'Eco-friendly cleaning'],
    experience: '6 years professional housekeeping and sanitization',
    bio: 'Eco-friendly deep cleaning expert. High-pressure steam equipment, non-toxic sanitizing agents, and pet-friendly products.',
    hourlyRate: 500,
    rating: 4.9,
    ratingCount: 1,
  });

  const service4 = await Service.create({
    title: 'Full Home Deep Cleaning & Sanitization',
    description: 'Deep scrubbing, floor polishing, kitchen degreasing, bathroom descaling, and high-touch surface disinfection.',
    category: 'Cleaning',
    price: 1999,
    pricingType: 'fixed',
    location: 'Mumbai Suburbs',
    workerId: worker3._id,
  });

  console.log('Creating demo Customers...');
  const customer1 = await User.create({
    name: 'Aarav Mehta',
    email: 'aarav.client@instavaliable.com',
    password: 'password123',
    role: 'client',
    phone: '+919876500001',
    location: 'South Delhi',
    accountStatus: 'active',
  });

  const customer2 = await User.create({
    name: 'Priya Nair',
    email: 'priya.client@instavaliable.com',
    password: 'password123',
    role: 'client',
    phone: '+919876500002',
    location: 'Bengaluru',
    accountStatus: 'active',
  });

  const customer3 = await User.create({
    name: 'Rohan Gupta',
    email: 'rohan.client@instavaliable.com',
    password: 'password123',
    role: 'client',
    phone: '+919876500003',
    location: 'Mumbai',
    accountStatus: 'active',
  });

  console.log('Creating Completed Bookings & Verified Feedback (Feature 7, 8, 10)...');

  // Completed Booking 1 for Worker 1
  const booking1 = await Booking.create({
    requestId: 'INS-2026-000101',
    clientId: customer1._id,
    workerId: worker1._id,
    serviceId: service1._id,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    scheduledTime: '10:00 AM',
    address: 'B-12, Green Park Extension, New Delhi',
    phone: customer1.phone,
    notes: 'Main bathroom supply pipe dripping under sink',
    status: 'completed',
    hasFeedback: true,
  });

  const feedback1 = await Feedback.create({
    bookingId: booking1._id,
    clientId: customer1._id,
    workerId: worker1._id,
    serviceId: service1._id,
    rating: 5,
    message: 'Rajesh arrived within 30 minutes! Diagnosed the problem immediately and fixed the burst valve with high-grade copper fittings. Clear pricing in rupees and very polite.',
    status: 'visible',
  });

  booking1.feedbackId = feedback1._id;
  await booking1.save();

  // Completed Booking 2 for Worker 1
  const booking2 = await Booking.create({
    requestId: 'INS-2026-000102',
    clientId: customer2._id,
    workerId: worker1._id,
    serviceId: service2._id,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    scheduledTime: '03:30 PM',
    address: '45 Lotus Enclave, Saket, New Delhi',
    phone: customer2.phone,
    notes: 'Install new shower mixer and angle valves',
    status: 'completed',
    hasFeedback: true,
  });

  const feedback2 = await Feedback.create({
    bookingId: booking2._id,
    clientId: customer2._id,
    workerId: worker1._id,
    serviceId: service2._id,
    rating: 5,
    message: 'Very neat installation. Verified everything twice for leaks before leaving. Excellent communication over WhatsApp beforehand.',
    status: 'visible',
  });

  booking2.feedbackId = feedback2._id;
  await booking2.save();

  // Completed Booking 3 for Worker 2
  const booking3 = await Booking.create({
    requestId: 'INS-2026-000103',
    clientId: customer2._id,
    workerId: worker2._id,
    serviceId: service3._id,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    scheduledTime: '11:00 AM',
    address: '12th Main, HAL 2nd Stage, Indiranagar',
    phone: customer2.phone,
    notes: 'MCB was constantly tripping when microwave was on',
    status: 'completed',
    hasFeedback: true,
  });

  const feedback3 = await Feedback.create({
    bookingId: booking3._id,
    clientId: customer2._id,
    workerId: worker2._id,
    serviceId: service3._id,
    rating: 5,
    message: 'Vikram detected an overloaded sub-circuit in under 15 minutes. Rewired safely and explained everything clearly. Top notch professional!',
    status: 'visible',
  });

  booking3.feedbackId = feedback3._id;
  await booking3.save();

  // Active Pending Booking for customer 1 to test actions
  await Booking.create({
    requestId: 'INS-2026-000104',
    clientId: customer1._id,
    workerId: worker3._id,
    serviceId: service4._id,
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    scheduledTime: '09:00 AM',
    address: 'B-12, Green Park, New Delhi',
    phone: customer1.phone,
    notes: 'Weekend deep cleaning request',
    status: 'pending',
    hasFeedback: false,
  });

  // Sample Customer Report (Feature 12)
  await Report.create({
    reporterId: customer3._id,
    providerId: worker1._id,
    bookingId: booking1._id,
    category: 'Poor service',
    description: 'Initial enquiry had a 15 min delay due to traffic before arrival. Issue was resolved amicably.',
    status: 'investigating',
    adminNotes: 'Spoke with client, confirmed service was completed satisfactorily.',
  });

  console.log('✅ Demo Marketplace Seed Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('Super Admin Credentials: superadmin@instavaliable.com / SuperAdmin@Secure2026!');
  console.log('Demo Customer: aarav.client@instavaliable.com / password123');
  console.log('Demo Provider: rajesh.plumbing@instavaliable.com / password123');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

seedMarketplace().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
