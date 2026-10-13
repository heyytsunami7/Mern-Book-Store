import { createRequire } from "node:module";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

// The server source is CommonJS, so load it with require.
const require = createRequire(import.meta.url);
const { createApp } = require("../src/app");
const { parseConfig } = require("../src/config");
const { ensureIndexes } = require("../src/db");

// Fake Firebase tokens: the token string is just a key into this table.
export const TOKENS = {
  alice: { uid: "u-alice", email: "alice@example.com", email_verified: true, name: "Alice" },
  admin: { uid: "u-admin", email: "boss@example.com", email_verified: true, name: "Boss" },
  adminUnverified: {
    uid: "u-admin-2",
    email: "boss@example.com",
    email_verified: false,
    name: "Boss",
  },
};

export const bearer = (tokenName) => ({ Authorization: `Bearer ${tokenName}` });

export function makeApp({ db = null, adminEmails = "boss@example.com" } = {}) {
  const config = parseConfig({
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://unused",
    DB_NAME: "bookstore_test",
    ADMIN_EMAILS: adminEmails,
    CORS_ORIGINS: "http://localhost:5173",
  });
  const getDb = async () => {
    if (!db) throw new Error("No test database was provided");
    return db;
  };
  const verifyIdToken = async (token) => {
    const user = TOKENS[token];
    if (!user) throw new Error("invalid token");
    return user;
  };
  return createApp({ config, getDb, verifyIdToken });
}

export async function startTestDb() {
  const mongod = await MongoMemoryServer.create();
  const client = await MongoClient.connect(mongod.getUri());
  const db = client.db("bookstore_test");
  await ensureIndexes(db);
  return {
    db,
    async stop() {
      await client.close();
      await mongod.stop();
    },
  };
}
