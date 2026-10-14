const express = require("express");

module.exports = function healthRouter({ getDb }) {
  const router = express.Router();

  router.get("/health", async (req, res) => {
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      res.json({ ok: true, db: true });
    } catch (err) {
      if (req.log) req.log.error({ err }, "Health check failed");
      res.status(503).json({ ok: false, db: false });
    }
  });

  return router;
};
