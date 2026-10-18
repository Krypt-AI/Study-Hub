/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { syncPublicDirPlugin } from './scripts/vite/syncPublicDir.ts';

export default defineConfig({
  // public/ is large (page images, audio): it is synced into dist incrementally instead of emptied and recopied.
  plugins: [react(), tailwindcss(), syncPublicDirPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // The code editor and WebAssembly runtimes are split into lazy chunks; this only
    // silences the warning for those intentionally large chunks.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'supabase/tests/**/*.test.ts', 'netlify/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
