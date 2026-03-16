const mongoose = require("mongoose");

const AssignmentSubmissionSchema = new mongoose.Schema(
  {
    // Reference to the assignment being submitted against
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    // Student who submitted
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Stored filename of the submitted file on disk
    file: {
      type: String,
      required: [true, "Submission file is required"],
    },

    // Original name of the uploaded file
    originalFileName: {
      type: String,
      required: true,
    },

    // When the student submitted (defaults to now)
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// One submission per student per assignment
AssignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

/**
 * Check if a student has already submitted for an assignment.
 */
AssignmentSubmissionSchema.statics.hasSubmitted = async function (
  assignmentId,
  studentId
) {
  const count = await this.countDocuments({
    assignment: assignmentId,
    student: studentId,
  });
  return count > 0;
};

module.exports = mongoose.model(
  "AssignmentSubmission",
  AssignmentSubmissionSchema
);
