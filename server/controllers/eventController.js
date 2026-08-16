// server/controllers/eventController.js

const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Community = require('../models/Community');

const ORGANIZER_FIELDS = 'fullName profilePicture branch year role';

// A user can create/manage an event tied to a community if they're a
// platform admin, or an admin of that specific community.
const canManageCommunityEvent = async (userId, userRole, communityId) => {
  if (userRole === 'admin') return true;
  if (!communityId) return false;

  const community = await Community.findById(communityId);
  if (!community) return false;

  return (
    String(community.creator) === String(userId) ||
    community.admins.some((a) => String(a) === String(userId))
  );
};

// @desc    Get events (upcoming/past, filter by category/community, search)
// @route   GET /api/events?when=upcoming|past&category=&community=&search=&page=&limit=
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const { when = 'upcoming', category, community, search, page = 1, limit = 10 } = req.query;

  const query = {};
  if (category) query.category = category;
  if (community) query.community = community;
  if (search) query.$text = { $search: search };

  const now = new Date();
  if (when === 'upcoming') query.date = { $gte: now };
  else if (when === 'past') query.date = { $lt: now };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 30);

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('organizer', ORGANIZER_FIELDS)
      .populate('community', 'name logo')
      .sort({ date: when === 'past' ? -1 : 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Event.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    events,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single event's details
// @route   GET /api/events/:id
// @access  Private
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', ORGANIZER_FIELDS)
    .populate('community', 'name logo')
    .populate('registeredStudents', 'fullName profilePicture branch year');

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  res.status(200).json({ success: true, event });
});

// @desc    Create an event (platform admin, or admin of the given community)
// @route   POST /api/events
// @access  Private
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, community, date, venue, maxParticipants } = req.body;

  if (!title?.trim() || !description?.trim() || !date || !venue?.trim()) {
    res.status(400);
    throw new Error('Title, description, date, and venue are required');
  }

  const allowed = await canManageCommunityEvent(req.user._id, req.user.role, community);
  if (!allowed) {
    res.status(403);
    throw new Error('Only platform admins or that community\'s admins can create this event');
  }

  const event = await Event.create({
    title: title.trim(),
    description: description.trim(),
    category: category || 'Other',
    community: community || null,
    organizer: req.user._id,
    date,
    venue: venue.trim(),
    maxParticipants: maxParticipants ? Number(maxParticipants) : null,
    image: req.file ? `/uploads/events/${req.file.filename}` : '',
  });

  await event.populate('organizer', ORGANIZER_FIELDS);

  res.status(201).json({ success: true, event });
});

// @desc    Edit an event (organizer, community admin, or platform admin)
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const isOrganizer = String(event.organizer) === String(req.user._id);
  const allowed = isOrganizer || (await canManageCommunityEvent(req.user._id, req.user.role, event.community));
  if (!allowed) {
    res.status(403);
    throw new Error('You are not authorized to edit this event');
  }

  const { title, description, category, date, venue, maxParticipants } = req.body;
  if (title !== undefined) event.title = title.trim();
  if (description !== undefined) event.description = description.trim();
  if (category !== undefined) event.category = category;
  if (date !== undefined) event.date = date;
  if (venue !== undefined) event.venue = venue.trim();
  if (maxParticipants !== undefined) event.maxParticipants = maxParticipants ? Number(maxParticipants) : null;
  if (req.file) event.image = `/uploads/events/${req.file.filename}`;

  await event.save();
  await event.populate('organizer', ORGANIZER_FIELDS);

  res.status(200).json({ success: true, event });
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const isOrganizer = String(event.organizer) === String(req.user._id);
  const allowed = isOrganizer || (await canManageCommunityEvent(req.user._id, req.user.role, event.community));
  if (!allowed) {
    res.status(403);
    throw new Error('You are not authorized to delete this event');
  }

  await event.deleteOne();

  res.status(200).json({ success: true, message: 'Event deleted' });
});

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.date < new Date()) {
    res.status(400);
    throw new Error('This event has already taken place');
  }

  const alreadyRegistered = event.registeredStudents.some((s) => String(s) === String(req.user._id));
  if (alreadyRegistered) {
    res.status(400);
    throw new Error('You are already registered for this event');
  }

  if (event.maxParticipants && event.registeredStudents.length >= event.maxParticipants) {
    res.status(400);
    throw new Error('This event has reached its maximum number of participants');
  }

  event.registeredStudents.push(req.user._id);
  await event.save();

  res.status(200).json({ success: true, message: 'Registered successfully', registeredCount: event.registeredStudents.length });
});

// @desc    Unregister from an event
// @route   POST /api/events/:id/unregister
// @access  Private
const unregisterFromEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  event.registeredStudents = event.registeredStudents.filter((s) => String(s) !== String(req.user._id));
  await event.save();

  res.status(200).json({ success: true, message: 'Unregistered successfully', registeredCount: event.registeredStudents.length });
});

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
};
