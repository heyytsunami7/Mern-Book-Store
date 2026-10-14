import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { startTestDb, makeApp, bearer } from "./helpers.js";

let ctx;
let app;

beforeAll(async () => {
  ctx = await startTestDb();
  app = makeApp({ db: ctx.db });
}, 120000);

afterAll(async () => {
  if (ctx) await ctx.stop();
});

beforeEach(async () => {
  await ctx.db.collection("users").deleteMany({});
});

describe("GET /me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 for an invalid token", async () => {
    const res = await request(app).get("/me").set(bearer("nobody"));
    expect(res.status).toBe(401);
  });

  it("returns isAdmin false for a normal user and creates the user document", async () => {
    const res = await request(app).get("/me").set(bearer("alice"));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uid: "u-alice", email: "alice@example.com", isAdmin: false });

    const doc = await ctx.db.collection("users").findOne({ firebaseUid: "u-alice" });
    expect(doc.email).toBe("alice@example.com");
    expect(doc.createdAt).toBeInstanceOf(Date);
  });

  it("does not duplicate the user on later calls and keeps createdAt", async () => {
    await request(app).get("/me").set(bearer("alice"));
    const first = await ctx.db.collection("users").findOne({ firebaseUid: "u-alice" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await request(app).get("/me").set(bearer("alice"));

    const users = await ctx.db.collection("users").find({ firebaseUid: "u-alice" }).toArray();
    expect(users).toHaveLength(1);
    expect(users[0].createdAt.getTime()).toBe(first.createdAt.getTime());
    expect(users[0].lastSeenAt.getTime()).toBeGreaterThan(first.lastSeenAt.getTime());
  });

  it("returns isAdmin true for a verified email in ADMIN_EMAILS", async () => {
    const res = await request(app).get("/me").set(bearer("admin"));
    expect(res.body.isAdmin).toBe(true);
  });

  it("returns isAdmin false when the admin email is not verified", async () => {
    const res = await request(app).get("/me").set(bearer("adminUnverified"));
    expect(res.body.isAdmin).toBe(false);
  });

  it("returns isAdmin false for everyone when ADMIN_EMAILS is empty", async () => {
    const emptyApp = makeApp({ db: ctx.db, adminEmails: "" });
    const res = await request(emptyApp).get("/me").set(bearer("admin"));
    expect(res.body.isAdmin).toBe(false);
  });
});
