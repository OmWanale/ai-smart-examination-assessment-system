const express = require("express");
// mergeParams allows access to :classId from the parent mount
const router = express.Router({ mergeParams: true });
const { authenticate, authorize } = require("../middleware/auth");
const { uploadAssignment, uploadSubmission } = require("../middleware/upload");
const {
  createAssignment,
  getAssignments,
  downloadAssignmentFile,
  submitAssignment,
  getSubmissions,
  downloadSubmissionFile,
} = require("../controllers/assignmentController");

// All assignment routes require authentication
router.use(authenticate);

// POST /api/classes/:classId/assignments/create — teacher creates assignment
router.post(
  "/create",
  authorize("teacher"),
  uploadAssignment.single("file"),
  createAssignment
);

// GET /api/classes/:classId/assignments — list assignments for a class
router.get("/", getAssignments);

// GET /api/classes/:classId/assignments/:assignmentId/download — download teacher's file
router.get("/:assignmentId/download", downloadAssignmentFile);

// POST /api/classes/:classId/assignments/:assignmentId/submit — student submits
router.post(
  "/:assignmentId/submit",
  authorize("student"),
  uploadSubmission.single("file"),
  submitAssignment
);

// GET /api/classes/:classId/assignments/:assignmentId/submissions — teacher views submissions
router.get(
  "/:assignmentId/submissions",
  authorize("teacher"),
  getSubmissions
);

// GET /api/classes/:classId/assignments/submissions/:submissionId/download — download submission
router.get(
  "/submissions/:submissionId/download",
  authorize("teacher"),
  downloadSubmissionFile
);

module.exports = router;
