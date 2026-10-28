import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MusicLibrary } from '../features/library/MusicLibrary';
import { AudioPlayer } from '../features/player/AudioPlayer';
import { PlaybackProvider } from '../features/player/PlaybackProvider';
import { usePlayback } from '../features/player/playback-context';
import { useAuth } from '../features/auth/useAuth';
import { setUnauthorizedHandler } from '../lib/api';
import { authClient } from '../lib/auth-client';
import { ErrorState, LoadingState } from './states';
import { SidePanel } from './SidePanel';
import { TopBar } from './TopBar';
import styles from './AppShell.module.css';

function Workspace() {
  const { ready, loadError, reload } = usePlayback();
  if (!ready) return <LoadingState label="Carregando seu player..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => void reload()} />;
  return (
    <div className={styles.grid}>
      <MusicLibrary />
      <SidePanel />
    </div>
  );
}

/** Estrutura da area autenticada: barra superior, conteudo, painel lateral e player fixo. */
export function AppShell() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => navigate('/login', { replace: true }));
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  if (isPending) return <LoadingState label="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" replace />;

  async function signOut() {
    await authClient.signOut();
    navigate('/login', { replace: true });
  }

  return (
    // key por usuario: ao trocar de conta, todo o estado de reproducao e descartado.
    <PlaybackProvider key={user.id}>
      <TopBar userName={user.name} onSignOut={() => void signOut()} />
      <main className={styles.main}>
        <Workspace />
      </main>
      <AudioPlayer />
    </PlaybackProvider>
  );
}
