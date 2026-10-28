import { useId, useState, type KeyboardEvent } from 'react';
import { HistoryPanel } from '../features/history/HistoryPanel';
import { QueuePanel } from '../features/queue/QueuePanel';
import { usePlayback } from '../features/player/playback-context';
import styles from './SidePanel.module.css';

type Tab = 'queue' | 'history';

/** Painel secundario com abas acessiveis (setas alternam entre Fila e Historico). */
export function SidePanel() {
  const { state } = usePlayback();
  const [tab, setTab] = useState<Tab>('queue');
  const baseId = useId();
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'queue', label: 'Fila', count: state.queue.length },
    { id: 'history', label: 'Histórico', count: state.history.length },
  ];

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      setTab((t) => (t === 'queue' ? 'history' : 'queue'));
      event.preventDefault();
    }
  }

  return (
    <aside className={styles.panel} aria-label="Fila e histórico">
      <div className={styles.tabs} role="tablist" onKeyDown={onKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${baseId}-${t.id}-tab`}
            aria-selected={tab === t.id}
            aria-controls={`${baseId}-${t.id}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className={styles.count}>{t.count}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-${tab}-panel`}
        aria-labelledby={`${baseId}-${tab}-tab`}
        className={styles.body}
      >
        {tab === 'queue' ? <QueuePanel /> : <HistoryPanel />}
      </div>
    </aside>
  );
}
