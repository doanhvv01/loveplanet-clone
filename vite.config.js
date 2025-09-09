import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',    // listen tất cả IPv4
    port: 51777,
    strictPort: true,
    allowedHosts: 'all',
  }
})
