// Hover tooltips and completion in the editable editors, from what the compiler reports about
// the code (the same helpers as the VS Code extension: src/vendor/intel.js).
import { hoverTooltip } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import intel from '../vendor/intel.js';
import { run } from './engine.js';

const FILE = 'main.q';

const COMPLETION_TYPE = {
  field: 'property',
  method: 'method',
  function: 'function',
  variable: 'variable',
  param: 'variable',
  keyword: 'keyword',
  type: 'type',
  struct: 'class',
  enum: 'enum',
  variant: 'enum',
  constant: 'constant',
  trait: 'interface',
  module: 'namespace',
};

/** Text with `code` spans and ```fenced``` code, as DOM (the documentation comes as Markdown). */
function markdownToDom(markdown) {
  const root = document.createElement('div');
  root.className = 'intel-doc';
  const inline = (parent, text) => {
    text.split(/(`[^`]+`)/).forEach((part) => {
      if (/^`[^`]+`$/.test(part)) {
        const code = document.createElement('code');
        code.textContent = part.slice(1, -1);
        parent.append(code);
      } else if (part) {
        parent.append(part);
      }
    });
  };
  for (const block of markdown.split(/(```[\s\S]*?```)/)) {
    if (block.startsWith('```')) {
      const pre = document.createElement('pre');
      pre.textContent = block.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      root.append(pre);
    } else {
      for (const paragraph of block.split(/\n{2,}/)) {
        if (!paragraph.trim()) continue;
        const p = document.createElement('p');
        inline(p, paragraph.trim());
        root.append(p);
      }
    }
  }
  return root;
}

/**
 * The extensions that add hover and completion to an editor.
 * `files()` gives the other files of the page (modules), `suffix()` code that follows the
 * editor's text when it is checked (the tests of an exercise).
 */
export function intelExtensions({ files = () => ({}), suffix = () => '' } = {}) {
  let last = { text: null, promise: null, info: null };

  /** What the compiler learned about `text` (the editor's code, or a variant of it). */
  async function analyse(text) {
    const full = suffix() ? `${text}\n${suffix()}` : text;
    if (last.text === full && last.promise) return last.promise;
    const entry = { text: full, promise: null, info: null };
    entry.promise = run({ files: { ...files(), [FILE]: full }, input: [], mode: 'check', info: true }).then((r) => {
      const info = r.answer?.info || null;
      if (info) lastKnown = info;
      return info;
    });
    last = entry;
    return entry.promise;
  }
  // the code does not always compile far enough: the previous answer is better than none
  let lastKnown = null;

  const hover = hoverTooltip(async (view, pos) => {
    const line = view.state.doc.lineAt(pos);
    const info = (await analyse(view.state.doc.toString())) || lastKnown;
    if (!info) return null;
    const h = intel.hoverAt(info, FILE, line.number - 1, pos - line.from, line.text);
    if (!h) return null;
    return {
      pos: line.from + h.range.start,
      end: line.from + h.range.end,
      above: true,
      create: () => ({ dom: markdownToDom(h.markdown) }),
    };
  }, { hoverTime: 350 });

  const source = async (context) => {
    const { state, pos, explicit } = context;
    const line = state.doc.lineAt(pos);
    const col = pos - line.from;
    const text = state.doc.toString();
    const access = intel.memberAccessAt(line.text, col);
    let items;
    let from;
    if (access) {
      // `value.par|`: ask about the code without `.par`, so that it still compiles
      const info = await analyse(intel.blank(text, line.number - 1, access.dot, col));
      if (!info) return null;
      const expr = intel.receiverAt(info, FILE, line.number - 1, access.dot);
      items = intel.memberCompletions(info, expr, line.text.slice(0, access.dot));
      from = line.from + access.start;
    } else {
      const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_]*/);
      if (!word && !explicit) return null;
      const info = (await analyse(text)) || lastKnown;
      if (!info) return null;
      items = intel.nameCompletions(info, FILE, line.number - 1, col);
      from = word ? word.from : pos;
    }
    if (context.aborted) return null;
    return {
      from,
      validFor: /^[A-Za-z0-9_]*$/,
      options: items.map((i) => ({
        label: i.label,
        type: COMPLETION_TYPE[i.kind],
        detail: i.kind === 'keyword' ? undefined : ` ${i.detail}`,
        info: i.doc ? () => markdownToDom(i.doc) : undefined,
        boost: -Number.parseInt(i.sort?.[0] ?? '9', 10) || 0,
      })),
    };
  };

  return [hover, autocompletion({ override: [source], icons: false })];
}
