import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables from .env files
dotenv.config()

const BACKEND = process.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5555'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
      },
      '/uploads': {
        target: BACKEND,
        changeOrigin: true,
      },
      '/socket.io': {
        target: BACKEND,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
