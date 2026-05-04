import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'kurukin-video-player': resolve(__dirname, './kurukin-video-player-pkg/src/kurukin-video-player/dev.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['kurukin-video-player', 'lucide-react'],
  },
});
