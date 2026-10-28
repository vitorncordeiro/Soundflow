import { useEffect, useState } from 'react';
import type { CreateTrackInput, Track } from '@pulse/shared';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import { MusicIcon, PlusIcon, SearchIcon } from '../../components/Icons';
import { api } from '../../lib/api';
import { usePlayback } from '../player/playback-context';
import { MusicListItem } from './MusicListItem';
import { TrackForm } from './TrackForm';
import { useTracks, type SortChoice } from './useTracks';
import styles from './MusicLibrary.module.css';

export function MusicLibrary() {
  const playback = usePlayback();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortChoice>('recent');
  const [formTrack, setFormTrack] = useState<Track | 'new' | null>(null);
  const { items, status, error, reload } = useTracks(query, sort);

  // Debounce da busca para nao consultar a API a cada tecla.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const currentTrackId = playback.state.current?.track.id;
  const isPlaying = playback.state.status === 'playing';

  async function handleSave(input: CreateTrackInput) {
    if (formTrack && formTrack !== 'new') {
      await api.tracks.update(formTrack.id, input);
      playback.notify('success', `"${input.title}" atualizada.`);
    } else {
      await api.tracks.create(input);
      playback.notify('success', `"${input.title}" adicionada ao catálogo.`);
    }
    setFormTrack(null);
    await reload();
  }

  async function handleDelete(track: Track) {
    if (!window.confirm(`Excluir "${track.title}" do catálogo?`)) return;
    try {
      await api.tracks.remove(track.id);
      playback.notify('success', `"${track.title}" excluída.`);
      await Promise.all([reload(), playback.reload()]);
    } catch (e) {
      playback.notify('error', e instanceof Error ? e.message : 'Não foi possível excluir.');
    }
  }

  const hasFilter = query.length > 0;

  return (
    <section className={styles.library} aria-labelledby="library-title">
      <header className={styles.header}>
        <div>
          <h1 id="library-title" className={styles.title}>
            Seu catálogo
          </h1>
          <p className={styles.subtitle}>
            {status === 'ready'
              ? `${items.length} ${items.length === 1 ? 'música' : 'músicas'}`
              : ' '}
          </p>
        </div>
        <button type="button" className={styles.add} onClick={() => setFormTrack('new')}>
          <PlusIcon size={18} />
          <span>Adicionar música</span>
        </button>
      </header>

      <div className={styles.tools}>
        <label className={styles.search}>
          <SearchIcon size={18} />
          <span className="visually-hidden">Buscar por título ou artista</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou artista"
            maxLength={100}
          />
        </label>
        <label className={styles.sort}>
          <span className="visually-hidden">Ordenar por</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortChoice)}>
            <option value="recent">Mais recentes</option>
            <option value="title">Título (A-Z)</option>
            <option value="artist">Artista (A-Z)</option>
          </select>
        </label>
      </div>

      {status === 'loading' && items.length === 0 && (
        <LoadingState label="Carregando catálogo..." />
      )}
      {status === 'error' && (
        <ErrorState message={error ?? 'Erro desconhecido.'} onRetry={() => void reload()} />
      )}
      {status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={<MusicIcon size={24} />}
          title={hasFilter ? 'Nada encontrado' : 'Seu catálogo está vazio'}
          description={
            hasFilter
              ? 'Tente outro termo de busca.'
              : 'Adicione sua primeira música informando o título, o artista e a URL do áudio.'
          }
          action={
            hasFilter ? undefined : (
              <button type="button" className={styles.add} onClick={() => setFormTrack('new')}>
                <PlusIcon size={18} />
                <span>Adicionar música</span>
              </button>
            )
          }
        />
      )}

      {items.length > 0 && (
        <ul className={styles.list} aria-label="Músicas do catálogo">
          {items.map((track) => (
            <MusicListItem
              key={track.id}
              track={track}
              isCurrent={currentTrackId === track.id}
              isPlaying={isPlaying}
              onPlay={(t) => void playback.playTrack(t)}
              onEnqueue={(t) => void playback.enqueueTrack(t)}
              onEdit={setFormTrack}
              onDelete={(t) => void handleDelete(t)}
            />
          ))}
        </ul>
      )}

      {formTrack && (
        <TrackForm
          track={formTrack === 'new' ? undefined : formTrack}
          onSubmit={handleSave}
          onClose={() => setFormTrack(null)}
        />
      )}
    </section>
  );
}
