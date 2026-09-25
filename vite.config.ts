import { defineConfig } from 'vite';

// 相对 base 便于直接丢到 GitHub Pages / 任意静态目录
export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
