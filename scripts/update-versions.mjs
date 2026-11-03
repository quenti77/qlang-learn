// Updates versions.json (and QLANG_VERSION / STD_VERSION) for a release of qlang or of qlang-std:
//
//   node scripts/update-versions.mjs qlang 1.0.1     # a fix: the line 1.0 now uses qlang 1.0.1
//   node scripts/update-versions.mjs qlang 1.1.0     # a new line: 1.1 becomes the latest, 1.0 keeps its text
//   node scripts/update-versions.mjs std 0.21.0      # qlang-std: the latest version uses it
//
// It prints one line of JSON: {"newLine":true,"previous":"1.0"} when a new line was added, so that the workflow tags
// the text of the site before the change (site-1.0): the old version then takes its hand-written folders from that tag.
//
// The version `next` (qlang on main) stays where it is, and keeps its pins.
// The rules (docs/stability.md of qlang): the three most recent lines are `stable`, the older ones `archived`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.UPDATE_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STABLE_LINES = 3;
const [what, version] = process.argv.slice(2);
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}
if (!['qlang', 'std'].includes(what) || !SEMVER.test(version ?? '')) fail('usage: update-versions.mjs <qlang|std> X.Y.Z');

const parts = (v) => v.split('.').map(Number);
const compare = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  const i = x.findIndex((n, k) => n !== y[k]);
  return i === -1 ? 0 : x[i] - y[i];
};
const file = path.join(root, 'versions.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (name, text) => fs.writeFileSync(path.join(root, name), `${text}\n`);
const latest = () => manifest.versions.find((v) => v.name === manifest.latest);
let result = { newLine: false };

if (what === 'std') {
  const entry = latest();
  if (compare(version, entry.std) < 0) fail(`std ${version} is older than ${entry.std}`);
  entry.std = version;
  write('STD_VERSION', version);
} else {
  const line = version.split('.').slice(0, 2).join('.');
  const entry = manifest.versions.find((v) => v.name === line);
  if (entry) {
    if (compare(version, entry.qlang) < 0) fail(`qlang ${version} is older than ${entry.qlang}`);
    entry.qlang = version;
    if (entry.name === manifest.latest) write('QLANG_VERSION', version);
  } else {
    if (compare(`${line}.0`, `${manifest.latest}.0`) < 0) fail(`the line ${line} is older than the latest (${manifest.latest}): add it by hand`);
    const previous = latest();
    // the old line keeps the text of the site as it is now
    previous.source ??= `site-${previous.name}`;
    manifest.versions.push({ name: line, qlang: version, std: previous.std, status: 'stable', released: new Date().toISOString().slice(0, 10) });
    manifest.latest = line;
    write('QLANG_VERSION', version);
    result = { newLine: true, previous: previous.name };
  }
}

// newest first; the first lines are stable, the others archived (a line marked `next` is left alone)
manifest.versions.sort((a, b) => (a.name === 'next') - (b.name === 'next') || (a.name === 'next' ? 0 : compare(`${b.name}.0`, `${a.name}.0`)));
manifest.versions.filter((v) => v.status !== 'next').forEach((v, i) => (v.status = i < STABLE_LINES ? 'stable' : 'archived'));
fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2).replace(/\{\s+"name"([^}]*?)\s+\}/g, (m) => m.replace(/\s*\n\s*/g, ' '))}\n`);
console.log(JSON.stringify(result));
