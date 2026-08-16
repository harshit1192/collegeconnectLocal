// server/routes/resourceRoutes.js

const express = require('express');
const router = express.Router();

const {
  getResources,
  getResourceById,
  uploadResource,
  downloadResource,
  deleteResource,
  reportResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { uploadResourceFile } = require('../middleware/uploadMiddleware');

router.get('/', protect, getResources);
router.post('/', protect, uploadResourceFile.single('file'), uploadResource);
router.get('/:id', protect, getResourceById);
router.get('/:id/download', protect, downloadResource);
router.delete('/:id', protect, deleteResource);
router.post('/:id/report', protect, reportResource);

module.exports = router;
