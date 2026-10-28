import type { TrackSnapshot } from '@pulse/shared';
import { PlaybackStateManager } from './playback-state.manager';
import { UserPlayback } from './user-playback';

let seq = 0;
const make = () =>
  new UserPlayback({ now: () => new Date('2026-01-01T00:00:00Z'), newId: () => `id-${++seq}` });
const track = (n: number): TrackSnapshot => ({
  id: `t${n}`,
  title: `Faixa ${n}`,
  artist: 'A',
  album: null,
  coverUrl: null,
  audioUrl: `http://x/${n}.mp3`,
  durationSeconds: null,
});
const titles = (list: { track: TrackSnapshot }[]) => list.map((e) => e.track.title);

describe('UserPlayback', () => {
  it('comeca ocioso e vazio', () => {
    expect(make().snapshot()).toEqual({
      status: 'idle',
      current: null,
      queue: [],
      history: [],
      error: null,
    });
  });

  it('play registra uma execucao no historico e nao mexe na fila', () => {
    const p = make();
    p.enqueue(track(1));
    p.enqueue(track(2));
    p.play(track(9));
    const s = p.snapshot();
    expect(s.current?.track.title).toBe('Faixa 9');
    expect(titles(s.queue)).toEqual(['Faixa 2']);
    expect(titles(s.history)).toEqual(['Faixa 9', 'Faixa 1']);
  });

  it('enqueue com player ocioso inicia; depois so enfileira', () => {
    const p = make();
    p.enqueue(track(1));
    expect(p.snapshot().status).toBe('playing');
    p.enqueue(track(2));
    expect(titles(p.snapshot().queue)).toEqual(['Faixa 2']);
  });

  it('a mesma musica tocada duas vezes gera duas execucoes e entradas de fila distintas', () => {
    const p = make();
    p.play(track(1));
    p.enqueue(track(2));
    p.enqueue(track(2));
    const [a, b] = p.snapshot().queue;
    expect(a!.entryId).not.toBe(b!.entryId);
    p.play(track(1));
    expect(p.snapshot().history).toHaveLength(2);
    expect(new Set(p.snapshot().history.map((h) => h.runId)).size).toBe(2);
  });

  it('ended e idempotente para runId antigo ou desconhecido', () => {
    const p = make();
    p.play(track(1));
    p.enqueue(track(2));
    const run1 = p.snapshot().current!.runId;
    expect(p.ended(run1)).toBe(true);
    expect(p.ended(run1)).toBe(false);
    expect(p.ended('outro')).toBe(false);
    expect(p.snapshot().current?.track.title).toBe('Faixa 2');
  });

  it('ended sem proxima deixa o player ocioso mas preserva o historico', () => {
    const p = make();
    p.play(track(1));
    p.ended(p.snapshot().current!.runId);
    const s = p.snapshot();
    expect(s.status).toBe('idle');
    expect(s.current).toBeNull();
    expect(titles(s.history)).toEqual(['Faixa 1']);
  });

  it('previous recupera a faixa anterior sem recolocar a atual na fila', () => {
    const p = make();
    p.play(track(1));
    p.play(track(2));
    p.play(track(3));
    p.previous();
    const s = p.snapshot();
    expect(s.current?.track.title).toBe('Faixa 2');
    expect(titles(s.history)).toEqual(['Faixa 2', 'Faixa 1']);
    expect(s.queue).toEqual([]);
  });

  it('previous com so a faixa atual no historico reinicia a mesma faixa', () => {
    const p = make();
    p.play(track(1));
    const before = p.snapshot().current!.runId;
    p.previous();
    const s = p.snapshot();
    expect(s.current?.track.title).toBe('Faixa 1');
    expect(s.current?.runId).not.toBe(before);
    expect(s.history).toHaveLength(1);
  });

  it('previous ocioso toca a ultima faixa do historico', () => {
    const p = make();
    p.play(track(1));
    p.play(track(2));
    p.next();
    expect(p.snapshot().status).toBe('idle');
    p.previous();
    expect(p.snapshot().current?.track.title).toBe('Faixa 2');
    expect(titles(p.snapshot().history)).toEqual(['Faixa 2', 'Faixa 1']);
  });

  it('previous sem historico nem faixa atual falha com 409', () => {
    expect(() => make().previous()).toThrow('Nao ha musica anterior');
  });

  it('previous apos limpar o historico reinicia a faixa atual', () => {
    const p = make();
    p.play(track(1));
    p.clearHistory();
    p.previous();
    expect(p.snapshot().current?.track.title).toBe('Faixa 1');
    expect(p.snapshot().history).toHaveLength(1);
  });

  it('pause/resume exigem faixa atual', () => {
    const p = make();
    expect(() => p.pause()).toThrow();
    expect(() => p.resume()).toThrow();
    p.play(track(1));
    p.pause();
    expect(p.snapshot().status).toBe('paused');
    p.resume();
    expect(p.snapshot().status).toBe('playing');
  });

  it('fail tira de playing, guarda mensagem limitada e ignora runId obsoleto', () => {
    const p = make();
    p.play(track(1));
    const run = p.snapshot().current!.runId;
    expect(p.fail('obsoleto', 'x')).toBe(false);
    expect(p.fail(run, 'y'.repeat(500))).toBe(true);
    const s = p.snapshot();
    expect(s.status).toBe('paused');
    expect(s.error).toHaveLength(200);
    p.resume();
    expect(p.snapshot().error).toBeNull();
  });

  it('removeFromQueue falha com 404 para entrada inexistente', () => {
    expect(() => make().removeFromQueue('nao-existe')).toThrow('nao encontrado');
  });

  it('purgeTrack remove da fila todas as ocorrencias, sem tocar na atual nem no historico', () => {
    const p = make();
    p.play(track(1));
    p.enqueue(track(2));
    p.enqueue(track(3));
    p.enqueue(track(2));
    p.purgeTrack('t2');
    expect(titles(p.snapshot().queue)).toEqual(['Faixa 3']);
    p.purgeTrack('t1');
    expect(p.snapshot().current?.track.title).toBe('Faixa 1');
    expect(titles(p.snapshot().history)).toEqual(['Faixa 1']);
  });

  it('snapshot nao expoe estruturas internas mutaveis', () => {
    const p = make();
    p.play(track(1));
    p.enqueue(track(2));
    p.snapshot().queue.length = 0;
    expect(p.snapshot().queue).toHaveLength(1);
  });
});

describe('PlaybackStateManager', () => {
  it('mantem estados separados por usuario', () => {
    const m = new PlaybackStateManager();
    m.get('a').play(track(1));
    expect(m.get('a').snapshot().status).toBe('playing');
    expect(m.get('b').snapshot().status).toBe('idle');
    expect(m.size).toBe(2);
  });

  it('sweep remove apenas estados inativos alem do TTL', () => {
    const m = new PlaybackStateManager();
    m.get('velho', 0);
    m.get('novo', 9_000);
    expect(m.sweep(10_000, 5_000)).toBe(1);
    expect(m.size).toBe(1);
    expect(m.sweep(10_000, 5_000)).toBe(0);
  });

  it('purgeTrack nao cria estado para usuario desconhecido', () => {
    const m = new PlaybackStateManager();
    m.purgeTrack('ninguem', 't1');
    expect(m.size).toBe(0);
  });
});
