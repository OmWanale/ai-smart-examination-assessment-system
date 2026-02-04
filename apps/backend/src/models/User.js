const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      required: [true, "Role is required"],
      default: "student",
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  // Only hash if password is modified or new
  if (!this.isModified("passwordHash")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to sanitize user object (remove sensitive data)
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.__v;
  return user;
};

// Static method to find by credentials
UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+passwordHash");
  
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.passwordHash) {
    throw new Error("Please login with Google");
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

module.exports = mongoose.model("User", UserSchema);
