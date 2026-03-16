const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
  {
    // Title of the assignment
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Detailed description / instructions
    description: {
      type: String,
      required: [true, "Assignment description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Deadline for student submissions
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    // Optional file uploaded by the teacher (stored filename on disk)
    file: {
      type: String,
      default: null,
    },

    // Original name of the uploaded file (for download UX)
    originalFileName: {
      type: String,
      default: null,
    },

    // Teacher who created this assignment
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for sorting assignments by newest first
AssignmentSchema.index({ createdAt: -1 });

/**
 * Check if the given userId is the creator of this assignment.
 */
AssignmentSchema.methods.isCreator = function (userId) {
  return this.createdBy.toString() === userId.toString();
};

module.exports = mongoose.model("Assignment", AssignmentSchema);
