import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-files',
      closeBundle() {
        const publicDir = 'public';
        const outDir = 'dist';

        try {
          const files = readdirSync(publicDir);
          files.forEach(file => {
            if (file.includes('image copy copy copy copy copy copy')) {
              return;
            }
            try {
              const srcPath = join(publicDir, file);
              const destPath = join(outDir, file);
              if (statSync(srcPath).isFile()) {
                copyFileSync(srcPath, destPath);
              }
            } catch (e) {
              console.warn(`Could not copy ${file}:`, e);
            }
          });
        } catch (e) {
          console.warn('Could not copy public files:', e);
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: false,
});
