import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";

import {
  applyV1ContentMigration,
  planV1ContentMigration,
} from "../src/server/migration/v1-content";

function optionValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const defaultInput = resolve(process.cwd(), "data/migration-samples/v1-content.sample.json");
  const inputPath = resolve(optionValue("--input") ?? defaultInput);
  const reportPath = optionValue("--report");
  const input = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
  const plan = planV1ContentMigration(input);

  const printable = {
    mode: apply ? "apply" : "dry-run",
    input: inputPath,
    counts: plan.counts,
    idMap: plan.idMap,
    rejected: plan.items
      .filter((item) => item.status !== "ready")
      .map((item) => ({ sourceId: item.sourceId, status: item.status, reasons: item.reasons })),
  };

  console.log(JSON.stringify(printable, null, 2));

  if (reportPath) {
    await writeFile(resolve(reportPath), `${JSON.stringify(printable, null, 2)}\n`, "utf8");
  }

  if (!apply) {
    console.log("Dry-run only. No database rows were written. Pass --apply to persist ready items as drafts.");
    return;
  }

  loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required when --apply is used.");
  const { createDatabaseConnection } = await import("../src/lib/db/connection-factory");
  const { db, sqlClient } = createDatabaseConnection(databaseUrl);
  try {
    const result = await applyV1ContentMigration(db, plan);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await sqlClient.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
