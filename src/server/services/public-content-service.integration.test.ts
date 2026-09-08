// @vitest-environment node

import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { db as productionDatabase } from "../../lib/db/client";
import * as schema from "../../lib/db/schema";
import { createPublicContentRepository } from "../repositories/public-content-repository";
import { createPublicContentService } from "./public-content-service";

const migrationUrl = new URL("../../../drizzle/0000_initial.sql", import.meta.url);
const seedUrl = new URL("../../../drizzle/seed.sql", import.meta.url);

describe("public content service", () => {
  let client: PGlite;
  let service: ReturnType<typeof createPublicContentService>;

  beforeEach(async () => {
    client = new PGlite();
    await client.exec(await readFile(migrationUrl, "utf8"));
    await client.exec(await readFile(seedUrl, "utf8"));
    const testDatabase = drizzle(client, { schema });
    const repository = createPublicContentRepository(
      testDatabase as unknown as typeof productionDatabase,
    );
    service = createPublicContentService(repository);
  });

  afterEach(async () => {
    await client.close();
  });

  it("returns only published content with bounded pagination", async () => {
    await client.exec(`
      INSERT INTO contents (
        id, type, status, slug, title, summary, body, category_id
      ) VALUES (
        '30000000-0000-4000-8000-000000000099', 'vs', 'draft', 'hidden-draft',
        '공개되지 않은 초안', '공개 목록에서 초안이 제외되는지 확인하기 위한 충분한 길이의 요약입니다.',
        '이 초안은 데이터베이스에는 존재하지만 공개 상태가 아니므로 어떠한 공개 읽기 결과에서도 반환되면 안 됩니다.',
        '10000000-0000-4000-8000-000000000001'
      );
    `);

    const result = await service.list({ page: "1", pageSize: "1", sort: "newest" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe("weekend-plan-vs");
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 1, pageCount: 1 });
    expect(result.items[0]).not.toHaveProperty("body");
  });

  it("filters by category and tag", async () => {
    const byCategory = await service.list({ category: "daily-life" });
    const byTag = await service.list({ tag: "weekend" });
    const missingTag = await service.list({ tag: "does-not-exist" });

    expect(byCategory.items).toHaveLength(1);
    expect(byTag.items).toHaveLength(1);
    expect(missingTag.items).toHaveLength(0);
  });

  it("sorts by publication time and returns stable pages", async () => {
    await client.exec(`
      INSERT INTO contents (
        id, type, status, slug, title, summary, body, category_id, published_at
      ) VALUES
      (
        '30000000-0000-4000-8000-000000000097', 'vs', 'published', 'older-choice',
        '조금 오래된 선택', '시간순 정렬과 페이지 이동을 확인하기 위한 오래된 공개 콘텐츠의 충분한 요약입니다.',
        '이 콘텐츠는 기준 시드보다 먼저 공개된 항목이며 공개 시각을 기준으로 안정적으로 뒤쪽에 정렬되어야 합니다.',
        '10000000-0000-4000-8000-000000000001', '2026-01-01T00:00:00Z'
      ),
      (
        '30000000-0000-4000-8000-000000000098', 'vs', 'published', 'newer-choice',
        '가장 새로운 선택', '시간순 정렬과 페이지 이동을 확인하기 위한 새로운 공개 콘텐츠의 충분한 요약입니다.',
        '이 콘텐츠는 기준 시드보다 나중에 공개된 항목이며 공개 시각을 기준으로 안정적으로 첫 번째에 정렬되어야 합니다.',
        '10000000-0000-4000-8000-000000000001', '2026-12-01T00:00:00Z'
      );
    `);

    const firstPage = await service.list({ page: 1, pageSize: 2, sort: "newest" });
    const secondPage = await service.list({ page: 2, pageSize: 2, sort: "newest" });

    expect(firstPage.items.map((item) => item.slug)).toEqual(["newer-choice", "weekend-plan-vs"]);
    expect(secondPage.items.map((item) => item.slug)).toEqual(["older-choice"]);
    expect(firstPage.pagination).toEqual({ page: 1, pageSize: 2, total: 3, pageCount: 2 });
  });

  it("returns a minimal public detail DTO with ordered candidates", async () => {
    const result = await service.getBySlug("weekend-plan-vs");

    expect(result?.candidates.map((candidate) => candidate.name)).toEqual([
      "새로운 곳으로 떠나기",
      "익숙한 곳에서 쉬기",
    ]);
    expect(result?.tags.map((tag) => tag.slug).sort()).toEqual(["lifestyle", "weekend"]);
    expect(result?.candidates[0]).not.toHaveProperty("rightsNote");
    expect(result).not.toHaveProperty("adEligible");
  });

  it("does not expose drafts by slug and rejects malformed filters", async () => {
    await expect(service.list({ pageSize: 500 })).rejects.toThrow();
    await expect(service.getBySlug("../admin")).rejects.toThrow();
    await expect(service.getBySlug("missing-content")).resolves.toBeNull();
  });
});
