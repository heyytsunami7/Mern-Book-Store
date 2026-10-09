const { AppError, ErrorCodes } = require("../errors");

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}

function normalizeError(err) {
  if (err instanceof AppError) return err;

  // body-parser errors
  if (err && err.type === "entity.too.large") {
    return new AppError("Request body is too large", 413, ErrorCodes.BAD_REQUEST);
  }
  if (
    err &&
    (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400))
  ) {
    return AppError.badRequest("Malformed JSON in request body");
  }
  // MongoDB duplicate key
  if (err && err.code === 11000) {
    return AppError.conflict("A record with these values already exists");
  }
  return null; // unexpected
}

// Must keep four parameters so Express treats it as an error handler.
function errorHandler(err, req, res, _next) {
  if (res.headersSent) return _next(err);

  const isProd = req.app.get("config")?.NODE_ENV === "production";
  let appError = normalizeError(err);

  if (!appError) {
    if (req.log) req.log.error({ err }, "Unhandled error");
    else console.error(err);
    appError = AppError.internal(
      isProd ? "Internal server error" : err?.message || "Internal server error",
    );
  }

  const body = { error: { code: appError.code, message: appError.message } };
  if (appError.details) body.error.details = appError.details;
  return res.status(appError.statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
