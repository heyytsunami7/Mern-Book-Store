const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  RATE_LIMITED: "RATE_LIMITED",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

class AppError extends Error {
  /**
   * @param {string} message - Human-readable message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code=ErrorCodes.INTERNAL_ERROR] - Machine-readable code
   * @param {any} [details=null] - Extra details (for example field errors)
   */
  constructor(message, statusCode = 500, code = ErrorCodes.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details = null) {
    return new AppError(message, 400, ErrorCodes.BAD_REQUEST, details);
  }
  static unauthorized(message = "Unauthorized", details = null) {
    return new AppError(message, 401, ErrorCodes.UNAUTHORIZED, details);
  }
  static forbidden(message = "Forbidden", details = null) {
    return new AppError(message, 403, ErrorCodes.FORBIDDEN, details);
  }
  static notFound(message = "Resource not found", details = null) {
    return new AppError(message, 404, ErrorCodes.NOT_FOUND, details);
  }
  static conflict(message = "Resource conflict", details = null) {
    return new AppError(message, 409, ErrorCodes.CONFLICT, details);
  }
  static validation(message = "Invalid request", details = null) {
    return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
  }
  static outOfStock(message = "Not enough stock", details = null) {
    return new AppError(message, 409, ErrorCodes.OUT_OF_STOCK, details);
  }
  static rateLimited(message = "Too many requests, please try again later", details = null) {
    return new AppError(message, 429, ErrorCodes.RATE_LIMITED, details);
  }
  static payment(message = "Payment provider error", details = null) {
    return new AppError(message, 502, ErrorCodes.PAYMENT_ERROR, details);
  }
  static internal(message = "Internal server error", details = null) {
    return new AppError(message, 500, ErrorCodes.INTERNAL_ERROR, details);
  }
}

module.exports = { AppError, ErrorCodes };