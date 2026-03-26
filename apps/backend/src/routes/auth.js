const express = require("express");
const passport = require("passport");
const {
  register,
  registerTeacher,
  registerStudent,
  login,
  getMe,
  googleCallback,
  buildFrontendRedirectUrl,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (legacy - accepts role in body)
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/register/teacher
 * @desc    Register new teacher
 * @access  Public
 */
router.post("/register/teacher", registerTeacher);

/**
 * @route   POST /api/auth/register/student
 * @desc    Register new student
 * @access  Public
 */
router.post("/register/student", registerStudent);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, getMe);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get("/google", (req, res, next) => {
  const requestedRole = req.query?.role === "teacher" ? "teacher" : "student";

  // Check if Google strategy is configured
  if (!req.app.get("googleStrategyConfigured")) {
    const mockUser = encodeURIComponent(
      JSON.stringify({
        email: `test-${requestedRole}@gmail.com`,
        googleId: `mock-google-id-${Date.now()}`,
        name: `Mock Google ${requestedRole === "teacher" ? "Teacher" : "Student"}`,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        role: requestedRole,
      })
    );
    return res.redirect(`/api/auth/google/mock-callback?user=${mockUser}`);
  }

  const origin = req.query?.origin || '';
  const state = JSON.stringify({ role: requestedRole, origin });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    session: false,
    state,
  })(req, res, next);
});

/**
 * @route   GET /api/auth/google/mock-callback
 * @desc    Mock Google OAuth callback for development
 * @access  Public
 */
router.get("/google/mock-callback", async (req, res, next) => {
  try {
    const mockProfile = JSON.parse(decodeURIComponent(req.query.user || "{}"));
    const User = require("../models/User");
    const { generateToken } = require("../utils/jwt");
    const { buildFrontendRedirectUrl } = require("../controllers/authController");

    let user = await User.findOne({ email: mockProfile.email });
    if (!user) {
      user = await User.create({
        email: mockProfile.email,
        googleId: mockProfile.googleId,
        name: mockProfile.name,
        avatar: mockProfile.avatar,
        isEmailVerified: true,
        role: mockProfile.role,
      });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    const callbackPath = process.env.FRONTEND_OAUTH_CALLBACK_PATH || "/auth/callback";
    const redirectUrl = buildFrontendRedirectUrl(callbackPath, { token });
    return res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err || !user) {
        const errorMessage =
          info?.message ||
          (err?.message ? `Google authentication failed: ${err.message}` : "google_auth_failed");
        const redirectUrl = buildFrontendRedirectUrl("/login", { error: errorMessage });
        return res.redirect(redirectUrl);
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
