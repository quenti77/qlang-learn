// Run between `astro build` and `pagefind`: the code of the exercises (tests, solutions) is no use in
// the search results, so the code blocks of those pages are marked to be skipped by Pagefind (the code
// of lessons and documentation stays searchable).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let pages = 0;
for (const lang of fs.readdirSync(dist).filter((d) => /^[a-z]{2}$/.test(d))) {
  const folder = path.join(dist, lang, 'exercices');
  if (!fs.existsSync(folder)) continue;
  for (const slug of fs.readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const file = path.join(folder, slug.name, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, html.replace(/<pre(?=[\s>])/g, '<pre data-pagefind-ignore'));
    pages++;
  }
}
console.log(`search: code blocks skipped in ${pages} exercise pages`);
