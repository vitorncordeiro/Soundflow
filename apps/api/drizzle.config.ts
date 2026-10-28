import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';

// O .env fica na raiz do monorepo; o drizzle-kit roda a partir de apps/api.
const rootEnv = resolve(__dirname, '../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: '../../drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/pulse_player',
  },
});
