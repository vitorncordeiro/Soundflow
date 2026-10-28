import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { LogoMark } from '../../components/Icons';
import { authErrorMessage } from './auth-messages';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = isSignup
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(authErrorMessage(result.error));
        return;
      }
      navigate('/', { replace: true });
    } catch {
      setError(authErrorMessage({ status: 0 }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="auth-title">
        <div className={styles.brand}>
          <LogoMark size={28} />
          <span>Pulse Player</span>
        </div>
        <h1 id="auth-title" className={styles.title}>
          {isSignup ? 'Crie sua conta' : 'Bem-vindo de volta'}
        </h1>
        <p className={styles.subtitle}>
          {isSignup
            ? 'Monte seu catálogo, organize a fila e volte a ouvir o que tocou.'
            : 'Entre para acessar seu catálogo, sua fila e seu histórico.'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {isSignup && (
            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                maxLength={80}
              />
            </label>
          )}
          <label className={styles.field}>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <div className={styles.field}>
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={8}
              aria-describedby={isSignup ? 'password-hint' : undefined}
            />
            {isSignup && (
              <small id="password-hint" className={styles.hint}>
                Mínimo de 8 caracteres.
              </small>
            )}
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <p className={styles.switch}>
          {isSignup ? (
            <>
              Já tem conta? <Link to="/login">Entrar</Link>
            </>
          ) : (
            <>
              Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
