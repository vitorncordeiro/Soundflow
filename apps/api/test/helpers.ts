import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

export const ORIGIN = 'http://localhost:5173';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await configureApp(app);
  await app.init();
  return app;
}

export interface TestUser {
  id: string;
  email: string;
  cookie: string;
}

let counter = 0;

/** Cadastra um usuario real pelo Better Auth e devolve o cookie de sessao. */
export async function signUp(app: INestApplication, label = 'user'): Promise<TestUser> {
  counter += 1;
  const email = `${label}-${Date.now()}-${counter}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-up/email')
    .set('Origin', ORIGIN)
    .send({ name: `Usuario ${label}`, email, password: 'senha-segura-123' });
  if (res.status !== 200) {
    throw new Error(`sign-up falhou: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const cookies = (res.headers['set-cookie'] ?? []) as unknown as string[];
  const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('sign-up nao devolveu cookie de sessao');
  return { id: res.body.user.id as string, email, cookie };
}

export const sampleTrack = (n: number) => ({
  title: `Faixa ${n}`,
  artist: `Artista ${n}`,
  album: 'Album de teste',
  audioUrl: `http://localhost:5173/demo/pulse-0${n}.wav`,
  durationSeconds: 20,
});

export async function addTrack(
  app: INestApplication,
  user: TestUser,
  n: number,
): Promise<{ id: string; title: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/music')
    .set('Cookie', user.cookie)
    .send(sampleTrack(n));
  if (res.status !== 201)
    throw new Error(`criar musica falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}
