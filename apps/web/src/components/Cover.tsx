import { useState } from 'react';
import { MusicIcon } from './Icons';
import styles from './Cover.module.css';

interface CoverProps {
  url: string | null;
  title: string;
  size?: number;
}

/** Capa da musica. Sem URL (ou se a imagem falhar) mostra um placeholder neutro. */
export function Cover({ url, title, size = 48 }: CoverProps) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (url && !failed) {
    return (
      <img
        className={styles.cover}
        style={style}
        src={url}
        alt={`Capa de ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={`${styles.cover} ${styles.placeholder}`} style={style} aria-hidden="true">
      <MusicIcon size={Math.round(size * 0.45)} />
    </span>
  );
}
