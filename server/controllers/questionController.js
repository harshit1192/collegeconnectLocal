// server/controllers/questionController.js

const asyncHandler = require('express-async-handler');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { createNotification } = require('./notificationController');

const AUTHOR_FIELDS = 'fullName profilePicture branch year role';

// @desc    Get questions with search/filter/pagination
// @route   GET /api/questions?search=&subject=&branch=&year=&tag=&page=&limit=&sort=
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
  const { search, subject, branch, year, tag, sort = 'newest', page = 1, limit = 10 } = req.query;

  const query = {};
  if (subject) query.subject = subject;
  if (branch) query.branch = branch;
  if (year) query.year = year;
  if (tag) query.tags = tag;
  if (search) query.$text = { $search: search };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    // Vote-based sort would need an aggregation; keeping it simple here by
    // sorting on answers count as a proxy for "active" questions.
    mostAnswered: { 'answers.length': -1 },
  };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 30);

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('author', AUTHOR_FIELDS)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Question.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    questions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    },
  });
});

// @desc    Get a single question with its answers
// @route   GET /api/questions/:id
// @access  Private
const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('author', AUTHOR_FIELDS);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const answers = await Answer.find({ question: question._id })
    .populate('author', AUTHOR_FIELDS)
    .populate('comments.author', AUTHOR_FIELDS)
    .sort({ isAccepted: -1, createdAt: 1 });

  res.status(200).json({ success: true, question, answers });
});

// @desc    Ask a new question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const { title, description, subject, branch, year, tags } = req.body;

  if (!title?.trim() || !description?.trim() || !subject) {
    res.status(400);
    throw new Error('Title, description, and subject are required');
  }

  const question = await Question.create({
    title: title.trim(),
    description: description.trim(),
    author: req.user._id,
    subject,
    branch: branch || req.user.branch,
    year: year || 'Any Year',
    tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t) => t.trim()).filter(Boolean),
  });

  await question.populate('author', AUTHOR_FIELDS);

  res.status(201).json({ success: true, question });
});

// @desc    Edit a question (author only)
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  if (String(question.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own questions');
  }

  const { title, description, subject, branch, year, tags } = req.body;
  if (title !== undefined) question.title = title.trim();
  if (description !== undefined) question.description = description.trim();
  if (subject !== undefined) question.subject = subject;
  if (branch !== undefined) question.branch = branch;
  if (year !== undefined) question.year = year;
  if (tags !== undefined) {
    question.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  await question.save();
  await question.populate('author', AUTHOR_FIELDS);

  res.status(200).json({ success: true, question });
});

// @desc    Delete a question (author or admin)
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const isOwner = String(question.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this question');
  }

  await Answer.deleteMany({ question: question._id });
  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted' });
});

// @desc    Upvote or downvote a question (toggle)
// @route   POST /api/questions/:id/vote
// @access  Private
const voteQuestion = asyncHandler(async (req, res) => {
  const { direction } = req.body; // 'up' | 'down'
  if (!['up', 'down'].includes(direction)) {
    res.status(400);
    throw new Error("Vote direction must be 'up' or 'down'");
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const uid = String(req.user._id);
  question.upvotes = question.upvotes.filter((id) => String(id) !== uid);
  question.downvotes = question.downvotes.filter((id) => String(id) !== uid);

  // Re-add only if this is a new vote (i.e. toggling off is handled by the
  // filters above; toggling on happens here).
  const wasUpvoted = direction === 'up';
  if (wasUpvoted) question.upvotes.push(req.user._id);
  else question.downvotes.push(req.user._id);

  await question.save();

  res.status(200).json({
    success: true,
    upvotes: question.upvotes.length,
    downvotes: question.downvotes.length,
  });
});

// @desc    Add an answer to a question
// @route   POST /api/questions/:id/answers
// @access  Private
const addAnswer = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400);
    throw new Error('Answer cannot be empty');
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const answer = await Answer.create({
    question: question._id,
    author: req.user._id,
    content: content.trim(),
  });

  question.answers.push(answer._id);
  await question.save();
  await answer.populate('author', AUTHOR_FIELDS);

  await createNotification({
    recipientId: question.author,
    senderId: req.user._id,
    type: 'answer',
    message: `${req.user.fullName} answered your question "${question.title}"`,
    link: `/academic/${question._id}`,
  });

  res.status(201).json({ success: true, answer });
});

