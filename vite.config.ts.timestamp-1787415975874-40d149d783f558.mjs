// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vitest/dist/config.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { copyFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "copy-public-files",
      closeBundle() {
        const publicDir = "public";
        const outDir = "dist";
        try {
          const files = readdirSync(publicDir);
          files.forEach((file) => {
            if (file.includes("image copy copy copy copy copy copy")) {
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
          console.warn("Could not copy public files:", e);
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  publicDir: false,
  test: {
    environment: "jsdom",
    globals: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIHJlYWRkaXJTeW5jLCBzdGF0U3luYywgbWtkaXJTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAge1xuICAgICAgbmFtZTogJ2NvcHktcHVibGljLWZpbGVzJyxcbiAgICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgICBjb25zdCBwdWJsaWNEaXIgPSAncHVibGljJztcbiAgICAgICAgY29uc3Qgb3V0RGlyID0gJ2Rpc3QnO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZmlsZXMgPSByZWFkZGlyU3luYyhwdWJsaWNEaXIpO1xuICAgICAgICAgIGZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsZS5pbmNsdWRlcygnaW1hZ2UgY29weSBjb3B5IGNvcHkgY29weSBjb3B5IGNvcHknKSkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzcmNQYXRoID0gam9pbihwdWJsaWNEaXIsIGZpbGUpO1xuICAgICAgICAgICAgICBjb25zdCBkZXN0UGF0aCA9IGpvaW4ob3V0RGlyLCBmaWxlKTtcbiAgICAgICAgICAgICAgaWYgKHN0YXRTeW5jKHNyY1BhdGgpLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgY29weUZpbGVTeW5jKHNyY1BhdGgsIGRlc3RQYXRoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBjb3B5ICR7ZmlsZX06YCwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0NvdWxkIG5vdCBjb3B5IHB1YmxpYyBmaWxlczonLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgcHVibGljRGlyOiBmYWxzZSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsY0FBYyxhQUFhLGdCQUEyQjtBQUMvRCxTQUFTLFlBQVk7QUFHckIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ047QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFDWixjQUFNLFlBQVk7QUFDbEIsY0FBTSxTQUFTO0FBRWYsWUFBSTtBQUNGLGdCQUFNLFFBQVEsWUFBWSxTQUFTO0FBQ25DLGdCQUFNLFFBQVEsVUFBUTtBQUNwQixnQkFBSSxLQUFLLFNBQVMscUNBQXFDLEdBQUc7QUFDeEQ7QUFBQSxZQUNGO0FBQ0EsZ0JBQUk7QUFDRixvQkFBTSxVQUFVLEtBQUssV0FBVyxJQUFJO0FBQ3BDLG9CQUFNLFdBQVcsS0FBSyxRQUFRLElBQUk7QUFDbEMsa0JBQUksU0FBUyxPQUFPLEVBQUUsT0FBTyxHQUFHO0FBQzlCLDZCQUFhLFNBQVMsUUFBUTtBQUFBLGNBQ2hDO0FBQUEsWUFDRixTQUFTLEdBQUc7QUFDVixzQkFBUSxLQUFLLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUFBLFlBQzNDO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSCxTQUFTLEdBQUc7QUFDVixrQkFBUSxLQUFLLGdDQUFnQyxDQUFDO0FBQUEsUUFDaEQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLFdBQVc7QUFBQSxFQUNYLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxFQUNYO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
