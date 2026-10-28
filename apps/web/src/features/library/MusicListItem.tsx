import type { Track } from '@pulse/shared';
import { Cover } from '../../components/Cover';
import { PencilIcon, PlayIcon, QueueAddIcon, TrashIcon } from '../../components/Icons';
import { formatTime } from '../../lib/format';
import styles from './MusicListItem.module.css';

interface MusicListItemProps {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onEnqueue: (track: Track) => void;
  onEdit: (track: Track) => void;
  onDelete: (track: Track) => void;
}

export function MusicListItem({
  track,
  isCurrent,
  isPlaying,
  onPlay,
  onEnqueue,
  onEdit,
  onDelete,
}: MusicListItemProps) {
  return (
    <li className={`${styles.item} ${isCurrent ? styles.current : ''}`}>
      <Cover url={track.coverUrl} title={track.title} size={48} />
      <div className={styles.meta}>
        <p className={styles.title}>
          {track.title}
          {isCurrent && <span className={styles.badge}>{isPlaying ? 'Tocando' : 'Em pausa'}</span>}
        </p>
        <p className={styles.sub}>
          {track.artist}
          {track.album ? ` · ${track.album}` : ''}
        </p>
      </div>
      <span className={styles.duration}>
        {track.durationSeconds ? formatTime(track.durationSeconds) : ''}
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onPlay(track)}
          aria-label={`Tocar agora: ${track.title}`}
        >
          <PlayIcon size={16} />
          <span>Tocar agora</span>
        </button>
        <button
          type="button"
          className={styles.icon}
          onClick={() => onEnqueue(track)}
          aria-label={`Adicionar à fila: ${track.title}`}
          title="Adicionar à fila"
        >
          <QueueAddIcon />
        </button>
        <button
          type="button"
          className={styles.icon}
          onClick={() => onEdit(track)}
          aria-label={`Editar: ${track.title}`}
          title="Editar"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className={`${styles.icon} ${styles.danger}`}
          onClick={() => onDelete(track)}
          aria-label={`Excluir: ${track.title}`}
          title="Excluir"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
