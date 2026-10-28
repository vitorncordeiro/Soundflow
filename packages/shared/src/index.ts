/**
 * Contratos HTTP compartilhados entre o frontend e a API.
 * Apenas tipos: nenhum codigo do backend e importado pelo frontend.
 */

export type TrackSort = 'title' | 'artist' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/** Musica do catalogo (PostgreSQL). Datas serializadas em ISO 8601. */
export interface Track {
  id: string;
  userId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  audioUrl: string;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackInput {
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  audioUrl: string;
  durationSeconds?: number | null;
}

export type UpdateTrackInput = Partial<CreateTrackInput>;

export interface ListTracksParams {
  q?: string;
  sort?: TrackSort;
  order?: SortOrder;
}

/**
 * Copia minima dos metadados de uma musica, guardada em memoria na fila e no
 * historico. Continua exibivel mesmo que a musica seja removida do catalogo.
 */
export interface TrackSnapshot {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  audioUrl: string;
  durationSeconds: number | null;
}

/** Entrada da fila FIFO. `entryId` e unico mesmo que a musica se repita. */
export interface QueueEntry {
  entryId: string;
  track: TrackSnapshot;
  addedAt: string;
}

/** Entrada da pilha de historico. Cada execucao iniciada gera uma entrada. */
export interface HistoryEntry {
  entryId: string;
  runId: string;
  track: TrackSnapshot;
  startedAt: string;
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused';

/** Execucao em andamento. `runId` muda a cada vez que uma faixa comeca a tocar. */
export interface CurrentRun {
  runId: string;
  track: TrackSnapshot;
  startedAt: string;
}

/** Estado logico de reproducao do usuario, mantido em memoria no backend. */
export interface PlaybackState {
  status: PlaybackStatus;
  current: CurrentRun | null;
  /** Fila na ordem em que as musicas serao reproduzidas (a primeira e a proxima). */
  queue: QueueEntry[];
  /** Historico do mais recente para o mais antigo. */
  history: HistoryEntry[];
  /** Mensagem de falha da faixa atual, quando o navegador reportou erro de audio. */
  error: string | null;
}

export interface ListResponse<T> {
  items: T[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error?: string;
}
