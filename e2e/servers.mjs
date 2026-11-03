// The servers of the tests (playwright.config.js): the site of one version on 4321 (most tests), and the
// versions side by side on 4322 (versions.spec.js). Both are built here, one after the other: they
// share the dist/ folder while they are built.
import { spawn, spawnSync } from 'node:child_process';

const run = (args, env = {}) => {
  const r = spawnSync('npm', ['run', ...args], { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
// the versions first: building them removes dist/, which the single version (built last) needs for the preview
run(['build:versions'], { VERSIONS_FILE: 'e2e/fixtures/versions.json', SITE_BASE: '/' });
run(['build']);
const children = [
  spawn('npx', ['astro', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'inherit' }),
  spawn('node', ['scripts/serve-site.mjs'], { stdio: 'inherit' }),
];
const stop = () => children.forEach((c) => c.kill());
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
children[0].on('exit', (code) => process.exit(code ?? 0));
