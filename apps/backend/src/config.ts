import { config as loadEnv } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const moduleDir = dirname(fileURLToPath(import.meta.url));

loadEnv({
  path: join(moduleDir, "../../..", ".env")
});
loadEnv({
  path: join(moduleDir, "..", ".env"),
  override: true
});

const dbSecretSchema = z.object({
  username: z.string(),
  password: z.string()
});

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DB_SECRET_JSON: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("tele"),
  COGNITO_ISSUER: z.string().url().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info")
});

const env = envSchema.parse(process.env);

function buildDatabaseUrl() {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (!env.DB_SECRET_JSON || !env.DB_HOST) {
    throw new Error("Set DATABASE_URL, or set DB_SECRET_JSON and DB_HOST.");
  }

  const secret = dbSecretSchema.parse(JSON.parse(env.DB_SECRET_JSON));
  const username = encodeURIComponent(secret.username);
  const password = encodeURIComponent(secret.password);

  return `postgresql://${username}:${password}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?schema=public`;
}

export const config = {
  ...env,
  DATABASE_URL: buildDatabaseUrl()
};

process.env.DATABASE_URL = config.DATABASE_URL;
