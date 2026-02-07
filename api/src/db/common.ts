import { z } from 'zod';

/**
 * Shared Zod schema fragments for EVE entities and system tables.
 * These ensure consistent validation and typing across the Raw SQL layer.
 */

// --- Base Types ---

/**
 * PostgreSQL BIGINT returned by postgres.js can be string or number.
 * We normalize to number since EVE IDs fit within JavaScript's safe integer range (2^53 - 1).
 */
export const DbBigIntSchema = z.union([z.number(), z.string()]).transform((val) => Number(val));

/**
 * Validates EVE IDs which are large positive integers.
 * ESI often returns them as numbers, but we store them as BIGINT.
 */
export const EveIdSchema = DbBigIntSchema.pipe(z.number().int().positive());

// --- Schema Fragments ---

/**
 * Fields used for ESI cache management.
 */
export const EsiCacheSchema = z.object({
  etag: z.string().nullable(),
  expiresAt: z.date().nullable(),
  lastModifiedAt: z.date().nullable(),
});

/**
 * Tracking fields for discovery priority.
 */
export const DiscoveryTrackingSchema = z.object({
  accessCount: DbBigIntSchema.default(0),
  lastDiscoveryAt: z.date().nullable(),
});

/**
 * Common audit timestamps.
 */
export const AuditTimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Historical ledger timestamps.
 */
export const RecordedAtSchema = z.object({
  recordedAt: z.date(),
});