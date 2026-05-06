import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Base path for asset URLs.
//   - Local dev / preview: '/'
//   - GitHub Pages project site: '/<repo>/' (provided by configure-pages action via VITE_BASE)
//   - User can override with VITE_BASE env var
const base = process.env.VITE_BASE && process.env.VITE_BASE.length > 0 ? process.env.VITE_BASE : '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
