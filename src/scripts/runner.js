// Turns the ```qlang code blocks of a lesson into small editors that run their code.
import { run } from './engine.js';
import { mountEditor } from './editor.js';
import { isDone, markDone, doneIn, reset } from './progress.js';

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
    <div class="editor" data-testid="module-code"></div>`;
  root.querySelector('.tag').textContent = path;
  block.closest('pre').replaceWith(root);
  mountEditor(root.querySelector('.editor'), { doc: source, readOnly: true, label: path });
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
    <div class="editor" data-testid="code"></div>
    <input class="stdin" data-testid="stdin" hidden />
    <output data-testid="output" aria-live="polite"></output>`;
  const stdin = root.querySelector('.stdin');
  const runButton = root.querySelector('[data-testid=run]');
  const resetButton = root.querySelector('[data-testid=reset]');
  const output = root.querySelector('output');
  const code = mountEditor(root.querySelector('.editor'), { doc: original, onRun: () => execute(), intel: { files: () => modules } });
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
  resetButton.addEventListener('click', () => {
    code.value = original;
    output.replaceChildren();
  });
  block.closest('pre').replaceWith(root);
}

function describeFor(d, studentLines, testLines) {
  // a failure inside the tests is reported as a failed test, with the test that failed
  if (d.location && d.location.line > studentLines) {
    const line = testLines[d.location.line - studentLines - 1] ?? '';
    return `${text('exercise.failed')} : ${d.message}\n  ${line.trim()}`;
  }
  return describe(d);
}

