// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();

const {
  getUsers,
  verifyUserByAdmin,
  blockUser,
  unblockUser,
  deleteUserByAdmin,
  adminDeletePost,
  adminDeleteComment,
  adminDeleteResource,
  getReports,
  updateReportStatus,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Every route below requires a logged-in platform admin.
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);

router.get('/users', getUsers);
router.put('/users/:id/verify', verifyUserByAdmin);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUserByAdmin);

router.delete('/posts/:id', adminDeletePost);
router.delete('/comments/:id', adminDeleteComment);
router.delete('/resources/:id', adminDeleteResource);

router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);

module.exports = router;
