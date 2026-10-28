import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { addTrack, createTestApp, sampleTrack, signUp, TestUser } from './helpers';

describe('Autenticacao e catalogo (integracao com PostgreSQL)', () => {
  let app: INestApplication;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    alice = await signUp(app, 'alice');
    bob = await signUp(app, 'bob');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('health e publico', async () => {
    const res = await http().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it.each([
    ['GET', '/api/music'],
    ['POST', '/api/music'],
    ['GET', '/api/playback'],
    ['POST', '/api/playback/next'],
    ['GET', '/api/queue'],
    ['GET', '/api/history'],
  ])('rejeita %s %s sem sessao', async (method, url) => {
    const res = await http()[method.toLowerCase() as 'get' | 'post'](url);
    expect(res.status).toBe(401);
  });

  it('rejeita cookie de sessao invalido', async () => {
    const res = await http().get('/api/music').set('Cookie', 'better-auth.session_token=invalido');
    expect(res.status).toBe(401);
  });

  it('login com senha errada falha e com a senha certa devolve sessao', async () => {
    const bad = await http()
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:5173')
      .send({ email: alice.email, password: 'senha-errada-123' });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    const ok = await http()
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:5173')
      .send({ email: alice.email, password: 'senha-segura-123' });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie']).toBeDefined();
  });

  it('cria, lista e persiste musicas do usuario', async () => {
    const created = await http()
      .post('/api/music')
      .set('Cookie', alice.cookie)
      .send(sampleTrack(1));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: 'Faixa 1', userId: alice.id });

    const list = await http().get('/api/music').set('Cookie', alice.cookie);
    expect(list.status).toBe(200);
    expect(list.body.map((t: { id: string }) => t.id)).toContain(created.body.id);
  });

  it('usuario B nao ve nem altera musicas do usuario A', async () => {
    const track = await addTrack(app, alice, 2);

    const list = await http().get('/api/music').set('Cookie', bob.cookie);
    expect(list.body.map((t: { id: string }) => t.id)).not.toContain(track.id);

    expect((await http().get(`/api/music/${track.id}`).set('Cookie', bob.cookie)).status).toBe(404);
    expect(
      (await http().patch(`/api/music/${track.id}`).set('Cookie', bob.cookie).send({ title: 'x' }))
        .status,
    ).toBe(404);
    expect((await http().delete(`/api/music/${track.id}`).set('Cookie', bob.cookie)).status).toBe(
      404,
    );

    // Continua intacta para a dona.
    const still = await http().get(`/api/music/${track.id}`).set('Cookie', alice.cookie);
    expect(still.status).toBe(200);
    expect(still.body.title).toBe('Faixa 2');
  });

  it('ignora userId enviado no corpo (mass assignment) e rejeita campos extras', async () => {
    const res = await http()
      .post('/api/music')
      .set('Cookie', bob.cookie)
      .send({ ...sampleTrack(3), userId: alice.id });
    expect(res.status).toBe(400);
  });

  it('valida entradas invalidas', async () => {
    const post = (body: object) => http().post('/api/music').set('Cookie', alice.cookie).send(body);
    expect((await post({ ...sampleTrack(1), title: '   ' })).status).toBe(400);
    expect((await post({ ...sampleTrack(1), audioUrl: 'javascript:alert(1)' })).status).toBe(400);
    expect((await post({ ...sampleTrack(1), audioUrl: 'ftp://x/y.mp3' })).status).toBe(400);
    expect((await post({ ...sampleTrack(1), coverUrl: 'nao-e-url' })).status).toBe(400);
    expect((await post({ ...sampleTrack(1), durationSeconds: -3 })).status).toBe(400);
    expect((await http().get('/api/music/nao-uuid').set('Cookie', alice.cookie)).status).toBe(400);
    expect((await http().get('/api/music?sort=senha').set('Cookie', alice.cookie)).status).toBe(
      400,
    );
  });

  it('atualiza parcialmente e rejeita PATCH vazio', async () => {
    const track = await addTrack(app, alice, 4);
    const ok = await http()
      .patch(`/api/music/${track.id}`)
      .set('Cookie', alice.cookie)
      .send({ title: '  Novo titulo  ', album: '' });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ title: 'Novo titulo', album: null, artist: 'Artista 4' });
    const empty = await http().patch(`/api/music/${track.id}`).set('Cookie', alice.cookie).send({});
    expect(empty.status).toBe(400);
  });

  it('busca e ordena de forma literal e segura', async () => {
    const carol = await signUp(app, 'carol');
    for (const [title, artist] of [
      ['Beta', 'Zeta'],
      ['alfa', 'Yota'],
      ['100% Pure', 'Xi'],
    ]) {
      await http()
        .post('/api/music')
        .set('Cookie', carol.cookie)
        .send({ ...sampleTrack(1), title, artist })
        .expect(201);
    }
    const byTitle = await http().get('/api/music?sort=title&order=asc').set('Cookie', carol.cookie);
    expect(byTitle.body.map((t: { title: string }) => t.title)).toEqual([
      '100% Pure',
      'alfa',
      'Beta',
    ]);

    const search = await http().get('/api/music?q=yota').set('Cookie', carol.cookie);
    expect(search.body).toHaveLength(1);

    // O curinga % e tratado como texto literal.
    const percent = await http().get('/api/music?q=%25').set('Cookie', carol.cookie);
    expect(percent.body.map((t: { title: string }) => t.title)).toEqual(['100% Pure']);

    const injection = await http()
      .get(`/api/music?q=${encodeURIComponent("' OR 1=1 --")}`)
      .set('Cookie', carol.cookie);
    expect(injection.body).toEqual([]);
  });

  it('remove musica e responde 404 depois', async () => {
    const track = await addTrack(app, alice, 5);
    expect((await http().delete(`/api/music/${track.id}`).set('Cookie', alice.cookie)).status).toBe(
      204,
    );
    expect((await http().get(`/api/music/${track.id}`).set('Cookie', alice.cookie)).status).toBe(
      404,
    );
  });

  it('CORS permite apenas a origem do frontend, com credenciais', async () => {
    const allowed = await http()
      .options('/api/music')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const denied = await http()
      .options('/api/music')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
