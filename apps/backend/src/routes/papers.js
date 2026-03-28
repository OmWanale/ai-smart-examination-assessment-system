const express = require("express");
const multer = require("multer");
const { generatePaper, downloadPaper } = require("../controllers/paperController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10,
  },
  fileFilter: (req, file, cb) => {
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
 * @route   POST /api/papers/generate
 * @desc    Generate question paper from uploaded documents
 * @access  Private/Teacher
 */
router.post(
  "/generate",
  authorize("teacher"),
  upload.array("files", 10),
  generatePaper
);

/**
 * @route   POST /api/papers/download
 * @desc    Download question paper as PDF
 * @access  Private/Teacher
 */
router.post(
  "/download",
  authorize("teacher"),
  downloadPaper
);

module.exports = router;
