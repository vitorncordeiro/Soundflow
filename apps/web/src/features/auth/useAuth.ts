import { authClient } from '../../lib/auth-client';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/** Sessao atual do Better Auth (cookie HttpOnly gerenciado pelo servidor). */
export function useAuth(): { user: SessionUser | null; isPending: boolean } {
  const { data, isPending } = authClient.useSession();
  const user = data?.user
    ? { id: data.user.id, name: data.user.name, email: data.user.email }
    : null;
  return { user, isPending };
}
