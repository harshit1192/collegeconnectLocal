// server/models/Question.js

const mongoose = require('mongoose');

const SUBJECTS = [
  'Data Structures',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Java',
  'JavaScript',
  'React',
  'Mathematics',
  'AI/ML',
  'Other',
];

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Question description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: SUBJECTS,
      required: [true, 'Please select a subject'],
    },
    branch: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Any Year'],
      default: 'Any Year',
    },
    tags: {
      type: [String],
      default: [],
    },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', description: 'text', tags: 'text' });
questionSchema.index({ subject: 1, branch: 1, year: 1, createdAt: -1 });

questionSchema.virtual('voteScore').get(function voteScore() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);
module.exports.SUBJECTS = SUBJECTS;
