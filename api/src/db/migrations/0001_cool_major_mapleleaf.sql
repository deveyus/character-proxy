ALTER TABLE "alliance_static" ADD COLUMN "etag" text;--> statement-breakpoint
ALTER TABLE "alliance_static" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "alliance_static" ADD COLUMN "last_modified_at" timestamp;--> statement-breakpoint
ALTER TABLE "character_static" ADD COLUMN "etag" text;--> statement-breakpoint
ALTER TABLE "character_static" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "character_static" ADD COLUMN "last_modified_at" timestamp;--> statement-breakpoint
ALTER TABLE "corporation_static" ADD COLUMN "etag" text;--> statement-breakpoint
ALTER TABLE "corporation_static" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "corporation_static" ADD COLUMN "last_modified_at" timestamp;