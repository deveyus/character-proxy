import { integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

// --- Characters ---
export const characterStatic = pgTable('character_static', {
  id: integer('id').primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  birthday: timestamp('birthday').notNull(),
});

export const characterEphemeral = pgTable('character_ephemeral', {
  id: serial('id').primaryKey(),
  characterId: integer('character_id').notNull().references(() => characterStatic.id),
  corporationId: integer('corporation_id').notNull(),
  securityStatus: real('security_status').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// --- Corporations ---
export const corporationStatic = pgTable('corporation_static', {
  id: integer('id').primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  ticker: text('ticker').notNull(),
});

export const corporationEphemeral = pgTable('corporation_ephemeral', {
  id: serial('id').primaryKey(),
  corporationId: integer('corporation_id').notNull().references(() => corporationStatic.id),
  allianceId: integer('alliance_id'),
  memberCount: integer('member_count').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// --- Alliances ---
export const allianceStatic = pgTable('alliance_static', {
  id: integer('id').primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  ticker: text('ticker').notNull(),
});

export const allianceEphemeral = pgTable('alliance_ephemeral', {
  id: serial('id').primaryKey(),
  allianceId: integer('alliance_id').notNull().references(() => allianceStatic.id),
  executorCorpId: integer('executor_corp_id'),
  memberCount: integer('member_count').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// We can remove the placeholder 'users' table or keep it if needed, but the spec focuses on these.
// For now, I'll keep the file focused on the EVE entities.
