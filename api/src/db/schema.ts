import { bigint, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

// --- Characters ---
export const characterStatic = pgTable("character_static", {
  characterId: bigint("character_id", { mode: "number" }).primaryKey(), // EVE Entity ID
  name: text("name").notNull(),
  birthday: timestamp("birthday").notNull(),
  gender: text("gender").notNull(),
  raceId: bigint("race_id", { mode: "number" }).notNull(),
  bloodlineId: bigint("bloodline_id", { mode: "number" }).notNull(),
});

export const characterEphemeral = pgTable("character_ephemeral", {
  recordId: uuid("record_id").primaryKey(), // UUIDv7 generated at application level
  characterId: bigint("character_id", { mode: "number" }).notNull().references(() => characterStatic.characterId),
  corporationId: bigint("corporation_id", { mode: "number" }).notNull(),
  allianceId: bigint("alliance_id", { mode: "number" }),
  securityStatus: real("security_status").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// --- Corporations ---
export const corporationStatic = pgTable("corporation_static", {
  corporationId: bigint("corporation_id", { mode: "number" }).primaryKey(), // EVE Entity ID
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  dateFounded: timestamp("date_founded"),
  creatorId: bigint("creator_id", { mode: "number" }),
  factionId: bigint("faction_id", { mode: "number" }),
});

export const corporationEphemeral = pgTable("corporation_ephemeral", {
  recordId: uuid("record_id").primaryKey(), // UUIDv7
  corporationId: bigint("corporation_id", { mode: "number" }).notNull().references(() => corporationStatic.corporationId),
  allianceId: bigint("alliance_id", { mode: "number" }),
  ceoId: bigint("ceo_id", { mode: "number" }).notNull(),
  memberCount: bigint("member_count", { mode: "number" }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// --- Alliances ---
export const allianceStatic = pgTable("alliance_static", {
  allianceId: bigint("alliance_id", { mode: "number" }).primaryKey(), // EVE Entity ID
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  dateFounded: timestamp("date_founded"),
  creatorId: bigint("creator_id", { mode: "number" }).notNull(),
  creatorCorporationId: bigint("creator_corporation_id", { mode: "number" }).notNull(),
  factionId: bigint("faction_id", { mode: "number" }),
});

export const allianceEphemeral = pgTable("alliance_ephemeral", {
  recordId: uuid("record_id").primaryKey(), // UUIDv7
  allianceId: bigint("alliance_id", { mode: "number" }).notNull().references(() => allianceStatic.allianceId),
  executorCorpId: bigint("executor_corp_id", { mode: "number" }),
  memberCount: bigint("member_count", { mode: "number" }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});