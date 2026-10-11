// Runs every code block of every lesson with the real qlang.wasm, as the site does, and fails
// if one has an error (unless the block is preceded by `<!-- expect-error -->`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from '../src/vendor/qlang.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const qlang = await load(fs.readFileSync(path.join(root, 'public', 'qlang.wasm')));
const content = path.join(root, 'content');
let blocks = 0;
let problems = 0;

for (const lang of fs.readdirSync(content)) {
  const dir = path.join(content, lang, 'cours');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const modules = {};
    for (const m of text.matchAll(/```qlang-module\n([\s\S]*?)```/g)) {
      const [first, ...rest] = m[1].split('\n');
      modules[first.replace(/^--\s*file:\s*/, '').trim()] = rest.join('\n');
    }
    for (const m of text.matchAll(/(<!-- expect-error -->\n)?```qlang\n([\s\S]*?)```/g)) {
      blocks++;
      const answer = qlang.handle({
        files: { ...modules, 'main.q': m[2] },
        input: ['Ada', '36', '12', 'x', 'y', 'z', 'a', 'b', 'c', 'd'],
        limits: { max_steps: 20_000_000, max_depth: 250 },
      });
      const expectError = Boolean(m[1]);
      if (answer.ok === expectError) {
        problems++;
        const where = `${lang}/${file}`;
        const first = m[2].split('\n').find((l) => l.trim() && !l.startsWith('--')) ?? '';
        console.error(`✗ ${where}: ${expectError ? 'should fail but works' : answer.diagnostics.map((d) => `${d.code} ${d.message}`).join('; ')}\n    ${first}`);
      }
    }
  }
}
if (problems) process.exit(1);
console.log(`lessons ok: ${blocks} blocks run`);
