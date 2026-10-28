import { createContext, useContext } from 'react';
import type { PlaybackState } from '@pulse/shared';
import type { Notice } from '../../components/Toast';

/** Dados minimos de uma musica para pedir reproducao ou enfileirar. */
export interface TrackRef {
  id: string;
  title: string;
}

export interface PlaybackContextValue {
  /** Estado logico vindo do servidor (fonte de verdade de fila, historico e faixa atual). */
  state: PlaybackState;
  ready: boolean;
  loadError: string | null;
  /** Incrementa quando o usuario pede para tentar de novo a faixa que falhou. */
  retryNonce: number;
  notice: Notice | null;
  dismissNotice: () => void;
  notify: (tone: Notice['tone'], text: string) => void;
  reload: () => Promise<void>;
  playTrack: (track: TrackRef) => Promise<void>;
  enqueueTrack: (track: TrackRef) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  removeFromQueue: (entryId: string, title: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  clearHistory: () => Promise<void>;
  reportEnded: (runId: string) => Promise<void>;
  reportError: (runId: string, message: string) => Promise<void>;
  retryCurrent: () => Promise<void>;
}

export const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function usePlayback(): PlaybackContextValue {
  const value = useContext(PlaybackContext);
  if (!value) throw new Error('usePlayback deve ser usado dentro de <PlaybackProvider>');
  return value;
}
