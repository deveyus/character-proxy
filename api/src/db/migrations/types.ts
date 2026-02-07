import { sql } from '../client.ts';

export interface Migration {
  version: number;
  description: string;
  /**
   * The function to apply the migration.
   * Receives a postgres.js transaction object.
   */
  // deno-lint-ignore no-explicit-any
  up: (tx: any) => Promise<void>;
}
