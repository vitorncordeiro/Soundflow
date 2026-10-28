import { EmptyState } from '../../components/states';
import { ClockIcon, ReplayIcon, TrashIcon } from '../../components/Icons';
import { Cover } from '../../components/Cover';
import { formatClock } from '../../lib/format';
import { usePlayback } from '../player/playback-context';
import styles from '../queue/QueuePanel.module.css';
import local from './HistoryPanel.module.css';

/**
 * Historico (pilha LIFO) listado do mais recente para o mais antigo.
 * Ele e mantido em memoria no backend: reiniciar o servidor o zera.
 */
export function HistoryPanel() {
  const { state, playTrack, clearHistory } = usePlayback();
  const { history } = state;

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon size={22} />}
        title="Nada tocado ainda"
        description="As músicas que você ouvir aparecem aqui, da mais recente para a mais antiga."
      />
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {history.length} {history.length === 1 ? 'reprodução' : 'reproduções'}
        </span>
        <button type="button" className={styles.clear} onClick={() => void clearHistory()}>
          <TrashIcon size={16} />
          <span>Limpar histórico</span>
        </button>
      </div>
      <ol className={styles.list} aria-label="Histórico de reprodução">
        {history.map((entry) => (
          <li key={entry.entryId} className={local.item}>
            <Cover url={entry.track.coverUrl} title={entry.track.title} size={40} />
            <div className={styles.meta}>
              <p className={styles.title}>{entry.track.title}</p>
              <p className={styles.artist}>
                {entry.track.artist} · às {formatClock(entry.startedAt)}
              </p>
            </div>
            <button
              type="button"
              className={styles.remove}
              onClick={() => void playTrack(entry.track)}
              aria-label={`Tocar novamente: ${entry.track.title}`}
              title="Tocar novamente"
            >
              <ReplayIcon size={18} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
