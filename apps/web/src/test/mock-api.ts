import { vi } from 'vitest';

const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');

export const ApiError = actual.ApiError;
export const errorMessage = actual.errorMessage;
export const setUnauthorizedHandler = vi.fn();

export const api = {
  tracks: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  playback: {
    get: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    ended: vi.fn(),
    error: vi.fn(),
  },
  queue: { list: vi.fn(), add: vi.fn(), remove: vi.fn(), clear: vi.fn() },
  history: { list: vi.fn(), clear: vi.fn() },
};
