// server/controllers/notificationController.js

const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { getIO, getSocketIdForUser } = require('../config/socket');

const SENDER_FIELDS = 'fullName profilePicture';

// Shared helper other controllers call whenever a notification-worthy
// action happens (like, comment, follow, answer, etc.). Never notifies a
// user about their own action. Also emits a real-time event over Socket.IO
// if the recipient is currently online, so the navbar badge updates live.
const createNotification = async ({ recipientId, senderId = null, type, message, link = '' }) => {
  // Don't notify people about their own actions.
  if (senderId && String(senderId) === String(recipientId)) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    message,
    link,
  });

  const io = getIO();
  if (io) {
    const socketId = getSocketIdForUser(recipientId);
    if (socketId) {
      const populated = await notification.populate('sender', SENDER_FIELDS);
      io.to(socketId).emit('new-notification', populated);
    }
  }

  return notification;
};

// Same as createNotification, but for a batch of recipients (e.g. all
// members of a community when an announcement is posted). Runs in parallel.
const createNotifications = async (recipientIds, { senderId = null, type, message, link = '' }) => {
  await Promise.all(
    recipientIds
      .filter((id) => !senderId || String(id) !== String(senderId))
      .map((id) => createNotification({ recipientId: id, senderId, type, message, link }))
  );
};

// @desc    Get the logged-in user's notifications (paginated) + unread count
// @route   GET /api/notifications?page=&limit=
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate('sender', SENDER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: { page, limit, total, hasMore: page * limit < total },
  });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (String(notification.recipient) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
});

// @desc    Mark all of the logged-in user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

module.exports = {
  createNotification,
  createNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
