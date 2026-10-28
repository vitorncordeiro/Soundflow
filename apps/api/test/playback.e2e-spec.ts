import type { INestApplication } from '@nestjs/common';
import type { PlaybackState } from '@pulse/shared';
import request from 'supertest';
import { addTrack, createTestApp, signUp, TestUser } from './helpers';

describe('Reproducao, fila FIFO e historico LIFO (integracao)', () => {
  let app: INestApplication;
  let user: TestUser;
  let other: TestUser;
  let t1: { id: string; title: string };
  let t2: { id: string; title: string };
  let t3: { id: string; title: string };

  beforeAll(async () => {
    app = await createTestApp();
    user = await signUp(app, 'player');
    other = await signUp(app, 'outsider');
    t1 = await addTrack(app, user, 1);
    t2 = await addTrack(app, user, 2);
    t3 = await addTrack(app, user, 3);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (u: TestUser) => ({
    get: (url: string) => request(app.getHttpServer()).get(url).set('Cookie', u.cookie),
    post: (url: string, body?: object) =>
      request(app.getHttpServer())
        .post(url)
        .set('Cookie', u.cookie)
        .send(body ?? {}),
    del: (url: string) => request(app.getHttpServer()).delete(url).set('Cookie', u.cookie),
  });
  const titles = (items: { track: { title: string } }[]) => items.map((i) => i.track.title);

  it('fluxo completo: play, enfileirar, next, ended idempotente, previous e historico', async () => {
    const me = as(user);

    let state = (await me.post('/api/playback/play', { trackId: t1.id })).body as PlaybackState;
    expect(state.status).toBe('playing');
    expect(state.current?.track.title).toBe('Faixa 1');
    const run1 = state.current!.runId;

    // Fila FIFO: entram 2 e 3, nessa ordem, sem interromper a faixa atual.
    await me.post('/api/queue', { trackId: t2.id }).expect(201);
    state = (await me.post('/api/queue', { trackId: t3.id })).body;
    expect(titles(state.queue)).toEqual(['Faixa 2', 'Faixa 3']);
    expect(state.current?.runId).toBe(run1);

    // ended: avanca para a primeira da fila.
    state = (await me.post('/api/playback/ended', { runId: run1 })).body;
    expect(state.current?.track.title).toBe('Faixa 2');
    expect(titles(state.queue)).toEqual(['Faixa 3']);

    // Evento repetido com runId antigo nao avanca de novo.
    state = (await me.post('/api/playback/ended', { runId: run1 })).body;
    expect(state.current?.track.title).toBe('Faixa 2');
    expect(titles(state.queue)).toEqual(['Faixa 3']);

    // Historico LIFO: mais recente primeiro.
    const history = (await me.get('/api/history')).body.items;
    expect(titles(history)).toEqual(['Faixa 2', 'Faixa 1']);

    // Anterior volta para a Faixa 1; a Faixa 2 nao volta para a fila.
    state = (await me.post('/api/playback/previous')).body;
    expect(state.current?.track.title).toBe('Faixa 1');
    expect(titles(state.queue)).toEqual(['Faixa 3']);
    expect(titles(state.history)).toEqual(['Faixa 1']);

    // Pausar e retomar.
    expect(((await me.post('/api/playback/pause')).body as PlaybackState).status).toBe('paused');
    expect(((await me.post('/api/playback/resume')).body as PlaybackState).status).toBe('playing');

    // Next ate esvaziar a fila: depois fica ocioso.
    state = (await me.post('/api/playback/next')).body;
    expect(state.current?.track.title).toBe('Faixa 3');
    state = (await me.post('/api/playback/next')).body;
    expect(state.status).toBe('idle');
    expect(state.current).toBeNull();
    expect(state.queue).toEqual([]);
  });

  it('enfileirar com player ocioso inicia a reproducao', async () => {
    const solo = await signUp(app, 'solo');
    const tr = await addTrack(app, solo, 1);
    const state = (await as(solo).post('/api/queue', { trackId: tr.id })).body as PlaybackState;
    expect(state.status).toBe('playing');
    expect(state.current?.track.id).toBe(tr.id);
    expect(state.queue).toEqual([]);
  });

  it('remove item especifico da fila (mesmo com musica repetida) e limpa a fila', async () => {
    const solo = await signUp(app, 'queuer');
    const a = await addTrack(app, solo, 1);
    const b = await addTrack(app, solo, 2);
    const me = as(solo);
    await me.post('/api/playback/play', { trackId: a.id });
    await me.post('/api/queue', { trackId: b.id });
    await me.post('/api/queue', { trackId: b.id });
    let state = (await me.post('/api/queue', { trackId: a.id })).body as PlaybackState;
    expect(state.queue).toHaveLength(3);
    const [first, second, third] = state.queue;
    expect(first!.entryId).not.toBe(second!.entryId);

    state = (await me.del(`/api/queue/${second!.entryId}`)).body;
    expect(state.queue.map((e) => e.entryId)).toEqual([first!.entryId, third!.entryId]);

    expect((await me.del(`/api/queue/${second!.entryId}`)).status).toBe(404);
    expect((await me.del('/api/queue/nao-uuid')).status).toBe(400);

    state = (await me.del('/api/queue')).body;
    expect(state.queue).toEqual([]);
  });

  it('isola o estado entre usuarios e valida a propriedade da musica', async () => {
    const mine = as(user);
    const theirs = as(other);
    await mine.post('/api/playback/play', { trackId: t1.id });

    const otherState = (await theirs.get('/api/playback')).body as PlaybackState;
    expect(otherState.status).toBe('idle');
    expect(otherState.history).toEqual([]);

    // Outro usuario nao consegue tocar nem enfileirar musica alheia.
    expect((await theirs.post('/api/playback/play', { trackId: t1.id })).status).toBe(404);
    expect((await theirs.post('/api/queue', { trackId: t1.id })).status).toBe(404);
  });

  it('erros de audio tiram o estado de playing sem avancar sozinho', async () => {
    const solo = await signUp(app, 'erro');
    const tr = await addTrack(app, solo, 1);
    const tr2 = await addTrack(app, solo, 2);
    const me = as(solo);
    const played = (await me.post('/api/playback/play', { trackId: tr.id })).body as PlaybackState;
    await me.post('/api/queue', { trackId: tr2.id });

    const failed = (
      await me.post('/api/playback/error', {
        runId: played.current!.runId,
        message: 'Formato nao suportado',
      })
    ).body as PlaybackState;
    expect(failed.status).toBe('paused');
    expect(failed.error).toBe('Formato nao suportado');
    expect(failed.queue).toHaveLength(1);

    const resumed = (await me.post('/api/playback/resume')).body as PlaybackState;
    expect(resumed.status).toBe('playing');
    expect(resumed.error).toBeNull();
  });

  it('excluir musica do catalogo a remove da fila, mas o historico guarda o snapshot', async () => {
    const solo = await signUp(app, 'excluir');
    const a = await addTrack(app, solo, 1);
    const b = await addTrack(app, solo, 2);
    const me = as(solo);
    await me.post('/api/playback/play', { trackId: a.id });
    await me.post('/api/queue', { trackId: b.id });
    await request(app.getHttpServer())
      .delete(`/api/music/${b.id}`)
      .set('Cookie', solo.cookie)
      .expect(204);

    const state = (await me.get('/api/playback')).body as PlaybackState;
    expect(state.queue).toEqual([]);

    await request(app.getHttpServer())
      .delete(`/api/music/${a.id}`)
      .set('Cookie', solo.cookie)
      .expect(204);
    const after = (await me.get('/api/history')).body.items;
    expect(titles(after)).toEqual(['Faixa 1']);
    // Tocar de novo uma musica removida e recusado.
    expect((await me.post('/api/playback/play', { trackId: a.id })).status).toBe(404);
  });

  it('previous sem nenhum historico responde 409; pause sem faixa responde 409', async () => {
    const solo = await signUp(app, 'vazio');
    expect((await as(solo).post('/api/playback/previous')).status).toBe(409);
    expect((await as(solo).post('/api/playback/pause')).status).toBe(409);
    expect((await as(solo).post('/api/playback/ended', { runId: 'x' })).status).toBe(400);
  });

  it('limpa o historico', async () => {
    const me = as(user);
    const state = (await me.del('/api/history')).body as PlaybackState;
    expect(state.history).toEqual([]);
  });
});
