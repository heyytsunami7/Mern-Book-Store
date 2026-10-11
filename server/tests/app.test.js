import { describe, it, expect } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers.js";

describe("app basics", () => {
  const app = makeApp();

  it("GET / returns a small JSON banner", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("unknown routes return 404 in the standard error shape", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(typeof res.body.error.message).toBe("string");
  });

  it("malformed JSON returns 400", async () => {
    const res = await request(app)
      .post("/anything")
      .set("Content-Type", "application/json")
      .send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("bodies over 100kb return 413", async () => {
    const res = await request(app)
      .post("/anything")
      .send({ data: "x".repeat(200000) });
    expect(res.status).toBe(413);
  });
});
