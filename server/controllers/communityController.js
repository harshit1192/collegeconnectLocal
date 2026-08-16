// server/controllers/communityController.js

const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const MEMBER_FIELDS = 'fullName profilePicture branch year section';

const isCreatorOrCommunityAdmin = (community, userId) =>
  String(community.creator) === String(userId) ||
  community.admins.some((a) => String(a) === String(userId));

// @desc    Search/browse communities
// @route   GET /api/communities?search=&category=&page=&limit=
// @access  Private
const getCommunities = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;

  const query = {};
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 12, 40);

  const [communities, total] = await Promise.all([
    Community.find(query)
      .populate('creator', MEMBER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Community.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    communities: communities.map((c) => ({
      ...c.toObject(),
      memberCount: c.members.length,
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single community's details
// @route   GET /api/communities/:id
// @access  Private
const getCommunityById = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id)
    .populate('creator', MEMBER_FIELDS)
    .populate('admins', MEMBER_FIELDS)
    .populate('members', MEMBER_FIELDS);

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  res.status(200).json({ success: true, community });
});

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
const createCommunity = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  if (!name?.trim() || !description?.trim()) {
    res.status(400);
    throw new Error('Community name and description are required');
  }

  const exists = await Community.findOne({ name: name.trim() });
  if (exists) {
    res.status(400);
    throw new Error('A community with this name already exists');
  }

  const community = await Community.create({
    name: name.trim(),
    description: description.trim(),
    category: category || 'Other',
    creator: req.user._id,
    admins: [req.user._id],
    members: [req.user._id], // creator automatically joins
  });

  await community.populate('creator', MEMBER_FIELDS);

  res.status(201).json({ success: true, community });
});

// @desc    Edit a community (creator or community admin)
// @route   PUT /api/communities/:id
// @access  Private
const updateCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  if (!isCreatorOrCommunityAdmin(community, req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only community admins can edit this community');
  }

  const { name, description, category } = req.body;
  if (name !== undefined) community.name = name.trim();
  if (description !== undefined) community.description = description.trim();
  if (category !== undefined) community.category = category;

  await community.save();
  await community.populate('creator', MEMBER_FIELDS);

  res.status(200).json({ success: true, community });
});

// @desc    Delete a community (creator or platform admin)
// @route   DELETE /api/communities/:id
// @access  Private
const deleteCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const isCreator = String(community.creator) === String(req.user._id);
  if (!isCreator && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the community creator or a platform admin can delete this community');
  }

  const communityPosts = await Post.find({ community: community._id });
  await Comment.deleteMany({ post: { $in: communityPosts.map((p) => p._id) } });
  await Post.deleteMany({ community: community._id });
  await community.deleteOne();

  res.status(200).json({ success: true, message: 'Community deleted' });
});

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
const joinCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const alreadyMember = community.members.some((m) => String(m) === String(req.user._id));
  if (alreadyMember) {
    res.status(400);
    throw new Error('You are already a member of this community');
  }

  community.members.push(req.user._id);
  await community.save();

  res.status(200).json({ success: true, message: `You joined ${community.name}` });
});

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
const leaveCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  if (String(community.creator) === String(req.user._id)) {
    res.status(400);
    throw new Error('The community creator cannot leave. Transfer ownership or delete the community instead.');
  }

  community.members = community.members.filter((m) => String(m) !== String(req.user._id));
  community.admins = community.admins.filter((a) => String(a) !== String(req.user._id));
  await community.save();

  res.status(200).json({ success: true, message: `You left ${community.name}` });
});

// @desc    Remove a member from the community (community admin only)
// @route   DELETE /api/communities/:id/members/:userId
// @access  Private
const removeMember = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  if (!isCreatorOrCommunityAdmin(community, req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only community admins can remove members');
  }

  const { userId } = req.params;
  if (String(userId) === String(community.creator)) {
    res.status(400);
    throw new Error('The community creator cannot be removed');
  }

  community.members = community.members.filter((m) => String(m) !== String(userId));
  community.admins = community.admins.filter((a) => String(a) !== String(userId));
  await community.save();

  res.status(200).json({ success: true, message: 'Member removed' });
});

// @desc    Promote a member to community admin (creator only)
// @route   POST /api/communities/:id/admins/:userId
// @access  Private
const addCommunityAdmin = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  if (String(community.creator) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only the community creator or a platform admin can promote admins');
  }

  const { userId } = req.params;
  const isMember = community.members.some((m) => String(m) === String(userId));
  if (!isMember) {
    res.status(400);
    throw new Error('User must be a member before becoming an admin');
  }

  const alreadyAdmin = community.admins.some((a) => String(a) === String(userId));
  if (!alreadyAdmin) {
    community.admins.push(userId);
    await community.save();
  }

  res.status(200).json({ success: true, message: 'Member promoted to admin' });
});

// @desc    Get a community's posts (community feed)
// @route   GET /api/communities/:id/posts?page=&limit=
// @access  Private
const getCommunityPosts = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.id);
  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

  const [posts, total] = await Promise.all([
    Post.find({ community: community._id })
      .populate('author', 'fullName profilePicture branch year role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments({ community: community._id }),
  ]);

  res.status(200).json({
    success: true,
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
});

module.exports = {
  getCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  removeMember,
  addCommunityAdmin,
  getCommunityPosts,
};
