const crypto = require("crypto");

/**
 * Generate a unique 6-character alphanumeric join code
 * Format: XXXXXX (uppercase letters and numbers)
 * Excludes confusing characters: 0, O, I, 1, L
 */
const generateJoinCode = () => {
  // Characters that are easy to read and distinguish
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  return code;
};

/**
 * Generate a unique join code that doesn't exist in database
 * @param {Model} ClassModel - Mongoose Class model
 * @returns {Promise<string>} Unique join code
 */
const generateUniqueJoinCode = async (ClassModel) => {
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateJoinCode();
    
    // Check if code already exists
    const existingClass = await ClassModel.findOne({ joinCode: code });
    
    if (!existingClass) {
      return code;
    }
    
    attempts++;
  }

  // If we couldn't generate unique code after max attempts, throw error
  throw new Error("Failed to generate unique join code. Please try again.");
};

/**
 * Validate join code format
 * @param {string} code - Join code to validate
 * @returns {boolean} True if valid
 */
const isValidJoinCode = (code) => {
  if (!code || typeof code !== "string") {
    return false;
  }
  
  // Must be exactly 6 alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
};

module.exports = {
  generateJoinCode,
  generateUniqueJoinCode,
  isValidJoinCode,
};
