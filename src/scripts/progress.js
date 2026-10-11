// What the student has done, kept in this browser (localStorage). Exercise ids are the same in
// every language: "<series>#<number>", for example "01-bases#3".
const KEY = 'qlang-learn:progress';

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return data && typeof data.done === 'object' ? data : { done: {} };
  } catch {
    return { done: {} };
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode or full storage: the progress just is not kept */
  }
  document.dispatchEvent(new CustomEvent('qlang-progress'));
}

export const isDone = (id) => Boolean(read().done[id]);

export function markDone(id) {
  const data = read();
  if (!data.done[id]) {
    data.done[id] = new Date().toISOString();
    write(data);
  }
}

export const doneIn = (series) => Object.keys(read().done).filter((id) => id.startsWith(series + '#')).length;

export function reset() {
  write({ done: {} });
}
