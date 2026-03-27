const Submission = require("../models/Submission");
const Quiz = require("../models/Quiz");
const Class = require("../models/Class");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @route   POST /api/submissions
 * @desc    Submit quiz (student only, one attempt)
 * @access  Private/Student
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId, answers, timeTakenMinutes } = req.body;
  const studentId = req.user._id;

  console.log('[submitQuiz] Request received');
  console.log('[submitQuiz] Quiz ID:', quizId);
  console.log('[submitQuiz] Student ID:', studentId);
  console.log('[submitQuiz] Answers count:', answers?.length);

  // Validation
  if (!quizId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: "Quiz ID and answers array are required",
    });
  }

  // Check if quiz exists
  const quiz = await Quiz.findById(quizId).populate("class", "students");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  if (!quiz.isActive) {
    return res.status(400).json({
      success: false,
      message: "This quiz is no longer active",
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

  // Check if student already submitted
  const hasSubmitted = await Submission.hasSubmitted(quizId, req.user._id);

  if (hasSubmitted) {
    return res.status(400).json({
      success: false,
      message: "You have already submitted this quiz",
    });
  }

  // Validate answers
  if (answers.length !== quiz.questions.length) {
    return res.status(400).json({
      success: false,
      message: `Expected ${quiz.questions.length} answers, got ${answers.length}`,
    });
  }

  // Validate each answer
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    if (
      answer.questionIndex === undefined ||
      answer.selectedOptionIndex === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: `Answer ${i + 1} is missing required fields`,
      });
    }

    const question = quiz.questions[answer.questionIndex];
    if (!question) {
      return res.status(400).json({
        success: false,
        message: `Invalid question index in answer ${i + 1}`,
      });
    }

    if (
      answer.selectedOptionIndex < 0 ||
      answer.selectedOptionIndex >= question.options.length
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid option index in answer ${i + 1}`,
      });
    }
  }

  // Calculate score
  const scoreData = quiz.calculateScore(answers);

  // Create submission
  const submission = await Submission.create({
    quiz: quizId,
    student: req.user._id,
    answers,
    score: scoreData.score,
    totalQuestions: scoreData.totalQuestions,
    percentage: scoreData.percentage,
    timeTakenMinutes: timeTakenMinutes || null,
    submittedAt: new Date(),
  });

  console.log('[submitQuiz] Submission created successfully');
  console.log('[submitQuiz] Submission ID:', submission._id);
  console.log('[submitQuiz] Stored Quiz ID:', submission.quiz);
  console.log('[submitQuiz] Stored Student ID:', submission.student);

  // Populate student info
  await submission.populate("student", "name email");

  res.status(201).json({
    success: true,
    message: "Quiz submitted successfully",
    data: {
      submission: {
        id: submission._id,
        quiz: submission.quiz,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage.toFixed(2),
        timeTakenMinutes: submission.timeTakenMinutes,
        submittedAt: submission.submittedAt,
      },
    },
  });
});

/**
 * @route   GET /api/submissions/quiz/:quizId/leaderboard
 * @desc    Get leaderboard for a quiz
 * @access  Private (teacher or enrolled student)
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  // Check if quiz exists
  const quiz = await Quiz.findById(quizId).populate("class", "teacher students");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  const isTeacher = quiz.class.teacher.toString() === req.user._id.toString();
  const isStudent = quiz.class.students.some(
    (studentId) => studentId.toString() === req.user._id.toString()
  );

  if (!isTeacher && !isStudent) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this quiz",
    });
  }

  if (isStudent && !quiz.showResultsToStudents) {
    return res.status(403).json({
      success: false,
      message: "The teacher has disabled leaderboard access for this quiz",
    });
  }

  // Get leaderboard
  const leaderboard = await Submission.getLeaderboard(quizId, limit);

  res.json({
    success: true,
    count: leaderboard.length,
    data: {
      leaderboard: leaderboard.map((submission, index) => ({
        rank: index + 1,
        student: submission.student,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage.toFixed(2),
        timeTakenMinutes: submission.timeTakenMinutes,
        submittedAt: submission.submittedAt,
      })),
    },
  });
});

/**
 * @route   GET /api/submissions/quiz/:quizId
 * @desc    Get all submissions for a quiz (teacher only)
 * @access  Private/Teacher
 */
const getSubmissionsForQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  // Check if quiz exists and user is teacher
  const quiz = await Quiz.findById(quizId).populate("class", "teacher");

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
  }

  if (quiz.class.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only the teacher can view all submissions",
    });
  }

  // Get all submissions
  const submissions = await Submission.find({ quiz: quizId })
    .populate("student", "name email avatar")
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  res.json({
    success: true,
    count: submissions.length,
    data: {
      submissions: submissions.map((submission) => ({
        id: submission._id,
        student: submission.student,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage.toFixed(2),
        timeTakenMinutes: submission.timeTakenMinutes,
        submittedAt: submission.submittedAt,
      })),
    },
  });
});

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission details
 * @access  Private (student owner or teacher)
 */
const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await Submission.findById(id)
    .populate("student", "name email avatar")
    .populate("quiz", "title questions class");

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found",
    });
  }

  // Populate class to check teacher
  await submission.quiz.populate("class", "teacher");

  // Debug logging
  const studentId = submission.student._id || submission.student;
  console.log('getSubmissionById: checking access', {
    submissionStudentId: studentId.toString(),
    requestUserId: req.user._id.toString(),
    studentMatch: studentId.toString() === req.user._id.toString(),
    teacherId: submission.quiz.class.teacher.toString(),
  });

  const isOwner = studentId.toString() === req.user._id.toString();
  const isTeacher =
    submission.quiz.class.teacher.toString() === req.user._id.toString();

  if (!isOwner && !isTeacher) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this submission",
    });
  }

  // Build detailed response with correct/incorrect answers
  const detailedAnswers = submission.answers.map((answer) => {
    const question = submission.quiz.questions[answer.questionIndex];
    const isCorrect =
      answer.selectedOptionIndex === question.correctOptionIndex;

    return {
      questionIndex: answer.questionIndex,
      questionText: question.questionText,
      options: question.options,
      selectedOptionIndex: answer.selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect,
    };
  });

  res.json({
    success: true,
    data: {
      submission: {
        id: submission._id,
        quiz: {
          id: submission.quiz._id,
          title: submission.quiz.title,
        },
        student: submission.student,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentage.toFixed(2),
        timeTakenMinutes: submission.timeTakenMinutes,
        submittedAt: submission.submittedAt,
        answers: detailedAnswers,
      },
    },
  });
});

/**
 * @route   GET /api/submissions/student
 * @desc    Get all submissions for the current student
 * @access  Private/Student
 */
const getStudentSubmissions = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const submissions = await Submission.find({ student: studentId })
    .populate("quiz", "title class totalQuestions")
    .populate({
      path: "quiz",
      populate: { path: "class", select: "name" },
    })
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    success: true,
    count: submissions.length,
    data: {
      submissions: submissions.map((s) => ({
        id: s._id,
        quiz: {
          id: s.quiz?._id,
          title: s.quiz?.title || "Unknown Quiz",
          className: s.quiz?.class?.name || "Unknown Class",
        },
        score: s.score,
        totalQuestions: s.totalQuestions,
        percentage: s.percentage ? s.percentage.toFixed(2) : "0.00",
        timeTakenMinutes: s.timeTakenMinutes,
        submittedAt: s.submittedAt,
      })),
    },
  });
});

module.exports = {
  submitQuiz,
  getLeaderboard,
  getSubmissionsForQuiz,
  getSubmissionById,
  getStudentSubmissions,
};
