import { bigint, index, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// --- Characters ---
export const characterStatic = pgTable('character_static', {
  characterId: bigint('character_id', { mode: 'number' }).primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  birthday: timestamp('birthday').notNull(),
  gender: text('gender').notNull(),
  raceId: bigint('race_id', { mode: 'number' }).notNull(),
  bloodlineId: bigint('bloodline_id', { mode: 'number' }).notNull(),
  etag: text('etag'),
  expiresAt: timestamp('expires_at'),
  lastModifiedAt: timestamp('last_modified_at'),
  accessCount: bigint('access_count', { mode: 'number' }).default(0).notNull(),
  lastDiscoveryAt: timestamp('last_discovery_at'),
}, (table) => ({
  lastDiscoveryIdx: index('idx_character_last_discovery').on(table.lastDiscoveryAt),
}));

export const characterEphemeral = pgTable('character_ephemeral', {
  recordId: uuid('record_id').primaryKey(), // UUIDv7 generated at application level
  characterId: bigint('character_id', { mode: 'number' }).notNull().references(() =>
    characterStatic.characterId
  ),
  corporationId: bigint('corporation_id', { mode: 'number' }).notNull(),
  allianceId: bigint('alliance_id', { mode: 'number' }),
  securityStatus: real('security_status').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// --- Corporations ---
export const corporationStatic = pgTable('corporation_static', {
  corporationId: bigint('corporation_id', { mode: 'number' }).primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  ticker: text('ticker').notNull(),
  dateFounded: timestamp('date_founded'),
  creatorId: bigint('creator_id', { mode: 'number' }),
  factionId: bigint('faction_id', { mode: 'number' }),
  etag: text('etag'),
  expiresAt: timestamp('expires_at'),
  lastModifiedAt: timestamp('last_modified_at'),
  accessCount: bigint('access_count', { mode: 'number' }).default(0).notNull(),
  lastDiscoveryAt: timestamp('last_discovery_at'),
}, (table) => ({
  lastDiscoveryIdx: index('idx_corporation_last_discovery').on(table.lastDiscoveryAt),
}));

export const corporationEphemeral = pgTable('corporation_ephemeral', {
  recordId: uuid('record_id').primaryKey(), // UUIDv7
  corporationId: bigint('corporation_id', { mode: 'number' }).notNull().references(() =>
    corporationStatic.corporationId
  ),
  allianceId: bigint('alliance_id', { mode: 'number' }),
  ceoId: bigint('ceo_id', { mode: 'number' }).notNull(),
  memberCount: bigint('member_count', { mode: 'number' }).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// --- Alliances ---
export const allianceStatic = pgTable('alliance_static', {
  allianceId: bigint('alliance_id', { mode: 'number' }).primaryKey(), // EVE Entity ID
  name: text('name').notNull(),
  ticker: text('ticker').notNull(),
  dateFounded: timestamp('date_founded'),
  creatorId: bigint('creator_id', { mode: 'number' }).notNull(),
  creatorCorporationId: bigint('creator_corporation_id', { mode: 'number' }).notNull(),
  factionId: bigint('faction_id', { mode: 'number' }),
  etag: text('etag'),
  expiresAt: timestamp('expires_at'),
  lastModifiedAt: timestamp('last_modified_at'),
  accessCount: bigint('access_count', { mode: 'number' }).default(0).notNull(),
  lastDiscoveryAt: timestamp('last_discovery_at'),
}, (table) => ({
  lastDiscoveryIdx: index('idx_alliance_last_discovery').on(table.lastDiscoveryAt),
}));

export const allianceEphemeral = pgTable('alliance_ephemeral', {
  recordId: uuid('record_id').primaryKey(), // UUIDv7
  allianceId: bigint('alliance_id', { mode: 'number' }).notNull().references(() =>
    allianceStatic.allianceId
  ),
  executorCorpId: bigint('executor_corp_id', { mode: 'number' }),
  memberCount: bigint('member_count', { mode: 'number' }).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// --- Discovery Queue ---
export const discoveryQueue = pgTable('discovery_queue', {
  entityId: bigint('entity_id', { mode: 'number' }).notNull(),
  entityType: text('entity_type', { enum: ['character', 'corporation', 'alliance'] }).notNull(),
  attempts: bigint('attempts', { mode: 'number' }).default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: { columns: [table.entityId, table.entityType] },
}));

// --- System State ---
export const systemState = pgTable('system_state', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
