// server/controllers/userController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { createReport } = require('./reportController');

// Fields safe to return for OTHER students' profiles (hide email etc. from
// strangers if you want — kept visible here since this is a closed college
// network, but easy to trim down later).
const PUBLIC_FIELDS =
  'fullName email rollNumber branch year section role profilePicture bio skills interests achievements githubUrl linkedinUrl followers following createdAt';

// @desc    Get a single user's public profile by id
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select(PUBLIC_FIELDS)
    .populate('followers', 'fullName profilePicture branch year')
    .populate('following', 'fullName profilePicture branch year');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({ success: true, user });
});

// @desc    Update the logged-in user's own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const editableFields = ['fullName', 'bio', 'skills', 'interests', 'achievements', 'githubUrl', 'linkedinUrl', 'branch', 'section'];

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const updated = await user.save();

  res.status(200).json({ success: true, user: updated.toSafeObject() });
});

// @desc    Upload / replace the logged-in user's profile picture
// @route   POST /api/users/profile/picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file was uploaded');
  }

  const user = await User.findById(req.user._id);
  user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
  await user.save();

  res.status(200).json({
    success: true,
    profilePicture: user.profilePicture,
  });
});

// @desc    Search / browse students with optional filters
// @route   GET /api/users?search=&branch=&year=&section=&page=&limit=
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { search, branch, year, section, page = 1, limit = 20 } = req.query;

  const query = { role: 'student', isBlocked: false };

  if (branch) query.branch = branch;
  if (year) query.year = year;
  if (section) query.section = section;

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 50);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('fullName rollNumber branch year section profilePicture bio skills')
      .sort({ fullName: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// @desc    Follow another student
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  if (targetId === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const target = await User.findById(targetId);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  const alreadyFollowing = target.followers.some((f) => String(f) === String(req.user._id));
  if (alreadyFollowing) {
    res.status(400);
    throw new Error('You are already following this user');
  }

  target.followers.push(req.user._id);
  await target.save();

  const me = await User.findById(req.user._id);
  me.following.push(target._id);
  await me.save();

  await createNotification({
    recipientId: target._id,
    senderId: req.user._id,
    type: 'follow',
    message: `${req.user.fullName} started following you`,
    link: `/profile/${req.user._id}`,
  });

  res.status(200).json({ success: true, message: `You are now following ${target.fullName}` });
});

// @desc    Unfollow a student
// @route   POST /api/users/:id/unfollow
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  const target = await User.findById(targetId);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  target.followers = target.followers.filter((f) => String(f) !== String(req.user._id));
  await target.save();

  const me = await User.findById(req.user._id);
  me.following = me.following.filter((f) => String(f) !== String(targetId));
  await me.save();

  res.status(200).json({ success: true, message: `You unfollowed ${target.fullName}` });
});

// @desc    Get a user's followers list
// @route   GET /api/users/:id/followers
// @access  Private
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'followers',
    'fullName profilePicture branch year section'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({ success: true, followers: user.followers });
});

// @desc    Get a user's following list
// @route   GET /api/users/:id/following
// @access  Private
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'following',
    'fullName profilePicture branch year section'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({ success: true, following: user.following });
});

// @desc    Report a user
// @route   POST /api/users/:id/report
// @access  Private
const reportUser = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please select a reason for reporting this user');
  }

  if (String(req.params.id) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot report yourself');
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  await createReport({
    reporterId: req.user._id,
    targetType: 'User',
    targetId: target._id,
    reason,
    description,
  });

  res.status(201).json({ success: true, message: 'User reported. Our moderators will review it.' });
});

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  reportUser,
};
