import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const configuredBase = loadEnv(mode, '.', 'VITE_').VITE_BASE_PATH || './';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;
  return {
  base,
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'Prima — śpiewanie z nut', short_name: 'Prima', lang: 'pl',
      description: 'Spokojne ćwiczenia śpiewania z nut, bez presji tempa.',
      theme_color: '#244b40', background_color: '#f7f6f2', display: 'standalone',
      id: './', start_url: './', scope: './',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'], maximumFileSizeToCacheInBytes: 4000000 },
  })],
  };
});
