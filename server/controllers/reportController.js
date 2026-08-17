// server/controllers/reportController.js

const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');

// Shared helper other controllers can call to create a report for any
// target type (Post, Comment, User, Resource).
const createReport = async ({ reporterId, targetType, targetId, reason, description }) => {
  return Report.create({
    reporter: reporterId,
    targetType,
    targetId,
    reason,
    description,
  });
};

// @desc    Get all reports (admin moderation queue)
// @route   GET /api/admin/reports
// @access  Private/Admin
// (Wired up fully in Phase 12/13 — exported now so it's ready to mount.)
const getReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};

  const reports = await Report.find(query)
    .populate('reporter', 'fullName email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, reports });
});

module.exports = { createReport, getReports };
