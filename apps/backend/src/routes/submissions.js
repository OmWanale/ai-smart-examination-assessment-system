const express = require("express");
const {
  submitQuiz,
  getLeaderboard,
  getSubmissionsForQuiz,
  getSubmissionById,
} = require("../controllers/submissionController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/submissions
 * @desc    Submit a quiz
 * @access  Private/Student
 */
router.post("/", authorize("student"), submitQuiz);

/**
 * @route   GET /api/submissions/quiz/:quizId/leaderboard
 * @desc    Get leaderboard for a quiz
 * @access  Private (teacher or enrolled student)
 */
router.get("/quiz/:quizId/leaderboard", getLeaderboard);

/**
 * @route   GET /api/submissions/quiz/:quizId
 * @desc    Get all submissions for a quiz
 * @access  Private/Teacher
 */
router.get("/quiz/:quizId", authorize("teacher"), getSubmissionsForQuiz);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get single submission details
 * @access  Private (student owner or teacher)
 */
router.get("/:id", getSubmissionById);

module.exports = router;
