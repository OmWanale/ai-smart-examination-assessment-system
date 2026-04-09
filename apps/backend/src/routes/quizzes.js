const express = require("express");
const multer = require("multer");
const {
  createQuiz,
  generateQuizWithAI,
  previewQuizWithAI,
  publishQuizFromPreview,
  generateQuizFromFiles,
  getQuizzesForClass,
  getQuizById,
  getQuizForAttempt,
  getQuizSubmissions,
  getQuizForTeacher,
  getQuizReviewForStudent,
  deleteQuiz,
} = require("../controllers/quizController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOC, DOCX
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

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
 * @desc    Generate a quiz using AI (direct create)
 * @access  Private/Teacher
 */
router.post("/ai-generate", authorize("teacher"), generateQuizWithAI);

/**
 * @route   POST /api/quizzes/ai-preview
 * @desc    Preview AI generated quiz without saving
 * @access  Private/Teacher
 */
router.post("/ai-preview", authorize("teacher"), previewQuizWithAI);

/**
 * @route   POST /api/quizzes/ai-publish
 * @desc    Publish a previewed AI quiz
 * @access  Private/Teacher
 */
router.post("/ai-publish", authorize("teacher"), publishQuizFromPreview);

/**
 * @route   POST /api/quizzes/generate-from-files
 * @desc    Generate quiz questions from uploaded PDF/DOC/DOCX files
 * @access  Private/Teacher
 */
router.post(
  "/generate-from-files",
  authorize("teacher"),
  upload.array("files", 10),
  generateQuizFromFiles
);

/**
 * @route   GET /api/quizzes/class/:classId
 * @desc    Get all quizzes for a class
 * @access  Private (teacher or enrolled student)
 */
router.get("/class/:classId", getQuizzesForClass);

/**
 * @route   GET /api/quizzes/:id/teacher-view
 * @desc    Get full quiz details for teacher (includes answers and explanations)
 * @access  Private/Teacher (creator only)
 */
router.get("/:id/teacher-view", authorize("teacher"), getQuizForTeacher);

/**
 * @route   GET /api/quizzes/:id/submissions
 * @desc    Get all submissions for a quiz
 * @access  Private/Teacher (creator only)
 */
router.get("/:id/submissions", authorize("teacher"), getQuizSubmissions);

/**
 * @route   GET /api/quizzes/:id/attempt
 * @desc    Get quiz for student attempt (without answers)
 * @access  Private/Student (enrolled in class)
 */
router.get("/:id/attempt", authorize("student"), getQuizForAttempt);

/**
 * @route   GET /api/quizzes/:id/student-review
 * @desc    Get quiz review for student (based on permissions)
 * @access  Private/Student (must have submitted)
 */
router.get("/:id/student-review", authorize("student"), getQuizReviewForStudent);

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get single quiz details
 * @access  Private (teacher or enrolled student)
 */
router.get("/:id", getQuizById);

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete a quiz and all its submissions
 * @access  Private/Teacher (creator only)
 */
router.delete("/:id", authorize("teacher"), deleteQuiz);

module.exports = router;
