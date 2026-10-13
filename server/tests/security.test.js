import { describe, it, expect } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers.js";

describe("security middleware", () => {
  const app = makeApp();

  it("sets helmet headers and hides x-powered-by", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("allows configured origins", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("does not add CORS headers for other origins", async () => {
    const res = await request(app).get("/").set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers preflight requests for allowed origins", async () => {
    const res = await request(app)
      .options("/")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});
