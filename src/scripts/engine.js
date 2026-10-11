// One qlang engine (a Web Worker) shared by all the code blocks of the page.

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

// Tests can lower these (`window.__QLANG = { timeoutMs, maxSteps }`) to provoke the slow paths.
// maxDepth: WebAssembly recursion uses the browser's call stack, which is small (Chromium
// overflows around 500 nested qlang calls, measured by e2e/), so qlang's own limit of 1000
// would end in a crash instead of a clear error.
const settings = () => ({ timeoutMs: 8000, maxSteps: 20_000_000, maxDepth: 250, ...(window.__QLANG || {}) });

let worker = null;
let nextId = 1;
const pending = new Map();
let queue = Promise.resolve();

function start() {
  worker = new Worker(new URL('./qlang.worker.js', import.meta.url), { type: 'module' });
  worker.postMessage({ type: 'init', wasmUrl: `${base}/qlang.wasm` });
  worker.onmessage = ({ data }) => {
    const done = pending.get(data.id);
    if (done) {
      pending.delete(data.id);
      done(data);
    }
  };
  worker.onerror = () => {
    // the worker could not even start: fail every waiting request
    for (const done of pending.values()) done({ crash: 'worker error' });
    pending.clear();
    worker = null;
  };
}

function runNow(request) {
  if (!worker) start();
  const { timeoutMs, maxSteps, maxDepth } = settings();
  const id = nextId++;
  const full = { ...request, limits: { max_steps: maxSteps, max_depth: maxDepth, ...(request.limits || {}) } };
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      worker.terminate(); // the only way to stop a program that does not end
      worker = null;
      resolve({ stopped: 'timeout' });
    }, timeoutMs);
    pending.set(id, (data) => {
      clearTimeout(timer);
      if (data.crash) {
        worker.terminate();
        worker = null;
        resolve({ stopped: 'crash', detail: data.crash });
      } else {
        resolve({ answer: data.answer });
      }
    });
    worker.postMessage({ id, request: full });
  });
}

/** Run a request; resolves to {answer} or {stopped: "timeout" | "crash"}. One at a time. */
export function run(request) {
  const result = queue.then(() => runNow(request));
  queue = result.catch(() => {});
  return result;
}
