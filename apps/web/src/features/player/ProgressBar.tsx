import { formatTime } from '../../lib/format';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  disabled: boolean;
  onSeek: (seconds: number) => void;
}

/** Barra de progresso com busca por posicao. Um input range nativo e operavel por teclado. */
export function ProgressBar({ currentTime, duration, disabled, onSeek }: ProgressBarProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const value = Math.min(currentTime, safeDuration);
  const percent = safeDuration ? (value / safeDuration) * 100 : 0;

  return (
    <div className={styles.wrapper}>
      <span className={styles.time}>{formatTime(value)}</span>
      <input
        type="range"
        className={styles.range}
        style={{ '--progress': `${percent}%` } as React.CSSProperties}
        min={0}
        max={safeDuration || 1}
        step={0.1}
        value={value}
        disabled={disabled || !safeDuration}
        aria-label="Posição na música"
        aria-valuetext={`${formatTime(value)} de ${formatTime(safeDuration)}`}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <span className={styles.time}>{formatTime(safeDuration)}</span>
    </div>
  );
}
