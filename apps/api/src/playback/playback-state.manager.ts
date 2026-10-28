import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UserPlayback } from './user-playback';

const IDLE_TTL_MS = 6 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

interface Slot {
  playback: UserPlayback;
  lastTouchedAt: number;
}

/**
 * Gerenciador do estado de reproducao em memoria, indexado pelo ID do usuario
 * validado na sessao. O estado nao e compartilhado entre instancias do backend e
 * se perde ao reiniciar o processo (comportamento documentado no README).
 */
@Injectable()
export class PlaybackStateManager implements OnModuleInit, OnModuleDestroy {
  private readonly slots = new Map<string, Slot>();
  private timer?: NodeJS.Timeout;

  onModuleInit(): void {
    this.timer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Recupera (ou cria) o estado do usuario e marca atividade. */
  get(userId: string, now = Date.now()): UserPlayback {
    let slot = this.slots.get(userId);
    if (!slot) {
      slot = { playback: new UserPlayback(), lastTouchedAt: now };
      this.slots.set(userId, slot);
    }
    slot.lastTouchedAt = now;
    return slot.playback;
  }

  /** Remove a musica da fila do usuario, se ele ja tiver estado. */
  purgeTrack(userId: string, trackId: string): void {
    this.slots.get(userId)?.playback.purgeTrack(trackId);
  }

  /** Descarta estados sem atividade ha mais que o TTL. Nunca toca em estados recentes. */
  sweep(now = Date.now(), ttlMs = IDLE_TTL_MS): number {
    let removed = 0;
    for (const [userId, slot] of this.slots) {
      if (now - slot.lastTouchedAt > ttlMs) {
        this.slots.delete(userId);
        removed++;
      }
    }
    return removed;
  }

  get size(): number {
    return this.slots.size;
  }
}
