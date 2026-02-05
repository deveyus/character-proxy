import { assertEquals } from 'std/assert/mod.ts';
import { appRouter } from '../../src/trpc/router.ts';
import { createTRPCContext } from '../../src/trpc/context.ts';
import { client, db, initializeDatabase } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { CharacterEntity } from '../../src/db/character.ts';

Deno.test('tRPC Entity Procedures', async (t) => {
  await initializeDatabase();
  const ctx = createTRPCContext();
  const caller = appRouter.createCaller(ctx);
  const originalFetch = globalThis.fetch;

  const charId = 211202;
  const name = 'tRPC Test Character';

  // Mock ESI 200 for setup/calls
  globalThis.fetch = ((url: string) => {
    if (url.includes(`/characters/${charId}/`)) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            name: name,
            birthday: '2020-01-01T00:00:00Z',
            gender: 'female',
            race_id: 1,
            bloodline_id: 1,
            corporation_id: 1000001,
            security_status: 5.0,
          }),
          {
            status: 200,
            headers: {
              'etag': '"abc"',
              'expires': new Date(Date.now() + 60000).toUTCString(),
              'x-esi-error-limit-remain': '100',
              'x-esi-error-limit-reset': '60',
            },
          },
        ),
      );
    }
    if (url.includes('/characters/999999/')) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }
    return Promise.reject(new Error('Unexpected fetch'));
  }) as typeof fetch;

  try {
    await t.step('resolveById - should return entity via tRPC', async () => {
      const response = await caller.resolveById({ id: charId, type: 'character' });
      assertEquals(response.data?.name, name);
      assertEquals((response.data as CharacterEntity)?.characterId, charId);
      assertEquals(response.metadata.source, 'fresh');
    });

    await t.step('resolveByName - should return entity via tRPC', async () => {
      const response = await caller.resolveByName({ name: name, type: 'character' });
      assertEquals(response.data?.name, name);
      assertEquals((response.data as CharacterEntity)?.characterId, charId);
    });

    await t.step('resolveById - should return null for non-existent', async () => {
      const response = await caller.resolveById({ id: 999999, type: 'character' });
      assertEquals(response.data, null);
      assertEquals(response.metadata.source, 'stale');
    });
  } finally {
    globalThis.fetch = originalFetch;
    // Cleanup
    await db.delete(schema.characterEphemeral).where(
      eq(schema.characterEphemeral.characterId, charId),
    );
    await db.delete(schema.characterStatic).where(eq(schema.characterStatic.characterId, charId));
    await client.end();
  }
});
