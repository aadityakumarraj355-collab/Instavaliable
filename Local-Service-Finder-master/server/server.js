const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const whatsAppRoutes = require('./routes/whatsAppRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');

connectDB();

const app = express();
const httpServer = http.createServer(app);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline scripts/styles needed by React Vite bundle
    crossOriginEmbedderPolicy: false,
  })
);

const clientUrlEnv = process.env.CLIENT_URL;
const allowedOrigins = clientUrlEnv
  ? clientUrlEnv.split(',').map(origin => origin.trim()).filter(Boolean)
  : '*';

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// Authenticate Socket.IO connections using JWT
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('Server authentication configuration error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return next(new Error('Invalid authentication token'));
    }

    const user = await User.findById(userId).select(
      '_id role isSuspended'
    );

    if (!user || user.isSuspended) {
      return next(new Error('Account unavailable'));
    }

    socket.data.userId = user._id.toString();
    socket.data.role = user.role;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Users can join ONLY their own room
io.on('connection', (socket) => {
  const userId = socket.data.userId;

  socket.join(userId);

  socket.on('join', (requestedUserId) => {
    // Reject attempts to join another user's room
    if (requestedUserId !== userId) {
      return;
    }

    socket.join(userId);
  });
});


// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/health', (req, res) =>
  res.json({ success: true, message: 'Server is running', environment: process.env.NODE_ENV || 'production' })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsAppRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);

// Static frontend serving (Single-origin production preview)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`));

module.exports = app;
