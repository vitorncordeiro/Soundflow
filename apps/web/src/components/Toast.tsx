import { AlertIcon, CheckIcon, CloseIcon } from './Icons';
import styles from './Toast.module.css';

export interface Notice {
  id: number;
  tone: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  notice: Notice | null;
  onDismiss: () => void;
}

/** Feedback transitorio. Usa texto e icone, nao apenas cor, para indicar o tipo. */
export function Toast({ notice, onDismiss }: ToastProps) {
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {notice && (
        <div className={`${styles.toast} ${styles[notice.tone]}`} key={notice.id}>
          {notice.tone === 'error' ? <AlertIcon size={18} /> : <CheckIcon size={18} />}
          <span>{notice.text}</span>
          <button
            type="button"
            className={styles.close}
            onClick={onDismiss}
            aria-label="Fechar aviso"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
