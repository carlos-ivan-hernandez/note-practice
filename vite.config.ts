import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'app-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Note Practice',
        short_name: 'Notes',
        description: 'Sight-reading practice for the treble and bass clefs',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png'},
          {src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png'},
          {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png'},
          {src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
      },
      workbox: {
        // Precache everything, including the Phaser chunk and the music font, so the game works offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    // Phaser is a single ~1.3MB chunk; it's loaded in the background from the start screen and precached.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
  },
});
