require("dotenv").config();
const { z } = require("zod");

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z
    .string({ message: "MONGODB_URI is required" })
    .min(1, "MONGODB_URI is required"),
  DB_NAME: z
    .string({ message: "DB_NAME is required" })
    .min(1, "DB_NAME is required"),
  CORS_ORIGINS: z
    .union([z.string(), z.array(z.string())])
    .default("http://localhost:5173")
    .transform((val) => {
      const list = Array.isArray(val) ? val : val.split(",");
      return list.map((item) => item.trim()).filter(Boolean);
    }),
  ADMIN_EMAILS: z
    .union([z.string(), z.array(z.string())])
    .default("")
    .transform((val) => {
      const list = Array.isArray(val) ? val : val.split(",");
      return list.map((email) => email.trim().toLowerCase()).filter(Boolean);
    }),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

function formatZodErrors(error) {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "config"}: ${issue.message}`)
    .join("\n");
}

function parseConfig(env = process.env) {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw new Error(
      `Invalid environment configuration:\n${formattedErrors}\nPlease check your .env file or environment variables.`
    );
  }
  return result.data;
}

// Parse configuration from process.env and fail fast on startup if invalid
const config = parseConfig(process.env);

module.exports = config;
module.exports.config = config;
module.exports.configSchema = configSchema;
module.exports.parseConfig = parseConfig;
