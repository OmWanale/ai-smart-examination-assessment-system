const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");

const getFrontendBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return (process.env.FRONTEND_URL || "https://classyn-ai.onrender.com").replace(/\/$/, "");
};

const useHashRouterForFrontend = () =>
  String(process.env.FRONTEND_USE_HASH_ROUTER || "true").toLowerCase() === "true";

const buildFrontendRedirectUrl = (path, params = {}) => {
  const base = getFrontendBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const query = new URLSearchParams(params).toString();

  if (useHashRouterForFrontend()) {
    return `${base}/#${normalizedPath}${query ? `?${query}` : ""}`;
  }

  return `${base}${normalizedPath}${query ? `?${query}` : ""}`;
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email and password
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, password, and name",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Validate role if provided
  if (role && !["student", "teacher"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be either 'student' or 'teacher'",
    });
  }

  // Check if user already exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database error occurred",
    });
  }

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Create user
  let user;
  try {
    user = await User.create({
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      name,
      role: role || "student", // Default to student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    throw error; // Let asyncHandler pass to error middleware
  }

  // Generate token
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  // Find user by credentials
  let user;
  try {
    user = await User.findByCredentials(email, password);
  } catch (error) {
    // Return 401 for authentication failures
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }

  // Validate role if provided - must match stored role
  if (role && role !== user.role) {
    return res.status(401).json({
      success: false,
      message: `This account is registered as a ${user.role}, not a ${role}. Please select the correct role.`,
    });
  }

  // Generate token
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // User is already attached by authenticate middleware
  const user = await User.findById(req.user._id).populate("classes", "name joinCode");

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        classes: user.classes,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    },
  });
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res) => {
  // User is attached by passport
  const user = req.user;

  // Generate token
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  const callbackPath = process.env.FRONTEND_OAUTH_CALLBACK_PATH || "/auth/callback";
  const redirectUrl = buildFrontendRedirectUrl(callbackPath, { token });
  res.redirect(redirectUrl);
});

/**
 * @route   POST /api/auth/register/teacher
 * @desc    Register new teacher
 * @access  Public
 */
const registerTeacher = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, password, and name",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Create teacher user
  const user = await User.create({
    email,
    passwordHash: password,
    name,
    role: "teacher",
  });

  // Generate token with role
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  res.status(201).json({
    success: true,
    message: "Teacher registered successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @route   POST /api/auth/register/student
 * @desc    Register new student
 * @access  Public
 */
const registerStudent = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, password, and name",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  // Create student user
  const user = await User.create({
    email,
    passwordHash: password,
    name,
    role: "student",
  });

  // Generate token with role
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  res.status(201).json({
    success: true,
    message: "Student registered successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    },
  });
});

module.exports = {
  register,
  registerTeacher,
  registerStudent,
  login,
  getMe,
  googleCallback,
  buildFrontendRedirectUrl,
};

