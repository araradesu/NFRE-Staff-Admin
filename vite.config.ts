import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/NFRE-Staff-Admin/' : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
  },
}));
