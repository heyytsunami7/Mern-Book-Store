const rateLimit = require("express-rate-limit");
const { AppError } = require("../errors");

const passthrough = (req, res, next) => next();

function build(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next) => next(AppError.rateLimited()),
  });
}

/**
 * Two limiters:
 *   global: applied to every route
 *   strict: apply to sensitive routes (checkout, later phases)
 * Counters are per server instance, which is fine for a demo on Vercel.
 * Disabled in the test environment so tests never trip over them.
 */
function createLimiters(config) {
  if (config.NODE_ENV === "test") return { global: passthrough, strict: passthrough };
  const fifteenMinutes = 15 * 60 * 1000;
  return { global: build(fifteenMinutes, 300), strict: build(fifteenMinutes, 30) };
}

module.exports = { createLimiters };
