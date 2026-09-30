import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon-v2.svg',
            'icon-v2.svg',
            'apple-touch-icon-v2.png',
            'favicon-32x32-v2.png',
            'favicon-16x16-v2.png',
            'icon-192-v2.png',
            'icon-512-v2.png',
            'icon-maskable-512-v2.png',
            'favicon.svg',
            'icon.svg',
            'apple-touch-icon.png',
            'favicon-32x32.png',
            'favicon-16x16.png',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'pwa-maskable-512x512.png'
          ],
          manifest: {
            id: '/',
            name: 'SuperLista - Lista de Compras',
            short_name: 'SuperLista',
            description: 'Um gerenciador de lista de compras otimizado para uso móvel com uma mão, focado em rapidez, acessibilidade e clareza visual no supermercado.',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'portrait-primary',
            background_color: '#FFFFFF',
            theme_color: '#2563EB',
            icons: [
              {
                src: '/icon-192-v2.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-512-v2.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-maskable-512-v2.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: '/icon-v2.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
