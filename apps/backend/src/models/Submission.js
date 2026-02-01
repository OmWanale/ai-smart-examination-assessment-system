const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: [true, "Question index is required"],
    },
    selectedOptionIndex: {
      type: Number,
      required: [true, "Selected option is required"],
    },
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz is required"],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
      index: true,
    },
    answers: {
      type: [AnswerSchema],
      required: [true, "Answers are required"],
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: [true, "Total questions is required"],
    },
    percentage: {
      type: Number,
      required: [true, "Percentage is required"],
      min: 0,
      max: 100,
    },
    timeTakenMinutes: {
      type: Number,
      min: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one submission per student per quiz
SubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

// Index for leaderboard queries
SubmissionSchema.index({ quiz: 1, score: -1, submittedAt: 1 });

// Method to check if submission belongs to user
SubmissionSchema.methods.isOwner = function (userId) {
  return this.student.toString() === userId.toString();
};

// Static method to check if student already submitted
SubmissionSchema.statics.hasSubmitted = async function (quizId, studentId) {
  const submission = await this.findOne({ quiz: quizId, student: studentId });
  return !!submission;
};

// Static method to get leaderboard for a quiz
SubmissionSchema.statics.getLeaderboard = async function (quizId, limit = 10) {
  return this.find({ quiz: quizId })
    .populate("student", "name email avatar")
    .sort({ score: -1, submittedAt: 1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model("Submission", SubmissionSchema);
