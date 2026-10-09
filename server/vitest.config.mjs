import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 120000, // the first run downloads a MongoDB binary
  },
});
