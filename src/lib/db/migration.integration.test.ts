// @vitest-environment node

import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const migrationUrl = new URL("../../../drizzle/0000_initial.sql", import.meta.url);
const seedUrl = new URL("../../../drizzle/seed.sql", import.meta.url);

describe("database baseline", () => {
  let database: PGlite;

  beforeEach(async () => {
    database = new PGlite();
    const migration = await readFile(migrationUrl, "utf8");
    await database.exec(migration);
  });

  afterEach(async () => {
    await database.close();
  });

  it("applies the text-only seed repeatedly without duplication", async () => {
    const seed = await readFile(seedUrl, "utf8");
    await database.exec(seed);
    await database.exec(seed);

    const result = await database.query<{ content_count: number; candidate_count: number }>(`
      SELECT
        (SELECT count(*)::int FROM contents) AS content_count,
        (SELECT count(*)::int FROM candidates) AS candidate_count
    `);

    expect(result.rows[0]).toEqual({ content_count: 1, candidate_count: 2 });
  });

  it("rejects an invalid content status", async () => {
    const seed = await readFile(seedUrl, "utf8");
    await database.exec(seed);

    await expect(
      database.query(`
        INSERT INTO contents (
          type, status, slug, title, summary, body, category_id
        ) VALUES (
          'vs', 'not-public', 'invalid-status', '잘못된 상태',
          '유효하지 않은 상태가 데이터베이스에서 거부되는지 확인하는 설명입니다.',
          '유효하지 않은 공개 상태는 애플리케이션 검증을 우회하더라도 데이터베이스 열거형 제약에서 반드시 차단되어야 합니다.',
          '10000000-0000-4000-8000-000000000001'
        )
      `),
    ).rejects.toThrow();
  });

  it("rejects a candidate that belongs to another content item", async () => {
    const seed = await readFile(seedUrl, "utf8");
    await database.exec(seed);
    await database.exec(`
      INSERT INTO contents (
        id, type, status, slug, title, summary, body, category_id
      ) VALUES (
        '30000000-0000-4000-8000-000000000002',
        'vs',
        'draft',
        'second-content',
        '두 번째 콘텐츠',
        '복합 외래키가 콘텐츠와 후보의 관계를 올바르게 지키는지 확인하기 위한 설명입니다.',
        '후보는 자신이 등록된 콘텐츠의 투표에서만 선택될 수 있어야 하며 다른 콘텐츠 식별자와 결합될 수 없습니다.',
        '10000000-0000-4000-8000-000000000001'
      );

      INSERT INTO candidates (
        id, content_id, name, rights_status, rights_note, display_order
      ) VALUES (
        '40000000-0000-4000-8000-000000000003',
        '30000000-0000-4000-8000-000000000002',
        '다른 콘텐츠 후보',
        'original',
        'Variety Quiz V2 test copy',
        0
      );

      INSERT INTO vote_sessions (id, token_hash, expires_at)
      VALUES (
        '50000000-0000-4000-8000-000000000002',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        now() + interval '1 day'
      );
    `);

    await expect(
      database.query(`
        INSERT INTO votes (
          content_id, session_id, matchup_key,
          selected_candidate_id, rejected_candidate_id, round_number
        ) VALUES (
          '30000000-0000-4000-8000-000000000001',
          '50000000-0000-4000-8000-000000000002',
          'invalid-cross-content',
          '40000000-0000-4000-8000-000000000003',
          '40000000-0000-4000-8000-000000000001',
          1
        )
      `),
    ).rejects.toThrow();
  });

  it("rejects a duplicate vote for the same session and matchup", async () => {
    const seed = await readFile(seedUrl, "utf8");
    await database.exec(seed);
    await database.exec(`
      INSERT INTO vote_sessions (id, token_hash, expires_at)
      VALUES (
        '50000000-0000-4000-8000-000000000001',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        now() + interval '1 day'
      );

      INSERT INTO votes (
        id, content_id, session_id, matchup_key,
        selected_candidate_id, rejected_candidate_id, round_number
      ) VALUES (
        '60000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
        '50000000-0000-4000-8000-000000000001',
        'vs-main',
        '40000000-0000-4000-8000-000000000001',
        '40000000-0000-4000-8000-000000000002',
        1
      );
    `);

    await expect(
      database.query(`
        INSERT INTO votes (
          content_id, session_id, matchup_key,
          selected_candidate_id, rejected_candidate_id, round_number
        ) VALUES (
          '30000000-0000-4000-8000-000000000001',
          '50000000-0000-4000-8000-000000000001',
          'vs-main',
          '40000000-0000-4000-8000-000000000002',
          '40000000-0000-4000-8000-000000000001',
          1
        )
      `),
    ).rejects.toThrow();
  });
});
