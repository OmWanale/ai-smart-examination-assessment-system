const { verifyToken, extractTokenFromHeader } = require("../utils/jwt");
const User = require("../models/User");

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
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
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
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${roles.join(" or ")} role.`,
      });
    }

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
