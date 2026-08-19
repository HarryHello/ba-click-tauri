import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'es2021',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        panel: 'panel.html',
      },
    },
  },
});