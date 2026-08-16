// server/models/Event.js

const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Competition',
  'Hackathon',
  'Club Event',
  'College Function',
  'Other',
];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      default: 'Other',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // If set, this event belongs to a specific club/community.
    // If null, it's a college-wide event.
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    image: {
      type: String, // relative URL, e.g. /uploads/events/xyz.jpg
      default: '',
    },
    maxParticipants: {
      type: Number,
      default: null, // null = unlimited
    },
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_CATEGORIES = EVENT_CATEGORIES;
