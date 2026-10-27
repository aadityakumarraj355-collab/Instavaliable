require('dotenv').config({ path: '../.env' });

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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavaliable';

async function seedData() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB. Clearing demo records only...');

  // Only remove demo accounts, never super_admin or genuine accounts
  await Promise.all([
    User.deleteMany({ role: { $in: ['client', 'worker'] }, email: { $regex: '@instavaliable\\.com$' } }),
    WorkerProfile.deleteMany({}),
    Service.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  console.log('Creating Admin account...');
  const admin = await User.create({
    name: 'Instavaliable Admin',
    email: 'admin@instavaliable.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
  });

  console.log('Creating Service Providers & Freelancers...');
  const workersData = [
    {
      name: 'Sarah Jenkins',
      email: 'sarah.plumbing@instavaliable.com',
      password: 'worker123',
      role: 'worker',
      location: 'Downtown / Metro Area',
      phone: '+1 (555) 234-5678',
      isVerified: true,
      profile: {
        skills: ['Pipe Fitting', 'Leak Detection', 'Drain Unclogging', 'Water Heaters'],
        experience: '8 years of certified master plumbing experience',
        bio: 'Licensed local plumber specializing in emergency leak repairs, bathroom fixtures, and water heater installations. Fast response guaranteed.',
        hourlyRate: 65,
        rating: 4.9,
        ratingCount: 38,
      },
      services: [
        {
          title: 'Emergency Plumbing & Leak Repair',
          description: 'Fast on-demand diagnostics and repair for leaky pipes, bursting joints, running toilets, and dripping faucets.',
          category: 'Plumbing',
          price: 75,
          location: 'Downtown / Metro Area',
        },
        {
          title: 'Kitchen Sink & Drain Unclogging',
          description: 'High-pressure unclogging and trap replacement for stubborn kitchen and bathroom blockages.',
          category: 'Plumbing',
          price: 60,
          location: 'Metro Area',
        },
      ],
    },
    {
      name: 'David Sparks',
      email: 'david.electric@instavaliable.com',
      password: 'worker123',
      role: 'worker',
      location: 'Westside & Suburbs',
      phone: '+1 (555) 345-6789',
      isVerified: true,
      profile: {
        skills: ['Wiring Inspection', 'Circuit Breakers', 'Smart Home Setup', 'Lighting'],
        experience: '10 years certified residential & commercial electrician',
        bio: 'Master Electrician providing prompt, code-compliant electrical maintenance, ceiling fan setups, smart switches, and breaker upgrades.',
        hourlyRate: 70,
        rating: 4.8,
        ratingCount: 52,
      },
      services: [
        {
          title: 'Residential Electrical Inspection & Repairs',
          description: 'Safe fault finding, faulty switch/outlet replacements, and electrical panel safety checks.',
          category: 'Electrical',
          price: 85,
          location: 'Westside & Suburbs',
        },
        {
          title: 'Smart Home Lighting & EV Charger Installation',
          description: 'Expert installation of smart light fixtures, dimmer switches, and Level 2 electric vehicle chargers.',
          category: 'Electrical',
          price: 120,
          location: 'Westside & Suburbs',
        },
      ],
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.woodwork@instavaliable.com',
      password: 'worker123',
      role: 'worker',
      location: 'North Hills',
      phone: '+1 (555) 456-7890',
      isVerified: true,
      profile: {
        skills: ['Cabinet Making', 'Furniture Assembly', 'Door Fitting', 'Deck Repair'],
        experience: '7 years professional carpentry & custom woodwork',
        bio: 'Passionate craftsman delivering tailored wood solutions, interior trim, custom shelving, and flat-pack furniture assembly.',
        hourlyRate: 55,
        rating: 4.9,
        ratingCount: 29,
      },
      services: [
        {
          title: 'Custom Shelving & Cabinet Repair',
          description: 'Precision carpentry for kitchen cabinets, closet organization shelves, and sturdy floating wood shelves.',
          category: 'Carpentry',
          price: 90,
          location: 'North Hills',
        },
        {
          title: 'Interior Door Installation & Lock Fitting',
          description: 'Hanging new doors, trimming sticking doors, and installing heavy-duty deadbolts and handles.',
          category: 'Carpentry',
          price: 65,
          location: 'North Hills',
        },
      ],
    },
    {
      name: 'Elena Rostova',
      email: 'elena.clean@instavaliable.com',
      password: 'worker123',
      role: 'worker',
      location: 'City Center',
      phone: '+1 (555) 567-8901',
      isVerified: true,
      profile: {
        skills: ['Deep Cleaning', 'Sanitization', 'Move-in/Move-out', 'Window Washing'],
        experience: '5 years running top-rated residential cleaning team',
        bio: 'Detail-obsessed home cleaning specialist using eco-friendly products for sparkling clean living spaces.',
        hourlyRate: 45,
        rating: 5.0,
        ratingCount: 46,
      },
      services: [
        {
          title: 'Complete Home Deep Cleaning & Sanitization',
          description: 'Thorough top-to-bottom cleaning of kitchen, bathrooms, bedrooms, and floors with eco-safe disinfectant.',
          category: 'Cleaning',
          price: 95,
          location: 'City Center',
        },
      ],
    },
    {
      name: 'Alex Rivera',
      email: 'alex.freelancer@instavaliable.com',
      password: 'worker123',
      role: 'worker',
      location: 'Remote / Local Tech Hub',
      phone: '+1 (555) 678-9012',
      isVerified: true,
      profile: {
        skills: ['Wi-Fi Optimization', 'Computer Repair', 'Smart Office Setup', 'Website Help'],
        experience: '6 years independent tech support & freelance IT consultant',
        bio: 'Freelance IT specialist assisting homes and small businesses with fast on-site tech troubleshooting, mesh Wi-Fi, and software configuration.',
        hourlyRate: 60,
        rating: 4.9,
        ratingCount: 22,
      },
      services: [
        {
          title: 'Home Office Wi-Fi & Network Setup',
          description: 'Eliminate dead zones with high-speed mesh router setup, cabling, and secure network optimization.',
          category: 'Electrical',
          price: 70,
          location: 'Remote / Local Tech Hub',
        },
      ],
    },
  ];

  const createdWorkers = [];
  const createdServices = [];

  for (const w of workersData) {
    const user = await User.create({
      name: w.name,
      email: w.email,
      password: w.password,
      role: w.role,
      location: w.location,
      phone: w.phone,
      isVerified: w.isVerified,
    });

    const profile = await WorkerProfile.create({
      userId: user._id,
      ...w.profile,
      location: w.location,
    });

    createdWorkers.push({ user, profile });

    for (const s of w.services) {
      const service = await Service.create({
        workerId: user._id,
        title: s.title,
        description: s.description,
        category: s.category,
        price: s.price,
        location: s.location,
        isActive: true,
      });
      createdServices.push({ service, user });
    }
  }

  console.log('Creating Sample Customers...');
  const client1 = await User.create({
    name: 'Emily Watson',
    email: 'emily.client@gmail.com',
    password: 'client123',
    role: 'client',
    location: 'Downtown / 4th Ave',
    phone: '+1 (555) 888-1122',
  });

  const client2 = await User.create({
    name: 'Michael Chen',
    email: 'michael.client@gmail.com',
    password: 'client123',
    role: 'client',
    location: 'Westside Boulevard',
    phone: '+1 (555) 999-3344',
  });

  console.log('Creating Initial Bookings with formatted Request IDs...');
  const sampleBookings = [
    {
      requestId: 'INS-2026-000101',
      clientId: client1._id,
      workerId: createdWorkers[0].user._id,
      serviceId: createdServices[0].service._id,
      date: new Date(Date.now() + 86400000 * 2),
      scheduledTime: '10:00 AM',
      address: '742 Evergreen Terrace, Downtown',
      phone: client1.phone,
      notes: 'Kitchen faucet dripping steadily. Need gasket inspection and valve check.',
      status: 'accepted',
    },
    {
      requestId: 'INS-2026-000102',
      clientId: client2._id,
      workerId: createdWorkers[1].user._id,
      serviceId: createdServices[2].service._id,
      date: new Date(Date.now() + 86400000 * 3),
      scheduledTime: '02:30 PM',
      address: '108 Westside Blvd, Apt 4B',
      phone: client2.phone,
      notes: 'Two breaker switches trip whenever air conditioner is powered on.',
      status: 'pending',
    },
    {
      requestId: 'INS-2026-000103',
      clientId: client1._id,
      workerId: createdWorkers[3].user._id,
      serviceId: createdServices[4].service._id,
      date: new Date(Date.now() - 86400000 * 4),
      scheduledTime: '11:00 AM',
      address: '742 Evergreen Terrace, Downtown',
      phone: client1.phone,
      notes: 'Move-in deep sanitization for 3-bedroom apartment.',
      status: 'completed',
    },
  ];

  for (const b of sampleBookings) {
    await Booking.create(b);
  }

  console.log('\n===============================================');
  console.log('INSTAVALIABLE SEED COMPLETED SUCCESSFULLY! 🎉');
  console.log('===============================================');
  console.log('Admin Account:');
  console.log('  Email   : admin@instavaliable.com');
  console.log('  Password: admin123');
  console.log('\nSample Service Providers (Password: worker123):');
  console.log('  1. sarah.plumbing@instavaliable.com   (Plumbing)');
  console.log('  2. david.electric@instavaliable.com   (Electrical)');
  console.log('  3. marcus.woodwork@instavaliable.com  (Carpentry)');
  console.log('  4. elena.clean@instavaliable.com      (Cleaning)');
  console.log('  5. alex.freelancer@instavaliable.com  (Tech/Freelancer)');
  console.log('\nSample Customers (Password: client123):');
  console.log('  1. emily.client@gmail.com');
  console.log('  2. michael.client@gmail.com');
  console.log('===============================================\n');

  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
