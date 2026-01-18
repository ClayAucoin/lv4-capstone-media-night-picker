import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // important for remote access
    port: 3080,      // your static port
    strictPort: true // prevents auto-increment
  }
})