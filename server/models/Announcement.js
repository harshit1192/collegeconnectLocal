// server/models/Announcement.js

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // If set, this announcement is scoped to a specific community.
    // If null, it's a platform-wide announcement (platform admins only).
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
