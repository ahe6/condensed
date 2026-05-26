import { spawnSync } from "node:child_process";
import "dotenv/config";

function databaseUrlFromEnv() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_SECRET_JSON, DB_HOST, DB_PORT = "5432", DB_NAME = "tele" } = process.env;

  if (!DB_SECRET_JSON || !DB_HOST) {
    throw new Error("Set DATABASE_URL, or set DB_SECRET_JSON and DB_HOST.");
  }

  const secret = JSON.parse(DB_SECRET_JSON);
  const username = encodeURIComponent(secret.username);
  const password = encodeURIComponent(secret.password);

  return `postgresql://${username}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
}

process.env.DATABASE_URL = databaseUrlFromEnv();

const result = spawnSync("prisma", ["migrate", "deploy"], {
  env: process.env,
  stdio: "inherit",
  shell: true
});

process.exit(result.status ?? 1);
