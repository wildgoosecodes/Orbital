const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  // Electron loads the built app via file://, which needs relative asset paths —
  // Vite's default root-absolute paths (/assets/...) would 404 under file://.
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-renderer',
  },
});
