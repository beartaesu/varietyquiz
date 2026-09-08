import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import type { db } from "../../lib/db/client";
import {
  candidates,
  categories,
  contentTags,
  contents,
  tags,
} from "../../lib/db/schema";

type AppDatabase = typeof db;

export type PublicContentSort = "newest" | "oldest" | "title";

export interface PublicContentListQuery {
  page: number;
  pageSize: number;
  sort: PublicContentSort;
  categorySlug?: string;
  tagSlug?: string;
}

export interface PublicContentRecord {
  id: string;
  type: "vs" | "worldcup" | "test";
  slug: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: Date;
  category: {
    slug: string;
    name: string;
  };
}

export interface PublicCandidateRecord {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
  displayOrder: number;
}

export interface PublicContentDetailRecord extends PublicContentRecord {
  candidates: PublicCandidateRecord[];
  tags: Array<{ slug: string; name: string }>;
}

export interface PublicContentRepository {
  listPublished(query: PublicContentListQuery): Promise<{
    items: PublicContentRecord[];
    total: number;
  }>;
  findPublishedBySlug(slug: string): Promise<PublicContentDetailRecord | null>;
}

function tagExistsCondition(tagSlug: string): SQL {
  return sql`exists (
    select 1
    from ${contentTags}
    inner join ${tags} on ${tags.id} = ${contentTags.tagId}
    where ${contentTags.contentId} = ${contents.id}
      and ${tags.slug} = ${tagSlug}
  )`;
}

export function createPublicContentRepository(database: AppDatabase): PublicContentRepository {
  return {
    async listPublished(query) {
      const filters: SQL[] = [eq(contents.status, "published")];
      if (query.categorySlug) filters.push(eq(categories.slug, query.categorySlug));
      if (query.tagSlug) filters.push(tagExistsCondition(query.tagSlug));

      const orderBy =
        query.sort === "oldest"
          ? [asc(contents.publishedAt), asc(contents.id)]
          : query.sort === "title"
            ? [asc(contents.title), asc(contents.id)]
            : [desc(contents.publishedAt), desc(contents.id)];

      const baseSelection = {
        id: contents.id,
        type: contents.type,
        slug: contents.slug,
        title: contents.title,
        summary: contents.summary,
        body: contents.body,
        publishedAt: contents.publishedAt,
        categorySlug: categories.slug,
        categoryName: categories.name,
      };

      const [rows, countRows] = await Promise.all([
        database
          .select(baseSelection)
          .from(contents)
          .innerJoin(categories, eq(categories.id, contents.categoryId))
          .where(and(...filters))
          .orderBy(...orderBy)
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        database
          .select({ count: sql<number>`count(*)::int` })
          .from(contents)
          .innerJoin(categories, eq(categories.id, contents.categoryId))
          .where(and(...filters)),
      ]);

      return {
        items: rows.map((row) => ({
          id: row.id,
          type: row.type,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          body: row.body,
          publishedAt: row.publishedAt!,
          category: { slug: row.categorySlug, name: row.categoryName },
        })),
        total: countRows[0]?.count ?? 0,
      };
    },

    async findPublishedBySlug(slug) {
      const rows = await database
        .select({
          id: contents.id,
          type: contents.type,
          slug: contents.slug,
          title: contents.title,
          summary: contents.summary,
          body: contents.body,
          publishedAt: contents.publishedAt,
          categorySlug: categories.slug,
          categoryName: categories.name,
        })
        .from(contents)
        .innerJoin(categories, eq(categories.id, contents.categoryId))
        .where(and(eq(contents.slug, slug), eq(contents.status, "published")))
        .limit(1);

      const content = rows[0];
      if (!content?.publishedAt) return null;

      const [candidateRows, tagRows] = await Promise.all([
        database
          .select({
            id: candidates.id,
            name: candidates.name,
            description: candidates.description,
            imageUrl: candidates.imageUrl,
            imageAlt: candidates.imageAlt,
            displayOrder: candidates.displayOrder,
          })
          .from(candidates)
          .where(and(eq(candidates.contentId, content.id), eq(candidates.isActive, true)))
          .orderBy(asc(candidates.displayOrder)),
        database
          .select({ slug: tags.slug, name: tags.name })
          .from(contentTags)
          .innerJoin(tags, eq(tags.id, contentTags.tagId))
          .where(eq(contentTags.contentId, content.id))
          .orderBy(asc(tags.name)),
      ]);

      return {
        id: content.id,
        type: content.type,
        slug: content.slug,
        title: content.title,
        summary: content.summary,
        body: content.body,
        publishedAt: content.publishedAt,
        category: { slug: content.categorySlug, name: content.categoryName },
        candidates: candidateRows,
        tags: tagRows,
      };
    },
  };
}
