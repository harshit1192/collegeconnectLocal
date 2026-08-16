// server/controllers/searchController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Community = require('../models/Community');
const Event = require('../models/Event');

// A small number of top results per category — this is a "quick search"
// meant to fan out across the whole platform, not a full paginated search
// per category (those already exist on their own list pages with filters).
const RESULTS_PER_CATEGORY = 5;

// @desc    Global search across students, posts, questions, resources,
//          communities, and events
// @route   GET /api/search?q=
// @access  Private
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const regex = { $regex: q.trim(), $options: 'i' };

  const [students, posts, questions, resources, communities, events] = await Promise.all([
    User.find({
      role: 'student',
      isBlocked: false,
      $or: [{ fullName: regex }, { rollNumber: regex }],
    })
      .select('fullName rollNumber branch year profilePicture')
      .limit(RESULTS_PER_CATEGORY),

    Post.find({ community: null, content: regex })
      .populate('author', 'fullName profilePicture')
      .sort({ createdAt: -1 })
      .limit(RESULTS_PER_CATEGORY),

    Question.find({ $or: [{ title: regex }, { description: regex }, { tags: regex }] })
      .populate('author', 'fullName')
      .sort({ createdAt: -1 })
      .limit(RESULTS_PER_CATEGORY),

    Resource.find({ $or: [{ title: regex }, { description: regex }, { subject: regex }] })
      .populate('uploader', 'fullName')
      .sort({ createdAt: -1 })
      .limit(RESULTS_PER_CATEGORY),

    Community.find({ $or: [{ name: regex }, { description: regex }] }).limit(RESULTS_PER_CATEGORY),

    Event.find({ $or: [{ title: regex }, { description: regex }, { venue: regex }] })
      .sort({ date: 1 })
      .limit(RESULTS_PER_CATEGORY),
  ]);

  res.status(200).json({
    success: true,
    query: q.trim(),
    results: { students, posts, questions, resources, communities, events },
  });
});

module.exports = { globalSearch };
