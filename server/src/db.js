const { MongoClient, ServerApiVersion } = require("mongodb");

/**
 * Create the indexes the app needs. Safe to run repeatedly.
 * Phase 1 only needs the users index; Phase 2 adds the rest.
 */
async function ensureIndexes(db) {
  await db.collection("users").createIndex({ firebaseUid: 1 }, { unique: true });
}

/**
 * Returns a getDb() function that connects once and reuses the same connection.
 * The promise is cached in this closure, so on Vercel every request handled by the
 * same warm instance shares one connection. A failed connect is not cached.
 */
function createDbGetter({ uri, dbName }) {
  let dbPromise = null;

  return function getDb() {
    if (!dbPromise) {
      // Stable API "strict" mode is intentionally off: it can reject operations
      // we use later (for example text search). Turn it on only if tests pass with it.
      const client = new MongoClient(uri, {
        serverApi: { version: ServerApiVersion.v1, deprecationErrors: true },
      });
      dbPromise = client
        .connect()
        .then(async (connected) => {
          const db = connected.db(dbName);
          await ensureIndexes(db);
          return db;
        })
        .catch((err) => {
          dbPromise = null;
          throw err;
        });
    }
    return dbPromise;
  };
}

module.exports = { createDbGetter, ensureIndexes };