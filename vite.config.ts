import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  envPrefix: ['VITE_', 'TELEGRAM_'], // Allow both VITE_ and TELEGRAM_ prefixed variables
  base: '/studyhub-main/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        format: 'es',
      },
    },
    target: 'esnext',
    modulePreload: {
      polyfill: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
      },
    },
  },
});
