import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import { startTestDb } from "./helpers.js";

const require = createRequire(import.meta.url);
const { ensureIndexes } = require("../src/db");

let ctx;

beforeAll(async () => {
  ctx = await startTestDb();
}, 120000);

afterAll(async () => {
  if (ctx) await ctx.stop();
});

describe("ensureIndexes", () => {
  it("creates a unique index on users.firebaseUid", async () => {
    const users = ctx.db.collection("users");
    await users.insertOne({ firebaseUid: "dup" });
    await expect(users.insertOne({ firebaseUid: "dup" })).rejects.toThrow(/duplicate key/i);
  });

  it("can run more than once without errors", async () => {
    await expect(ensureIndexes(ctx.db)).resolves.toBeUndefined();
    await expect(ensureIndexes(ctx.db)).resolves.toBeUndefined();
  });
});
