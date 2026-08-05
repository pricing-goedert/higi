import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // Tailwind 4 runs as a Vite plugin instead of a PostCSS plugin — this is
    // what replaced postcss.config.js + autoprefixer. Kept before VitePWA so
    // the service worker still sees the final emitted CSS.
    tailwindcss(),
    VitePWA({
      // Auto-activates + reloads on the next open rather than prompting —
      // the boring default, and docs/PLAN.md flags the service-worker
      // update lifecycle as the single biggest operational risk of running
      // a PWA at a one-time live event, so "it just updates itself" beats
      // building a custom update-prompt UI nobody has tested under
      // pressure.
      registerType: 'autoUpdate',
      // The service worker is otherwise only built in production — this is
      // vite-plugin-pwa's documented way to exercise it against `npm run
      // dev` too, so offline behavior can be checked without a full build
      // each time.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'GoHub Higiexpo',
        short_name: 'Higiexpo',
        description: 'Central de atendimento Goedert na palma da sua mão',
        theme_color: '#143C52',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          // Upscaled from the source 121x121 goedert-icon.png — Chrome on
          // Android requires 192/512 sizes in the manifest to consider the
          // app installable at all (iOS Safari has no such gate, which is
          // why "Add to Home Screen" worked there but Android only offered
          // a plain shortcut). Real higher-res source art should replace
          // these before the Phase 8 pre-expo Lighthouse audit.
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // The default glob patterns exclude jpg — which would silently drop
        // the Mapa da Feira image from the offline cache, defeating the
        // entire point of that screen. Explicit list covers the app shell,
        // icons, the map image, and fonts.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
        // @fontsource/inter ships every Unicode subset; only latin/latin-ext
        // is ever requested for Portuguese content (flagged back in Phase 4
        // Slice A) — precaching the rest wastes offline storage for nothing.
        globIgnores: ['**/inter-{cyrillic,greek,vietnamese}*'],
        // Explicit rather than relying on the plugin's defaults, because the
        // photo warm-up depends on it: the service worker is what writes to
        // the photo cache, so on a first install it has to take control of
        // the page that's already open instead of waiting for a reload —
        // otherwise the very first sync (right after login, the one moment a
        // rep reliably has connectivity) downloads everything and caches
        // none of it.
        clientsClaim: true,
        skipWaiting: true,
        // Product photos aren't in this build — globPatterns can't reach
        // them. They come from /api/produtos/:id/foto, which resizes the
        // ERP's original and serves it from our own origin (see
        // backend/src/routes/produtos.ts).
        //
        // This used to match any image URL by file extension, back when the
        // <img> pointed straight at the ERP's host. That was issue #13: a
        // cross-origin image can only be cached as an opaque response, which
        // Chrome pads by ~7MB each against the storage quota, so warming ~800
        // photos silently hit QuotaExceededError partway through and the rest
        // simply weren't there offline. Matching our own path instead means
        // every entry is a real, measurable, status-carrying response.
        //
        // This rule is now the *only* thing that writes to this cache —
        // lib/fotosCache.ts just issues the requests and lets the service
        // worker store them, so Workbox's expiration bookkeeping stays
        // accurate.
        runtimeCaching: [
          {
            urlPattern: /\/api\/produtos\/[^/]+\/foto$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'produto-fotos',
              expiration: {
                maxEntries: 1200,
                maxAgeSeconds: 60 * 60 * 24 * 120, // 120 dias — cobre a janela do evento com folga
              },
              // Só 200. Antes aceitava 0 (resposta opaca), o que gravava um
              // 404 do ERP como se fosse sucesso e o servia vazio para
              // sempre — sem jeito de se recuperar sozinho.
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
