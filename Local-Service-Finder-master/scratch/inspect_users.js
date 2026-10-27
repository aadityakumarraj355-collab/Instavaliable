const path = require('path');
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instavaliable';

async function inspect() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  console.log(`TOTAL USERS IN DB: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`[${i + 1}] ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Status: ${u.accountStatus || 'none'}`);
  });

  const services = await db.collection('services').find({}).toArray();
  console.log(`\nTOTAL SERVICES IN DB: ${services.length}`);
  services.forEach((s, i) => {
    console.log(`[${i + 1}] ID: ${s._id} | Title: ${s.title} | WorkerId: ${s.workerId} | Price: ₹${s.price}`);
  });

  const bookings = await db.collection('bookings').find({}).toArray();
  console.log(`\nTOTAL BOOKINGS IN DB: ${bookings.length}`);
  bookings.forEach((b, i) => {
    console.log(`[${i + 1}] ID: ${b._id} | RequestId: ${b.requestId} | Status: ${b.status} | Client: ${b.clientId} | Worker: ${b.workerId}`);
  });

  const feedbacks = await db.collection('feedbacks').find({}).toArray();
  console.log(`\nTOTAL FEEDBACKS IN DB: ${feedbacks.length}`);
  feedbacks.forEach((f, i) => {
    console.log(`[${i + 1}] ID: ${f._id} | Rating: ${f.rating}★ | Message: ${f.message?.slice(0, 30)}...`);
  });

  await mongoose.disconnect();
}

inspect().catch(console.error);
