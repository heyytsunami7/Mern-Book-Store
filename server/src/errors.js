const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code=ErrorCodes.INTERNAL_ERROR] - Machine-readable error code
   * @param {any} [details=null] - Additional error details (e.g., validation field errors)
   */
  constructor(message, statusCode = 500, code = ErrorCodes.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Marks expected operational errors vs unhandled bugs

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Bad Request", details = null) {
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

  static validation(message = "Validation error", details = null) {
    return new AppError(message, 422, ErrorCodes.VALIDATION_ERROR, details);
  }

  static internal(message = "Internal server error", details = null) {
    return new AppError(message, 500, ErrorCodes.INTERNAL_ERROR, details);
  }
}

module.exports = {
  AppError,
  ErrorCodes,
};
