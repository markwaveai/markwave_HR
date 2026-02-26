import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: [
        'hr.markwave.ai',
        'localhost',
        '127.0.0.1'
      ],
      hmr: {
        host: 'hr.markwave.ai',
        clientPort: 443,
        protocol: 'wss'
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/media': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    }
  }
})
