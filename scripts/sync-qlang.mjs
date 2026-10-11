// Puts qlang.wasm (public/) and qlang.mjs (src/vendor/) in place.
//
//   npm run sync                      # download the release named in QLANG_VERSION
//   QLANG_REPO=../qlang npm run sync  # or take the files from a local build of qlang:
//                                     #   cargo build --profile wasm --target wasm32-unknown-unknown -p qlang-wasm
import fs from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const wasmOut = path.join(root, 'public', 'qlang.wasm');
const mjsOut = path.join(root, 'src', 'vendor', 'qlang.mjs');
fs.mkdirSync(path.dirname(mjsOut), { recursive: true });
fs.mkdirSync(path.dirname(wasmOut), { recursive: true }); // git does not keep empty folders

let languageDoc;

if (process.env.QLANG_REPO) {
  const repo = path.resolve(root, process.env.QLANG_REPO);
  const wasm = path.join(repo, 'target/wasm32-unknown-unknown/wasm/qlang_wasm.wasm');
  if (!fs.existsSync(wasm)) {
    console.error(`${wasm} not found: build qlang-wasm first (see this script's header)`);
    process.exit(1);
  }
  fs.copyFileSync(wasm, wasmOut);
  fs.copyFileSync(path.join(repo, 'crates/qlang-wasm/js/qlang.mjs'), mjsOut);
  languageDoc = fs.readFileSync(path.join(repo, 'docs/language.md'), 'utf8');
  console.log(`qlang taken from ${repo}`);
} else {
  const version = fs.readFileSync(path.join(root, 'QLANG_VERSION'), 'utf8').trim();
  const base = `https://github.com/quenti77/qlang/releases/download/v${version}`;
  for (const [name, out] of [['qlang.wasm', wasmOut], ['qlang.mjs', mjsOut]]) {
    const res = await fetch(`${base}/${name}`);
    if (!res.ok) {
      console.error(`cannot download ${base}/${name}: ${res.status} (is there a release v${version} with ${name}?)`);
      process.exit(1);
    }
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  }
  const doc = await fetch(`https://raw.githubusercontent.com/quenti77/qlang/v${version}/docs/language.md`);
  if (!doc.ok) {
    console.error(`cannot download docs/language.md of v${version}: ${doc.status}`);
    process.exit(1);
  }
  languageDoc = await doc.text();
  console.log(`qlang ${version} downloaded`);
}

// The reference of the language (docs/language.md of qlang) becomes one page per chapter:
// content/fr/reference/NN-name.md. They are generated: not committed.
const slugify = (text) => new GithubSlugger().slug(text.replace(/`/g, ''));
// file names: no accents (the anchors inside the pages keep them, as the links to them do)
const ascii = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const plain = (title) => title.replace(/^\d+\.\s*/, '').replace(/`/g, '').trim();
const body = languageDoc.replace(/^# .*\n/, '').replace(/^## Sommaire\n[\s\S]*?(?=^## 1\. )/m, '');
const chapters = body.split(/^(?=## )/m).filter((c) => c.startsWith('## '));
const anchors = new Map(); // anchor -> page
const chapterAnchors = new Set(); // anchors of the chapter titles: they are page titles here, without that anchor
const pages = chapters.map((chapter, i) => {
  const title = chapter.match(/^## (.*)$/m)[1];
  const slug = `${String(i + 1).padStart(2, '0')}-${ascii(slugify(plain(title))).replace(/[^a-z0-9-]/g, '')}`.replace(/-+$/, '');
  const seen = new GithubSlugger();
  for (const h of chapter.matchAll(/^#{2,4} (.*)$/gm)) {
    const anchor = seen.slug(h[1].replace(/`/g, ''));
    anchors.set(anchor, slug);
    if (h[0].startsWith('## ')) chapterAnchors.add(anchor);
  }
  return { slug, title: plain(title), chapter };
});
const outDir = path.join(root, 'content', 'fr', 'reference');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const { slug, title, chapter } of pages) {
  let text = chapter
    .replace(/^## .*\n/, '') // the title is the page title
    .replace(/^(#{3,4}) /gm, (m, h) => h.slice(1) + ' ') // one level up
    .replace(/^```$/gm, '```QLANGREF') // placeholder, see below
    .replace(/\]\(#([^)]+)\)/g, (m, anchor) => {
      if (!anchors.has(anchor)) return m;
      const target = anchors.get(anchor);
      if (chapterAnchors.has(anchor)) return `](../${target}/)`;
      return target === slug ? m : `](../${target}/#${anchor})`;
    })
    .replace(/\]\(\.\.\/([A-Za-z0-9_.-]+)\)/g, '](https://github.com/quenti77/qlang/blob/main/$1)');
  // fences come in pairs: the opening one gets the language, the closing one stays bare
  let open = false;
  text = text
    .split('\n')
    .map((line) => {
      if (line === '```QLANGREF') {
        open = !open;
        return open ? '```qlang-ref' : '```';
      }
      return line;
    })
    .join('\n');
  fs.writeFileSync(path.join(outDir, `${slug}.md`), `---\ntitle: ${JSON.stringify(title)}\n---\n\n# ${title}\n${text}`);
}
console.log(`reference: ${pages.length} pages`);
