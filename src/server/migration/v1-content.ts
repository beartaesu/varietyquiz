import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { db } from "../../lib/db/client";
import {
  candidates,
  categories,
  contents,
  migrationSourceMaps,
} from "../../lib/db/schema";

type AppDatabase = typeof db;

const rightsStatusSchema = z.enum([
  "original",
  "licensed",
  "permission",
  "public_domain",
  "unknown",
]);

const sourceCandidateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().default(""),
  imageUrl: z.url().startsWith("https://").optional(),
  imageAlt: z.string().trim().min(2).max(240).optional(),
  sourceUrl: z.url().startsWith("https://").optional(),
  rightsStatus: rightsStatusSchema,
  rightsNote: z.string().trim().default(""),
});

const sourceContentSchema = z.object({
  sourceId: z.string().trim().min(1).max(200),
  sourceKind: z.enum(["editorial", "v1-celebrity"]),
  type: z.enum(["vs", "worldcup", "test"]),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(20).max(320),
  body: z.string().trim().min(40),
  categorySlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  candidates: z.array(sourceCandidateSchema).min(2).max(32),
});

type SourceContent = z.infer<typeof sourceContentSchema>;

export interface ReadyMigrationItem {
  status: "ready";
  sourceId: string;
  targetId: string;
  checksum: string;
  content: SourceContent;
  candidates: Array<SourceContent["candidates"][number] & { targetId: string; displayOrder: number }>;
}

export interface RejectedMigrationItem {
  status: "excluded" | "invalid";
  sourceId: string;
  reasons: string[];
}

export interface ContentMigrationPlan {
  sourceSystem: "varietyquiz-v1";
  dryRun: true;
  counts: {
    read: number;
    ready: number;
    excluded: number;
    invalid: number;
  };
  items: Array<ReadyMigrationItem | RejectedMigrationItem>;
  idMap: Record<string, string>;
}

function deterministicUuid(value: string): string {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function policyReasons(content: SourceContent): string[] {
  const reasons: string[] = [];
  if (content.sourceKind === "v1-celebrity") {
    reasons.push("v1-celebrity-rights-review-required");
  }
  if (content.type === "vs" && content.candidates.length !== 2) {
    reasons.push("vs-requires-exactly-2-candidates");
  }
  if (content.type === "worldcup" && ![16, 32].includes(content.candidates.length)) {
    reasons.push("worldcup-requires-16-or-32-candidates");
  }

  content.candidates.forEach((candidate, index) => {
    if (candidate.rightsStatus === "unknown") {
      reasons.push(`candidate-${index + 1}-rights-unverified`);
    }
    if (candidate.rightsStatus !== "unknown" && candidate.rightsNote.length < 4) {
      reasons.push(`candidate-${index + 1}-rights-note-required`);
    }
    if (candidate.imageUrl && (!candidate.imageAlt || !candidate.sourceUrl)) {
      reasons.push(`candidate-${index + 1}-image-metadata-incomplete`);
    }
  });

  return reasons;
}

export function planV1ContentMigration(input: unknown): ContentMigrationPlan {
  if (!Array.isArray(input)) throw new Error("Migration input must be a JSON array.");

  const items: ContentMigrationPlan["items"] = input.map((rawItem, index) => {
    const parsed = sourceContentSchema.safeParse(rawItem);
    if (!parsed.success) {
      const sourceId =
        typeof rawItem === "object" && rawItem !== null && "sourceId" in rawItem
          ? String(rawItem.sourceId)
          : `row-${index + 1}`;
      return {
        status: "invalid" as const,
        sourceId,
        reasons: parsed.error.issues.map((issue) => `${issue.path.join(".") || "item"}: ${issue.message}`),
      };
    }

    const reasons = policyReasons(parsed.data);
    if (reasons.length > 0) {
      return { status: "excluded" as const, sourceId: parsed.data.sourceId, reasons };
    }

    const targetId = deterministicUuid(`content:${parsed.data.sourceId}`);
    return {
      status: "ready" as const,
      sourceId: parsed.data.sourceId,
      targetId,
      checksum: checksum(parsed.data),
      content: parsed.data,
      candidates: parsed.data.candidates.map((candidate, candidateIndex) => ({
        ...candidate,
        targetId: deterministicUuid(`candidate:${parsed.data.sourceId}:${candidateIndex}`),
        displayOrder: candidateIndex,
      })),
    };
  });

  const readyItems = items.filter((item): item is ReadyMigrationItem => item.status === "ready");
  return {
    sourceSystem: "varietyquiz-v1",
    dryRun: true,
    counts: {
      read: input.length,
      ready: readyItems.length,
      excluded: items.filter((item) => item.status === "excluded").length,
      invalid: items.filter((item) => item.status === "invalid").length,
    },
    items,
    idMap: Object.fromEntries(readyItems.map((item) => [item.sourceId, item.targetId])),
  };
}

export async function applyV1ContentMigration(database: AppDatabase, plan: ContentMigrationPlan) {
  const readyItems = plan.items.filter((item): item is ReadyMigrationItem => item.status === "ready");
  let applied = 0;
  let skipped = 0;

  for (const item of readyItems) {
    const result = await database.transaction(async (transaction) => {
      const existing = await transaction
        .select({ targetId: migrationSourceMaps.targetId, checksum: migrationSourceMaps.checksum })
        .from(migrationSourceMaps)
        .where(
          and(
            eq(migrationSourceMaps.sourceSystem, plan.sourceSystem),
            eq(migrationSourceMaps.sourceId, item.sourceId),
            eq(migrationSourceMaps.entityType, "content"),
          ),
        )
        .limit(1);
      if (existing[0]) {
        if (existing[0].checksum !== item.checksum) {
          throw new Error(`Source changed after migration: ${item.sourceId}`);
        }
        return "skipped" as const;
      }

      const category = await transaction
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, item.content.categorySlug))
        .limit(1);
      if (!category[0]) throw new Error(`Category not found: ${item.content.categorySlug}`);

      await transaction.insert(contents).values({
        id: item.targetId,
        type: item.content.type,
        status: "draft",
        slug: item.content.slug,
        title: item.content.title,
        summary: item.content.summary,
        body: item.content.body,
        categoryId: category[0].id,
        adEligible: false,
      });
      await transaction.insert(candidates).values(
        item.candidates.map((candidate) => ({
          id: candidate.targetId,
          contentId: item.targetId,
          name: candidate.name,
          description: candidate.description,
          imageUrl: candidate.imageUrl,
          imageAlt: candidate.imageAlt,
          sourceUrl: candidate.sourceUrl,
          rightsStatus: candidate.rightsStatus,
          rightsNote: candidate.rightsNote,
          displayOrder: candidate.displayOrder,
        })),
      );
      await transaction.insert(migrationSourceMaps).values({
        sourceSystem: plan.sourceSystem,
        sourceId: item.sourceId,
        entityType: "content",
        targetId: item.targetId,
        checksum: item.checksum,
      });
      return "applied" as const;
    });

    if (result === "applied") applied += 1;
    else skipped += 1;
  }

  return { attempted: readyItems.length, applied, skipped };
}
