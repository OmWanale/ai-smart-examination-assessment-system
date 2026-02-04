const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [100, "Class name cannot exceed 100 characters"],
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
      match: [/^[A-Z0-9]{6}$/, "Join code must be 6 alphanumeric characters"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
      index: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ClassSchema.index({ teacher: 1, createdAt: -1 });
ClassSchema.index({ students: 1 });

// Virtual for student count
ClassSchema.virtual("studentCount").get(function () {
  return this.students ? this.students.length : 0;
});

// Virtual for quiz count
ClassSchema.virtual("quizCount").get(function () {
  return this.quizzes ? this.quizzes.length : 0;
});

// Method to check if user is teacher
ClassSchema.methods.isTeacher = function (userId) {
  if (!this.teacher) return false;
  // Handle both ObjectId and populated teacher object
  const teacherId = this.teacher._id || this.teacher;
  return teacherId.toString() === userId.toString();
};

// Method to check if user is student
ClassSchema.methods.isStudent = function (userId) {
  return this.students.some((student) => {
    // Handle both ObjectId and populated student object
    const studentId = student._id || student;
    return studentId.toString() === userId.toString();
  });
};

// Method to add student
ClassSchema.methods.addStudent = async function (userId) {
  if (this.isStudent(userId)) {
    throw new Error("User is already enrolled in this class");
  }
  
  this.students.push(userId);
  await this.save();
  return this;
};

// Enable virtuals in JSON
ClassSchema.set("toJSON", { virtuals: true });
ClassSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Class", ClassSchema);
