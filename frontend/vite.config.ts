import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Include .jsx files
      include: "**/*.{jsx,tsx}",
    }),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/store': resolve(__dirname, './src/store'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/styles': resolve(__dirname, './src/styles'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, options) => {
          // Handle WebSocket upgrade
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('WebSocket proxy request:', req.url);
          });
        },
      },
      // Proxy Socket.IO requests
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  // Preview server (for production build)
  preview: {
    port: 3000,
    host: true,
    open: true,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    minify: 'terser',
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['framer-motion', 'lucide-react'],
          socket: ['socket.io-client'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          utils: ['axios', 'date-fns', 'lodash-es', 'clsx', 'tailwind-merge'],
        },
        // Generate readable chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^/.]+$/, '') : 
            'unknown';
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1] || '';
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash].${extType}`;
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash].${extType}`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash].${extType}`;
          }
          
          return `assets/[ext]/[name]-[hash].${extType}`;
        },
      },
    },

    // Terser options for minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Enable/disable CSS code splitting
    cssCodeSplit: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'socket.io-client',
      'axios',
      'react-hook-form',
      'framer-motion',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
    // Force re-optimization on dependency changes
    force: process.env.FORCE_OPTIMIZE === 'true',
  },

  // Environment variables
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    global: 'globalThis',
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },

  // Enable esbuild for JSX
  esbuild: {
    jsxInject: `import React from 'react'`,
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },

  // WebRTC and media support
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],

  // Base URL for deployment
  base: './',

  // Additional configuration
  clearScreen: false,
});