import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface AppEnv {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  authSecret: string;
  authUrl: string;
  webOrigin: string;
}

export const APP_ENV = Symbol('APP_ENV');

const EXAMPLE_SECRET_PREFIX = 'replace-with-a-long-random-secret';

/** Valida as variaveis de ambiente na inicializacao e falha com uma mensagem clara. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const problems: string[] = [];
  const read = (name: string): string => {
    const value = source[name]?.trim();
    if (!value) {
      problems.push(`${name} nao definida`);
      return '';
    }
    return value;
  };
  const readUrl = (name: string): string => {
    const value = read(name);
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocolo');
      } catch {
        problems.push(`${name} deve ser uma URL http(s) valida`);
      }
    }
    return value.replace(/\/+$/, '');
  };

  const rawNodeEnv = source.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(rawNodeEnv)) {
    problems.push('NODE_ENV deve ser development, test ou production');
  }
  const nodeEnv = rawNodeEnv as AppEnv['nodeEnv'];

  const rawPort = source.API_PORT?.trim() || '3000';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push('API_PORT deve ser um inteiro entre 1 e 65535');
  }

  const databaseUrl = read('DATABASE_URL');
  if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
    problems.push('DATABASE_URL deve comecar com postgresql://');
  }

  const authSecret = read('BETTER_AUTH_SECRET');
  if (authSecret && authSecret.length < 32) {
    problems.push('BETTER_AUTH_SECRET deve ter pelo menos 32 caracteres');
  }
  const authUrl = readUrl('BETTER_AUTH_URL');
  const webOrigin = readUrl('WEB_ORIGIN');

  if (nodeEnv === 'production') {
    if (authSecret.startsWith(EXAMPLE_SECRET_PREFIX)) {
      problems.push('BETTER_AUTH_SECRET nao pode usar o valor de exemplo em producao');
    }
    if (authUrl && !authUrl.startsWith('https://')) {
      problems.push('BETTER_AUTH_URL deve usar HTTPS em producao');
    }
    if (webOrigin && !webOrigin.startsWith('https://')) {
      problems.push('WEB_ORIGIN deve usar HTTPS em producao');
    }
  }

  if (problems.length > 0) {
    throw new Error(`Configuracao de ambiente invalida:\n - ${problems.join('\n - ')}`);
  }

  return { nodeEnv, port, databaseUrl, authSecret, authUrl, webOrigin };
}

/** Sobe a arvore de diretorios ate achar a raiz do monorepo. */
export function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

/** Carrega o .env da raiz do monorepo, se existir. Variaveis ja definidas prevalecem. */
export function loadDotEnv(): void {
  const file = join(findRepoRoot(), '.env');
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
}
