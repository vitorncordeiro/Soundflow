import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/states';
import { AuthForm } from './features/auth/AuthForm';
import { useAuth } from './features/auth/useAuth';

/** Telas de login/cadastro: quem ja tem sessao vai direto para o catalogo. */
function PublicOnly({ mode }: { mode: 'login' | 'signup' }) {
  const { user, isPending } = useAuth();
  if (isPending) return <LoadingState label="Verificando sessão..." />;
  if (user) return <Navigate to="/" replace />;
  return <AuthForm mode={mode} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly mode="login" />} />
      <Route path="/cadastro" element={<PublicOnly mode="signup" />} />
      <Route path="/" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
