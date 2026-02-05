const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: function (arr) {
          return arr.length >= 2 && arr.length <= 6;
        },
        message: "Must have between 2 and 6 options",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: [true, "Correct option index is required"],
      validate: {
        validator: function (val) {
          return val >= 0 && val < this.options.length;
        },
        message: "Correct option index must be valid",
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: [true, "Difficulty level is required"],
      default: "medium",
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [180, "Duration cannot exceed 180 minutes"],
    },
    questions: {
      type: [QuestionSchema],
      required: [true, "Questions are required"],
      validate: {
        validator: function (arr) {
          return arr.length >= 1 && arr.length <= 50;
        },
        message: "Must have between 1 and 50 questions",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    showExplanations: {
      type: Boolean,
      default: true,
    },
    showResultsToStudents: {
      type: Boolean,
      default: true,
    },
    totalMarks: {
      type: Number,
      default: function () {
        return this.questions.length;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
QuizSchema.index({ class: 1, createdAt: -1 });
QuizSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for question count
QuizSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

// Method to check if quiz is created by user
QuizSchema.methods.isCreator = function (userId) {
  return this.createdBy.toString() === userId.toString();
};

// Method to calculate score for submission
QuizSchema.methods.calculateScore = function (answers) {
  let correctCount = 0;

  answers.forEach((answer) => {
    const question = this.questions[answer.questionIndex];
    if (question && answer.selectedOptionIndex === question.correctOptionIndex) {
      correctCount++;
    }
  });

  return {
    score: correctCount,
    totalQuestions: this.questions.length,
    percentage: (correctCount / this.questions.length) * 100,
  };
};

// Enable virtuals in JSON
QuizSchema.set("toJSON", { virtuals: true });
QuizSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Quiz", QuizSchema);
