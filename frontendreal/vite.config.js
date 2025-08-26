import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables from .env files
dotenv.config()

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://3.128.25.225/api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Change this to your desired port
    proxy: {
      // Proxy Socket.IO requests to backend to avoid CORS
      '/socket.io': {
        target: BACKEND,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})