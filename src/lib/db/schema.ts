import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const contentTypeEnum = pgEnum("content_type", ["vs", "worldcup", "test"]);
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "review",
  "published",
  "hidden",
  "archived",
]);
export const adminRoleEnum = pgEnum("admin_role", ["admin", "editor"]);
export const rightsStatusEnum = pgEnum("rights_status", [
  "original",
  "licensed",
  "permission",
  "public_domain",
  "unknown",
]);
export const reportReasonEnum = pgEnum("report_reason", [
  "copyright",
  "inappropriate",
  "incorrect",
  "privacy",
  "other",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerSubject: varchar("provider_subject", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    role: adminRoleEnum("role").notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_provider_subject_unique").on(table.providerSubject),
    uniqueIndex("admin_users_email_unique").on(table.email),
    check("admin_users_email_normalized", sql`${table.email} = lower(${table.email})`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    check("categories_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("categories_display_order_nonnegative", sql`${table.displayOrder} >= 0`),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_slug_unique").on(table.slug),
    check("tags_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
  ],
);

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: contentTypeEnum("type").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    summary: varchar("summary", { length: 320 }).notNull(),
    body: text("body").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    adEligible: boolean("ad_eligible").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("contents_slug_unique").on(table.slug),
    index("contents_public_feed_idx").on(table.status, table.publishedAt),
    index("contents_category_idx").on(table.categoryId, table.status),
    check("contents_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("contents_title_length", sql`char_length(${table.title}) between 2 and 160`),
    check("contents_summary_length", sql`char_length(${table.summary}) between 20 and 320`),
    check("contents_body_not_blank", sql`char_length(btrim(${table.body})) >= 40`),
    check(
      "contents_published_at_required",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
  ],
);

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    imageAlt: varchar("image_alt", { length: 240 }),
    sourceUrl: text("source_url"),
    rightsStatus: rightsStatusEnum("rights_status").notNull().default("unknown"),
    rightsNote: text("rights_note").notNull().default(""),
    displayOrder: integer("display_order").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("candidates_id_content_unique").on(table.id, table.contentId),
    uniqueIndex("candidates_content_order_unique").on(table.contentId, table.displayOrder),
    index("candidates_content_active_idx").on(table.contentId, table.isActive),
    check("candidates_name_not_blank", sql`char_length(btrim(${table.name})) >= 1`),
    check("candidates_display_order_nonnegative", sql`${table.displayOrder} >= 0`),
    check(
      "candidates_image_alt_required",
      sql`${table.imageUrl} IS NULL OR char_length(btrim(${table.imageAlt})) >= 2`,
    ),
    check(
      "candidates_rights_note_required",
      sql`${table.rightsStatus} = 'unknown' OR char_length(btrim(${table.rightsNote})) >= 4`,
    ),
  ],
);

export const contentTags = pgTable(
  "content_tags",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contentId, table.tagId] })],
);

export const voteSessions = pgTable(
  "vote_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    riskFlags: jsonb("risk_flags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("vote_sessions_token_hash_unique").on(table.tokenHash),
    index("vote_sessions_expiry_idx").on(table.expiresAt),
    check("vote_sessions_token_hash_length", sql`char_length(${table.tokenHash}) = 64`),
    check("vote_sessions_expiry_after_creation", sql`${table.expiresAt} > ${table.createdAt}`),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => voteSessions.id, { onDelete: "cascade" }),
    matchupKey: varchar("matchup_key", { length: 120 }).notNull(),
    selectedCandidateId: uuid("selected_candidate_id").notNull(),
    rejectedCandidateId: uuid("rejected_candidate_id").notNull(),
    roundNumber: integer("round_number").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("votes_session_content_matchup_unique").on(
      table.sessionId,
      table.contentId,
      table.matchupKey,
    ),
    index("votes_content_created_idx").on(table.contentId, table.createdAt),
    unique("votes_id_content_unique").on(table.id, table.contentId),
    check("votes_distinct_candidates", sql`${table.selectedCandidateId} <> ${table.rejectedCandidateId}`),
    check("votes_round_positive", sql`${table.roundNumber} >= 1`),
    foreignKey({
      name: "votes_selected_candidate_content_fk",
      columns: [table.selectedCandidateId, table.contentId],
      foreignColumns: [candidates.id, candidates.contentId],
    }).onDelete("cascade"),
    foreignKey({
      name: "votes_rejected_candidate_content_fk",
      columns: [table.rejectedCandidateId, table.contentId],
      foreignColumns: [candidates.id, candidates.contentId],
    }).onDelete("cascade"),
  ],
);

export const contentStats = pgTable(
  "content_stats",
  {
    contentId: uuid("content_id")
      .primaryKey()
      .references(() => contents.id, { onDelete: "cascade" }),
    viewCount: integer("view_count").notNull().default(0),
    startCount: integer("start_count").notNull().default(0),
    completionCount: integer("completion_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    voteCount: integer("vote_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "content_stats_nonnegative",
      sql`${table.viewCount} >= 0 AND ${table.startCount} >= 0 AND ${table.completionCount} >= 0 AND ${table.shareCount} >= 0 AND ${table.voteCount} >= 0`,
    ),
  ],
);

export const candidateStats = pgTable(
  "candidate_stats",
  {
    candidateId: uuid("candidate_id").primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    selectionCount: integer("selection_count").notNull().default(0),
    matchupCount: integer("matchup_count").notNull().default(0),
    championshipCount: integer("championship_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("candidate_stats_content_idx").on(table.contentId),
    foreignKey({
      name: "candidate_stats_candidate_content_fk",
      columns: [table.candidateId, table.contentId],
      foreignColumns: [candidates.id, candidates.contentId],
    }).onDelete("cascade"),
    check(
      "candidate_stats_nonnegative",
      sql`${table.selectionCount} >= 0 AND ${table.matchupCount} >= 0 AND ${table.championshipCount} >= 0`,
    ),
    check(
      "candidate_stats_selection_within_matchups",
      sql`${table.selectionCount} <= ${table.matchupCount}`,
    ),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => voteSessions.id, { onDelete: "set null" }),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details").notNull(),
    status: reportStatusEnum("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    handledBy: uuid("handled_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_queue_idx").on(table.status, table.createdAt),
    check("reports_details_length", sql`char_length(btrim(${table.details})) between 4 and 2000`),
    check(
      "reports_resolution_consistency",
      sql`${table.status} NOT IN ('resolved', 'dismissed') OR ${table.resolvedAt} IS NOT NULL`,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 160 }).notNull(),
    changes: jsonb("changes").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    index("audit_logs_admin_idx").on(table.adminId, table.createdAt),
    check("audit_logs_action_not_blank", sql`char_length(btrim(${table.action})) >= 2`),
  ],
);

export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type Vote = typeof votes.$inferSelect;
