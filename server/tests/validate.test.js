import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validate } = require("../src/middleware/validate");
const { errorHandler } = require("../src/middleware/error");

function buildApp() {
  const app = express();
  app.set("query parser", "simple"); // same setting as createApp
  app.use(express.json());

  app.get(
    "/items",
    validate({
      query: z.strictObject({
        category: z.enum(["Fiction", "Mystery"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
      }),
    }),
    (req, res) => res.json(req.query),
  );

  app.post("/items", validate({ body: z.strictObject({ title: z.string().min(1) }) }), (req, res) =>
    res.json(req.body),
  );

  app.use(errorHandler);
  return app;
}

describe("validate middleware", () => {
  const app = buildApp();

  it("coerces and applies defaults", async () => {
    const res = await request(app).get("/items?category=Fiction&page=2");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ category: "Fiction", page: 2 });

    const defaults = await request(app).get("/items");
    expect(defaults.body).toEqual({ page: 1 });
  });

  it("rejects values outside the allowed list with VALIDATION_ERROR and details", async () => {
    const res = await request(app).get("/items?category=Horror");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].path).toBe("category");
  });

  it("rejects operator injection like ?category[$ne]=Fiction", async () => {
    const res = await request(app).get("/items?category[$ne]=Fiction");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects repeated query keys for a single-value field", async () => {
    const res = await request(app).get("/items?category=Fiction&category=Mystery");
    expect(res.status).toBe(400);
  });

  it("rejects unknown body fields and reports missing ones", async () => {
    const unknown = await request(app).post("/items").send({ title: "x", extra: 1 });
    expect(unknown.status).toBe(400);

    const missing = await request(app).post("/items").send({});
    expect(missing.status).toBe(400);
    expect(missing.body.error.details.some((d) => d.path === "title")).toBe(true);

    const ok = await request(app).post("/items").send({ title: "Dune" });
    expect(ok.status).toBe(200);
  });
});
