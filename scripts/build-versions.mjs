// Builds the site once per version listed in versions.json, and puts them side by side in site/:
//
//   site/versions.json   the list, read by the version selector
//   site/<name>/…        one complete site per version (its own qlang.wasm, reference and search index)
//   site/latest/…        redirections to the latest version
//   site/<page>          the addresses from before the versions (/fr/docs/…) redirect to the latest version
//
//   npm run build:versions                       # SITE_BASE=/ (local)
//   SITE_BASE=/qlang-learn/ npm run build:versions   # GitHub Pages
//   npm run build:versions -- 1.0                # only these versions
//   CACHE_DIR=.cache/versions …                  # an archived version is not rebuilt while nothing it depends on changed
//   SITE_ORIGIN=https://owner.github.io …        # adds <link rel="canonical"> to the pages (see below)
//
// The version `next` (status "next", qlang "next", std "next") is qlang and qlang-std as they are on main; the checks of
// its lessons only warn. A version is built with the pair (qlang, std) it names; the text written by hand (lessons, exercises,
// pages of the site, English translation of the reference) is the one of the working tree, unless the
// version has a "source" (a git ref such as site-1.0): the hand-written folders are then taken from it.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'site');
const siteBase = `/${(process.env.SITE_BASE || '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const manifestFile = path.resolve(root, process.env.VERSIONS_FILE || 'versions.json'); // another list: the tests
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const only = process.argv.slice(2);
const HAND_WRITTEN = ['content', 'reference']; // the folders a "source" ref provides
// the generated documentation is not hand-written: it is regenerated for the version
const SKIP_IN_COPY = new Set(['node_modules', 'dist', 'site', '.git', '.versions', '.astro', 'test-results', 'playwright-report']);

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!manifest.versions.some((v) => v.name === manifest.latest)) fail(`"latest" is ${manifest.latest}, which is not in versions`);
for (const v of manifest.versions) {
  if (!/^([0-9]+\.[0-9]+|next)$/.test(v.name)) fail(`version name "${v.name}": expected MAJOR.MINOR, or next`);
  if ((v.name === 'next') !== (v.status === 'next')) fail(`version "${v.name}": only "next" has the status "next"`);
}
const latest = manifest.versions.find((v) => v.name === manifest.latest);
const pinned = (file) => fs.readFileSync(path.join(root, file), 'utf8').trim();
if (!latest.source && (latest.qlang !== pinned('QLANG_VERSION') || latest.std !== pinned('STD_VERSION'))) {
  fail(`versions.json says ${latest.name} is qlang ${latest.qlang} / std ${latest.std}, but QLANG_VERSION / STD_VERSION say ${pinned('QLANG_VERSION')} / ${pinned('STD_VERSION')}: change both together`);
}

function run(command, args, cwd, env, { warnOnly = false } = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.status === 0) return;
  if (warnOnly) console.warn(`warning: ${command} ${args.join(' ')} failed in ${cwd}`);
  else fail(`${command} ${args.join(' ')} failed in ${cwd}`);
}

/** The folder a version is built in: the working tree, or a copy of it with the hand-written folders of its ref. */
function workdir(v) {
  if (!v.source) return root;
  const dir = path.join(root, '.versions', v.name);
  fs.rmSync(dir, { recursive: true, force: true });
  // entry by entry: Node refuses to copy a folder into one of its own sub-folders (.versions is inside root)
  for (const entry of fs.readdirSync(root)) {
    if (SKIP_IN_COPY.has(entry)) continue;
    fs.cpSync(path.join(root, entry), path.join(dir, entry), { recursive: true, filter: (src) => !SKIP_IN_COPY.has(path.basename(src)) });
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  for (const folder of HAND_WRITTEN) fs.rmSync(path.join(dir, folder), { recursive: true, force: true });
  const archive = spawnSync('git', ['archive', v.source, ...HAND_WRITTEN], { cwd: root, maxBuffer: 1 << 30 });
  if (archive.status !== 0) fail(`git archive ${v.source}: ${archive.stderr}`);
  const untar = spawnSync('tar', ['-x', '-C', dir], { input: archive.stdout });
  if (untar.status !== 0) fail(`tar: ${untar.stderr}`);
  return dir;
}

/** A hash of a file or folder of the working tree (names and contents; not what `sync` puts in, which depends on the version). */
function hashOf(entry, hash = createHash('sha256')) {
  const file = path.join(root, entry);
  if (!fs.existsSync(file) || entry === 'src/vendor' || ['__pycache__', 'docs-generated'].includes(path.basename(entry))) return hash;
  if (fs.statSync(file).isDirectory()) {
    for (const child of fs.readdirSync(file).sort()) hashOf(path.join(entry, child), hash);
  } else {
    hash.update(entry).update(fs.readFileSync(file));
  }
  return hash;
}
// What an archived version depends on: its line in versions.json, the code that builds the site, the folders
// written by hand (the ones of its source ref when it has one), and where the site is served from.
function cacheKey(v) {
  const hash = createHash('sha256').update(JSON.stringify(v)).update(siteBase);
  for (const entry of ['src', 'scripts', 'astro.config.mjs', 'package-lock.json']) hash.update(hashOf(entry).digest('hex'));
  if (v.source) {
    const rev = spawnSync('git', ['rev-parse', v.source], { cwd: root, encoding: 'utf8' });
    if (rev.status !== 0) fail(`git rev-parse ${v.source}: ${rev.stderr}`);
    hash.update(rev.stdout.trim());
  } else {
    for (const entry of HAND_WRITTEN) hash.update(hashOf(entry).digest('hex'));
  }
  return hash.digest('hex').slice(0, 16);
}

if (only.length === 0) fs.rmSync(out, { recursive: true, force: true }); // a version taken off the list is gone
fs.mkdirSync(out, { recursive: true });
for (const v of manifest.versions.filter((x) => only.length === 0 || only.includes(x.name))) {
  console.log(`\n=== ${v.name}: qlang ${v.qlang}, std ${v.std}${v.source ? `, text of ${v.source}` : ''}`);
  // an archived version is rebuilt only when what it depends on changed
  const cached = process.env.CACHE_DIR && v.status === 'archived' ? path.resolve(root, process.env.CACHE_DIR, `${v.name}-${cacheKey(v)}`) : null;
  const target = path.join(out, v.name);
  if (cached && fs.existsSync(cached)) {
    console.log(`taken from the cache (${path.basename(cached)})`);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(cached, target, { recursive: true });
    continue;
  }
  const cwd = workdir(v);
  const env = {
    ...process.env,
    QLANG_VERSION: v.qlang,
    STD_VERSION: v.std,
    BASE_PATH: `${siteBase}${v.name}/`,
    SITE_BASE: siteBase,
    SITE_VERSION: v.name,
  };
  fs.rmSync(path.join(cwd, 'dist'), { recursive: true, force: true });
  run('node', ['scripts/sync-qlang.mjs'], cwd, env);
  // the lessons are written for the latest version: on main they only warn (a change of qlang must not stop the site)
  run('node', ['scripts/check-content.mjs'], cwd, env, { warnOnly: v.status === 'next' });
  run('node', ['scripts/verify-lessons.mjs'], cwd, env, { warnOnly: v.status === 'next' });
  run('npx', ['astro', 'build'], cwd, env);
  run('node', ['scripts/prepare-search.mjs'], cwd, env);
  run('npx', ['pagefind', '--site', 'dist'], cwd, env);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(cwd, 'dist'), target, { recursive: true });
  if (cached) {
    // the pages as built: the canonical links are added below, to every page, from the current list
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    for (const old of fs.readdirSync(path.dirname(cached)).filter((d) => d.startsWith(`${v.name}-`))) fs.rmSync(path.join(path.dirname(cached), old), { recursive: true, force: true });
    fs.cpSync(target, cached, { recursive: true });
  }
  fs.rmSync(path.join(cwd, 'dist'), { recursive: true, force: true });
}

// --- what lies around the versions ---------------------------------------------------------

fs.copyFileSync(manifestFile, path.join(out, 'versions.json'));

const redirect = (to) =>
  `<!doctype html>\n<html><head><meta charset="utf-8"><title>qlang</title><meta name="robots" content="noindex">` +
  `<link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}">` +
  `<script>location.replace(${JSON.stringify(to)} + location.hash)</script></head>` +
  `<body><a href="${to}">${to}</a></body></html>\n`;
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

