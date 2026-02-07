import { assertEquals } from 'std/assert/mod.ts';
import { DbBigIntSchema, EveIdSchema } from '../../src/db/common.ts';

Deno.test('DbBigIntSchema should transform string to number', () => {
  const result = DbBigIntSchema.parse('12345');
  assertEquals(result, 12345);
});

Deno.test('DbBigIntSchema should accept number', () => {
  const result = DbBigIntSchema.parse(67890);
  assertEquals(result, 67890);
});

Deno.test('EveIdSchema should validate positive integers', () => {
  const result = EveIdSchema.parse(1000001);
  assertEquals(result, 1000001);
});
