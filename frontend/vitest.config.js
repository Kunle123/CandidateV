import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup/testEnv.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    testTimeout: 15000,
    hookTimeout: 20000,
    env: {
      VITE_SUPABASE_URL: 'https://aqmybjkzxfwiizorveco.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXliamt6eGZ3aWl6b3J2ZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDU1NTYsImV4cCI6MjA2MDgyMTU1Nn0.Ais3ZEu95OyqitcscyfmztxogCqcqrHjo9BZWPrqQKw'
    }
  },
}); 