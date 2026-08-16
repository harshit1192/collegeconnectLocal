// server/routes/questionRoutes.js

const express = require('express');
const router = express.Router();

const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  acceptAnswer,
  addAnswerComment,
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getQuestions);
router.post('/', protect, createQuestion);
router.get('/:id', protect, getQuestionById);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);
router.post('/:id/vote', protect, voteQuestion);

router.post('/:id/answers', protect, addAnswer);
router.put('/:id/answers/:answerId', protect, updateAnswer);
router.delete('/:id/answers/:answerId', protect, deleteAnswer);
router.post('/:id/answers/:answerId/vote', protect, voteAnswer);
router.post('/:id/answers/:answerId/accept', protect, acceptAnswer);
router.post('/:id/answers/:answerId/comments', protect, addAnswerComment);

module.exports = router;
