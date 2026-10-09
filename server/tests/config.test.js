import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseConfig } = require("../src/config");

describe("parseConfig", () => {
  it("throws a readable error when required variables are missing", () => {
    expect(() => parseConfig({})).toThrow(/MONGODB_URI/);
    expect(() => parseConfig({ MONGODB_URI: "x" })).toThrow(/DB_NAME/);
  });

  it("parses lists, trims, and lowercases admin emails", () => {
    const config = parseConfig({
      MONGODB_URI: "x",
      DB_NAME: "d",
      ADMIN_EMAILS: " A@x.com, b@x.com ,",
      CORS_ORIGINS: "http://a.com, http://b.com",
    });
    expect(config.ADMIN_EMAILS).toEqual(["a@x.com", "b@x.com"]);
    expect(config.CORS_ORIGINS).toEqual(["http://a.com", "http://b.com"]);
    expect(config.PORT).toBe(3001);
    expect(config.NODE_ENV).toBe("development");
  });

  it("treats a missing or empty ADMIN_EMAILS as an empty list", () => {
    expect(parseConfig({ MONGODB_URI: "x", DB_NAME: "d" }).ADMIN_EMAILS).toEqual([]);
    expect(parseConfig({ MONGODB_URI: "x", DB_NAME: "d", ADMIN_EMAILS: "" }).ADMIN_EMAILS).toEqual(
      [],
    );
  });
});
