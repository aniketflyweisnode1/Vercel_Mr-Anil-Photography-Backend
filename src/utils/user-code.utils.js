/**
 * Generate a random user code with letters (A-Z) and numbers (0-9)
 * @param {number} length - Length of the user code (default: 8)
 * @returns {string} - Generated user code
 */
const generateUserCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Generate a unique user code and check if it exists in the database
 * @param {Object} model - Mongoose model to check for existing codes
 * @param {string} fieldName - Field name to check for uniqueness (default: 'user_code')
 * @param {number} length - Length of the user code (default: 8)
 * @param {number} maxAttempts - Maximum attempts to generate unique code (default: 10)
 * @returns {Promise<string>} - Generated unique user code
 */
const generateUniqueUserCode = async (model, fieldName = 'user_code', length = 8, maxAttempts = 10) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const userCode = generateUserCode(length);
    
    // Check if the code already exists
    const existingUser = await model.findOne({ [fieldName]: userCode });
    
    if (!existingUser) {
      return userCode;
    }
    
    attempts++;
  }
  
  // If we couldn't generate a unique code within max attempts, throw an error
  throw new Error(`Unable to generate unique user code after ${maxAttempts} attempts`);
};

/**
 * Generate a user code with specific pattern
 * @param {string} pattern - Pattern for the code (e.g., 'LLNNNN' for 2 letters + 4 numbers)
 * @returns {string} - Generated user code following the pattern
 */
const generateUserCodeWithPattern = (pattern = 'LLNNNN') => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    
    if (char === 'L') {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    } else if (char === 'N') {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    } else {
      result += char; // Keep any other characters as is
    }
  }
  
  return result;
};

/**
 * Generate a unique user code with specific pattern
 * @param {Object} model - Mongoose model to check for existing codes
 * @param {string} pattern - Pattern for the code (e.g., 'LLNNNN' for 2 letters + 4 numbers)
 * @param {string} fieldName - Field name to check for uniqueness (default: 'user_code')
 * @param {number} maxAttempts - Maximum attempts to generate unique code (default: 10)
 * @returns {Promise<string>} - Generated unique user code following the pattern
 */
const generateUniqueUserCodeWithPattern = async (model, pattern = 'LLNNNN', fieldName = 'user_code', maxAttempts = 10) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const userCode = generateUserCodeWithPattern(pattern);
    
    // Check if the code already exists
    const existingUser = await model.findOne({ [fieldName]: userCode });
    
    if (!existingUser) {
      return userCode;
    }
    
    attempts++;
  }
  
  // If we couldn't generate a unique code within max attempts, throw an error
  throw new Error(`Unable to generate unique user code with pattern ${pattern} after ${maxAttempts} attempts`);
};

module.exports = {
  generateUserCode,
  generateUniqueUserCode,
  generateUserCodeWithPattern,
  generateUniqueUserCodeWithPattern
}; 