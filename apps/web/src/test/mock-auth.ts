import { vi } from 'vitest';

export const authClient = {
  useSession: vi.fn(),
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
};

export function mockSession(
  user: { id: string; name: string; email: string } | null,
  isPending = false,
) {
  authClient.useSession.mockReturnValue({ data: user ? { user } : null, isPending });
}
