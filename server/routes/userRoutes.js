// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  reportUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePicture: uploadMiddleware } = require('../middleware/uploadMiddleware');

// IMPORTANT: specific routes like /profile must be declared BEFORE the
// generic /:id route, otherwise Express would treat "profile" as an :id.
router.put('/profile', protect, updateProfile);
router.post('/profile/picture', protect, uploadMiddleware.single('profilePicture'), uploadProfilePicture);

router.get('/', protect, searchUsers);
router.get('/:id', protect, getUserProfile);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.post('/:id/report', protect, reportUser);

module.exports = router;
