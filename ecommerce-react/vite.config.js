import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Every browser that can run React 19 handles these; a lower target only
    // ships transpiler noise.
    target: 'es2020',
    cssTarget: 'chrome100',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 2048,
    // three.js is deliberately its own lazy chunk; the default 500 kB warning
    // is noise here.
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        /**
         * three.js is the largest dependency by a wide margin and is only
         * reachable through the lazily-imported hero. Pinning it to its own
         * chunk keeps it out of the critical path and lets it cache
         * independently of app code.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three/')) return 'three';
          if (id.includes('/react-router') || id.includes('/react-dom/') || id.includes('/react/')) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },

  esbuild: {
    // Strip diagnostics from production; they cost bytes and leak internals.
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },

  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },

  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