// An exercise: ```qlang-exercise (the code to complete), then ```qlang-tests and ```qlang-solution.
function exerciseWidget(block) {
  const pre = block.closest('pre');
  const testsPre = pre.nextElementSibling;
  const solutionPre = testsPre?.nextElementSibling;
  if (!testsPre?.querySelector('code.language-qlang-tests') || !solutionPre?.querySelector('code.language-qlang-solution')) return;
  const starter = block.textContent.replace(/\n$/, '');
  const tests = testsPre.textContent.replace(/\n$/, '');
  const solution = solutionPre.textContent.replace(/\n$/, '');
  // optional hints: ```qlang-hint, paragraphs revealed one at a time
  const hintPre = solutionPre.nextElementSibling?.querySelector('code.language-qlang-hint') ? solutionPre.nextElementSibling : null;
  const hints = hintPre ? hintPre.textContent.trim().split(/\n{2,}/) : [];
  const heading = [...document.querySelectorAll('article h2')].filter((h) => h.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
  const number = heading ? heading.textContent.replace(/\D+/g, '') : '0';
  const id = `${document.querySelector('article').dataset.series}#${number}`;

  const root = document.createElement('div');
  root.className = 'qlang-widget exercise';
  root.dataset.testid = 'exercise';
  root.innerHTML = `
    <div class="head"><span class="tag"></span><span class="actions">
      <span class="status" data-testid="status"></span>
      <button type="button" class="secondary" data-testid="reset"></button>
      <button type="button" data-testid="run"></button>
    </span></div>
    <div class="editor" data-testid="code"></div>
    <details class="tests"><summary></summary><div class="editor" data-testid="tests"></div></details>
    <output data-testid="output" aria-live="polite"></output>
    <div class="hints" data-testid="hints" hidden></div>
    <div class="solution-bar"><button type="button" class="secondary" data-testid="hint" hidden></button><button type="button" class="secondary" data-testid="solution-toggle"></button></div>
    <div class="solution" data-testid="solution" hidden><div class="head"><span class="tag"></span></div><div class="editor" data-testid="solution-code"></div></div>`;
  const status = root.querySelector('.status');
  const runButton = root.querySelector('[data-testid=run]');
  const resetButton = root.querySelector('[data-testid=reset]');
  const output = root.querySelector('output');
  const toggle = root.querySelector('[data-testid=solution-toggle]');
  const solutionBox = root.querySelector('.solution');
  root.querySelector('.tag').textContent = `qlang · ${heading ? heading.textContent : ''}`;
  const code = mountEditor(root.querySelector('.editor[data-testid=code]'), { doc: starter, onRun: () => check(), intel: { files: () => modules, suffix: () => tests } });
  root.querySelector('summary').textContent = text('exercise.tests');
  mountEditor(root.querySelector('.editor[data-testid=tests]'), { doc: tests, readOnly: true, label: text('exercise.tests') });
  output.dataset.label = text('output');
  runButton.textContent = text('exercise.check');
  resetButton.textContent = text('reset');
  toggle.textContent = text('exercise.solution.show');
  solutionBox.querySelector('.tag').textContent = text('exercise.solution.title');
  mountEditor(solutionBox.querySelector('.editor'), { doc: solution, readOnly: true, label: text('exercise.solution.title') });

  const hintList = root.querySelector('.hints');
  const hintButton = root.querySelector('[data-testid=hint]');
  let shown = 0;
  const updateHintButton = () => {
    hintButton.hidden = shown >= hints.length;
    hintButton.textContent = `${text('exercise.hint')} (${shown + 1}/${hints.length})`;
  };
  if (hints.length) updateHintButton();
  hintButton.addEventListener('click', () => {
    const p = document.createElement('p');
    // `code` spans
    hints[shown].split(/(`[^`]+`)/).forEach((part) => {
      if (/^`[^`]+`$/.test(part)) {
        const c = document.createElement('code');
        c.textContent = part.slice(1, -1);
        p.append(c);
      } else if (part) {
        p.append(part);
      }
    });
    hintList.append(p);
    hintList.hidden = false;
    shown++;
    updateHintButton();
  });
  const refresh = () => {
    const done = isDone(id);
    status.textContent = done ? text('exercise.done') : text('exercise.todo');
    root.classList.toggle('is-done', done);
  };
  refresh();
  document.addEventListener('qlang-progress', refresh);

  const span = (cls, content) => {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = content;
    return s;
  };
  async function check() {
    runButton.disabled = true;
    runButton.textContent = text('exercise.checking');
    const studentLines = code.value.split('\n').length;
    const result = await run({ files: { ...modules, 'main.q': code.value + '\n' + tests }, input: [] });
    runButton.disabled = false;
    runButton.textContent = text('exercise.check');
    if (result.stopped) {
      output.replaceChildren(span('error', text(`stopped.${result.stopped}`)));
      return;
    }
    const a = result.answer;
    const parts = [];
    if (a.output) parts.push(span('', a.output));
    for (const d of a.diagnostics || []) parts.push(span('error', describeFor(d, studentLines, tests.split('\n')) + '\n'));
    if (a.ok) {
      parts.push(span('success', text('exercise.passed')));
      markDone(id);
    }
    output.replaceChildren(...parts);
  }
  runButton.addEventListener('click', check);
  resetButton.addEventListener('click', () => {
    code.value = starter;
    output.replaceChildren();
  });
  toggle.addEventListener('click', () => {
    solutionBox.hidden = !solutionBox.hidden;
    toggle.textContent = text(solutionBox.hidden ? 'exercise.solution.show' : 'exercise.solution.hide');
  });
  testsPre.remove();
  solutionPre.remove();
  hintPre?.remove();
  pre.replaceWith(root);
}

// The number of exercises done, on the pages that list the series.
function showProgress() {
  for (const el of document.querySelectorAll('[data-progress-series]')) {
    el.textContent = `${doneIn(el.dataset.progressSeries)}/${el.dataset.total}`;
  }
}
showProgress();
document.addEventListener('qlang-progress', showProgress);
document.querySelector('[data-testid=reset-progress]')?.addEventListener('click', () => {
  if (confirm(text('progress.confirm'))) reset();
});

// examples of the reference: highlighted, not runnable
for (const block of document.querySelectorAll('pre > code.language-qlang-ref')) {
  const host = document.createElement('div');
  host.className = 'qlang-widget reference-code';
  const pre = block.closest('pre');
  const source = block.textContent.replace(/\n$/, '');
  pre.replaceWith(host);
  mountEditor(host, { doc: source, readOnly: true, label: 'qlang' });
}
for (const block of document.querySelectorAll('pre > code.language-qlang-module')) moduleWidget(block);
for (const block of document.querySelectorAll('pre > code.language-qlang-exercise')) exerciseWidget(block);
for (const block of document.querySelectorAll('pre > code.language-qlang')) widget(block);
document.documentElement.dataset.ready = 'true';
