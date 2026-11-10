/* global process */ // runs in Node
import path from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Shown on the About page. Docker builds have no .git, so they pass the commit in GIT_COMMIT (see the Dockerfile).
const gitCommit = () => {
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return null
  }
}
const BUILD = {
  version: JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version,
  date: new Date().toISOString(),
  commit: gitCommit(),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __BUILD__: JSON.stringify(BUILD) },
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
