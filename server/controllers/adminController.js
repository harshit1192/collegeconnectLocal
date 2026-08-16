// server/controllers/adminController.js
// Platform-admin-only actions. All routes using this controller are
// protected by both `protect` and `authorize('admin')` (see adminRoutes.js).
//
// Note: community/event/announcement CRUD already allow the 'admin' role to
// bypass ownership checks in their own controllers (communityController,
// eventController, announcementController) — admins can already manage
// those directly through the regular endpoints, so this controller focuses
// on user management, moderation/reports, content removal, and dashboard
// statistics, matching the spec's Admin Dashboard section.

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Report = require('../models/Report');

const USER_LIST_FIELDS =
  'fullName email rollNumber branch year section role isVerified isBlocked createdAt';

// ============================================================
// User Management
// ============================================================

// @desc    List/search users
// @route   GET /api/admin/users?search=&role=&status=&page=&limit=
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (status === 'verified') query.isVerified = true;
  if (status === 'unverified') query.isVerified = false;
  if (status === 'blocked') query.isBlocked = true;
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(query)
      .select(USER_LIST_FIELDS)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Manually verify a user (bypassing email verification)
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
const verifyUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isVerified = true;
  await user.save();
  res.status(200).json({ success: true, message: `${user.fullName} has been verified` });
});

// @desc    Block a user (prevents login / API access via `protect`)
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot block another admin');
  }
  user.isBlocked = true;
  await user.save();
  res.status(200).json({ success: true, message: `${user.fullName} has been blocked` });
});

// @desc    Unblock a user
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin
const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isBlocked = false;
  await user.save();
  res.status(200).json({ success: true, message: `${user.fullName} has been unblocked` });
});

// @desc    Permanently delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete another admin');
  }

  await user.deleteOne();
  // Note: this intentionally leaves the user's historical posts/comments/
  // answers in place (with a dangling author reference) rather than
  // cascading a large multi-collection delete, which is simpler and safer
  // for a college-project scope. A production system would likely
  // soft-delete or anonymize instead.

  res.status(200).json({ success: true, message: 'User deleted' });
});

// ============================================================
// Content Management
// ============================================================

// @desc    Admin-remove a post
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
const adminDeletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.status(200).json({ success: true, message: 'Post removed' });
});

// @desc    Admin-remove a comment
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const adminDeleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
  await comment.deleteOne();
  res.status(200).json({ success: true, message: 'Comment removed' });
});

// @desc    Admin-remove a resource
// @route   DELETE /api/admin/resources/:id
// @access  Private/Admin
const adminDeleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }
  await resource.deleteOne();
  res.status(200).json({ success: true, message: 'Resource removed' });
});

// ============================================================
// Reports / Moderation
// ============================================================

// @desc    List reports (optionally filtered by status)
// @route   GET /api/admin/reports?status=
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};

  const reports = await Report.find(query)
    .populate('reporter', 'fullName email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, reports });
});

// @desc    Update a report's status (reviewed/dismissed/resolved)
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'reviewed', 'dismissed', 'resolved'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  report.status = status;
  await report.save();

  res.status(200).json({ success: true, report });
});

// ============================================================
// Dashboard Statistics
// ============================================================

// @desc    Get platform-wide stats for the admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    activeStudents,
    totalPosts,
    totalQuestions,
    totalResources,
    totalCommunities,
    totalEvents,
    pendingReports,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isBlocked: false, isVerified: true }),
    Post.countDocuments(),
    Question.countDocuments(),
    Resource.countDocuments(),
    Community.countDocuments(),
    Event.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      activeStudents,
      totalPosts,
      totalQuestions,
      totalResources,
      totalCommunities,
      totalEvents,
      pendingReports,
    },
  });
});

module.exports = {
  getUsers,
  verifyUserByAdmin,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  adminDeletePost,
  adminDeleteComment,
  adminDeleteResource,
  getReports,
  updateReportStatus,
  getDashboardStats,
};
