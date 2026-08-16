// server/routes/eventRoutes.js

const express = require('express');
const router = express.Router();

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { uploadEventImage } = require('../middleware/uploadMiddleware');

router.get('/', protect, getEvents);
router.post('/', protect, uploadEventImage.single('image'), createEvent);
router.get('/:id', protect, getEventById);
router.put('/:id', protect, uploadEventImage.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);

router.post('/:id/register', protect, registerForEvent);
router.post('/:id/unregister', protect, unregisterFromEvent);

module.exports = router;
