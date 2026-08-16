// server/controllers/announcementController.js

const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const Community = require('../models/Community');
const { createNotifications } = require('./notificationController');

const AUTHOR_FIELDS = 'fullName profilePicture role';

const canManageCommunityAnnouncement = async (userId, userRole, communityId) => {
  if (userRole === 'admin') return true;
  if (!communityId) return false;

  const community = await Community.findById(communityId);
  if (!community) return false;

  return (
    String(community.creator) === String(userId) ||
    community.admins.some((a) => String(a) === String(userId))
  );
};

// @desc    Get announcements (platform-wide, or scoped to a community)
// @route   GET /api/announcements?community=
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  const { community } = req.query;

  // No `community` query param => platform-wide announcements only.
  const query = community ? { community } : { community: null };

  const announcements = await Announcement.find(query)
    .populate('author', AUTHOR_FIELDS)
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, announcements });
});

// @desc    Get a single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('author', AUTHOR_FIELDS);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  res.status(200).json({ success: true, announcement });
});

// @desc    Create an announcement (platform admin, or admin of the given community)
// @route   POST /api/announcements
// @access  Private
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, community } = req.body;

  if (!title?.trim() || !content?.trim()) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  const allowed = await canManageCommunityAnnouncement(req.user._id, req.user.role, community);
  if (!allowed) {
    res.status(403);
    throw new Error('Only platform admins or that community\'s admins can post this announcement');
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    content: content.trim(),
    author: req.user._id,
    community: community || null,
  });

  await announcement.populate('author', AUTHOR_FIELDS);

  // Notify community members for a community-scoped announcement. Platform-
  // wide announcements (community: null) aren't mass-notified to every
  // student to avoid a very large fan-out write — they're surfaced via the
  // banner on Home instead.
  if (community) {
    const communityDoc = await Community.findById(community);
    if (communityDoc) {
      await createNotifications(communityDoc.members, {
        senderId: req.user._id,
        type: 'community_announcement',
        message: `New announcement in ${communityDoc.name}: ${announcement.title}`,
        link: `/communities/${communityDoc._id}`,
      });
    }
  }

  res.status(201).json({ success: true, announcement });
});

// @desc    Edit an announcement
// @route   PUT /api/announcements/:id
// @access  Private
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  const isAuthor = String(announcement.author) === String(req.user._id);
  const allowed = isAuthor || (await canManageCommunityAnnouncement(req.user._id, req.user.role, announcement.community));
  if (!allowed) {
    res.status(403);
    throw new Error('You are not authorized to edit this announcement');
  }

  const { title, content } = req.body;
  if (title !== undefined) announcement.title = title.trim();
  if (content !== undefined) announcement.content = content.trim();

  await announcement.save();
  await announcement.populate('author', AUTHOR_FIELDS);

  res.status(200).json({ success: true, announcement });
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  const isAuthor = String(announcement.author) === String(req.user._id);
  const allowed = isAuthor || (await canManageCommunityAnnouncement(req.user._id, req.user.role, announcement.community));
  if (!allowed) {
    res.status(403);
    throw new Error('You are not authorized to delete this announcement');
  }

  await announcement.deleteOne();

  res.status(200).json({ success: true, message: 'Announcement deleted' });
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
