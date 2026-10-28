import { LogoMark, LogoutIcon } from './Icons';
import styles from './TopBar.module.css';

interface TopBarProps {
  userName: string;
  onSignOut: () => void;
}

export function TopBar({ userName, onSignOut }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <LogoMark size={26} />
        <span>Pulse Player</span>
      </div>
      <nav className={styles.nav} aria-label="Principal">
        <a href="/" aria-current="page">
          Catálogo
        </a>
      </nav>
      <div className={styles.user}>
        <span className={styles.name} title={userName}>
          {userName}
        </span>
        <button type="button" className={styles.signOut} onClick={onSignOut}>
          <LogoutIcon size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
