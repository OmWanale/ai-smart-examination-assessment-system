/**
 * Wrapper to catch async errors in route handlers
 * Eliminates need for try-catch in every controller
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // async code here
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
