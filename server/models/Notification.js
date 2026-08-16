// server/models/Notification.js

const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'like',
  'comment',
  'follow',
  'answer',
  'accepted_answer',
  'message',
  'community_announcement',
  'event_reminder',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Who/what triggered this notification (omitted for system-generated
    // notifications like event reminders).
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Frontend route to navigate to when the notification is clicked,
    // e.g. "/academic/<questionId>" or "/messages/<conversationId>".
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
