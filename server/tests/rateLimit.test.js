import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createLimiters } = require("../src/middleware/rateLimit");
const { errorHandler } = require("../src/middleware/error");

function buildApp(nodeEnv, which) {
  const limiters = createLimiters({ NODE_ENV: nodeEnv });
  const app = express();
  app.get("/ping", limiters[which], (req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe("rate limiters", () => {
  it("are disabled in the test environment", async () => {
    const app = buildApp("test", "strict");
    for (let i = 0; i < 40; i += 1) {
      const res = await request(app).get("/ping");
      expect(res.status).toBe(200);
    }
  });

  it("strict limiter blocks the 31st request with RATE_LIMITED", async () => {
    const app = buildApp("development", "strict");
    for (let i = 0; i < 30; i += 1) {
      const res = await request(app).get("/ping");
      expect(res.status).toBe(200);
    }
    const blocked = await request(app).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
