// Turns the ```qlang code blocks of a lesson into small editors that run their code.
import { run } from './engine.js';

const ui = JSON.parse(document.getElementById('ui-strings')?.textContent || '{}');
const text = (key) => ui[key] || key;

function describe(d) {
  const where = d.location ? `${d.location.line}:${d.location.col} ` : '';
  const notes = (d.notes || []).map((n) => `\n  ${n.message}`).join('');
  return `${where}${d.code}: ${d.message}${notes}`;
}

// Files that the examples of the page import: ```qlang-module blocks whose first line is `-- file: path`.
const modules = {};

function moduleWidget(block) {
  const [first, ...rest] = block.textContent.replace(/\n$/, '').split('\n');
  const path = first.replace(/^--\s*file:\s*/, '').trim();
  const source = rest.join('\n');
  modules[path] = source;
  const root = document.createElement('div');
  root.className = 'qlang-widget module';
  root.innerHTML = `
    <div class="head"><span class="tag" data-testid="module-name"></span></div>
    <textarea data-testid="module-code" spellcheck="false" readonly aria-label=""></textarea>`;
  root.querySelector('.tag').textContent = path;
  const area = root.querySelector('textarea');
  area.setAttribute('aria-label', path);
  area.value = source;
  area.rows = Math.max(2, source.split('\n').length);
  block.closest('pre').replaceWith(root);
}

function widget(block) {
  const original = block.textContent.replace(/\n$/, '');
  const root = document.createElement('div');
  root.className = 'qlang-widget';
  root.innerHTML = `
    <div class="head"><span class="tag">qlang</span><span class="actions">
      <button type="button" class="secondary" data-testid="reset"></button>
      <button type="button" data-testid="run"></button>
    </span></div>
    <textarea data-testid="code" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="qlang"></textarea>
    <input class="stdin" data-testid="stdin" hidden />
    <output data-testid="output" aria-live="polite"></output>`;
  const code = root.querySelector('textarea');
  const stdin = root.querySelector('.stdin');
  const runButton = root.querySelector('[data-testid=run]');
  const resetButton = root.querySelector('[data-testid=reset]');
  const output = root.querySelector('output');
  code.value = original;
  code.rows = Math.max(2, original.split('\n').length);
  stdin.placeholder = text('input');
  output.dataset.label = text('output');
  stdin.hidden = !/\bread\s*\(/.test(original);
  runButton.textContent = text('run');
  resetButton.textContent = text('reset');

  const show = (parts) => {
    output.replaceChildren(...parts);
  };
  const span = (cls, content) => {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = content;
    return s;
  };

  async function execute() {
    runButton.disabled = true;
    runButton.textContent = text('running');
    const lines = stdin.value === '' ? [] : stdin.value.split('\n');
    const result = await run({ files: { ...modules, 'main.q': code.value }, input: lines });
    runButton.disabled = false;
    runButton.textContent = text('run');
    if (result.stopped) {
      if (result.detail) console.error('qlang:', result.detail);
      show([span('error', text(`stopped.${result.stopped}`))]);
      return;
    }
    const a = result.answer;
    const parts = [];
    if (a.output) parts.push(span('', a.output));
    for (const d of a.diagnostics || []) parts.push(span('error', describe(d) + '\n'));
    if (parts.length === 0) parts.push(span('muted', text('empty')));
    show(parts);
  }

  runButton.addEventListener('click', execute);
  code.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      execute();
    }
  });
  resetButton.addEventListener('click', () => {
    code.value = original;
    output.replaceChildren();
  });
  block.closest('pre').replaceWith(root);
}

for (const block of document.querySelectorAll('pre > code.language-qlang-module')) moduleWidget(block);
for (const block of document.querySelectorAll('pre > code.language-qlang')) widget(block);
document.documentElement.dataset.ready = 'true';
