import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { findRepoRoot, loadDotEnv } from '../config/env';
import { createDatabase } from './database';

/** Aplica as migrations versionadas da pasta `drizzle/` na raiz do monorepo. */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const { db, pool } = createDatabase(databaseUrl);
  try {
    await migrate(db, { migrationsFolder: resolve(findRepoRoot(), 'drizzle') });
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  loadDotEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL nao definida. Copie .env.example para .env.');
    process.exit(1);
  }
  runMigrations(url)
    .then(() => console.log('Migrations aplicadas com sucesso.'))
    .catch((error: unknown) => {
      console.error('Falha ao aplicar migrations:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
