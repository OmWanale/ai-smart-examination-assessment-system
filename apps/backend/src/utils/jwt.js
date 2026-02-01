const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role (student/teacher)
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  const { id, role, email } = payload;

  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d", // Token expires in 7 days
    }
  );
};

/**
 * Generate refresh token (longer expiration)
 * @param {Object} payload - User data
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  const { id } = payload;

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d", // Refresh token expires in 30 days
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
};

/**
 * Decode token without verification (useful for expired tokens)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
};
