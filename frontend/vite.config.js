import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Ajout d'un alias pour les images
      '/images': path.resolve(__dirname, 'images'),
    },
  },
  build: {
    sourcemap: false, // Désactiver les sourcemaps pour éviter les erreurs
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Séparer les dépendances dans un chunk 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Limite d'avertissement à 1000 kB
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'], // Inclure les assets
});