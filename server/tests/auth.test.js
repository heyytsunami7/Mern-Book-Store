import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAuth } = require("../src/middleware/auth");
const { errorHandler } = require("../src/middleware/error");

const USERS = {
  alice: { uid: "u1", email: "Alice@Example.com", email_verified: true, name: "Alice" },
  boss: { uid: "u2", email: "boss@example.com", email_verified: true, name: "Boss" },
  bossUnverified: { uid: "u3", email: "boss@example.com", email_verified: false },
};

const verifyIdToken = async (token) => {
  if (!USERS[token]) throw new Error("bad token");
  return USERS[token];
};

function buildApp(adminEmails) {
  const auth = createAuth({ verifyIdToken, adminEmails });
  const app = express();
  app.get("/whoami", auth.verifyToken, (req, res) => {
    res.json({ user: req.user, isAdmin: auth.isAdminUser(req.user) });
  });
  app.get("/admin", auth.verifyToken, auth.requireAdmin, (req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe("verifyToken", () => {
  const app = buildApp(["boss@example.com"]);

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await request(app).get("/whoami");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when the scheme is not Bearer", async () => {
    const res = await request(app).get("/whoami").set("Authorization", "Token alice");
    expect(res.status).toBe(401);
  });

  it("returns 401 for an invalid token", async () => {
    const res = await request(app).get("/whoami").set("Authorization", "Bearer nobody");
    expect(res.status).toBe(401);
  });

  it("attaches a normalized user for a valid token", async () => {
    const res = await request(app).get("/whoami").set("Authorization", "Bearer alice");
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      uid: "u1",
      email: "alice@example.com",
      name: "Alice",
      emailVerified: true,
    });
    expect(res.body.isAdmin).toBe(false);
  });
});
