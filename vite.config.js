import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// `base` is configurable via env so the same vite.config works for
// localhost (`/`) and for GitHub Pages sub-paths (e.g. `/c2c-mobile/`).
// Set `VITE_BASE=/c2c-mobile/` in CI to deploy under that path.
const BASE = process.env.VITE_BASE || '/';

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Camptocamp',
        short_name: 'Camptocamp',
        description: 'Topoguide alpinisme, escalade, ski, randonnée — accessible et offline-first.',
        theme_color: '#ff9933',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          // Relative paths so the PWA manifest resolves them against its own
          // location (works whether deployed at `/` or under a sub-path).
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.camptocamp\.org\/(articles|books|images|outings|routes|waypoints|xreports)\/\d+\?cook=.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'c2c-api-docs',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 90 * 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/.*camptocamp\.org\/.*\.(?:jpg|jpeg|png|gif|svg|webp|avif)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'c2c-images',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 500, maxAgeSeconds: 90 * 86400, purgeOnQuotaError: true },
            },
          },
          {
            urlPattern: /^https:\/\/api\.camptocamp\.org\/images\/proxy\/\d+/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'c2c-images',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 500, maxAgeSeconds: 90 * 86400, purgeOnQuotaError: true },
            },
          },
          {
            urlPattern: /\/\d+\/\d+\/\d+\.(png|jpe?g|webp|pbf)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'c2c-map-tiles',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 86400, purgeOnQuotaError: true },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // SW disabled in dev to make iteration smoother
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
