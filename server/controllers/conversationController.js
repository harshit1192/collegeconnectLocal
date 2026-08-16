// server/controllers/conversationController.js

const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIO, getSocketIdForUser, isUserOnline } = require('../config/socket');
const { createNotification } = require('./notificationController');

const PARTICIPANT_FIELDS = 'fullName profilePicture branch year role';

// @desc    Get all of the logged-in user's conversations, newest first,
//          with the other participant, last message, and unread count.
// @route   GET /api/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', PARTICIPANT_FIELDS)
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  const withMeta = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = conv.participants.find((p) => String(p._id) !== String(req.user._id));
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user._id },
        read: false,
      });

      return {
        _id: conv._id,
        otherUser,
        lastMessage: conv.lastMessage,
        unreadCount,
        isOnline: otherUser ? isUserOnline(otherUser._id) : false,
        updatedAt: conv.updatedAt,
      };
    })
  );

  res.status(200).json({ success: true, conversations: withMeta });
});

// @desc    Get (or create) the 1-to-1 conversation with another user
// @route   POST /api/conversations
// @access  Private
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    res.status(400);
    throw new Error('recipientId is required');
  }

  if (String(recipientId) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot message yourself');
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId], $size: 2 },
  }).populate('participants', PARTICIPANT_FIELDS);

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, recipientId] });
    await conversation.populate('participants', PARTICIPANT_FIELDS);
  }

  res.status(200).json({ success: true, conversation });
});

// @desc    Get message history for a conversation (paginated, oldest first
//          within each page) and mark the other participant's messages read
// @route   GET /api/conversations/:id/messages?page=&limit=
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => String(p) === String(req.user._id));
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not part of this conversation');
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

  // Fetch newest-first for pagination (so "page 2" = older messages), then
  // reverse to chronological order for display.
  const [messagesDesc, total] = await Promise.all([
    Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Message.countDocuments({ conversation: conversation._id }),
  ]);

  const messages = messagesDesc.reverse();

  // Mark incoming messages as read now that this user has fetched them.
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    messages,
    pagination: { page, limit, total, hasMore: page * limit < total },
  });
});

// @desc    Send a message in a conversation (persists to DB, then emits it
//          to the recipient in real time via Socket.IO if they're online)
// @route   POST /api/conversations/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    res.status(400);
    throw new Error('Message cannot be empty');
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => String(p) === String(req.user._id));
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not part of this conversation');
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    content: content.trim(),
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const populatedMessage = await message.populate('sender', PARTICIPANT_FIELDS);

  // Real-time delivery: emit to the other participant's active socket, if
  // they have one connected right now. If they're offline, they'll simply
  // see the message the next time they load their conversation list/history
  // (it's already persisted above).
  const io = getIO();
  if (io) {
    const recipientId = conversation.participants.find((p) => String(p) !== String(req.user._id));
    const recipientSocketId = getSocketIdForUser(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', {
        conversationId: conversation._id,
        message: populatedMessage,
      });
    }
  }

  await createNotification({
    recipientId: conversation.participants.find((p) => String(p) !== String(req.user._id)),
    senderId: req.user._id,
    type: 'message',
    message: `${req.user.fullName} sent you a message`,
    link: `/messages/${conversation._id}`,
  });

  res.status(201).json({ success: true, message: populatedMessage });
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
};
