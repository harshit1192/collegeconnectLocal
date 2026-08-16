// server/config/socket.js
// Sets up Socket.IO on top of the existing HTTP server, authenticates each
// connection with the same JWT used for REST requests, and tracks which
// users are currently online so private messages and typing indicators can
// be delivered in real time.

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// userId (string) -> socket.id. A user could theoretically have multiple
// tabs open; for simplicity we keep the most recent socket per user, which
// is sufficient for a college-project-scale app.
const onlineUsers = new Map();

let ioInstance = null;

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate every socket connection using the JWT sent by the client
  // in the connection handshake (see client/src/context/SocketContext.jsx).
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      if (user.isBlocked) return next(new Error('Account blocked'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    onlineUsers.set(userId, socket.id);
    io.emit('user-online', userId);

    // ---- Typing indicators ----
    socket.on('typing', ({ conversationId, recipientId }) => {
      const recipientSocketId = onlineUsers.get(String(recipientId));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing', { conversationId, userId });
      }
    });

    socket.on('stop-typing', ({ conversationId, recipientId }) => {
      const recipientSocketId = onlineUsers.get(String(recipientId));
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('stop-typing', { conversationId, userId });
      }
    });

    socket.on('disconnect', () => {
      // Only clear the mapping if this was the socket we had on record
      // (avoids a race where a newer tab's connection gets wiped out by an
      // older tab's disconnect event).
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user-offline', userId);
      }
    });
  });

  ioInstance = io;
  return io;
};

// Lets REST controllers (e.g. messageController) emit events without
// needing Socket.IO passed through every function call.
const getIO = () => ioInstance;

const isUserOnline = (userId) => onlineUsers.has(String(userId));
const getOnlineUserIds = () => Array.from(onlineUsers.keys());
const getSocketIdForUser = (userId) => onlineUsers.get(String(userId));

module.exports = { initSocket, getIO, isUserOnline, getOnlineUserIds, getSocketIdForUser };
