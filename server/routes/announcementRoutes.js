// server/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();

const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, createAnnouncement);
router.get('/:id', protect, getAnnouncementById);
router.put('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
