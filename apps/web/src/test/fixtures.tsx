import type { HistoryEntry, PlaybackState, QueueEntry, Track, TrackSnapshot } from '@pulse/shared';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PlaybackProvider } from '../features/player/PlaybackProvider';

export const track = (n: number, extra: Partial<Track> = {}): Track => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  userId: 'u1',
  title: `Faixa ${n}`,
  artist: `Artista ${n}`,
  album: null,
  coverUrl: null,
  audioUrl: `http://localhost/audio-${n}.mp3`,
  durationSeconds: 60 + n,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...extra,
});

export const snapshot = (n: number): TrackSnapshot => {
  const t = track(n);
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    coverUrl: t.coverUrl,
    audioUrl: t.audioUrl,
    durationSeconds: t.durationSeconds,
  };
};

export const queueEntry = (n: number, entryId = `entry-${n}`): QueueEntry => ({
  entryId,
  track: snapshot(n),
  addedAt: '2026-01-01T10:00:00.000Z',
});

export const historyEntry = (n: number): HistoryEntry => ({
  entryId: `h-${n}`,
  runId: `run-${n}`,
  track: snapshot(n),
  startedAt: '2026-01-01T10:30:00.000Z',
});

export const idleState = (over: Partial<PlaybackState> = {}): PlaybackState => ({
  status: 'idle',
  current: null,
  queue: [],
  history: [],
  error: null,
  ...over,
});

export const playingState = (n: number, over: Partial<PlaybackState> = {}): PlaybackState => ({
  status: 'playing',
  current: { runId: `run-${n}`, track: snapshot(n), startedAt: '2026-01-01T10:30:00.000Z' },
  queue: [],
  history: [],
  error: null,
  ...over,
});

export function renderWithPlayback(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <PlaybackProvider>{ui}</PlaybackProvider>
    </MemoryRouter>,
  );
}
