const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const id = user._id || user.id || user;
  const role = user.role || 'client';
  const tokenVersion = user.tokenVersion || 0;

  return jwt.sign(
    { id, role, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
