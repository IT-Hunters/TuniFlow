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
    },
  },
  build: {
    // Activer ou désactiver les sourcemaps selon vos besoins
    sourcemap: true, // Changez à false si vous voulez désactiver pour le prod
    // Optimisation des chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Sépare les dépendances dans un chunk 'vendor'
          }
        },
      },
    },
    // Ajuster la limite d'avertissement de taille des chunks
    chunkSizeWarningLimit: 1000, // Augmente à 1000 kB pour réduire les warnings
  },
  // Configuration des assets pour résoudre les images comme darkBG.png
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
});