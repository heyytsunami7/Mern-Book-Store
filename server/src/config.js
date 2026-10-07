const { z } = require("zod");

const csv = (transform) =>
  z
    .union([z.string(), z.array(z.string())])
    .default("")
    .transform((val) => {
      const list = Array.isArray(val) ? val : val.split(",");
      return list.map(transform).filter(Boolean);
    });

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string({ message: "MONGODB_URI is required" }).min(1, "MONGODB_URI is required"),
  DB_NAME: z.string({ message: "DB_NAME is required" }).min(1, "DB_NAME is required"),
  CORS_ORIGINS: z
    .union([z.string(), z.array(z.string())])
    .default("http://localhost:5173")
    .transform((val) => {
      const list = Array.isArray(val) ? val : val.split(",");
      return list.map((item) => item.trim()).filter(Boolean);
    }),
  ADMIN_EMAILS: csv((email) => email.trim().toLowerCase()),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

function formatZodErrors(error) {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "config"}: ${issue.message}`)
    .join("\n");
}

// Pure function: no side effects at import time. Entry points (server.js, index.js)
// call it with process.env; tests call it with their own values.
function parseConfig(env = process.env) {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatZodErrors(result.error)}\n` +
        "Please check your .env file or environment variables.",
    );
  }
  return result.data;
}

module.exports = { parseConfig, configSchema };