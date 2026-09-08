CREATE TYPE "public"."admin_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'review', 'published', 'hidden', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('vs', 'worldcup', 'test');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('copyright', 'inappropriate', 'incorrect', 'privacy', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."rights_status" AS ENUM('original', 'licensed', 'permission', 'public_domain', 'unknown');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_subject" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_normalized" CHECK ("admin_users"."email" = lower("admin_users"."email"))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" varchar(160) NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_action_not_blank" CHECK (char_length(btrim("audit_logs"."action")) >= 2)
);
--> statement-breakpoint
CREATE TABLE "candidate_stats" (
	"candidate_id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"selection_count" integer DEFAULT 0 NOT NULL,
	"matchup_count" integer DEFAULT 0 NOT NULL,
	"championship_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_stats_nonnegative" CHECK ("candidate_stats"."selection_count" >= 0 AND "candidate_stats"."matchup_count" >= 0 AND "candidate_stats"."championship_count" >= 0),
	CONSTRAINT "candidate_stats_selection_within_matchups" CHECK ("candidate_stats"."selection_count" <= "candidate_stats"."matchup_count")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text,
	"image_alt" varchar(240),
	"source_url" text,
	"rights_status" "rights_status" DEFAULT 'unknown' NOT NULL,
	"rights_note" text DEFAULT '' NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_id_content_unique" UNIQUE("id","content_id"),
	CONSTRAINT "candidates_name_not_blank" CHECK (char_length(btrim("candidates"."name")) >= 1),
	CONSTRAINT "candidates_display_order_nonnegative" CHECK ("candidates"."display_order" >= 0),
	CONSTRAINT "candidates_image_alt_required" CHECK ("candidates"."image_url" IS NULL OR char_length(btrim("candidates"."image_alt")) >= 2),
	CONSTRAINT "candidates_rights_note_required" CHECK ("candidates"."rights_status" = 'unknown' OR char_length(btrim("candidates"."rights_note")) >= 4)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "categories_display_order_nonnegative" CHECK ("categories"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "content_stats" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"start_count" integer DEFAULT 0 NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_stats_nonnegative" CHECK ("content_stats"."view_count" >= 0 AND "content_stats"."start_count" >= 0 AND "content_stats"."completion_count" >= 0 AND "content_stats"."share_count" >= 0 AND "content_stats"."vote_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"content_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "content_tags_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "content_type" NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(160) NOT NULL,
	"summary" varchar(320) NOT NULL,
	"body" text NOT NULL,
	"category_id" uuid NOT NULL,
	"created_by" uuid,
	"ad_eligible" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contents_slug_format" CHECK ("contents"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "contents_title_length" CHECK (char_length("contents"."title") between 2 and 160),
	CONSTRAINT "contents_summary_length" CHECK (char_length("contents"."summary") between 20 and 320),
	CONSTRAINT "contents_body_not_blank" CHECK (char_length(btrim("contents"."body")) >= 40),
	CONSTRAINT "contents_published_at_required" CHECK ("contents"."status" <> 'published' OR "contents"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"session_id" uuid,
	"reason" "report_reason" NOT NULL,
	"details" text NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"handled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "reports_details_length" CHECK (char_length(btrim("reports"."details")) between 4 and 2000),
	CONSTRAINT "reports_resolution_consistency" CHECK ("reports"."status" NOT IN ('resolved', 'dismissed') OR "reports"."resolved_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_format" CHECK ("tags"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "vote_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "vote_sessions_token_hash_length" CHECK (char_length("vote_sessions"."token_hash") = 64),
	CONSTRAINT "vote_sessions_expiry_after_creation" CHECK ("vote_sessions"."expires_at" > "vote_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"matchup_key" varchar(120) NOT NULL,
	"selected_candidate_id" uuid NOT NULL,
	"rejected_candidate_id" uuid NOT NULL,
	"round_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_id_content_unique" UNIQUE("id","content_id"),
	CONSTRAINT "votes_distinct_candidates" CHECK ("votes"."selected_candidate_id" <> "votes"."rejected_candidate_id"),
	CONSTRAINT "votes_round_positive" CHECK ("votes"."round_number" >= 1)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stats" ADD CONSTRAINT "candidate_stats_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stats" ADD CONSTRAINT "candidate_stats_candidate_content_fk" FOREIGN KEY ("candidate_id","content_id") REFERENCES "public"."candidates"("id","content_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_stats" ADD CONSTRAINT "content_stats_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_session_id_vote_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."vote_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_admin_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_session_id_vote_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."vote_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_selected_candidate_content_fk" FOREIGN KEY ("selected_candidate_id","content_id") REFERENCES "public"."candidates"("id","content_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_rejected_candidate_content_fk" FOREIGN KEY ("rejected_candidate_id","content_id") REFERENCES "public"."candidates"("id","content_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_provider_subject_unique" ON "admin_users" USING btree ("provider_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_admin_idx" ON "audit_logs" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "candidate_stats_content_idx" ON "candidate_stats" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidates_content_order_unique" ON "candidates" USING btree ("content_id","display_order");--> statement-breakpoint
CREATE INDEX "candidates_content_active_idx" ON "candidates" USING btree ("content_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_slug_unique" ON "contents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "contents_public_feed_idx" ON "contents" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "contents_category_idx" ON "contents" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "reports_queue_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_unique" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vote_sessions_token_hash_unique" ON "vote_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "vote_sessions_expiry_idx" ON "vote_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_session_content_matchup_unique" ON "votes" USING btree ("session_id","content_id","matchup_key");--> statement-breakpoint
CREATE INDEX "votes_content_created_idx" ON "votes" USING btree ("content_id","created_at");