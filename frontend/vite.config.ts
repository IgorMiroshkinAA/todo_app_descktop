import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.ts',
      onstart: () => {}, // отключаем автоматический запуск Electron
      vite: {
        build: {
          outDir: 'dist-electron',
          rollupOptions: {
            input: {
              main: 'electron/main.ts',
              preload: 'electron/preload.ts',
            },
            output: {
              format: 'cjs',
              entryFileNames: '[name].js',
            },
          },
        },
      },
    }),
  ],
  server: {
    port: 5173,
  },
});