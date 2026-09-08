import "server-only";

import { z } from "zod";

import type {
  PublicContentDetailRecord,
  PublicContentRecord,
  PublicContentRepository,
} from "../repositories/public-content-repository";

const slugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["newest", "oldest", "title"]).default("newest"),
  category: slugSchema.optional(),
  tag: slugSchema.optional(),
});

export interface PublicContentCardDto {
  id: string;
  type: "vs" | "worldcup" | "test";
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  category: { slug: string; name: string };
}

export interface PublicContentDetailDto extends PublicContentCardDto {
  body: string;
  candidates: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    imageAlt: string | null;
  }>;
  tags: Array<{ slug: string; name: string }>;
}

function toCardDto(content: PublicContentRecord): PublicContentCardDto {
  return {
    id: content.id,
    type: content.type,
    slug: content.slug,
    title: content.title,
    summary: content.summary,
    publishedAt: content.publishedAt.toISOString(),
    category: content.category,
  };
}

function toDetailDto(content: PublicContentDetailRecord): PublicContentDetailDto {
  return {
    ...toCardDto(content),
    body: content.body,
    candidates: content.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      description: candidate.description,
      imageUrl: candidate.imageUrl,
      imageAlt: candidate.imageAlt,
    })),
    tags: content.tags,
  };
}

export function createPublicContentService(repository: PublicContentRepository) {
  return {
    async list(rawQuery: unknown = {}) {
      const query = listQuerySchema.parse(rawQuery);
      const result = await repository.listPublished({
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
        categorySlug: query.category,
        tagSlug: query.tag,
      });

      return {
        items: result.items.map(toCardDto),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          pageCount: Math.ceil(result.total / query.pageSize),
        },
      };
    },

    async getBySlug(rawSlug: unknown): Promise<PublicContentDetailDto | null> {
      const slug = slugSchema.parse(rawSlug);
      const result = await repository.findPublishedBySlug(slug);
      return result ? toDetailDto(result) : null;
    },
  };
}
