const { MongoClient, ServerApiVersion } = require("mongodb");
const config = require("./config");

// Module-level variables to cache the MongoClient and its connection promise
// This prevents connection exhaustion across serverless function invocations (e.g., Vercel)
let client = null;
let clientPromise = null;

/**
 * Connect to MongoDB and cache the connection promise.
 * Subsequent calls return the existing promise.
 * @param {string} [uri=config.MONGODB_URI]
 * @param {object} [options={}]
 * @returns {Promise<MongoClient>}
 */
function connect(uri = config.MONGODB_URI, options = {}) {
  if (!clientPromise) {
    const mongoOptions = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      ...options,
    };

    client = new MongoClient(uri, mongoOptions);
    clientPromise = client.connect().catch((err) => {
      // Clear cached promise on failure so subsequent requests can retry
      client = null;
      clientPromise = null;
      throw err;
    });
  }

  return clientPromise;
}

/**
 * Returns the MongoDB Database instance using the cached connection.
 * @param {string} [dbName=config.DB_NAME]
 * @returns {Promise<import("mongodb").Db>}
 */
async function getDb(dbName = config.DB_NAME) {
  const connectedClient = await connect();
  return connectedClient.db(dbName);
}

/**
 * Ensures required database indexes exist on startup or migration.
 * @returns {Promise<void>}
 */
async function ensureIndexes() {
  const db = await getDb();
  await db.collection("books").createIndex({ category: 1 });
}

/**
 * Gracefully close the MongoDB client and reset connection state.
 * @returns {Promise<void>}
 */
async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
  }
}

module.exports = {
  connect,
  getDb,
  ensureIndexes,
  closeDb,
};
