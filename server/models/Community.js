// server/models/Community.js

const mongoose = require('mongoose');

const CATEGORIES = [
  'Coding',
  'Cultural',
  'Sports',
  'Robotics',
  'Photography',
  'AI/ML',
  'Literary',
  'Other',
];

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Community name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Community description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    logo: {
      type: String, // relative URL, e.g. /uploads/communities/xyz.jpg
      default: '',
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The creator is automatically an admin; more admins can be added later.
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

communitySchema.index({ name: 'text', description: 'text' });
communitySchema.index({ category: 1 });

module.exports = mongoose.model('Community', communitySchema);
module.exports.CATEGORIES = CATEGORIES;
