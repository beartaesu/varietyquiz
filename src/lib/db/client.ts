import "server-only";

import { createDatabaseConnection } from "./connection-factory";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database access.");
}

type DatabaseConnection = ReturnType<typeof createDatabaseConnection>;
const globalForDatabase = globalThis as unknown as {
  varietyQuizConnection?: DatabaseConnection;
};

const connection =
  globalForDatabase.varietyQuizConnection ??
  createDatabaseConnection(databaseUrl, process.env.NODE_ENV === "production" ? 10 : 1);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.varietyQuizConnection = connection;
}

export const { db, sqlClient } = connection;
