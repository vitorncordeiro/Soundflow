import { eq } from 'drizzle-orm';
import { loadDotEnv, loadEnv } from '../config/env';
import { createAuth } from '../auth/auth.factory';
import { createDatabase } from './database';
import { track, user } from './schema';

const DEMO_EMAIL = 'demo@pulse.local';
const DEMO_PASSWORD = 'pulse-demo-123';

/**
 * Cria (se necessario) o usuario de demonstracao e um catalogo inicial.
 * Os arquivos .wav sao sintetizados e ficam em apps/web/public/demo, servidos pelo Vite.
 * E idempotente: pode ser executado varias vezes.
 */
async function main(): Promise<void> {
  loadDotEnv();
  const env = loadEnv();
  const { db, pool } = createDatabase(env.databaseUrl);

  try {
    const auth = await createAuth({
      db,
      secret: env.authSecret,
      baseURL: env.authUrl,
      webOrigin: env.webOrigin,
      isProduction: env.nodeEnv === 'production',
    });

    let [demo] = await db.select().from(user).where(eq(user.email, DEMO_EMAIL)).limit(1);
    if (!demo) {
      await auth.api.signUpEmail({
        body: { name: 'Demo', email: DEMO_EMAIL, password: DEMO_PASSWORD },
      });
      [demo] = await db.select().from(user).where(eq(user.email, DEMO_EMAIL)).limit(1);
    }
    if (!demo) throw new Error('Nao foi possivel criar o usuario de demonstracao');

    const existing = await db
      .select({ id: track.id })
      .from(track)
      .where(eq(track.userId, demo.id))
      .limit(1);
    if (existing.length === 0) {
      const base = `${env.webOrigin}/demo`;
      await db.insert(track).values([
        {
          userId: demo.id,
          title: 'Amanhecer em La',
          artist: 'Pulse Demo',
          album: 'Tons de Teste',
          audioUrl: `${base}/pulse-01.wav`,
          durationSeconds: 16,
        },
        {
          userId: demo.id,
          title: 'Maré Baixa',
          artist: 'Pulse Demo',
          album: 'Tons de Teste',
          audioUrl: `${base}/pulse-02.wav`,
          durationSeconds: 19,
        },
        {
          userId: demo.id,
          title: 'Corrida Noturna',
          artist: 'Pulse Demo',
          album: 'Tons de Teste',
          audioUrl: `${base}/pulse-03.wav`,
          durationSeconds: 15,
        },
        {
          userId: demo.id,
          title: 'Janela Aberta',
          artist: 'Pulse Demo',
          album: 'Tons de Teste',
          audioUrl: `${base}/pulse-04.wav`,
          durationSeconds: 21,
        },
      ]);
      console.log('Catalogo de demonstracao criado.');
    } else {
      console.log('Catalogo de demonstracao ja existe; nada a fazer.');
    }
    console.log(`Usuario de demonstracao: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Falha no seed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
