const express = require("express");
const {
  createLecture,
  getClassLectures,
  startLecture,
  endLecture,
} = require("../controllers/lectureController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/lectures/create
 * @desc    Create a new lecture (instant or scheduled)
 * @access  Private/Teacher
 */
router.post("/create", authorize("teacher"), createLecture);

/**
 * @route   POST /api/lectures/:id/start
 * @desc    Start a scheduled lecture (mark as live)
 * @access  Private/Teacher
 */
router.post("/:id/start", authorize("teacher"), startLecture);

/**
 * @route   POST /api/lectures/:id/end
 * @desc    End a live lecture
 * @access  Private/Teacher
 */
router.post("/:id/end", authorize("teacher"), endLecture);

/**
 * @route   GET /api/classes/:classId/lectures
 * @desc    Get all lectures for a class
 * @access  Private (teacher or enrolled student)
 */
router.get("/", getClassLectures);

module.exports = router;
