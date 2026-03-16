const path = require("path");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Teacher creates a new assignment (with optional file attachment)
 * @route   POST /api/assignments/create
 * @access  Private / Teacher
 */
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!title || !description || !dueDate) {
    res.status(400);
    throw new Error("Title, description, and due date are required.");
  }

  const assignment = await Assignment.create({
    title,
    description,
    dueDate,
    file: req.file ? req.file.filename : null,
    originalFileName: req.file ? req.file.originalname : null,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Assignment created successfully.",
    data: assignment,
  });
});

/**
 * @desc    Get all assignments (newest first)
 * @route   GET /api/assignments
 * @access  Private (Teacher & Student)
 */
const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find()
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

/**
 * @desc    Download the teacher's assignment file
 * @route   GET /api/assignments/:id/download
 * @access  Private (Teacher & Student)
 */
const downloadAssignmentFile = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found.");
  }

  if (!assignment.file) {
    res.status(404);
    throw new Error("No file attached to this assignment.");
  }

  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "assignments",
    assignment.file
  );

  // Send the file with the original filename so the browser names it correctly
  res.download(filePath, assignment.originalFileName);
});

/**
 * @desc    Student submits their work for an assignment
 * @route   POST /api/assignments/submit
 * @access  Private / Student
 */
const submitAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;

  if (!assignmentId) {
    res.status(400);
    throw new Error("assignmentId is required.");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("A file (PDF, DOC, or DOCX) is required for submission.");
  }

  // Verify the assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found.");
  }

  // Prevent duplicate submissions
  const alreadySubmitted = await AssignmentSubmission.hasSubmitted(
    assignmentId,
    req.user._id
  );
  if (alreadySubmitted) {
    res.status(409);
    throw new Error("You have already submitted this assignment.");
  }

  const submission = await AssignmentSubmission.create({
    assignment: assignmentId,
    student: req.user._id,
    file: req.file.filename,
    originalFileName: req.file.originalname,
  });

  res.status(201).json({
    success: true,
    message: "Assignment submitted successfully.",
    data: submission,
  });
});

/**
 * @desc    Get all submissions for a specific assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private / Teacher
 */
const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found.");
  }

  const submissions = await AssignmentSubmission.find({
    assignment: req.params.id,
  })
    .populate("student", "name email")
    .sort({ submittedAt: -1 });

  res.json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

module.exports = {
  createAssignment,
  getAssignments,
  downloadAssignmentFile,
  submitAssignment,
  getSubmissions,
};
