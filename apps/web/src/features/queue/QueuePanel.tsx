import { EmptyState } from '../../components/states';
import { CloseIcon, QueueAddIcon, TrashIcon } from '../../components/Icons';
import { Cover } from '../../components/Cover';
import { usePlayback } from '../player/playback-context';
import styles from './QueuePanel.module.css';

/** Fila FIFO exibida na ordem em que as musicas serao reproduzidas. */
export function QueuePanel() {
  const { state, removeFromQueue, clearQueue } = usePlayback();
  const { queue } = state;

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<QueueAddIcon size={22} />}
        title="A fila está vazia"
        description='Use "Adicionar à fila" nas músicas do catálogo para escolher o que toca em seguida.'
      />
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {queue.length} {queue.length === 1 ? 'música' : 'músicas'}
        </span>
        <button type="button" className={styles.clear} onClick={() => void clearQueue()}>
          <TrashIcon size={16} />
          <span>Limpar fila</span>
        </button>
      </div>
      <ol className={styles.list} aria-label="Fila de reprodução">
        {queue.map((entry, index) => (
          <li key={entry.entryId} className={styles.item}>
            <span className={styles.position} aria-hidden="true">
              {index + 1}
            </span>
            <Cover url={entry.track.coverUrl} title={entry.track.title} size={40} />
            <div className={styles.meta}>
              <p className={styles.title}>
                {entry.track.title}
                {index === 0 && <span className={styles.next}>Próxima</span>}
              </p>
              <p className={styles.artist}>{entry.track.artist}</p>
            </div>
            <button
              type="button"
              className={styles.remove}
              onClick={() => void removeFromQueue(entry.entryId, entry.track.title)}
              aria-label={`Remover da fila: ${entry.track.title}`}
              title="Remover da fila"
            >
              <CloseIcon size={18} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
