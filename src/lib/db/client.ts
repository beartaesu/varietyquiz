import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database access.");
}

const globalForDatabase = globalThis as unknown as {
  varietyQuizSql?: ReturnType<typeof postgres>;
};

export const sqlClient =
  globalForDatabase.varietyQuizSql ??
  postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.varietyQuizSql = sqlClient;
}

export const db = drizzle(sqlClient, { schema });
