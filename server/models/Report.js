// server/models/Report.js
// Generic reporting model. Posts, comments, users, and resources can all be
// reported through the same collection, distinguished by targetType.
// Full moderation review tooling for admins is built in Phase 13 — this
// phase just needs a place to record reports as they come in.

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['Post', 'Comment', 'User', 'Resource'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for this report'],
      enum: [
        'Spam',
        'Harassment or bullying',
        'Hate speech',
        'Inappropriate content',
        'Misinformation',
        'Academic dishonesty',
        'Other',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'resolved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
