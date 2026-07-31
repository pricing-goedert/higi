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
          {
            // Placeholder: the only Goedert icon asset available today is
            // 121x121. Real 192/512 art needs to replace this before the
            // Phase 8 pre-expo Lighthouse audit — see docs/PROGRESS.md.
            src: 'goedert-icon.png',
            sizes: '121x121',
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
