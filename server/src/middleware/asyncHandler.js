// Wraps an async route handler so rejected promises reach the central error handler.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
