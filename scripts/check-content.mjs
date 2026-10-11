// Every lesson must exist in every language, with the same code blocks: same number, same
// number of lines of code (names, strings and comments may be translated). Run by CI; `npm run check-content`.
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'content');
const languages = fs.readdirSync(root).sort();
const lessons = (lang) => fs.readdirSync(path.join(root, lang, 'cours')).filter((f) => f.endsWith('.md')).sort();
const blocks = (file) => [...fs.readFileSync(file, 'utf8').matchAll(/```qlang\n([\s\S]*?)```/g)].map((m) => m[1]);
// the lines of code of a block, without comments and blank lines
const lines = (block) => block.split('\n').map((l) => l.replace(/--.*$/, '').trim()).filter(Boolean).length;

let problems = 0;
const fail = (message) => {
  console.error(`✗ ${message}`);
  problems++;
};
const reference = lessons(languages[0]);
for (const lang of languages) {
  const here = lessons(lang);
  for (const f of reference.filter((x) => !here.includes(x))) fail(`${lang}: missing ${f}`);
  for (const f of here.filter((x) => !reference.includes(x))) fail(`${lang}: ${f} has no counterpart in ${languages[0]}`);
}
for (const f of reference) {
  const base = blocks(path.join(root, languages[0], 'cours', f));
  for (const lang of languages.slice(1)) {
    const file = path.join(root, lang, 'cours', f);
    if (!fs.existsSync(file)) continue;
    const other = blocks(file);
    if (other.length !== base.length) fail(`${f}: ${languages[0]} has ${base.length} code blocks, ${lang} has ${other.length}`);
    else base.forEach((b, i) => lines(b) !== lines(other[i]) && fail(`${f}: block ${i + 1} has ${lines(b)} lines of code in ${languages[0]} and ${lines(other[i])} in ${lang}`));
  }
}
if (problems) process.exit(1);
console.log(`content ok: ${reference.length} lesson(s) in ${languages.join(', ')}`);
