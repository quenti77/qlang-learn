// Puts qlang.wasm (public/) and qlang.mjs (src/vendor/) in place.
//
//   npm run sync                      # download the release named in QLANG_VERSION
//   QLANG_REPO=../qlang npm run sync  # or take the files from a local build of qlang:
//                                     #   cargo build --profile wasm --target wasm32-unknown-unknown -p qlang-wasm
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const wasmOut = path.join(root, 'public', 'qlang.wasm');
const mjsOut = path.join(root, 'src', 'vendor', 'qlang.mjs');
fs.mkdirSync(path.dirname(mjsOut), { recursive: true });
fs.mkdirSync(path.dirname(wasmOut), { recursive: true }); // git does not keep empty folders

if (process.env.QLANG_REPO) {
  const repo = path.resolve(root, process.env.QLANG_REPO);
  const wasm = path.join(repo, 'target/wasm32-unknown-unknown/wasm/qlang_wasm.wasm');
  if (!fs.existsSync(wasm)) {
    console.error(`${wasm} not found: build qlang-wasm first (see this script's header)`);
    process.exit(1);
  }
  fs.copyFileSync(wasm, wasmOut);
  fs.copyFileSync(path.join(repo, 'crates/qlang-wasm/js/qlang.mjs'), mjsOut);
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
  console.log(`qlang ${version} downloaded`);
}
