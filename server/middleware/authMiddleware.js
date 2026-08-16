// server/middleware/authMiddleware.js
// Reusable middleware for protecting routes and restricting access by role.

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Verifies the JWT from the Authorization header and attaches the user
// document (without password) to req.user. Use on any route that requires
// a logged-in user.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error('This account has been blocked. Contact an administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, invalid or expired token');
  }
});

// Restricts a route to specific roles, e.g. authorize('admin').
// Must be used *after* `protect` so req.user is already set.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user?.role}' is not authorized to access this resource`);
    }
    next();
  };
};

module.exports = { protect, authorize };
