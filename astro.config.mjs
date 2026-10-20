import { defineConfig } from 'astro/config';

// Lessons 28 to 31 were renumbered (the final project now comes last): the old addresses still work.
const renamed = {
  '28-projet-final': '31-projet-final',
  '29-temps-hasard-identifiants': '28-temps-hasard-identifiants',
  '30-dates-et-heures': '29-dates-et-heures',
  '31-serveur-web': '30-serveur-web',
};
// (the destination is not prefixed with `base` by Astro)
const prefix = (process.env.BASE_PATH || '').replace(/\/$/, '');
const redirects = Object.fromEntries(
  ['fr', 'en'].flatMap((lang) => Object.entries(renamed).map(([from, to]) => [`/${lang}/cours/${from}`, `${prefix}/${lang}/cours/${to}/`]))
);

// BASE_PATH is the folder the site is served from (GitHub Pages: "/qlang-learn/").
export default defineConfig({
  redirects,
  base: process.env.BASE_PATH || '/',
  // code blocks are made runnable by src/scripts/runner.js, not highlighted at build time
  markdown: { syntaxHighlight: false },
  vite: { worker: { format: 'es' } },
});
