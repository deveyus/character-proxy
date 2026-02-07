import { generateNewKey, revokeKey } from './services/auth.ts';
import { db } from './db/client.ts';
import { apiKeys } from './db/schema.ts';
import { desc } from 'drizzle-orm';

async function main() {
  const [command, ...args] = Deno.args;

  switch (command) {
    case 'add': {
      const name = args[0];
      if (!name) {
        console.error('Usage: deno task manage:keys add <name>');
        Deno.exit(1);
      }
      const result = await generateNewKey(name);
      if (result.isErr()) {
        console.error(`Error: ${result.error.message}`);
        Deno.exit(1);
      }
      console.log('--- API KEY CREATED ---');
      console.log(`ID:   ${result.value.id}`);
      console.log(`Name: ${name}`);
      console.log(`Key:  ${result.value.rawKey}`);
      console.log('-----------------------');
      console.log('IMPORTANT: This key will NOT be shown again.');
      break;
    }

    case 'list': {
      const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
      console.log('--- ACTIVE API KEYS ---');
      console.table(keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.keyPrefix,
        active: k.isActive,
        last_used: k.lastUsedAt?.toISOString() || 'never',
      })));
      break;
    }

    case 'revoke': {
      const id = args[0];
      if (!id) {
        console.error('Usage: deno task manage:keys revoke <id>');
        Deno.exit(1);
      }
      const result = await revokeKey(id);
      if (result.isErr()) {
        console.error(`Error: ${result.error.message}`);
        Deno.exit(1);
      }
      console.log(`Key ${id} revoked.`);
      break;
    }

    default:
      console.log('Usage: deno task manage:keys <add|list|revoke> [args]');
  }

  // Ensure DB connection closes
  const { client } = await import('./db/client.ts');
  await client.end();
  Deno.exit(0);
}

if (import.meta.main) {
  main();
}
