import { defineConfig } from 'astro/config';

// BASE_PATH is the folder the site is served from (GitHub Pages: "/qlang-learn/").
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  // code blocks are made runnable by src/scripts/runner.js, not highlighted at build time
  markdown: { syntaxHighlight: false },
  vite: { worker: { format: 'es' } },
});
