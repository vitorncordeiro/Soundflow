import { createAuthClient } from 'better-auth/react';
import { API_URL } from '../env';

const url = new URL(API_URL);

/** Cliente do Better Auth apontando para /api/auth no backend. Cookies via credentials. */
export const authClient = createAuthClient({
  baseURL: url.origin,
  basePath: `${url.pathname.replace(/\/+$/, '')}/auth`,
  fetchOptions: { credentials: 'include' },
});
