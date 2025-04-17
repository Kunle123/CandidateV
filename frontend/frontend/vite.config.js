import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // Fail if port is already in use instead of auto-incrementing
    proxy: {
      // Auth Service
      '/api/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // User Service
      '/api/users': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
      },
      // CV Service
      '/api/cv': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
      },
      // Export Service
      '/api/export': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        secure: false,
      },
      // AI Service
      '/api/ai': {
        target: 'http://127.0.0.1:8004',
        changeOrigin: true,
        secure: false,
      },
      // Payment Service
      '/api/payments': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}) 