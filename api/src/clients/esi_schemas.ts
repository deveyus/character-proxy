import { z } from 'zod';

export const ESICharacterSchema = z.object({
  name: z.string(),
  birthday: z.string(),
  gender: z.string(),
  race_id: z.number(),
  bloodline_id: z.number(),
  corporation_id: z.number(),
  alliance_id: z.number().optional(),
  security_status: z.number(),
  description: z.string().optional(),
});

export const ESICorporationSchema = z.object({
  name: z.string(),
  ticker: z.string(),
  date_founded: z.string().optional(),
  creator_id: z.number().optional(),
  faction_id: z.number().optional(),
  alliance_id: z.number().optional(),
  ceo_id: z.number(),
  member_count: z.number(),
  description: z.string().optional(),
});

export const ESIAllianceSchema = z.object({
  name: z.string(),
  ticker: z.string(),
  date_founded: z.string().optional(),
  creator_id: z.number(),
  creator_corporation_id: z.number(),
  faction_id: z.number().optional(),
  executor_corporation_id: z.number().optional(),
  member_count: z.number(),
  description: z.string().optional(),
});

export const ESICorpHistorySchema = z.array(z.object({
  corporation_id: z.number(),
  record_id: z.number(),
  start_date: z.string(),
  is_deleted: z.boolean().optional(),
}));

export const ESIAllianceHistorySchema = z.array(z.object({
  alliance_id: z.number().optional(),
  start_date: z.string(),
  is_deleted: z.boolean().optional(),
}));

export const ESIAllianceMembersSchema = z.array(z.number());

export type ESICharacter = z.infer<typeof ESICharacterSchema>;
export type ESICorporation = z.infer<typeof ESICorporationSchema>;
export type ESIAlliance = z.infer<typeof ESIAllianceSchema>;
