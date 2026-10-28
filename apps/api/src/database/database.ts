import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: Pool;
}

export function createDatabase(databaseUrl: string): DatabaseHandle {
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  // Sem este handler, uma queda de conexao ociosa derrubaria o processo.
  pool.on('error', (error) => {
    console.error('[database] erro em conexao ociosa do pool:', error.message);
  });
  return { db: drizzle(pool, { schema }), pool };
}
