import { generateNewKey, revokeKey } from './services/auth.ts';
import { sql } from './db/client.ts';

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
      const keys = await sql`
        SELECT id, name, key_prefix as "keyPrefix", is_active as "isActive", last_used_at as "lastUsedAt", created_at as "createdAt"
        FROM api_keys
        ORDER BY created_at DESC
      `;
      console.log('--- ACTIVE API KEYS ---');
      console.table(keys.map((k) => ({
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
  const { sql: dbSql } = await import('./db/client.ts');
  await dbSql.end();
  Deno.exit(0);
}

if (import.meta.main) {
  main();
}
