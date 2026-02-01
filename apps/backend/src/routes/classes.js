const express = require("express");
const {
  createClass,
  joinClassByCode,
  getMyClasses,
  getClassById,
} = require("../controllers/classController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/classes
 * @desc    Get all classes for current user
 * @access  Private (both student and teacher)
 */
router.get("/", getMyClasses);

/**
 * @route   POST /api/classes
 * @desc    Create a new class
 * @access  Private/Teacher
 */
router.post("/", authorize("teacher"), createClass);

/**
 * @route   POST /api/classes/join
 * @desc    Join a class by code
 * @access  Private/Student
 */
router.post("/join", authorize("student"), joinClassByCode);

/**
 * @route   GET /api/classes/:id
 * @desc    Get single class details
 * @access  Private (teacher or enrolled student)
 */
router.get("/:id", getClassById);

module.exports = router;
