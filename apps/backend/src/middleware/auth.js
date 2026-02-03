const { verifyToken, extractTokenFromHeader } = require("../utils/jwt");
const User = require("../models/User");
const mongoose = require("mongoose");

// ============================================
// DEV AUTH BYPASS – REMOVE BEFORE PROD
// Allow mock token in development for frontend testing
// ============================================
const DEV_BYPASS_TOKEN = 'DEV_FAKE_JWT_TOKEN';
const DEV_MOCK_USER_ID = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Valid ObjectId
const DEV_MOCK_USER = {
  _id: DEV_MOCK_USER_ID,
  id: DEV_MOCK_USER_ID.toString(),
  name: 'Demo Teacher',
  email: 'demo@teacher.com',
  role: 'teacher',
  isEmailVerified: true,
  createdAt: new Date(),
  toObject: function() { return this; }
};
// ============================================

/**
 * Middleware to authenticate JWT token
 * Attaches user object to req.user if valid
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header or cookie
    let token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log('[AUTH] No token provided in request');
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // DEV AUTH BYPASS – REMOVE BEFORE PROD
    // Accept mock token in development mode (check dynamically)
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log('[AUTH] Checking token:', token.substring(0, 20) + '...');
    console.log('[AUTH] NODE_ENV:', process.env.NODE_ENV);
    console.log('[AUTH] isDevelopment:', isDevelopment);
    
    if (isDevelopment && token === DEV_BYPASS_TOKEN) {
      console.log('[DEV BYPASS] Mock token accepted - bypassing JWT verification');
      req.user = DEV_MOCK_USER;
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      console.log('[AUTH] Token valid but user not found:', decoded.id);
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    // Attach user to request
    console.log('[AUTH] User authenticated:', { id: user._id, email: user.email, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('[AUTH] Authorization failed: No user in request');
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('[AUTH] Authorization failed: User role', req.user.role, 'not in', roles);
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${roles.join(" or ")} role.`,
      });
    }

    console.log('[AUTH] Authorization passed:', req.user.role, 'in', roles);
    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid
 * but doesn't fail if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
