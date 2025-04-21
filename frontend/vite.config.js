import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Changed from 3000 to 5173 to avoid conflicts
    strictPort: true, // Fail if port is unavailable
    host: '127.0.0.1', // Force IPv4
    proxy: {
      '/api': { // Single proxy route for all API endpoints
        target: 'http://localhost:8000',  // Updated to point to API Gateway port 8000 instead of 3000
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
}) 