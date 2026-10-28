import type {
  CreateTrackInput,
  HistoryEntry,
  ListResponse,
  ListTracksParams,
  PlaybackState,
  QueueEntry,
  Track,
  UpdateTrackInput,
} from '@pulse/shared';
import { API_URL } from '../env';

/** Erro de API com status HTTP e mensagem pronta para exibir. status 0 = falha de rede. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;
/** Registra o que fazer quando a API responder 401 (sessao expirada). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const NETWORK_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.';

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join('. ');
    if (typeof message === 'string') return message;
  }
  if (status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.';
  return `Falha na requisição (${status}).`;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, NETWORK_MESSAGE);
  }

  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
    throw new ApiError(response.status, messageFrom(body, response.status));
  }
  return body as T;
}

export const api = {
  tracks: {
    list: (params: ListTracksParams, signal?: AbortSignal) => {
      const query = new URLSearchParams();
      if (params.q) query.set('q', params.q);
      if (params.sort) query.set('sort', params.sort);
      if (params.order) query.set('order', params.order);
      const qs = query.toString();
      return request<Track[]>(`/music${qs ? `?${qs}` : ''}`, { signal });
    },
    create: (input: CreateTrackInput) => request<Track>('/music', { method: 'POST', body: input }),
    update: (id: string, input: UpdateTrackInput) =>
      request<Track>(`/music/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/music/${id}`, { method: 'DELETE' }),
  },
  playback: {
    get: () => request<PlaybackState>('/playback'),
    play: (trackId: string) =>
      request<PlaybackState>('/playback/play', { method: 'POST', body: { trackId } }),
    pause: () => request<PlaybackState>('/playback/pause', { method: 'POST' }),
    resume: () => request<PlaybackState>('/playback/resume', { method: 'POST' }),
    next: () => request<PlaybackState>('/playback/next', { method: 'POST' }),
    previous: () => request<PlaybackState>('/playback/previous', { method: 'POST' }),
    ended: (runId: string) =>
      request<PlaybackState>('/playback/ended', { method: 'POST', body: { runId } }),
    error: (runId: string, message: string) =>
      request<PlaybackState>('/playback/error', { method: 'POST', body: { runId, message } }),
  },
  queue: {
    list: () => request<ListResponse<QueueEntry>>('/queue'),
    add: (trackId: string) =>
      request<PlaybackState>('/queue', { method: 'POST', body: { trackId } }),
    remove: (entryId: string) => request<PlaybackState>(`/queue/${entryId}`, { method: 'DELETE' }),
    clear: () => request<PlaybackState>('/queue', { method: 'DELETE' }),
  },
  history: {
    list: () => request<ListResponse<HistoryEntry>>('/history'),
    clear: () => request<PlaybackState>('/history', { method: 'DELETE' }),
  },
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.';
}
