import { defineConfig } from 'astro/config';

// Lessons were renumbered twice (the final project comes last; then the course was reordered so that nothing
// is used before it is taught): the old addresses still work.
const renamed = {
  '28-projet-final': '34-projet-final',
  '31-projet-final': '34-projet-final',
  '33-projet-final': '34-projet-final',
  // before the reorder
  '29-temps-hasard-identifiants': '30-temps-hasard-identifiants',
  '30-dates-et-heures': '31-dates-et-heures',
  '31-serveur-web': '32-serveur-web',
  // the reorder: tuples and sets come after the dictionaries, `Result` after the errors
  '11-nullables': '12-nullables',
  '12-match': '13-match',
  '13-structures': '14-structures',
  '14-heritage': '15-heritage',
  '15-traits': '16-traits',
  '16-surcharge-operateurs': '17-surcharge-operateurs',
  '17-enumerations': '18-enumerations',
  '18-generiques': '19-generiques',
  '19-fermetures': '20-fermetures',
  '20-modules': '21-modules',
  '21-erreurs-et-robustesse': '22-erreurs-et-robustesse',
  '22-entrees-sorties': '24-entrees-sorties',
  '23-algo-recherche-et-tri': '25-algo-recherche-et-tri',
  '24-algo-recursivite': '26-algo-recursivite',
  '25-algo-nombres-et-textes': '27-algo-nombres-et-textes',
  '26-structures-de-donnees': '28-structures-de-donnees',
  '27-programmation-dynamique': '29-programmation-dynamique',
  '28-temps-hasard-identifiants': '30-temps-hasard-identifiants',
  '29-dates-et-heures': '31-dates-et-heures',
  '30-serveur-web': '32-serveur-web',
  '31-tuples-et-ensembles': '11-tuples-et-ensembles',
  '32-result-et-propagation': '23-result-et-propagation',
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
