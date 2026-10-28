/** URL base da API, incluindo o prefixo /api. Configurada por VITE_API_URL. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(
  /\/+$/,
  '',
);
