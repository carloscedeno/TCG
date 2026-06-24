// Trigger redeploy - Sync Fix
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo-emporio.png'],
      manifest: {
        name: 'Geekorium TCG',
        short_name: 'Geekorium',
        description: 'Tu tienda local de TCG',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo-emporio.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-emporio.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // Use the root .env file
  envDir: '../',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react'],
        }
      }
    }
  }
})
