const { AppError } = require("../errors");

function toDetails(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * validate({ params, query, body }) where each value is a Zod schema.
 * On success, req.params / req.query / req.body are replaced with the parsed values
 * (so coercions and defaults apply). On failure, responds through the central error
 * handler with VALIDATION_ERROR and a details array.
 */
function validate(schemas) {
  return (req, res, next) => {
    const details = [];
    const parsed = {};

    for (const key of ["params", "query", "body"]) {
      if (!schemas[key]) continue;
      // Copy query into a normal object (the simple query parser can return a null-prototype object).
      const input = key === "query" ? { ...req.query } : req[key];
      const result = schemas[key].safeParse(input);
      if (result.success) parsed[key] = result.data;
      else details.push(...toDetails(result.error));
    }

    if (details.length > 0) return next(AppError.validation("Invalid request", details));

    Object.assign(req, parsed);
    return next();
  };
}

module.exports = { validate };
