import { Injectable } from '@nestjs/common';
import type { HistoryEntry, PlaybackState, QueueEntry, TrackSnapshot } from '@pulse/shared';
import { MusicService } from '../music/music.service';
import { PlaybackStateManager } from './playback-state.manager';

@Injectable()
export class PlaybackService {
  constructor(
    private readonly state: PlaybackStateManager,
    private readonly music: MusicService,
  ) {}

  getState(userId: string): PlaybackState {
    return this.state.get(userId).snapshot();
  }

  /** Valida a propriedade da musica no catalogo e devolve o snapshot de exibicao. */
  private async snapshotOf(userId: string, trackId: string): Promise<TrackSnapshot> {
    const t = await this.music.getOwned(userId, trackId);
    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      coverUrl: t.coverUrl,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds,
    };
  }

  async play(userId: string, trackId: string): Promise<PlaybackState> {
    const track = await this.snapshotOf(userId, trackId);
    const playback = this.state.get(userId);
    playback.play(track);
    return playback.snapshot();
  }

  async enqueue(userId: string, trackId: string): Promise<PlaybackState> {
    const track = await this.snapshotOf(userId, trackId);
    const playback = this.state.get(userId);
    playback.enqueue(track);
    return playback.snapshot();
  }

  pause(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.pause());
  }

  resume(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.resume());
  }

  next(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.next());
  }

  previous(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.previous());
  }

  ended(userId: string, runId: string): PlaybackState {
    return this.mutate(userId, (p) => void p.ended(runId));
  }

  reportError(userId: string, runId: string, message?: string): PlaybackState {
    return this.mutate(userId, (p) => void p.fail(runId, message));
  }

  removeQueueEntry(userId: string, entryId: string): PlaybackState {
    return this.mutate(userId, (p) => p.removeFromQueue(entryId));
  }

  clearQueue(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.clearQueue());
  }

  clearHistory(userId: string): PlaybackState {
    return this.mutate(userId, (p) => p.clearHistory());
  }

  getQueue(userId: string): QueueEntry[] {
    return this.getState(userId).queue;
  }

  getHistory(userId: string): HistoryEntry[] {
    return this.getState(userId).history;
  }

  private mutate(
    userId: string,
    action: (p: ReturnType<PlaybackStateManager['get']>) => void,
  ): PlaybackState {
    const playback = this.state.get(userId);
    action(playback);
    return playback.snapshot();
  }
}
