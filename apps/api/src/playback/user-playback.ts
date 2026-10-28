import { ConflictException, NotFoundException } from '@nestjs/common';
import type {
  CurrentRun,
  HistoryEntry,
  PlaybackState,
  PlaybackStatus,
  QueueEntry,
  TrackSnapshot,
} from '@pulse/shared';
import { randomUUID } from 'node:crypto';
import { FifoQueue } from './structures/fifo-queue';
import { LifoStack } from './structures/lifo-stack';

export interface PlaybackDeps {
  now: () => Date;
  newId: () => string;
}

const defaultDeps: PlaybackDeps = { now: () => new Date(), newId: () => randomUUID() };

const MAX_ERROR_LENGTH = 200;

/**
 * Estado logico de reproducao de UM usuario, mantido em memoria.
 *
 * - `queue` (FIFO): proximas musicas. A primeira a entrar e a primeira a tocar.
 * - `history` (LIFO): execucoes iniciadas. O topo e a execucao mais recente.
 *
 * Regras:
 * - Uma execucao ("run") e registrada no historico quando a faixa COMECA a tocar
 *   (play, next, previous, ended ou enqueue com player ocioso), nunca a cada
 *   atualizacao de progresso. A mesma musica tocada duas vezes gera duas entradas.
 * - "Tocar agora" substitui a faixa atual e nao altera a fila.
 * - "Anterior" desfaz a execucao atual (pop do topo), recupera a anterior (pop) e a
 *   inicia de novo (push). A faixa descartada NAO volta para a fila.
 * - `ended(runId)` so tem efeito se o runId for o da execucao atual, o que torna a
 *   transicao idempotente mesmo com eventos repetidos do navegador.
 * - Invariante: sem faixa atual, a fila esta vazia.
 */
export class UserPlayback {
  private readonly queue = new FifoQueue<QueueEntry>();
  private readonly history = new LifoStack<HistoryEntry>();
  private current: CurrentRun | null = null;
  private status: PlaybackStatus = 'idle';
  private error: string | null = null;

  constructor(private readonly deps: PlaybackDeps = defaultDeps) {}

  snapshot(): PlaybackState {
    return {
      status: this.status,
      current: this.current,
      queue: this.queue.toArray(),
      history: this.history.toArray(),
      error: this.error,
    };
  }

  /** Tocar agora: inicia a faixa imediatamente, sem mexer na fila. */
  play(track: TrackSnapshot): void {
    this.startRun(track);
  }

  /**
   * Adiciona ao fim da fila sem interromper a faixa atual.
   * Se nada estiver tocando, a faixa e retirada da fila e comeca a tocar.
   */
  enqueue(track: TrackSnapshot): void {
    this.queue.enqueue({
      entryId: this.deps.newId(),
      track,
      addedAt: this.deps.now().toISOString(),
    });
    if (!this.current) {
      this.advance();
    }
  }

  /** Avanca para a proxima da fila. Sem proxima, o player fica ocioso. */
  next(): void {
    this.advance();
  }

  /** Veja a regra de "Anterior" na documentacao da classe. */
  previous(): void {
    const currentTrack = this.current?.track;
    const dropped = this.current ? this.history.pop() : undefined;
    const target = this.history.pop();
    const track = target?.track ?? dropped?.track ?? currentTrack;
    if (!track) {
      throw new ConflictException('Nao ha musica anterior para tocar.');
    }
    this.startRun(track);
  }

  /** Fim natural da faixa. Devolve false se o evento era obsoleto e foi ignorado. */
  ended(runId: string): boolean {
    if (this.current?.runId !== runId) return false;
    this.advance();
    return true;
  }

  pause(): void {
    if (!this.current) throw new ConflictException('Nenhuma musica em reproducao.');
    this.status = 'paused';
  }

  resume(): void {
    if (!this.current) throw new ConflictException('Nenhuma musica para retomar.');
    this.status = 'playing';
    this.error = null;
  }

  /**
   * O navegador nao conseguiu reproduzir a faixa. O estado sai de "playing" (nao
   * fica preso) e a mensagem e guardada. Nao avanca sozinho: o usuario escolhe
   * tentar de novo ou pular, o que evita um ciclo infinito de faixas invalidas.
   */
  fail(runId: string, message: string | undefined): boolean {
    if (this.current?.runId !== runId) return false;
    this.status = 'paused';
    this.error = (message?.trim() || 'Nao foi possivel reproduzir esta musica.').slice(
      0,
      MAX_ERROR_LENGTH,
    );
    return true;
  }

  removeFromQueue(entryId: string): void {
    const removed = this.queue.removeWhere((entry) => entry.entryId === entryId);
    if (!removed) throw new NotFoundException('Item da fila nao encontrado.');
  }

  clearQueue(): void {
    this.queue.clear();
  }

  clearHistory(): void {
    this.history.clear();
  }

  /**
   * Musica removida do catalogo: sai da fila (nao seria mais valida para novas
   * acoes). O historico e a faixa atual mantem o snapshot apenas para exibicao.
   */
  purgeTrack(trackId: string): void {
    this.queue.removeAll((entry) => entry.track.id === trackId);
  }

  private advance(): void {
    const entry = this.queue.dequeue();
    if (entry) {
      this.startRun(entry.track);
      return;
    }
    this.current = null;
    this.status = 'idle';
    this.error = null;
  }

  private startRun(track: TrackSnapshot): void {
    const startedAt = this.deps.now().toISOString();
    const runId = this.deps.newId();
    this.current = { runId, track, startedAt };
    this.status = 'playing';
    this.error = null;
    this.history.push({ entryId: this.deps.newId(), runId, track, startedAt });
  }
}
