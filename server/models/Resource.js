// server/models/Resource.js

const mongoose = require('mongoose');

const RESOURCE_TYPES = [
  'Notes',
  'Question Paper',
  'Assignment',
  'Study Material',
  'Lab File',
  'Reference Document',
];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      required: [true, 'Please select a resource type'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      enum: ['1', '2', '3', '4', '5', '6', '7', '8'],
    },

    // ---------- File metadata ----------
    fileUrl: { type: String, required: true }, // e.g. /uploads/resources/xyz.pdf
    fileName: { type: String, required: true }, // original filename, for display on download
    fileType: { type: String, required: true }, // mimetype
    fileSize: { type: Number, required: true }, // bytes

    downloads: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ title: 'text', description: 'text' });
resourceSchema.index({ subject: 1, branch: 1, semester: 1, createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
