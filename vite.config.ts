import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import electron from 'vite-plugin-electron';
// Node.js polyfills
import { builtinModules } from 'module';
// Rollup plugins
import commonjs from '@rollup/plugin-commonjs';

/**
 * Vite configuration for the TLDR app
 * - Configures Electron integration
 * - Adds path aliases matching tsconfig.json
 * - Sets up React support
 */
export default defineConfig({
  // Prevent Node.js modules in renderer
  optimizeDeps: {
    exclude: ['electron', 'sqlite3', ...builtinModules],
  },

  plugins: [
    react(),
    // Simple configuration for Electron with both main and preload scripts
    electron([
      {
        // Main process
        entry: 'src/main/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['electron', 'sqlite3', ...builtinModules],
              plugins: [
                commonjs({
                  // Specify the native module paths to handle properly
                  dynamicRequireTargets: [
                    'node_modules/sqlite3/lib/binding/**/*.node',
                    'node_modules/sqlite3/lib/sqlite3.js'
                  ],
                  ignoreDynamicRequires: true
                })
              ]
            }
          }
        }
      },
      {
        // Preload script
        entry: 'src/main/preload.ts'
      }
    ]),
  ],

  // Needed for both renderer and app
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
    // Make sure aliases work properly in different build modes
    preserveSymlinks: true,
  },

  base: './',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Ensure native modules are not bundled
      external: [
        'electron',
        'sqlite3',
        'better-sqlite3',
        ...builtinModules,
        /^node:/,  // Node.js internal modules
      ]
    },
  },
});
