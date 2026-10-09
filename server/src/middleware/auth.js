const { AppError } = require("../errors");
const { asyncHandler } = require("./asyncHandler");

/**
 * createAuth({ verifyIdToken, adminEmails }) returns { verifyToken, isAdminUser }.
 * verifyIdToken is injected: real Firebase Admin in production, a fake in tests.
 * Admin = verified email that is listed in adminEmails. An empty list means nobody is admin.
 */
function createAuth({ verifyIdToken, adminEmails }) {
  const admins = (adminEmails || []).map((e) => e.toLowerCase());

  const verifyToken = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) throw AppError.unauthorized("Missing or invalid Authorization header");

    let decoded;
    try {
      decoded = await verifyIdToken(token);
    } catch {
      throw AppError.unauthorized("Invalid or expired token");
    }

    req.user = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase(),
      name: decoded.name || "",
      emailVerified: decoded.email_verified === true,
    };
    next();
  });

  const isAdminUser = (user) =>
    admins.length > 0 && user.emailVerified === true && admins.includes(user.email);

  return { verifyToken, isAdminUser };
}

module.exports = { createAuth };
