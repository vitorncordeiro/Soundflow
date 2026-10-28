import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PlaybackState } from '@pulse/shared';
import { Toast, type Notice } from '../../components/Toast';
import { api, errorMessage } from '../../lib/api';
import { PlaybackContext, type PlaybackContextValue } from './playback-context';

const EMPTY_STATE: PlaybackState = {
  status: 'idle',
  current: null,
  queue: [],
  history: [],
  error: null,
};

const NOTICE_MS = 4000;

/**
 * Mantem o estado de reproducao do usuario. O servidor e a fonte de verdade: cada
 * acao chama a API e o estado devolvido substitui o local (sem atualizacao otimista).
 */
export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlaybackState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  const noticeId = useRef(0);
  const requestSeq = useRef(0);
  const appliedSeq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((tone: Notice['tone'], text: string) => {
    noticeId.current += 1;
    setNotice({ id: noticeId.current, tone, text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const dismissNotice = useCallback(() => {
    clearTimeout(timer.current);
    setNotice(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Executa uma chamada; respostas fora de ordem nao sobrescrevem estado mais novo. */
  const run = useCallback(
    async (call: () => Promise<PlaybackState>, successText?: string): Promise<void> => {
      requestSeq.current += 1;
      const seq = requestSeq.current;
      try {
        const next = await call();
        if (seq >= appliedSeq.current) {
          appliedSeq.current = seq;
          setState(next);
        }
        if (successText) notify('success', successText);
      } catch (error) {
        notify('error', errorMessage(error));
      }
    },
    [notify],
  );

  const reload = useCallback(async () => {
    try {
      const initial = await api.playback.get();
      setState(initial);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<PlaybackContextValue>(
    () => ({
      state,
      ready,
      loadError,
      retryNonce,
      notice,
      dismissNotice,
      notify,
      reload,
      playTrack: (t) => run(() => api.playback.play(t.id)),
      enqueueTrack: (t) => run(() => api.queue.add(t.id), `"${t.title}" adicionada à fila.`),
      pause: () => run(() => api.playback.pause()),
      resume: () => run(() => api.playback.resume()),
      next: () => run(() => api.playback.next()),
      previous: () => run(() => api.playback.previous()),
      removeFromQueue: (entryId, title) =>
        run(() => api.queue.remove(entryId), `"${title}" removida da fila.`),
      clearQueue: () => run(() => api.queue.clear(), 'Fila limpa.'),
      clearHistory: () => run(() => api.history.clear(), 'Histórico limpo.'),
      reportEnded: (runId) => run(() => api.playback.ended(runId)),
      reportError: (runId, message) => run(() => api.playback.error(runId, message)),
      retryCurrent: async () => {
        await run(() => api.playback.resume());
        setRetryNonce((n) => n + 1);
      },
    }),
    [state, ready, loadError, retryNonce, notice, dismissNotice, notify, reload, run],
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
      <Toast notice={notice} onDismiss={dismissNotice} />
    </PlaybackContext.Provider>
  );
}
