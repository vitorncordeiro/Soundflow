import { VolumeIcon, VolumeMuteIcon } from '../../components/Icons';
import styles from './VolumeControl.module.css';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export function VolumeControl({ volume, muted, onVolumeChange, onToggleMute }: VolumeControlProps) {
  const effective = muted ? 0 : volume;
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.mute}
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? 'Restaurar volume' : 'Silenciar'}
      >
        {muted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
      </button>
      <input
        type="range"
        className={styles.range}
        style={{ '--progress': `${effective * 100}%` } as React.CSSProperties}
        min={0}
        max={1}
        step={0.01}
        value={effective}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)}%`}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
      />
    </div>
  );
}
