import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CreateTrackInput, Track } from '@pulse/shared';
import { CloseIcon } from '../../components/Icons';
import { errorMessage } from '../../lib/api';
import styles from './TrackForm.module.css';

interface TrackFormProps {
  /** Musica em edicao; ausente para criar uma nova. */
  track?: Track;
  onSubmit: (input: CreateTrackInput) => Promise<void>;
  onClose: () => void;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function TrackForm({ track, onSubmit, onClose }: TrackFormProps) {
  const [title, setTitle] = useState(track?.title ?? '');
  const [artist, setArtist] = useState(track?.artist ?? '');
  const [album, setAlbum] = useState(track?.album ?? '');
  const [audioUrl, setAudioUrl] = useState(track?.audioUrl ?? '');
  const [coverUrl, setCoverUrl] = useState(track?.coverUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!title.trim() || !artist.trim()) return setError('Título e artista são obrigatórios.');
    if (!isHttpUrl(audioUrl.trim())) return setError('Informe uma URL de áudio http(s) válida.');
    if (coverUrl.trim() && !isHttpUrl(coverUrl.trim())) {
      return setError('A URL da capa deve ser http(s) válida.');
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || null,
        audioUrl: audioUrl.trim(),
        coverUrl: coverUrl.trim() || null,
      });
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-form-title"
      >
        <header className={styles.header}>
          <h2 id="track-form-title">{track ? 'Editar música' : 'Adicionar música'}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.field}>
            <span>Título</span>
            <input
              ref={firstField}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Artista</span>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={200}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Álbum (opcional)</span>
            <input value={album} onChange={(e) => setAlbum(e.target.value)} maxLength={200} />
          </label>
          <label className={styles.field}>
            <span>URL do áudio</span>
            <input
              type="url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://exemplo.com/musica.mp3"
              required
            />
          </label>
          <label className={styles.field}>
            <span>URL da capa (opcional)</span>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://exemplo.com/capa.jpg"
            />
          </label>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.footer}>
            <button type="button" className={styles.secondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
