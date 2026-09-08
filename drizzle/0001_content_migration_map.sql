CREATE TABLE "migration_source_maps" (
	"source_system" varchar(80) NOT NULL,
	"source_id" varchar(200) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"target_id" uuid NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"migrated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "migration_source_maps_source_system_source_id_entity_type_pk" PRIMARY KEY("source_system","source_id","entity_type"),
	CONSTRAINT "migration_source_maps_checksum_length" CHECK (char_length("migration_source_maps"."checksum") = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "migration_source_maps_target_unique" ON "migration_source_maps" USING btree ("entity_type","target_id");