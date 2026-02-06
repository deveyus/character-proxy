CREATE TABLE "system_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alliance_static" ADD COLUMN "access_count" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "character_static" ADD COLUMN "access_count" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "corporation_static" ADD COLUMN "access_count" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discovery_queue" ADD COLUMN "locked_until" timestamp;