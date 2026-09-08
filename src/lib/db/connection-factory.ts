import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createDatabaseConnection(databaseUrl: string, maxConnections = 1) {
  const sqlClient = postgres(databaseUrl, {
    max: maxConnections,
    prepare: false,
  });

  return {
    sqlClient,
    db: drizzle(sqlClient, { schema }),
  };
}
