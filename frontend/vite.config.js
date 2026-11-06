import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Same origin in dev, so the httpOnly refresh cookie (path /api/auth) just works.
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
