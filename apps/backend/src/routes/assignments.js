const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { uploadAssignment, uploadSubmission } = require("../middleware/upload");
const {
  createAssignment,
  getAssignments,
  downloadAssignmentFile,
  submitAssignment,
  getSubmissions,
} = require("../controllers/assignmentController");

// All assignment routes require authentication
router.use(authenticate);

// Teacher creates an assignment (optional file upload via "file" field)
router.post(
  "/create",
  authorize("teacher"),
  uploadAssignment.single("file"),
  createAssignment
);

// Any authenticated user can view assignments
router.get("/", getAssignments);

// Student submits their work (file upload via "file" field)
router.post(
  "/submit",
  authorize("student"),
  uploadSubmission.single("file"),
  submitAssignment
);

// Download the teacher's attachment for an assignment
router.get("/:id/download", downloadAssignmentFile);

// Teacher views all submissions for an assignment
router.get("/:id/submissions", authorize("teacher"), getSubmissions);

module.exports = router;
