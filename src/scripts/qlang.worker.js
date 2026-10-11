// Runs qlang off the page: a runaway program can then be stopped by killing this worker.
import { load } from '../vendor/qlang.mjs';

let qlang = null;
let loading = null;

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    loading = load(new URL(data.wasmUrl, self.location.href)).then((q) => (qlang = q));
    return;
  }
  const { id, request } = data;
  try {
    await loading;
    self.postMessage({ id, answer: qlang.handle(request) });
  } catch (e) {
    self.postMessage({ id, crash: String(e && e.message ? e.message : e) });
  }
};
