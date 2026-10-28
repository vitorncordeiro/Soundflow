import { runMigrations } from '../src/database/migrate';

export default async function globalSetup(): Promise<void> {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/pulse_player_test';
  try {
    await runMigrations(url);
  } catch (error) {
    throw new Error(
      `Nao foi possivel preparar o banco de testes (${url}). ` +
        `Suba o PostgreSQL com "pnpm db:up". Detalhe: ${error instanceof Error ? error.message : error}`,
    );
  }
}
