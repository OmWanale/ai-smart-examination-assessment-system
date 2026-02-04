const Class = require("../models/Class");
const User = require("../models/User");
const { generateUniqueJoinCode, isValidJoinCode } = require("../utils/joinCode");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route   POST /api/classes
 * @desc    Create a new class (teacher only)
 * @access  Private/Teacher
 */
const createClass = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Class name is required",
    });
  }

  // Generate unique join code
  const joinCode = await generateUniqueJoinCode(Class);

  // Create class
  const newClass = await Class.create({
    name: name.trim(),
    description: description?.trim(),
    joinCode,
    teacher: req.user._id,
    students: [],
  });

  // Add class to teacher's classes array
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { classes: newClass._id },
  });

  // Populate teacher info
  await newClass.populate("teacher", "name email");

  res.status(201).json({
    success: true,
    message: "Class created successfully",
    data: {
      class: {
        id: newClass._id,
        name: newClass.name,
        description: newClass.description,
        joinCode: newClass.joinCode,
        teacher: newClass.teacher,
        studentCount: 0,
        createdAt: newClass.createdAt,
      },
    },
  });
});

/**
 * @route   POST /api/classes/join
 * @desc    Join a class using join code (student only)
 * @access  Private/Student
 */
const joinClassByCode = asyncHandler(async (req, res) => {
  const { joinCode } = req.body;

  // Validation
  if (!joinCode) {
    return res.status(400).json({
      success: false,
      message: "Join code is required",
    });
  }

  const normalizedCode = joinCode.trim().toUpperCase();

  if (!isValidJoinCode(normalizedCode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid join code format",
    });
  }

  // Find class by join code
  const classToJoin = await Class.findOne({ joinCode: normalizedCode })
    .populate("teacher", "name email");

  if (!classToJoin) {
    return res.status(404).json({
      success: false,
      message: "Class not found with this join code",
    });
  }

  if (!classToJoin.isActive) {
    return res.status(400).json({
      success: false,
      message: "This class is no longer active",
    });
  }

  // Check if student is already enrolled
  if (classToJoin.isStudent(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: "You are already enrolled in this class",
    });
  }

  // Check if user is the teacher
  if (classToJoin.isTeacher(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: "You cannot join your own class as a student",
    });
  }

  // Add student to class
  await classToJoin.addStudent(req.user._id);

  // Add class to student's classes array
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { classes: classToJoin._id },
  });

  res.json({
    success: true,
    message: "Successfully joined class",
    data: {
      class: {
        id: classToJoin._id,
        name: classToJoin.name,
        description: classToJoin.description,
        teacher: classToJoin.teacher,
        studentCount: classToJoin.studentCount,
        createdAt: classToJoin.createdAt,
      },
    },
  });
});

/**
 * @route   GET /api/classes
 * @desc    Get all classes for current user (teacher sees owned, student sees enrolled)
 * @access  Private
 */
const getMyClasses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let classes;

  if (userRole === "teacher") {
    // Teachers see classes they created
    classes = await Class.find({ teacher: userId })
      .populate("teacher", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });
  } else {
    // Students see classes they're enrolled in
    // We need to keep students to compute count, but not return it
    classes = await Class.find({ students: userId })
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
  }

  res.json({
    success: true,
    count: classes.length,
    data: {
      classes: classes.map((cls) => ({
        id: cls._id,
        name: cls.name,
        description: cls.description,
        joinCode: userRole === "teacher" ? cls.joinCode : undefined,
        teacher: cls.teacher,
        studentCount: cls.studentCount,
        students: userRole === "teacher" ? cls.students : undefined,
        createdAt: cls.createdAt,
      })),
    },
  });
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get single class details
 * @access  Private (teacher or enrolled student)
 */
const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const classData = await Class.findById(id)
    .populate("teacher", "name email avatar")
    .populate("students", "name email");

  if (!classData) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  // Check if user has access to this class
  const isTeacher = classData.isTeacher(userId);
  const isStudent = classData.isStudent(userId);

  if (!isTeacher && !isStudent) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this class",
    });
  }

  // Log the raw data for debugging
  console.log('[getClassById] Raw classData:', JSON.stringify({
    id: classData._id,
    name: classData.name,
    students: classData.students,
    quizzes: classData.quizzes,
  }, null, 2));

  res.json({
    success: true,
    data: {
      class: {
        id: classData._id,
        name: classData.name,
        description: classData.description,
        joinCode: isTeacher ? classData.joinCode : undefined,
        teacher: classData.teacher,
        // Always return arrays, never undefined - use empty array as fallback
        students: isTeacher ? (Array.isArray(classData.students) ? classData.students : []) : [],
        quizzes: Array.isArray(classData.quizzes) ? classData.quizzes : [],
        studentCount: classData.studentCount,
        quizCount: classData.quizCount,
        createdAt: classData.createdAt,
        isTeacher,
        isStudent,
      },
    },
  });
});

module.exports = {
  createClass,
  joinClassByCode,
  getMyClasses,
  getClassById,
};
