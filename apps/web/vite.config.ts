/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // O .env fica na raiz do monorepo (apenas variaveis VITE_* sao expostas ao navegador).
  envDir: '../../',
  server: { port: 5173, strictPort: true },
  // O cliente do Better Auth (com zod) deixa o bundle principal acima de 500 kB.
  build: { chunkSizeWarningLimit: 650 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    restoreMocks: true,
  },
});
