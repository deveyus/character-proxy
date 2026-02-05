CREATE TABLE "alliance_ephemeral" (
	"record_id" uuid PRIMARY KEY NOT NULL,
	"alliance_id" bigint NOT NULL,
	"executor_corp_id" bigint,
	"member_count" bigint NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alliance_static" (
	"alliance_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL,
	"date_founded" timestamp,
	"creator_id" bigint NOT NULL,
	"creator_corporation_id" bigint NOT NULL,
	"faction_id" bigint
);
--> statement-breakpoint
CREATE TABLE "character_ephemeral" (
	"record_id" uuid PRIMARY KEY NOT NULL,
	"character_id" bigint NOT NULL,
	"corporation_id" bigint NOT NULL,
	"alliance_id" bigint,
	"security_status" real NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_static" (
	"character_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birthday" timestamp NOT NULL,
	"gender" text NOT NULL,
	"race_id" bigint NOT NULL,
	"bloodline_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporation_ephemeral" (
	"record_id" uuid PRIMARY KEY NOT NULL,
	"corporation_id" bigint NOT NULL,
	"alliance_id" bigint,
	"ceo_id" bigint NOT NULL,
	"member_count" bigint NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporation_static" (
	"corporation_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL,
	"date_founded" timestamp,
	"creator_id" bigint,
	"faction_id" bigint
);
--> statement-breakpoint
ALTER TABLE "alliance_ephemeral" ADD CONSTRAINT "alliance_ephemeral_alliance_id_alliance_static_alliance_id_fk" FOREIGN KEY ("alliance_id") REFERENCES "public"."alliance_static"("alliance_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_ephemeral" ADD CONSTRAINT "character_ephemeral_character_id_character_static_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character_static"("character_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporation_ephemeral" ADD CONSTRAINT "corporation_ephemeral_corporation_id_corporation_static_corporation_id_fk" FOREIGN KEY ("corporation_id") REFERENCES "public"."corporation_static"("corporation_id") ON DELETE no action ON UPDATE no action;