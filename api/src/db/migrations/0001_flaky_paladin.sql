CREATE TABLE "alliance_ephemeral" (
	"id" serial PRIMARY KEY NOT NULL,
	"alliance_id" integer NOT NULL,
	"executor_corp_id" integer,
	"member_count" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alliance_static" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_ephemeral" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"corporation_id" integer NOT NULL,
	"security_status" real NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_static" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birthday" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporation_ephemeral" (
	"id" serial PRIMARY KEY NOT NULL,
	"corporation_id" integer NOT NULL,
	"alliance_id" integer,
	"member_count" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporation_static" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "alliance_ephemeral" ADD CONSTRAINT "alliance_ephemeral_alliance_id_alliance_static_id_fk" FOREIGN KEY ("alliance_id") REFERENCES "public"."alliance_static"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_ephemeral" ADD CONSTRAINT "character_ephemeral_character_id_character_static_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character_static"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporation_ephemeral" ADD CONSTRAINT "corporation_ephemeral_corporation_id_corporation_static_id_fk" FOREIGN KEY ("corporation_id") REFERENCES "public"."corporation_static"("id") ON DELETE no action ON UPDATE no action;