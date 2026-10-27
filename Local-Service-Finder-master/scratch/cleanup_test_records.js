const mongoose = require('../server/node_modules/mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/instavaliable');
  
  // Clean up scratch test accounts
  const delRes = await mongoose.connection.collection('users').deleteMany({
    email: { $in: ['test_user_1793032177499@example.com', 'genuine_client_1793030169741@example.com'] }
  });
  console.log(`Deleted ${delRes.deletedCount} temporary test users.`);

  // Mark existing legacy accounts as verified
  const upRes = await mongoose.connection.collection('users').updateMany(
    { email: { $in: ['saurav_plumbing1@gmail.com', 'saurav_plumbing12@gmail.com'] } },
    { $set: { isVerified: true } }
  );
  console.log(`Updated legacy accounts to isVerified: true (matched: ${upRes.matchedCount}).`);

  const remaining = await mongoose.connection.collection('users').find({}).toArray();
  console.log('\nFinal User Database State:');
  remaining.forEach(u => console.log(`- ${u.email} | ${u.role} | isVerified: ${u.isVerified}`));

  await mongoose.disconnect();
}

run();
