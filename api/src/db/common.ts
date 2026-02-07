import { z } from 'zod';

/**
 * Shared Zod schema fragments for EVE entities and system tables.
 * These ensure consistent validation and typing across the Raw SQL layer.
 */

// --- Base Types ---

/**
 * PostgreSQL BIGINT normalization schema.
 * 
 * PostgreSQL BIGINT returned by postgres.js can be a string (to prevent precision loss for >53-bit ints) 
 * or a number. Since EVE IDs fit within JavaScript's safe integer range (2^53 - 1), we safely 
 * normalize them to numbers.
 */
export const DbBigIntSchema = z.union([z.number(), z.string()]).transform((val) => Number(val));

/**
 * Validates EVE Online entity IDs.
 * 
 * EVE IDs are large positive integers. This schema ensures the ID is a positive, 
 * non-zero integer after normalization from the database format.
 * 
 * @example
 * const id = EveIdSchema.parse("2112024646"); // Returns 2112024646
 */
export const EveIdSchema = DbBigIntSchema.pipe(z.number().int().positive());

// --- Schema Fragments ---

/**
 * Fields used for EVE Swagger Interface (ESI) cache management.
 * 
 * Includes E-Tag for conditional requests and expiration/modification timestamps 
 * derived from ESI response headers.
 */
export const EsiCacheSchema = z.object({
  etag: z.string().nullable(),
  expiresAt: z.date().nullable(),
  lastModifiedAt: z.date().nullable(),
});

/**
 * Tracking fields for internal discovery and cache priority.
 * 
 * Includes access frequency counters and the last time the entity was 
 * deeply analyzed by the discovery engine.
 */
export const DiscoveryTrackingSchema = z.object({
  accessCount: DbBigIntSchema.default(0),
  lastDiscoveryAt: z.date().nullable(),
});

/**
 * Standard audit timestamps for system-level tracking.
 */
export const AuditTimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Timestamp field for records in the historical ledger.
 * 
 * Used primarily in ephemeral tables to track when a specific state 
 * snapshot was recorded.
 */
export const RecordedAtSchema = z.object({
  recordedAt: z.date(),
});