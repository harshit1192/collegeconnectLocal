// server/routes/communityRoutes.js

const express = require('express');
const router = express.Router();

const {
  getCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  removeMember,
  addCommunityAdmin,
  getCommunityPosts,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCommunities);
router.post('/', protect, createCommunity);
router.get('/:id', protect, getCommunityById);
router.put('/:id', protect, updateCommunity);
router.delete('/:id', protect, deleteCommunity);

router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.delete('/:id/members/:userId', protect, removeMember);
router.post('/:id/admins/:userId', protect, addCommunityAdmin);

router.get('/:id/posts', protect, getCommunityPosts);

module.exports = router;
