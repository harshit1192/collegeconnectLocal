// server/routes/postRoutes.js

const express = require('express');
const router = express.Router();

const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  deleteComment,
  reportPost,
  reportComment,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPostImages } = require('../middleware/uploadMiddleware');

router.get('/', protect, getPosts);
router.post('/', protect, uploadPostImages.array('images', 4), createPost);
router.get('/:id', protect, getPostById);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/comments/:commentId/report', protect, reportComment);
router.post('/:id/report', protect, reportPost);

module.exports = router;