const latestDir = path.join(out, latest.name);
if (!fs.existsSync(latestDir)) fail(`the latest version (${latest.name}) was not built: do not restrict the versions without it`);
// <link rel="canonical">: a page of an old version names the same page of the latest version when there is one,
// so that search engines index one copy. Needs the address of the site (an absolute URL), SITE_ORIGIN.
const htmlPages = (dir) => {
  const found = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const file = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'pagefind' && entry.name !== '_astro') walk(file);
      } else if (entry.name.endsWith('.html')) found.push(path.relative(dir, file));
    }
  })(dir);
  return found;
};
const addressOf = (page) => (page.endsWith('index.html') ? page.slice(0, -'index.html'.length) : page);
const pages = htmlPages(latestDir); // before the canonical links: the redirections below copy the latest version
if (process.env.SITE_ORIGIN) {
  const origin = process.env.SITE_ORIGIN.replace(/\/$/, '');
  let tagged = 0;
  for (const v of manifest.versions) {
    const dir = path.join(out, v.name);
    if (!fs.existsSync(dir)) continue;
    for (const page of htmlPages(dir).filter((p) => p !== '404.html')) {
      const file = path.join(dir, page);
      const html = fs.readFileSync(file, 'utf8');
      if (!html.includes('</head>') || html.includes('rel="canonical"')) continue; // a redirection of Astro has its own
      const owner = fs.existsSync(path.join(latestDir, page)) ? latest.name : v.name;
      const href = `${origin}${siteBase}${owner}/${addressOf(page)}`;
      fs.writeFileSync(file, html.replace('</head>', `<link rel="canonical" href="${href}"></head>`));
      tagged++;
    }
  }
  console.log(`canonical: ${tagged} page(s) tagged`);
}

const names = new Set(manifest.versions.map((v) => v.name));
let stubs = 0;
for (const page of pages) {
  const to = `${siteBase}${latest.name}/${addressOf(page)}`;
  // /latest/<page>, and the address from before the versions (/<page>) except the home page, which is the root
  if (page !== '404.html') write(path.join(out, 'latest', page), redirect(to));
  if (page !== 'index.html' && page !== '404.html' && !names.has(page.split(path.sep)[0])) write(path.join(out, page), redirect(to));
  stubs++;
}
write(path.join(out, 'index.html'), redirect(`${siteBase}${latest.name}/`));
// GitHub Pages serves this file for any address that does not exist
fs.copyFileSync(path.join(latestDir, '404.html'), path.join(out, '404.html'));
console.log(`\nsite/: ${manifest.versions.length} version(s), latest ${latest.name}, ${stubs} redirection(s)`);
