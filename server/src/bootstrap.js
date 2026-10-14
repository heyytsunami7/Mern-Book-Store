const { parseConfig } = require("./config");
const { createApp } = require("./app");
const { createDbGetter } = require("./db");
const { createFirebaseVerifier } = require("./services/firebase");

// Builds the real app (real config, real database, real Firebase).
// Used by server.js (local) and index.js (Vercel).
function buildApp() {
  require("dotenv").config();
  const config = parseConfig(process.env);

  if (config.ADMIN_EMAILS.length === 0) {
    console.warn("ADMIN_EMAILS is empty: all admin routes will return 403. Set it in .env.");
  }

  const getDb = createDbGetter({ uri: config.MONGODB_URI, dbName: config.DB_NAME });
  const verifyIdToken = createFirebaseVerifier(config.FIREBASE_SERVICE_ACCOUNT_KEY);
  const app = createApp({ config, getDb, verifyIdToken });

  return { app, config, getDb };
}

module.exports = { buildApp };
