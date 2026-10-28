import type { Database } from '../database/database';
import { authSchema } from '../database/schema';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  session: { id: string; expiresAt: Date };
}

/** Contrato minimo que o projeto usa do Better Auth. */
export interface AuthInstance {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (ctx: { headers: Headers }) => Promise<AuthSession | null>;
    signUpEmail: (ctx: {
      body: { name: string; email: string; password: string };
    }) => Promise<unknown>;
  };
}

export interface AuthOptions {
  db: Database;
  secret: string;
  baseURL: string;
  webOrigin: string;
  isProduction: boolean;
}

/**
 * Cria a instancia do Better Auth.
 * O pacote e somente ESM e o backend compila para CommonJS, por isso o carregamento
 * e feito com `import()` dinamico.
 */
export async function createAuth(options: AuthOptions): Promise<AuthInstance> {
  const { betterAuth } = await import('better-auth');
  const { drizzleAdapter } = await import('better-auth/adapters/drizzle');

  const auth = betterAuth({
    baseURL: options.baseURL,
    secret: options.secret,
    database: drizzleAdapter(options.db, { provider: 'pg', schema: authSchema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    trustedOrigins: [options.webOrigin],
    // Limite de tentativas do Better Auth (em memoria, instancia unica). Ativo em producao.
    rateLimit: { enabled: options.isProduction },
    advanced: { useSecureCookies: options.isProduction },
  });
  return auth as unknown as AuthInstance;
}
