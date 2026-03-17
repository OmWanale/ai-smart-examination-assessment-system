const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher ID is required"],
    },
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["LIVE", "UPCOMING", "ENDED"],
      default: "UPCOMING",
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for join link
lectureSchema.virtual("joinLink").get(function () {
  return `/lecture/${this.roomId}`;
});

// Ensure virtuals are included in JSON
lectureSchema.set("toJSON", { virtuals: true });
lectureSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Lecture", lectureSchema);
