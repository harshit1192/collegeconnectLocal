// server/server.js
// Entry point for the CollegeConnect backend API.
// Phase 1: basic Express app + health check.
// Phase 2: MongoDB/Mongoose connection wired in (see config/db.js).
// Phase 3+: auth, users, posts, questions, resources, communities, events.
// Phase 10: wrapped in a raw http.Server so Socket.IO can attach for
// real-time private messaging (see config/socket.js).

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const questionRoutes = require('./routes/questionRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const communityRoutes = require('./routes/communityRoutes');
const eventRoutes = require('./routes/eventRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// ---------- Database ----------
// Connect to MongoDB before the server starts accepting traffic.
connectDB();

// ---------- Core middleware ----------
app.use(
  helmet({
    // Allow uploaded images (profile pictures, post images, event images)
    // to be loaded cross-origin by the frontend, since in production the
    // frontend and backend commonly live on different domains/ports.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// General API rate limit as a baseline defense against abusive traffic,
// on top of the stricter authLimiter applied to /api/auth below.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// ---------- Static file serving ----------
// Uploaded profile pictures / resources are served from here, e.g.
// GET /uploads/profile-pictures/abc123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Health check route ----------
// Used to verify the backend is running, and that MongoDB is connected.
app.get('/api/health', (req, res) => {
  // mongoose.connection.readyState: 0 = disconnected, 1 = connected,
  // 2 = connecting, 3 = disconnecting
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'CollegeConnect API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ---------- Placeholder root route ----------
app.get('/', (req, res) => {
  res.send('CollegeConnect API — see /api/health for status.');
});

// ---------- API routes ----------
// Rate-limit auth endpoints specifically to slow down brute-force/credential
// stuffing attempts (login, register, password reset).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // generous limit for dev/demo; tighten for production
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
// (Phase 14 is testing, debugging, optimization, and documentation — no new routers expected)

// ---------- 404 + centralized error handler ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Wrap Express in a raw HTTP server so Socket.IO (real-time messaging) can
// share the same port instead of needing a separate server/port.
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`CollegeConnect server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Socket.IO ready for real-time messaging');
});

module.exports = app;
