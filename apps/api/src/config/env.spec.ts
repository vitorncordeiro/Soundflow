import { loadEnv } from './env';

const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  BETTER_AUTH_SECRET: 'x'.repeat(40),
  BETTER_AUTH_URL: 'http://localhost:3000/',
  WEB_ORIGIN: 'http://localhost:5173',
};

describe('loadEnv', () => {
  it('aceita configuracao valida e normaliza barras finais', () => {
    const env = loadEnv(valid);
    expect(env.authUrl).toBe('http://localhost:3000');
    expect(env.port).toBe(3000);
  });

  it('lista todas as variaveis faltantes', () => {
    expect(() => loadEnv({})).toThrow(
      /DATABASE_URL.*\n.*BETTER_AUTH_SECRET.*\n.*BETTER_AUTH_URL.*\n.*WEB_ORIGIN/,
    );
  });

  it('rejeita segredo curto, URL invalida e porta invalida', () => {
    expect(() => loadEnv({ ...valid, BETTER_AUTH_SECRET: 'curto' })).toThrow('32 caracteres');
    expect(() => loadEnv({ ...valid, WEB_ORIGIN: 'ftp://x' })).toThrow('WEB_ORIGIN');
    expect(() => loadEnv({ ...valid, API_PORT: '99999' })).toThrow('API_PORT');
  });

  it('em producao exige HTTPS e proibe o segredo de exemplo', () => {
    const prod = { ...valid, NODE_ENV: 'production' };
    expect(() => loadEnv(prod)).toThrow('HTTPS');
    expect(() =>
      loadEnv({
        ...prod,
        BETTER_AUTH_URL: 'https://api.exemplo.com',
        WEB_ORIGIN: 'https://app.exemplo.com',
        BETTER_AUTH_SECRET: 'replace-with-a-long-random-secret-with-at-least-32-chars',
      }),
    ).toThrow('valor de exemplo');
  });
});
