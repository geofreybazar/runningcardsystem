import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // Same origin in dev, so the httpOnly refresh cookie (path /api/auth) just works.
  server: { proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' } },
})
