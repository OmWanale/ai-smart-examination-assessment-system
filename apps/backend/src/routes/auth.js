const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  getMe,
  googleCallback,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post("/register", register);

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
  // Check if Google strategy is configured
  if (!req.app.get("googleStrategyConfigured")) {
    return res.status(501).json({
      success: false,
      message: "Google OAuth is not configured. Please use email/password login.",
    });
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/login?error=google_auth_failed",
  }),
  googleCallback
);

module.exports = router;
