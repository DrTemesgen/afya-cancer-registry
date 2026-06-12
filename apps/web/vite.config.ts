/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Afya Cancer Registry — offline-first PWA.
// The PWA plugin makes the app installable on a tablet or desktop and caches
// the app shell so it loads and runs with no network (data lives in PouchDB).
export default defineConfig({
  plugins: [
    react(),
    // PouchDB (and its deps) extend Node's EventEmitter and expect `process`/`Buffer`.
    // Polyfill those Node builtins so the production browser bundle doesn't crash.
    nodePolyfills({ include: ['events', 'process', 'buffer', 'util'], globals: { process: true, Buffer: true } }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Afya Cancer Registry',
        short_name: 'Afya ACR',
        description: 'Offline-first African Cancer Registry',
        theme_color: '#0b6b3a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
