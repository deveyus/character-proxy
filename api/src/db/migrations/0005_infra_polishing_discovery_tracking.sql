ALTER TABLE "alliance_static" ADD COLUMN "last_discovery_at" timestamp;--> statement-breakpoint
ALTER TABLE "character_static" ADD COLUMN "last_discovery_at" timestamp;--> statement-breakpoint
ALTER TABLE "corporation_static" ADD COLUMN "last_discovery_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_alliance_last_discovery" ON "alliance_static" USING btree ("last_discovery_at");--> statement-breakpoint
CREATE INDEX "idx_character_last_discovery" ON "character_static" USING btree ("last_discovery_at");--> statement-breakpoint
CREATE INDEX "idx_corporation_last_discovery" ON "corporation_static" USING btree ("last_discovery_at");