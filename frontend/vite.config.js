/* global process */ // runs in Node
import path from 'path'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // Validation rules shared with the API (one file, imported by both).
      '@shared': path.resolve(import.meta.dirname, '../backend/src/shared'),
    },
    // The shared file imports zod: always use this app's copy (the backend's isn't there in the Docker build).
    dedupe: ['zod'],
  },
  // Same origin in dev, so the httpOnly refresh cookie (path /api/auth) just works.
  server: {
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' },
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(import.meta.dirname, '../backend/src/shared')] },
  },
})
