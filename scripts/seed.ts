import { readFile } from "node:fs/promises";

import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and set it first.");
}

const seedSql = await readFile(new URL("../drizzle/seed.sql", import.meta.url), "utf8");
const client = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await client.begin(async (transaction) => {
    await transaction.unsafe(seedSql);
  });
  console.log("Development seed applied successfully.");
} finally {
  await client.end();
}
