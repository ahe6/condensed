import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(scriptDir, "..");
const rootDir = resolve(backendDir, "..", "..");

loadEnv({ path: resolve(rootDir, ".env") });
loadEnv({ override: true, path: resolve(backendDir, ".env") });

export function databaseUrlFromEnv() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_SECRET_JSON, DB_HOST, DB_PORT = "5432", DB_NAME = "health" } = process.env;

  if (!DB_SECRET_JSON || !DB_HOST) {
    throw new Error("Set DATABASE_URL, or set DB_SECRET_JSON and DB_HOST.");
  }

  const secret = JSON.parse(DB_SECRET_JSON);
  const username = encodeURIComponent(secret.username);
  const password = encodeURIComponent(secret.password);
  const host = DB_HOST;
  const port = encodeURIComponent(DB_PORT);
  const database = encodeURIComponent(DB_NAME);

  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

export async function createPrismaClient() {
  process.env.DATABASE_URL = databaseUrlFromEnv();
  const { PrismaClient } = await import("@prisma/client");

  return new PrismaClient();
}
