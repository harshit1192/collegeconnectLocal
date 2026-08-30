// server/server.js
// Entry point for the CollegeConnect backend API.

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

// ======================================================
// DATABASE
// ======================================================

connectDB();

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  'http://localhost:5173',
  'https://collegeconnect-local.vercel.app',
  'https://collage-connect-phi.vercel.app',
];

// If CLIENT_URL exists on Render, also allow it.
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`CORS blocked origin: ${origin}`);

      return callback(new Error('Not allowed by CORS'));
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
);

// ======================================================
// SECURITY
// ======================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

// ======================================================
// BODY PARSING
// ======================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// LOGGER
// ======================================================

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ======================================================
// RATE LIMITING
// ======================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,

  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api', apiLimiter);

// ======================================================
// STATIC FILES
// ======================================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/api/health', (req, res) => {
  const dbStates = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting',
  ];

  const dbStatus =
    dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'CollegeConnect API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// ROOT ROUTE
// ======================================================

app.get('/', (req, res) => {
  res.send(
    'CollegeConnect API — see /api/health for status.'
  );
});

// ======================================================
// AUTH RATE LIMITER
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 50,

  message: {
    success: false,
    message: 'Too many authentication requests, please try again later.',
  },
});

// ======================================================
// API ROUTES
// ======================================================

app.use(
  '/api/auth',
  authLimiter,
  authRoutes
);

app.use(
  '/api/users',
  userRoutes
);

app.use(
  '/api/posts',
  postRoutes
);

app.use(
  '/api/questions',
  questionRoutes
);

app.use(
  '/api/resources',
  resourceRoutes
);

app.use(
  '/api/communities',
  communityRoutes
);

app.use(
  '/api/events',
  eventRoutes
);

app.use(
  '/api/announcements',
  announcementRoutes
);

app.use(
  '/api/conversations',
  conversationRoutes
);

app.use(
  '/api/notifications',
  notificationRoutes
);

app.use(
  '/api/admin',
  adminRoutes
);

app.use(
  '/api/search',
  searchRoutes
);

// ======================================================
// 404 HANDLER
// ======================================================

app.use(notFound);

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(errorHandler);

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// ======================================================
// SOCKET.IO
// ======================================================

initSocket(httpServer);

// ======================================================
// START SERVER
// ======================================================

httpServer.listen(PORT, () => {
  console.log(
    `CollegeConnect server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );

  console.log('Socket.IO ready for real-time messaging');

  console.log(
    'Allowed CORS origins:',
    allowedOrigins
  );
});

// ======================================================
// EXPORT
// ======================================================

module.exports = app;