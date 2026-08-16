// server/models/Post.js
// Social feed posts. Comments live in their own collection (Comment.js) and
// are referenced here by id for quick counts, but fetched separately when
// viewing a post's full comment thread.

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty'],
      trim: true,
      maxlength: [3000, 'Post cannot exceed 3000 characters'],
    },
    images: {
      type: [String], // relative URLs, e.g. /uploads/posts/xyz.jpg
      default: [],
    },
    // If set, this post belongs to a community feed rather than (or in
    // addition to) the main platform-wide feed. Added in Phase 8.
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
      index: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
