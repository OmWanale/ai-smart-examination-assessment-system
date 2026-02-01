const express = require("express");
const {
  createQuiz,
  generateQuizWithAI,
  getQuizzesForClass,
  getQuizById,
} = require("../controllers/quizController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/quizzes
 * @desc    Create a new quiz
 * @access  Private/Teacher
 */
router.post("/", authorize("teacher"), createQuiz);

/**
 * @route   POST /api/quizzes/ai-generate
 * @desc    Generate a quiz using AI
 * @access  Private/Teacher
 */
router.post("/ai-generate", authorize("teacher"), generateQuizWithAI);

/**
 * @route   GET /api/quizzes/class/:classId
 * @desc    Get all quizzes for a class
 * @access  Private (teacher or enrolled student)
 */
router.get("/class/:classId", getQuizzesForClass);

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get single quiz details
 * @access  Private (teacher or enrolled student)
 */
router.get("/:id", getQuizById);

module.exports = router;
