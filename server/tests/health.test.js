import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { startTestDb, makeApp } from "./helpers.js";

let ctx;

beforeAll(async () => {
  ctx = await startTestDb();
}, 120000);

afterAll(async () => {
  if (ctx) await ctx.stop();
});

describe("GET /health", () => {
  it("returns ok with a database ping", async () => {
    const app = makeApp({ db: ctx.db });
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true });
  });

  it("returns 503 when the database is unavailable", async () => {
    const app = makeApp({ db: null });
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, db: false });
  });
});
