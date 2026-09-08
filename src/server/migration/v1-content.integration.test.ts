// @vitest-environment node

import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { db as productionDatabase } from "../../lib/db/client";
import * as schema from "../../lib/db/schema";
import { applyV1ContentMigration, planV1ContentMigration } from "./v1-content";

const firstMigrationUrl = new URL("../../../drizzle/0000_initial.sql", import.meta.url);
const secondMigrationUrl = new URL("../../../drizzle/0001_content_migration_map.sql", import.meta.url);
const seedUrl = new URL("../../../drizzle/seed.sql", import.meta.url);
const sampleUrl = new URL("../../../data/migration-samples/v1-content.sample.json", import.meta.url);

describe("V1 content migration", () => {
  let client: PGlite;
  let database: typeof productionDatabase;
  let sample: unknown;

  beforeEach(async () => {
    client = new PGlite();
    await client.exec(await readFile(firstMigrationUrl, "utf8"));
    await client.exec(await readFile(secondMigrationUrl, "utf8"));
    await client.exec(await readFile(seedUrl, "utf8"));
    database = drizzle(client, { schema }) as unknown as typeof productionDatabase;
    sample = JSON.parse(await readFile(sampleUrl, "utf8")) as unknown;
  });

  afterEach(async () => {
    await client.close();
  });

  it("reports ready, excluded and invalid records with deterministic IDs", () => {
    const first = planV1ContentMigration(sample);
    const second = planV1ContentMigration(sample);

    expect(first.counts).toEqual({ read: 3, ready: 1, excluded: 1, invalid: 1 });
    expect(first.idMap).toEqual(second.idMap);
    expect(first.items).toContainEqual(
      expect.objectContaining({
        sourceId: "legacy-celebrity-example",
        status: "excluded",
        reasons: expect.arrayContaining(["v1-celebrity-rights-review-required"]),
      }),
    );
  });

  it("applies ready records as drafts and skips them on a repeated run", async () => {
    const plan = planV1ContentMigration(sample);

    await expect(applyV1ContentMigration(database, plan)).resolves.toEqual({
      attempted: 1,
      applied: 1,
      skipped: 0,
    });
    await expect(applyV1ContentMigration(database, plan)).resolves.toEqual({
      attempted: 1,
      applied: 0,
      skipped: 1,
    });

    const migrated = await client.query<{ status: string; count: number }>(`
      SELECT min(status::text) AS status, count(*)::int AS count
      FROM contents
      WHERE id = '${plan.idMap["editorial-weekend-balance"]}'
    `);
    expect(migrated.rows[0]).toEqual({ status: "draft", count: 1 });
  });

  it("stops when an already migrated source changes", async () => {
    const firstPlan = planV1ContentMigration(sample);
    await applyV1ContentMigration(database, firstPlan);

    const changedSample = structuredClone(sample) as Array<Record<string, unknown>>;
    changedSample[0].title = "변경된 원본 제목";
    const changedPlan = planV1ContentMigration(changedSample);

    await expect(applyV1ContentMigration(database, changedPlan)).rejects.toThrow(
      "Source changed after migration: editorial-weekend-balance",
    );
  });
});
