const Quiz = require("../models/Quiz");
const Class = require("../models/Class");
const Submission = require("../models/Submission");
const asyncHandler = require("../utils/asyncHandler");
const { generateQuizQuestions } = require("../services/ai.service");

const validateQuestionsInput = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "Questions array is required and must not be empty";
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || !q.options || q.correctOptionIndex === undefined) {
      return `Question ${i + 1} is missing required fields`;
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return `Question ${i + 1} must have at least 2 options`;
    }
    if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
      return `Question ${i + 1} has invalid correct option index`;
    }
  }

  return null;
};

const createQuizRecord = async ({
  classId,
  title,
  description,
  difficulty,
  durationMinutes,
  questions,
  teacherId,
}) => {
  // Check if class exists and user is the teacher
  const classData = await Class.findById(classId);

  if (!classData) {
    return { error: { status: 404, message: "Class not found" } };
  }

  if (!classData.isTeacher(teacherId)) {
    return {
      error: { status: 403, message: "Only the class teacher can create quizzes" },
    };
  }

  // Create quiz
  const quiz = await Quiz.create({
    class: classId,
    title: title.trim(),
    description: description?.trim(),
    difficulty,
    durationMinutes,
    questions,
    createdBy: teacherId,
  });

  console.log('[createQuizRecord] Quiz created:', quiz._id, quiz.title);

  // Add quiz to class
  classData.quizzes.push(quiz._id);
  await classData.save();

  console.log('[createQuizRecord] Quiz added to class:', classId);

  return { quiz };
};

/**
 * @route   POST /api/quizzes
 * @desc    Create a new quiz (teacher only)
 * @access  Private/Teacher
 */
const createQuiz = asyncHandler(async (req, res) => {
  console.log('[createQuiz] Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    classId,
    title,
    description,
    difficulty,
    durationMinutes,
    questions,
  } = req.body;

  // Validation
  if (!classId || !title || !difficulty || !durationMinutes || !questions) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  const validationError = validateQuestionsInput(questions);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  const { quiz, error } = await createQuizRecord({
    classId,
    title,
    description,
    difficulty,
    durationMinutes,
    questions,
    teacherId: req.user._id,
  });

  if (error) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questionCount: quiz.questionCount,
        totalMarks: quiz.totalMarks,
        isActive: quiz.isActive,
        createdAt: quiz.createdAt,
      },
    },
  });
});

/**
 * @route   POST /api/quizzes/ai-generate
 * @desc    Generate a quiz using AI (teacher only)
 * @access  Private/Teacher
 */
const generateQuizWithAI = asyncHandler(async (req, res) => {
  console.log('[generateQuizWithAI] Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    classId,
    title,
    description,
    topic,
    difficulty,
    numberOfQuestions,
    durationMinutes,
  } = req.body;

  if (!classId || !topic || !difficulty || !numberOfQuestions || !durationMinutes) {
    return res.status(400).json({
      success: false,
      message: "Please provide classId, topic, difficulty, numberOfQuestions, and durationMinutes",
    });
  }

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be easy, medium, or hard",
    });
  }

  const num = Number(numberOfQuestions);
  if (!Number.isInteger(num) || num < 1 || num > 50) {
    return res.status(400).json({
      success: false,
      message: "numberOfQuestions must be an integer between 1 and 50",
    });
  }

  let aiQuestions;
  try {
    aiQuestions = await generateQuizQuestions({
      topic,
      difficulty,
      numberOfQuestions: num,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "AI generation failed",
      error: error.message,
    });
  }

  const validationError = validateQuestionsInput(aiQuestions);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: `AI output invalid: ${validationError}`,
    });
  }

  const { quiz, error } = await createQuizRecord({
    classId,
    title: title || `${topic} Quiz`,
    description: description || `AI-generated quiz on ${topic}`,
    difficulty,
    durationMinutes,
    questions: aiQuestions,
    teacherId: req.user._id,
  });

  if (error) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  res.status(201).json({
    success: true,
    message: "AI quiz generated successfully",
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questionCount: quiz.questionCount,
        totalMarks: quiz.totalMarks,
        isActive: quiz.isActive,
        createdAt: quiz.createdAt,
      },
    },
  });
});

/**
 * @route   GET /api/quizzes/class/:classId
 * @desc    Get all quizzes for a class
 * @access  Private (teacher or enrolled student)
 */
const getQuizzesForClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  // Check if class exists and user has access
  const classData = await Class.findById(classId);

  if (!classData) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  const isTeacher = classData.isTeacher(req.user._id);
  const isStudent = classData.isStudent(req.user._id);

  if (!isTeacher && !isStudent) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this class",
    });
  }

  // Get quizzes
  const quizzes = await Quiz.find({
    class: classId,
    ...(isStudent && { isActive: true }), // Students only see active quizzes
  })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  // For students, check submission status for each quiz
  if (isStudent) {
    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const hasSubmitted = await Submission.hasSubmitted(
          quiz._id,
          req.user._id
        );
        return {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          durationMinutes: quiz.durationMinutes,
          questionCount: quiz.questions.length,
          totalMarks: quiz.totalMarks,
          createdAt: quiz.createdAt,
          hasSubmitted,
        };
      })
    );

    return res.json({
      success: true,
      count: quizzesWithStatus.length,
      data: { quizzes: quizzesWithStatus },
    });
  }

  // For teachers, include full details
  res.json({
    success: true,
    count: quizzes.length,
    data: {
      quizzes: quizzes.map((quiz) => ({
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questionCount: quiz.questions.length,
        totalMarks: quiz.totalMarks,
        isActive: quiz.isActive,
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt,
      })),
    },
  });
});

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get quiz details
 * @access  Private (teacher or enrolled student)
 */
const getQuizById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await Quiz.findById(id)
    .populate("class", "name teacher students")
    .populate("createdBy", "name email");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  const isTeacher = quiz.createdBy._id.toString() === req.user._id.toString();
  const isStudent = quiz.class.students.some(
    (studentId) => studentId.toString() === req.user._id.toString()
  );

  if (!isTeacher && !isStudent) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this quiz",
    });
  }

  // Check if student already submitted
  let hasSubmitted = false;
  if (isStudent) {
    hasSubmitted = await Submission.hasSubmitted(quiz._id, req.user._id);
  }

  // Return quiz with/without answers based on role
  if (isTeacher) {
    // Teachers see full quiz with answers
    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          durationMinutes: quiz.durationMinutes,
          questions: quiz.questions,
          totalMarks: quiz.totalMarks,
          isActive: quiz.isActive,
          showCorrectAnswers: quiz.showCorrectAnswers,
          showExplanations: quiz.showExplanations,
          showResultsToStudents: quiz.showResultsToStudents,
          class: quiz.class,
          createdBy: quiz.createdBy,
          createdAt: quiz.createdAt,
        },
      },
    });
  } else {
    // Students see quiz without correct answers
    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          durationMinutes: quiz.durationMinutes,
          questions: quiz.questions.map((q, idx) => ({
            questionIndex: idx,
            questionText: q.questionText,
            options: q.options,
          })),
          totalMarks: quiz.totalMarks,
          hasSubmitted,
          createdAt: quiz.createdAt,
        },
      },
    });
  }
});

/**
 * @route   POST /api/quizzes/ai-preview
 * @desc    Generate AI quiz preview without saving (teacher only)
 * @access  Private/Teacher
 */
const previewQuizWithAI = asyncHandler(async (req, res) => {
  console.log('[previewQuizWithAI] Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    classId,
    topic,
    difficulty,
    numberOfQuestions,
    durationMinutes,
  } = req.body;

  if (!classId || !topic || !difficulty || !numberOfQuestions || !durationMinutes) {
    return res.status(400).json({
      success: false,
      message: "Please provide classId, topic, difficulty, numberOfQuestions, and durationMinutes",
    });
  }

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be easy, medium, or hard",
    });
  }

  const num = Number(numberOfQuestions);
  if (!Number.isInteger(num) || num < 1 || num > 50) {
    return res.status(400).json({
      success: false,
      message: "numberOfQuestions must be an integer between 1 and 50",
    });
  }

  // Check if user has access to the class
  const classData = await Class.findById(classId);
  if (!classData) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  if (!classData.isTeacher(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the class teacher can create quizzes",
    });
  }

  let aiQuestions;
  try {
    aiQuestions = await generateQuizQuestions({
      topic,
      difficulty,
      numberOfQuestions: num,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "AI generation failed",
      error: error.message,
    });
  }

  const validationError = validateQuestionsInput(aiQuestions);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: `AI output invalid: ${validationError}`,
    });
  }

  // Return preview without saving
  res.status(200).json({
    success: true,
    message: "Quiz preview generated successfully",
    data: {
      preview: {
        topic,
        title: `${topic} Quiz`,
        description: `AI-generated quiz on ${topic}`,
        difficulty,
        durationMinutes: Number(durationMinutes),
        questions: aiQuestions,
        questionCount: aiQuestions.length,
      },
    },
  });
});

