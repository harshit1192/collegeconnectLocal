// server/models/Answer.js

const mongoose = require('mongoose');

// Lightweight embedded comment — kept simple (add-only) since the only
// required feature here is "comment on answers", not a full thread system.
const answerCommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Answer content cannot be empty'],
      trim: true,
      maxlength: [5000, 'Answer cannot exceed 5000 characters'],
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAccepted: {
      type: Boolean,
      default: false,
    },
    comments: [answerCommentSchema],
  },
  { timestamps: true }
);

answerSchema.index({ question: 1, createdAt: 1 });

// Virtual net score, handy for sorting answers by helpfulness.
answerSchema.virtual('voteScore').get(function voteScore() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});
answerSchema.set('toJSON', { virtuals: true });
answerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Answer', answerSchema);
