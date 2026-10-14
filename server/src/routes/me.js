const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

module.exports = function meRouter({ getDb, auth }) {
  const router = express.Router();

  // Creates the user document on first call, updates lastSeenAt on every call.
  router.get(
    "/me",
    auth.verifyToken,
    asyncHandler(async (req, res) => {
      const db = await getDb();
      const now = new Date();
      const { uid, email, name } = req.user;

      await db
        .collection("users")
        .updateOne(
          { firebaseUid: uid },
          { $set: { email, name, lastSeenAt: now }, $setOnInsert: { createdAt: now } },
          { upsert: true },
        );

      res.json({ uid, email, name, isAdmin: auth.isAdminUser(req.user) });
    }),
  );

  return router;
};
