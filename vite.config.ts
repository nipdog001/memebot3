import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'web-production-323cf.up.railway.app',
      '.railway.app',
      '.up.railway.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})