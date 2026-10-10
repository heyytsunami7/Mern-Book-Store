const express = require("express");
const { notFoundHandler, errorHandler } = require("./middleware/error");

/**
 * Builds the Express app from injected dependencies. It never connects to a database
 * or opens a port, so tests can import it freely.
 */
function createApp({ config }) {
  const app = express();

  app.set("config", config);
  // "simple" parser: ?category[$ne]=x stays a plain string key instead of becoming an object.
  app.set("query parser", "simple");
  // Vercel sits behind one proxy; needed for correct client IPs in rate limiting.
  if (config.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(express.json({ limit: "100kb" }));

  app.get("/", (req, res) => res.json({ name: "mern-book-store-api", ok: true }));
  // Later commits mount more routers here.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