/**
 * @route   POST /api/quizzes/ai-publish
 * @desc    Publish a previewed AI quiz (teacher only)
 * @access  Private/Teacher
 */
const publishQuizFromPreview = asyncHandler(async (req, res) => {
  console.log('[publishQuizFromPreview] Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    classId,
    title,
    description,
    difficulty,
    durationMinutes,
    questions,
    showCorrectAnswers = true,
    showExplanations = true,
    showResultsToStudents = true,
  } = req.body;

  if (!classId || !title || !difficulty || !durationMinutes || !questions) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  const validationError = validateQuestionsInput(questions);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  // Check if class exists and user is the teacher
  const classData = await Class.findById(classId);

  if (!classData) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  if (!classData.isTeacher(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the class teacher can create quizzes",
    });
  }

  // Create quiz with visibility settings
  const quiz = await Quiz.create({
    class: classId,
    title: title.trim(),
    description: description?.trim(),
    difficulty,
    durationMinutes,
    questions,
    createdBy: req.user._id,
    showCorrectAnswers,
    showExplanations,
    showResultsToStudents,
  });

  console.log('[publishQuizFromPreview] Quiz created:', quiz._id, quiz.title);

  // Add quiz to class
  classData.quizzes.push(quiz._id);
  await classData.save();

  res.status(201).json({
    success: true,
    message: "Quiz published successfully",
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questionCount: quiz.questions.length,
        totalMarks: quiz.totalMarks,
        isActive: quiz.isActive,
        showCorrectAnswers: quiz.showCorrectAnswers,
        showExplanations: quiz.showExplanations,
        showResultsToStudents: quiz.showResultsToStudents,
        createdAt: quiz.createdAt,
      },
    },
  });
});

/**
 * @route   GET /api/quizzes/:id/attempt
 * @desc    Get quiz for student attempt (without correct answers)
 * @access  Private/Student (enrolled in class)
 */
const getQuizForAttempt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('[getQuizForAttempt] Quiz ID:', id, 'User ID:', req.user._id);

  const quiz = await Quiz.findById(id)
    .populate("class", "name students");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  // Check if student is enrolled in the class
  const isEnrolled = quiz.class.students.some(
    (studentId) => studentId.toString() === req.user._id.toString()
  );

  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      message: "You are not enrolled in this class",
    });
  }

  // Check if quiz is active
  if (!quiz.isActive) {
    return res.status(403).json({
      success: false,
      message: "This quiz is not currently active",
    });
  }

  // Check if student already submitted
  const existingSubmission = await Submission.findOne({
    quiz: id,
    student: req.user._id,
  });

  if (existingSubmission) {
    return res.status(403).json({
      success: false,
      message: "You have already submitted this quiz",
      data: {
        submissionId: existingSubmission._id,
        submittedAt: existingSubmission.submittedAt,
      },
    });
  }

  // Return quiz WITHOUT correct answers and explanations
  res.json({
    success: true,
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        questionCount: quiz.questions.length,
        questions: quiz.questions.map((q, idx) => ({
          questionIndex: idx,
          questionText: q.questionText,
          options: q.options,
          // NO correctOptionIndex
          // NO explanation
        })),
        class: {
          id: quiz.class._id,
          name: quiz.class.name,
        },
      },
    },
  });
});

/**
 * @route   GET /api/quizzes/:id/submissions
 * @desc    Get all submissions for a quiz (teacher only)
 * @access  Private/Teacher (creator only)
 */
const getQuizSubmissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('[getQuizSubmissions] Quiz ID:', id, 'User ID:', req.user._id);

  const quiz = await Quiz.findById(id)
    .populate("createdBy", "name email");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  // Only the teacher who created this quiz can access
  const isCreator = quiz.createdBy._id.toString() === req.user._id.toString();
  
  if (!isCreator) {
    return res.status(403).json({
      success: false,
      message: "Only the quiz creator can view submissions",
    });
  }

  // Get all submissions for this quiz
  const submissions = await Submission.find({ quiz: id })
    .populate("student", "name email")
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  // Enrich submissions with detailed answer info
  const enrichedSubmissions = submissions.map((sub) => {
    const answersWithDetails = sub.answers.map((answer) => {
      const question = quiz.questions[answer.questionIndex];
      return {
        questionIndex: answer.questionIndex,
        questionText: question?.questionText || 'Question not found',
        selectedOptionIndex: answer.selectedOptionIndex,
        selectedOption: question?.options[answer.selectedOptionIndex] || 'N/A',
        correctOptionIndex: question?.correctOptionIndex,
        correctOption: question?.options[question?.correctOptionIndex] || 'N/A',
        isCorrect: answer.selectedOptionIndex === question?.correctOptionIndex,
        explanation: question?.explanation || '',
      };
    });

    return {
      id: sub._id,
      student: {
        id: sub.student._id,
        name: sub.student.name,
        email: sub.student.email,
      },
      score: sub.score,
      totalQuestions: sub.totalQuestions,
      percentage: sub.percentage,
      timeTakenMinutes: sub.timeTakenMinutes,
      submittedAt: sub.submittedAt,
      answers: answersWithDetails,
    };
  });

  res.json({
    success: true,
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalMarks: quiz.totalMarks,
        questionCount: quiz.questions.length,
      },
      submissionCount: submissions.length,
      submissions: enrichedSubmissions,
    },
  });
});

/**
 * @route   GET /api/quizzes/:id/teacher-view
 * @desc    Get full quiz details for teacher (includes all answers and explanations)
 * @access  Private/Teacher (creator only)
 */
const getQuizForTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('[getQuizForTeacher] Quiz ID:', id, 'User ID:', req.user._id);

  const quiz = await Quiz.findById(id)
    .populate("class", "name teacher students")
    .populate("createdBy", "name email");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  // Only the teacher who created this quiz can access
  const isCreator = quiz.createdBy._id.toString() === req.user._id.toString();
  
  if (!isCreator) {
    return res.status(403).json({
      success: false,
      message: "Only the quiz creator can view full quiz details",
    });
  }

  // Get submission count for this quiz
  const submissionCount = await Submission.countDocuments({ quiz: id });

  // Return full quiz with all questions, answers, and explanations
  res.json({
    success: true,
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        questions: quiz.questions.map((q, idx) => ({
          questionIndex: idx,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || '',
          difficulty: q.difficulty,
        })),
        totalMarks: quiz.totalMarks,
        questionCount: quiz.questions.length,
        isActive: quiz.isActive,
        showCorrectAnswers: quiz.showCorrectAnswers,
        showExplanations: quiz.showExplanations,
        showResultsToStudents: quiz.showResultsToStudents,
        submissionCount,
        class: {
          id: quiz.class._id,
          name: quiz.class.name,
        },
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
    },
  });
});

/**
 * @route   GET /api/quizzes/:id/student-review
 * @desc    Get quiz review for student (based on permissions)
 * @access  Private/Student (must have submitted)
 */
const getQuizReviewForStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;
  const mongoose = require('mongoose');
  
  console.log('[getQuizReviewForStudent] Request received');
  console.log('[getQuizReviewForStudent] Quiz ID from params:', id, 'type:', typeof id);
  console.log('[getQuizReviewForStudent] Student ID from token:', studentId, 'type:', typeof studentId);

  // Validate quiz ID format
  if (!id || id === 'undefined') {
    console.log('[getQuizReviewForStudent] Invalid quiz ID');
    return res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
  }

  // Convert to ObjectId if valid
  let quizObjectId;
  try {
    quizObjectId = new mongoose.Types.ObjectId(id);
    console.log('[getQuizReviewForStudent] Quiz ObjectId:', quizObjectId);
  } catch (e) {
    console.log('[getQuizReviewForStudent] Invalid ObjectId format:', e.message);
    return res.status(400).json({
      success: false,
      message: "Invalid quiz ID format",
    });
  }

  const quiz = await Quiz.findById(quizObjectId)
    .populate("class", "name students");

  if (!quiz) {
    console.log('[getQuizReviewForStudent] Quiz not found:', id);
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  console.log('[getQuizReviewForStudent] Quiz found:', quiz.title, 'Quiz _id:', quiz._id);
  console.log('[getQuizReviewForStudent] Class students count:', quiz.class?.students?.length);

  // Check if student is enrolled in the class
  const isEnrolled = quiz.class.students.some(
    (sid) => sid.toString() === studentId.toString()
  );

  if (!isEnrolled) {
    console.log('[getQuizReviewForStudent] Student not enrolled in class');
    return res.status(403).json({
      success: false,
      message: "You are not enrolled in this class",
    });
  }

  console.log('[getQuizReviewForStudent] Student is enrolled, looking for submission...');

  // Try multiple lookup strategies
  let submission = null;
  
  // Strategy 1: Use ObjectIds
  submission = await Submission.findOne({
    quiz: quizObjectId,
    student: studentId,
  });
  console.log('[getQuizReviewForStudent] Strategy 1 (ObjectIds):', submission ? 'FOUND' : 'NOT FOUND');
  
  // Strategy 2: Use strings
  if (!submission) {
    submission = await Submission.findOne({
      quiz: id,
      student: studentId.toString(),
    });
    console.log('[getQuizReviewForStudent] Strategy 2 (strings):', submission ? 'FOUND' : 'NOT FOUND');
  }

  // Strategy 3: Raw query with aggregation for debugging
  if (!submission) {
    const allSubmissions = await Submission.find({}).limit(10);
    console.log('[getQuizReviewForStudent] Total submissions in DB:', allSubmissions.length);
    
    const quizSubmissions = await Submission.find({ quiz: quizObjectId });
    console.log('[getQuizReviewForStudent] Submissions for this quiz:', quizSubmissions.length);
    
    if (quizSubmissions.length > 0) {
      console.log('[getQuizReviewForStudent] Sample submission:');
      console.log('  - quiz:', quizSubmissions[0].quiz, 'type:', typeof quizSubmissions[0].quiz);
      console.log('  - student:', quizSubmissions[0].student, 'type:', typeof quizSubmissions[0].student);
      console.log('  - Comparing student IDs:', quizSubmissions[0].student.toString(), '===', studentId.toString(), '=', quizSubmissions[0].student.toString() === studentId.toString());
      
      // Find matching by iterating
      submission = quizSubmissions.find(s => s.student.toString() === studentId.toString());
      console.log('[getQuizReviewForStudent] Strategy 3 (iteration):', submission ? 'FOUND' : 'NOT FOUND');
    }
  }

  console.log('[getQuizReviewForStudent] Final submission found:', submission ? 'YES' : 'NO');
  
  if (submission) {
    console.log('[getQuizReviewForStudent] Submission ID:', submission._id);
    console.log('[getQuizReviewForStudent] Submission quiz ID:', submission.quiz);
    console.log('[getQuizReviewForStudent] Submission student ID:', submission.student);
  }

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found. You must attempt the quiz before viewing the review.",
    });
  }

  // Check if teacher allows results to students
  if (!quiz.showResultsToStudents) {
    console.log('[getQuizReviewForStudent] Results disabled by teacher');
    return res.status(403).json({
      success: false,
      message: "The teacher has disabled result viewing for this quiz",
    });
  }

  // Build response based on permissions
  const responseQuestions = quiz.questions.map((q, idx) => {
    const studentAnswer = submission.answers.find(a => a.questionIndex === idx);
    const selectedOptionIndex = studentAnswer ? studentAnswer.selectedOptionIndex : null;
    const isCorrect = selectedOptionIndex === q.correctOptionIndex;

    const questionData = {
      questionIndex: idx,
      questionText: q.questionText,
      options: q.options,
      selectedOptionIndex,
      isCorrect,
    };

    // Only include correct answer if permission allows
    if (quiz.showCorrectAnswers) {
      questionData.correctOptionIndex = q.correctOptionIndex;
    }

    // Only include explanation if permission allows
    if (quiz.showExplanations && q.explanation) {
      questionData.explanation = q.explanation;
    }

    return questionData;
  });

  console.log('[getQuizReviewForStudent] Returning review data');

  res.json({
    success: true,
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        questionCount: quiz.questions.length,
        showCorrectAnswers: quiz.showCorrectAnswers,
        showExplanations: quiz.showExplanations,
      },
      submission: {
        id: submission._id,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage,
        timeTakenMinutes: submission.timeTakenMinutes,
        submittedAt: submission.submittedAt,
      },
      questions: responseQuestions,
    },
  });
});

module.exports = {
  createQuiz,
  generateQuizWithAI,
  previewQuizWithAI,
  publishQuizFromPreview,
  getQuizzesForClass,
  getQuizById,
  getQuizForAttempt,
  getQuizSubmissions,
  getQuizForTeacher,
  getQuizReviewForStudent,
};
