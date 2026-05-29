import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget = env.VITE_API_PROXY;
  return {
    plugins: [react()],
    server: apiTarget ? {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true }
      }
    } : undefined
  };
})
