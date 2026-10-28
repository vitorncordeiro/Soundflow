import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '../../components/Icons';
import styles from './PlaybackControls.module.css';

interface PlaybackControlsProps {
  /** Verdadeiro quando o audio esta de fato tocando (mostra o botao de pausar). */
  playing: boolean;
  loading: boolean;
  hasCurrent: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function PlaybackControls({
  playing,
  loading,
  hasCurrent,
  canPrevious,
  canNext,
  onPlayPause,
  onPrevious,
  onNext,
}: PlaybackControlsProps) {
  return (
    <div className={styles.controls} role="group" aria-label="Controles de reprodução">
      <button
        type="button"
        className={styles.side}
        onClick={onPrevious}
        disabled={!canPrevious}
        aria-label="Música anterior"
        title="Anterior (depois de 3 s, volta ao início da música)"
      >
        <SkipBackIcon size={22} />
      </button>
      <button
        type="button"
        className={styles.main}
        onClick={onPlayPause}
        disabled={!hasCurrent}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
        aria-busy={loading}
      >
        {playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
      </button>
      <button
        type="button"
        className={styles.side}
        onClick={onNext}
        disabled={!canNext}
        aria-label="Próxima música"
      >
        <SkipForwardIcon size={22} />
      </button>
    </div>
  );
}
