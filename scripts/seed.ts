import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

async function main() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and set it first.");
  }

  const seedSql = await readFile(resolve(process.cwd(), "drizzle/seed.sql"), "utf8");
  const client = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    await client.begin(async (transaction) => {
      await transaction.unsafe(seedSql);
    });
    console.log("Development seed applied successfully.");
  } finally {
    await client.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
