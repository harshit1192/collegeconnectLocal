// server/controllers/postController.js

const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Community = require('../models/Community');
const { createReport } = require('./reportController');
const { createNotification } = require('./notificationController');

const POST_AUTHOR_FIELDS = 'fullName profilePicture branch year role';

// @desc    Get paginated feed of posts (newest first)
// @route   GET /api/posts?page=&limit=
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

  // The main platform feed only shows posts that don't belong to a
  // community — community posts have their own feed (see
  // communityController.getCommunityPosts).
  const query = { community: null };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate('author', POST_AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
});

// @desc    Get a single post with its comments
// @route   GET /api/posts/:id
// @access  Private
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', POST_AUTHOR_FIELDS);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const comments = await Comment.find({ post: post._id })
    .populate('author', POST_AUTHOR_FIELDS)
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, post, comments });
});

// @desc    Create a new post (with optional images)
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content, community: communityId } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Post content cannot be empty');
  }

  if (communityId) {
    const community = await Community.findById(communityId);
    if (!community) {
      res.status(404);
      throw new Error('Community not found');
    }
    const isMember = community.members.some((m) => String(m) === String(req.user._id));
    if (!isMember) {
      res.status(403);
      throw new Error('You must join this community before posting in it');
    }
  }

  const images = (req.files || []).map((f) => `/uploads/posts/${f.filename}`);

  const post = await Post.create({
    author: req.user._id,
    content: content.trim(),
    images,
    community: communityId || null,
  });

  await post.populate('author', POST_AUTHOR_FIELDS);

  res.status(201).json({ success: true, post });
});

// @desc    Edit a post (author only)
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (String(post.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own posts');
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Post content cannot be empty');
  }

  post.content = content.trim();
  post.isEdited = true;
  await post.save();
  await post.populate('author', POST_AUTHOR_FIELDS);

  res.status(200).json({ success: true, post });
});

// @desc    Delete a post (author or admin)
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const isOwner = String(post.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this post');
  }

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.status(200).json({ success: true, message: 'Post deleted' });
});

// @desc    Like or unlike a post (toggle)
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const alreadyLiked = post.likes.some((id) => String(id) === String(req.user._id));

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => String(id) !== String(req.user._id));
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();

  if (!alreadyLiked) {
    await createNotification({
      recipientId: post.author,
      senderId: req.user._id,
      type: 'like',
      message: `${req.user.fullName} liked your post`,
      link: `/`,
    });
  }

  res.status(200).json({
    success: true,
    liked: !alreadyLiked,
    likesCount: post.likes.length,
  });
});

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Comment cannot be empty');
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    content: content.trim(),
  });

  post.comments.push(comment._id);
  await post.save();
  await comment.populate('author', POST_AUTHOR_FIELDS);

  await createNotification({
    recipientId: post.author,
    senderId: req.user._id,
    type: 'comment',
    message: `${req.user.fullName} commented on your post`,
    link: `/`,
  });

  res.status(201).json({ success: true, comment });
});

// @desc    Delete a comment (comment author, post author, or admin)
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const { id: postId, commentId } = req.params;

  const [post, comment] = await Promise.all([Post.findById(postId), Comment.findById(commentId)]);

  if (!post || !comment) {
    res.status(404);
    throw new Error('Post or comment not found');
  }

  const isCommentAuthor = String(comment.author) === String(req.user._id);
  const isPostAuthor = String(post.author) === String(req.user._id);
  if (!isCommentAuthor && !isPostAuthor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this comment');
  }

  await comment.deleteOne();
  post.comments = post.comments.filter((c) => String(c) !== String(commentId));
  await post.save();

  res.status(200).json({ success: true, message: 'Comment deleted' });
});

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
const reportPost = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please select a reason for reporting this post');
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  await createReport({
    reporterId: req.user._id,
    targetType: 'Post',
    targetId: post._id,
    reason,
    description,
  });

  res.status(201).json({ success: true, message: 'Post reported. Our moderators will review it.' });
});

// @desc    Report a comment
// @route   POST /api/posts/:id/comments/:commentId/report
// @access  Private
const reportComment = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please select a reason for reporting this comment');
  }

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  await createReport({
    reporterId: req.user._id,
    targetType: 'Comment',
    targetId: comment._id,
    reason,
    description,
  });

  res.status(201).json({ success: true, message: 'Comment reported. Our moderators will review it.' });
});

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  deleteComment,
  reportPost,
  reportComment,
};
