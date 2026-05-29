import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget = env.VITE_API_PROXY;
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/lucide-react')) return 'icons';
          }
        }
      }
    },
    server: apiTarget ? {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true }
      }
    } : undefined
  };
})