// @desc    Edit an answer (author only)
// @route   PUT /api/questions/:id/answers/:answerId
// @access  Private
const updateAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }
  if (String(answer.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own answers');
  }

  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400);
    throw new Error('Answer cannot be empty');
  }

  answer.content = content.trim();
  await answer.save();
  await answer.populate('author', AUTHOR_FIELDS);

  res.status(200).json({ success: true, answer });
});

// @desc    Delete an answer (author or admin)
// @route   DELETE /api/questions/:id/answers/:answerId
// @access  Private
const deleteAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  const isOwner = String(answer.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this answer');
  }

  const question = await Question.findById(req.params.id);
  if (question) {
    question.answers = question.answers.filter((a) => String(a) !== String(answer._id));
    if (String(question.acceptedAnswer) === String(answer._id)) {
      question.acceptedAnswer = null;
    }
    await question.save();
  }

  await answer.deleteOne();

  res.status(200).json({ success: true, message: 'Answer deleted' });
});

// @desc    Upvote or downvote an answer (toggle)
// @route   POST /api/questions/:id/answers/:answerId/vote
// @access  Private
const voteAnswer = asyncHandler(async (req, res) => {
  const { direction } = req.body; // 'up' | 'down'
  if (!['up', 'down'].includes(direction)) {
    res.status(400);
    throw new Error("Vote direction must be 'up' or 'down'");
  }

  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  const uid = String(req.user._id);
  answer.upvotes = answer.upvotes.filter((id) => String(id) !== uid);
  answer.downvotes = answer.downvotes.filter((id) => String(id) !== uid);

  if (direction === 'up') answer.upvotes.push(req.user._id);
  else answer.downvotes.push(req.user._id);

  await answer.save();

  res.status(200).json({
    success: true,
    upvotes: answer.upvotes.length,
    downvotes: answer.downvotes.length,
  });
});

// @desc    Mark (or unmark) an answer as accepted — question author only
// @route   POST /api/questions/:id/answers/:answerId/accept
// @access  Private
const acceptAnswer = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  if (String(question.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the question author can accept an answer');
  }

  const answer = await Answer.findById(req.params.answerId);
  if (!answer || String(answer.question) !== String(question._id)) {
    res.status(404);
    throw new Error('Answer not found for this question');
  }

  const alreadyAccepted = String(question.acceptedAnswer) === String(answer._id);

  // Unmark any previously accepted answer first.
  if (question.acceptedAnswer) {
    await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false });
  }

  if (alreadyAccepted) {
    question.acceptedAnswer = null;
  } else {
    question.acceptedAnswer = answer._id;
    answer.isAccepted = true;
    await answer.save();

    await createNotification({
      recipientId: answer.author,
      senderId: req.user._id,
      type: 'accepted_answer',
      message: `Your answer was accepted on "${question.title}"`,
      link: `/academic/${question._id}`,
    });
  }

  await question.save();

  res.status(200).json({
    success: true,
    acceptedAnswer: question.acceptedAnswer,
  });
});

// @desc    Comment on an answer
// @route   POST /api/questions/:id/answers/:answerId/comments
// @access  Private
const addAnswerComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400);
    throw new Error('Comment cannot be empty');
  }

  const answer = await Answer.findById(req.params.answerId);
  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  answer.comments.push({ author: req.user._id, content: content.trim() });
  await answer.save();
  await answer.populate('comments.author', AUTHOR_FIELDS);

  res.status(201).json({ success: true, comments: answer.comments });
});

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer,
  addAnswerComment,
};
