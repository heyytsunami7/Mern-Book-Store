const { MongoClient, ServerApiVersion } = require("mongodb");

/**
 * Every index the app needs, by collection. Adding an index later means adding a line here.
 * The users index has no explicit name on purpose: it keeps the default name (firebaseUid_1)
 * that earlier versions of this file created, so existing databases do not conflict.
 */
const INDEXES = {
  users: [{ key: { firebaseUid: 1 }, unique: true }],
  books: [
    {
      key: { isbn: 1 },
      name: "isbn_unique",
      unique: true,
      // Only books that have an ISBN take part, so hand-added books without one never collide.
      partialFilterExpression: { isbn: { $type: "string" } },
    },
    {
      key: { "source.provider": 1, "source.externalId": 1 },
      name: "source_unique",
      unique: true,
      // Makes re-running the seed safe. Manual books have no externalId and are not indexed.
      partialFilterExpression: { "source.externalId": { $type: "string" } },
    },
    {
      key: { title: "text", authors: "text", description: "text" },
      name: "books_text",
      weights: { title: 10, authors: 5, description: 1 },
    },
    { key: { category: 1, pricePaise: 1 }, name: "category_price" },
    { key: { isActive: 1, createdAt: -1 }, name: "active_created" },
    { key: { isFeatured: 1 }, name: "featured" },
  ],
  carts: [{ key: { userUid: 1 }, name: "userUid_unique", unique: true }],
  orders: [
    { key: { orderNumber: 1 }, name: "orderNumber_unique", unique: true },
    { key: { userUid: 1, createdAt: -1 }, name: "user_created" },
    { key: { status: 1, expiresAt: 1 }, name: "status_expires" },
    { key: { "items.bookId": 1 }, name: "items_bookId" },
    {
      key: { "payment.razorpayOrderId": 1 },
      name: "razorpayOrderId_unique",
      unique: true,
      sparse: true, // orders without a Razorpay order id are allowed to repeat
    },
  ],
};

/**
 * Create the indexes the app needs. Safe to run repeatedly.
 */
async function ensureIndexes(db) {
  for (const [collection, specs] of Object.entries(INDEXES)) {
    await db.collection(collection).createIndexes(specs);
  }
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

module.exports = { createDbGetter, ensureIndexes, INDEXES };
