import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const c = require("../src/constants");

describe("constants", () => {
  it("has ten unique categories", () => {
    expect(c.CATEGORIES).toHaveLength(10);
    expect(new Set(c.CATEGORIES).size).toBe(10);
  });

  it("keeps money amounts as positive integers (paise)", () => {
    for (const value of [c.SHIPPING_FLAT_PAISE, c.FREE_SHIPPING_THRESHOLD_PAISE]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it("charges shipping only below the free-shipping threshold", () => {
    expect(c.SHIPPING_FLAT_PAISE).toBeLessThan(c.FREE_SHIPPING_THRESHOLD_PAISE);
  });

  it("starts the order lifecycle at pending_payment", () => {
    expect(c.ORDER_STATUSES[0]).toBe("pending_payment");
    expect(c.ORDER_STATUSES).toContain("cancelled");
  });

  it("freezes the lists so they cannot change at runtime", () => {
    expect(Object.isFrozen(c.CATEGORIES)).toBe(true);
    expect(Object.isFrozen(c.ORDER_STATUSES)).toBe(true);
  });
});
