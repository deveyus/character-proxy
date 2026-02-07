import { Migration } from './types.ts';

export const migration: Migration = {
  version: 1,
  description: 'Grand Baseline: Initial schema for characters, corporations, alliances, queue, and API keys.',
  // deno-lint-ignore no-explicit-any
  up: async (tx: any) => {
    // --- Characters ---
    await tx`
      CREATE TABLE character_static (
        character_id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        birthday TIMESTAMP NOT NULL,
        gender TEXT NOT NULL,
        race_id BIGINT NOT NULL,
        bloodline_id BIGINT NOT NULL,
        etag TEXT,
        expires_at TIMESTAMP,
        last_modified_at TIMESTAMP,
        terminated_at TIMESTAMP,
        access_count BIGINT DEFAULT 0 NOT NULL,
        last_discovery_at TIMESTAMP
      )
    `;
    await tx`CREATE INDEX idx_character_last_discovery ON character_static (last_discovery_at)`;

    await tx`
      CREATE TABLE character_ephemeral (
        record_id UUID PRIMARY KEY,
        character_id BIGINT NOT NULL REFERENCES character_static(character_id),
        corporation_id BIGINT NOT NULL,
        alliance_id BIGINT,
        security_status REAL NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // --- Corporations ---
    await tx`
      CREATE TABLE corporation_static (
        corporation_id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        ticker TEXT NOT NULL,
        date_founded TIMESTAMP,
        creator_id BIGINT,
        faction_id BIGINT,
        etag TEXT,
        expires_at TIMESTAMP,
        last_modified_at TIMESTAMP,
        terminated_at TIMESTAMP,
        access_count BIGINT DEFAULT 0 NOT NULL,
        last_discovery_at TIMESTAMP
      )
    `;
    await tx`CREATE INDEX idx_corporation_last_discovery ON corporation_static (last_discovery_at)`;

    await tx`
      CREATE TABLE corporation_ephemeral (
        record_id UUID PRIMARY KEY,
        corporation_id BIGINT NOT NULL REFERENCES corporation_static(corporation_id),
        alliance_id BIGINT,
        ceo_id BIGINT NOT NULL,
        member_count BIGINT NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // --- Alliances ---
    await tx`
      CREATE TABLE alliance_static (
        alliance_id BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        ticker TEXT NOT NULL,
        date_founded TIMESTAMP,
        creator_id BIGINT NOT NULL,
        creator_corporation_id BIGINT NOT NULL,
        faction_id BIGINT,
        etag TEXT,
        expires_at TIMESTAMP,
        last_modified_at TIMESTAMP,
        terminated_at TIMESTAMP,
        access_count BIGINT DEFAULT 0 NOT NULL,
        last_discovery_at TIMESTAMP
      )
    `;
    await tx`CREATE INDEX idx_alliance_last_discovery ON alliance_static (last_discovery_at)`;

    await tx`
      CREATE TABLE alliance_ephemeral (
        record_id UUID PRIMARY KEY,
        alliance_id BIGINT NOT NULL REFERENCES alliance_static(alliance_id),
        executor_corp_id BIGINT,
        member_count BIGINT NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // --- Discovery Queue ---
    await tx`
      CREATE TABLE discovery_queue (
        entity_id BIGINT NOT NULL,
        entity_type TEXT NOT NULL,
        attempts BIGINT DEFAULT 0 NOT NULL,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (entity_id, entity_type)
      )
    `;

    // --- API Keys ---
    await tx`
      CREATE TABLE api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_used_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      )
    `;
  },
};
