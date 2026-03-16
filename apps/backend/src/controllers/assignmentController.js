const path = require("path");
const fs = require("fs");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Class = require("../models/Class");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Teacher creates a new assignment inside a class
 * @route   POST /api/classes/:classId/assignments/create
 * @access  Private / Teacher (must own the class)
 */
const createAssignment = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { title, description, dueDate } = req.body;

  // Verify the class exists and the teacher owns it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }
  if (!classDoc.isTeacher(req.user._id)) {
    res.status(403);
    throw new Error("Only the class teacher can create assignments.");
  }

  if (!title || !description || !dueDate) {
    res.status(400);
    throw new Error("Title, description, and due date are required.");
  }

  const assignment = await Assignment.create({
    class: classId,
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
 * @desc    Get all assignments for a class (newest first)
 * @route   GET /api/classes/:classId/assignments
 * @access  Private (class teacher or enrolled students only)
 */
const getAssignments = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  // Verify the class exists and user belongs to it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }

  const isTeacher = classDoc.isTeacher(req.user._id);
  const isStudent = classDoc.isStudent(req.user._id);
  if (!isTeacher && !isStudent) {
    res.status(403);
    throw new Error("You are not a member of this class.");
  }

  const assignments = await Assignment.find({ class: classId })
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
 * @route   GET /api/classes/:classId/assignments/:assignmentId/download
 * @access  Private (class teacher or enrolled students only)
 */
const downloadAssignmentFile = asyncHandler(async (req, res) => {
  const { classId, assignmentId } = req.params;

  // Verify class membership
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }
  if (!classDoc.isTeacher(req.user._id) && !classDoc.isStudent(req.user._id)) {
    res.status(403);
    throw new Error("You are not a member of this class.");
  }

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    class: classId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found in this class.");
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

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("Assignment file not found on server.");
  }

  res.download(filePath, assignment.originalFileName);
});

/**
 * @desc    Student submits their work for an assignment
 * @route   POST /api/classes/:classId/assignments/:assignmentId/submit
 * @access  Private / Student (must be enrolled in the class)
 */
const submitAssignment = asyncHandler(async (req, res) => {
  const { classId, assignmentId } = req.params;

  if (!req.file) {
    res.status(400);
    throw new Error("A file (PDF, DOC, or DOCX) is required for submission.");
  }

  // Verify the class exists and student is enrolled
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }
  if (!classDoc.isStudent(req.user._id)) {
    res.status(403);
    throw new Error("You must be enrolled in this class to submit.");
  }

  // Verify the assignment exists and belongs to this class
  const assignment = await Assignment.findOne({
    _id: assignmentId,
    class: classId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found in this class.");
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
    class: classId,
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
 * @route   GET /api/classes/:classId/assignments/:assignmentId/submissions
 * @access  Private / Teacher (must own the class)
 */
const getSubmissions = asyncHandler(async (req, res) => {
  const { classId, assignmentId } = req.params;

  // Verify the class exists and the teacher owns it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }
  if (!classDoc.isTeacher(req.user._id)) {
    res.status(403);
    throw new Error("Only the class teacher can view submissions.");
  }

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    class: classId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found in this class.");
  }

  const submissions = await AssignmentSubmission.find({
    assignment: assignmentId,
  })
    .populate("student", "name email")
    .sort({ submittedAt: -1 });

  res.json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

/**
 * @desc    Download a student's submitted file
 * @route   GET /api/classes/:classId/assignments/submissions/:submissionId/download
 * @access  Private / Teacher (must own the class)
 */
const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const { classId, submissionId } = req.params;

  // Verify the class exists and the teacher owns it
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found.");
  }
  if (!classDoc.isTeacher(req.user._id)) {
    res.status(403);
    throw new Error("Only the class teacher can download submissions.");
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    class: classId,
  });
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "submissions",
    submission.file
  );

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("Submission file not found on server.");
  }

  res.download(filePath, submission.originalFileName);
});

module.exports = {
  createAssignment,
  getAssignments,
  downloadAssignmentFile,
  submitAssignment,
  getSubmissions,
  downloadSubmissionFile,
};
