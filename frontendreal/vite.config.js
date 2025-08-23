import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Change this to your desired port
    proxy: {
      // Proxy Socket.IO requests to backend to avoid CORS
      '/socket.io': {
        target: 'http://localhost:5555',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})