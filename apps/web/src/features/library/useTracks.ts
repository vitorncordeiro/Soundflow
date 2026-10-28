import { useCallback, useEffect, useRef, useState } from 'react';
import type { SortOrder, Track, TrackSort } from '@pulse/shared';
import { api, errorMessage } from '../../lib/api';

export type SortChoice = 'recent' | 'title' | 'artist';

const SORT_PARAMS: Record<SortChoice, { sort: TrackSort; order: SortOrder }> = {
  recent: { sort: 'createdAt', order: 'desc' },
  title: { sort: 'title', order: 'asc' },
  artist: { sort: 'artist', order: 'asc' },
};

export interface TracksState {
  items: Track[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
}

/** Carrega o catalogo do usuario. Requisicoes antigas sao canceladas ao mudar busca/ordem. */
export function useTracks(query: string, sort: SortChoice) {
  const [state, setState] = useState<TracksState>({ items: [], status: 'loading', error: null });
  const controller = useRef<AbortController>(undefined);

  const load = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const items = await api.tracks.list(
        { q: query || undefined, ...SORT_PARAMS[sort] },
        abort.signal,
      );
      if (!abort.signal.aborted) setState({ items, status: 'ready', error: null });
    } catch (error) {
      if (abort.signal.aborted) return;
      setState((s) => ({ ...s, status: 'error', error: errorMessage(error) }));
    }
  }, [query, sort]);

  useEffect(() => {
    void load();
    return () => controller.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
