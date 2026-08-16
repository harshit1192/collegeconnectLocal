// server/controllers/resourceController.js

const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const { createReport } = require('./reportController');

const UPLOADER_FIELDS = 'fullName profilePicture branch year role';

// @desc    Get resources with search/filter/pagination
// @route   GET /api/resources?search=&subject=&semester=&branch=&resourceType=&page=&limit=
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { search, subject, semester, branch, resourceType, page = 1, limit = 12 } = req.query;

  const query = {};
  if (subject) query.subject = subject;
  if (semester) query.semester = semester;
  if (branch) query.branch = branch;
  if (resourceType) query.resourceType = resourceType;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 12, 40);

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .populate('uploader', UPLOADER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Resource.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    resources,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasMore: pageNum * limitNum < total,
    },
  });
});

// @desc    Get a single resource's metadata
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate('uploader', UPLOADER_FIELDS);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json({ success: true, resource });
});

// @desc    Upload a new study resource
// @route   POST /api/resources
// @access  Private
const uploadResource = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please attach a file to upload');
  }

  const { title, description, resourceType, subject, branch, semester } = req.body;

  if (!title?.trim() || !resourceType || !subject?.trim() || !branch?.trim() || !semester) {
    res.status(400);
    throw new Error('Title, resource type, subject, branch, and semester are required');
  }

  const resource = await Resource.create({
    title: title.trim(),
    description: description?.trim() || '',
    uploader: req.user._id,
    resourceType,
    subject: subject.trim(),
    branch: branch.trim(),
    semester,
    fileUrl: `/uploads/resources/${req.file.filename}`,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  await resource.populate('uploader', UPLOADER_FIELDS);

  res.status(201).json({ success: true, resource });
});

// @desc    Download a resource (increments download counter, then redirects
//          the browser to the actual static file)
// @route   GET /api/resources/:id/download
// @access  Private
const downloadResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloads: 1 } },
    { new: true }
  );

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // The file itself is served statically at /uploads/resources/<filename>;
  // redirecting keeps the download counter logic server-side while letting
  // the browser handle the actual file transfer (with the original filename
  // preserved via Content-Disposition would require a dedicated stream —
  // kept simple here since Express's static middleware already serves it).
  res.status(200).json({ success: true, fileUrl: resource.fileUrl, fileName: resource.fileName });
});

// @desc    Delete a resource (uploader or admin)
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const isOwner = String(resource.uploader) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this resource');
  }

  await resource.deleteOne();

  res.status(200).json({ success: true, message: 'Resource deleted' });
});

// @desc    Report a resource
// @route   POST /api/resources/:id/report
// @access  Private
const reportResource = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Please select a reason for reporting this resource');
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  await createReport({
    reporterId: req.user._id,
    targetType: 'Resource',
    targetId: resource._id,
    reason,
    description,
  });

  res.status(201).json({ success: true, message: 'Resource reported. Our moderators will review it.' });
});

module.exports = {
  getResources,
  getResourceById,
  uploadResource,
  downloadResource,
  deleteResource,
  reportResource,
};
