// The search dialog. The index is built by Pagefind after `astro build` (see package.json) and
// loaded the first time the dialog opens; there is none under `astro dev`.
const dialog = document.getElementById('search');
const ui = JSON.parse(document.getElementById('ui-strings')?.textContent || '{}');
const text = (key) => ui[key] || key;

if (dialog) {
  const input = dialog.querySelector('input');
  const filtersBox = dialog.querySelector('.search-filters');
  const status = dialog.querySelector('.search-status');
  const list = dialog.querySelector('.search-results');
  const base = dialog.dataset.base;
  const PAGE = 8;
  let pagefind = null;
  let failed = false;
  let section = ''; // '' = everywhere
  let token = 0; // the latest search wins
  let timer;

  async function load() {
    if (pagefind || failed) return pagefind;
    try {
      pagefind = await import(/* @vite-ignore */ `${base}/pagefind/pagefind.js`);
      await pagefind.options({ baseUrl: `${base}/` });
      await pagefind.init();
      await pagefind.filters(); // loads the filters: the results then carry their counts
    } catch {
      failed = true;
    }
    return pagefind;
  }

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    input.select();
    load().then(() => input.value.trim() && search());
    if (!input.value.trim()) show(text('search.hint'));
  }

  function show(message) {
    status.textContent = message;
    list.replaceChildren();
    filtersBox.replaceChildren();
  }

  function renderFilters(counts) {
    filtersBox.replaceChildren();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    for (const [id, label, count] of [['', text('search.all'), total], ...['cours', 'exercices', 'docs'].filter((s) => counts[s]).map((s) => [s, text(`section.${s}`), counts[s]])]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', String(id === section));
      b.textContent = `${label} ${count}`;
      b.addEventListener('click', () => {
        section = id;
        search();
        input.focus();
      });
      filtersBox.append(b);
    }
  }

  async function search() {
    const query = input.value.trim();
    const mine = ++token;
    if (!query) return show(text('search.hint'));
    if (!(await load())) return show(text('search.unavailable'));
    const found = await pagefind.search(query, section ? { filters: { section } } : {});
    if (mine !== token) return;
    const counts = found.totalFilters?.section || {};
    if (!found.results.length && !section) return show(text('search.none').replace('{q}', query));
    renderFilters(counts);
    status.textContent = '';
    list.replaceChildren();
    let shown = 0;
    const more = async () => {
      const batch = found.results.slice(shown, shown + PAGE);
      shown += batch.length;
      const items = await Promise.all(batch.map((r) => r.data()));
      if (mine !== token) return;
      moreButton.remove();
      for (const d of items) list.append(item(d));
      if (shown < found.results.length) list.append(moreButton);
    };
    const moreButton = document.createElement('li');
    moreButton.className = 'more';
    moreButton.innerHTML = `<button type="button"></button>`;
    moreButton.firstChild.textContent = text('search.more');
    moreButton.firstChild.addEventListener('click', more);
    await more();
    if (!found.results.length) status.textContent = text('search.none').replace('{q}', query);
  }

  function item(d) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = d.url;
    const where = [text(`section.${d.filters?.section?.[0]}`), d.meta.part].filter(Boolean).join(' › ');
    a.innerHTML = '<span class="where"></span><strong class="title"></strong><span class="excerpt"></span>';
    a.querySelector('.where').textContent = where;
    a.querySelector('.title').textContent = d.meta.title;
    a.querySelector('.excerpt').innerHTML = d.excerpt; // Pagefind escapes the text and only adds <mark>
    li.append(a);
    return li;
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 120);
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // a search field would only clear itself
      dialog.close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...dialog.querySelectorAll('.search-results a')];
    if (!links.length) return;
    const at = links.indexOf(document.activeElement);
    const to = e.key === 'ArrowDown' ? at + 1 : at - 1;
    e.preventDefault();
    if (to < 0) input.focus();
    else links[Math.min(to, links.length - 1)].focus();
  });
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close()); // the backdrop
  dialog.addEventListener('click', (e) => e.target.closest('.search-results a') && dialog.close());

  document.querySelector('.search-open')?.addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName) || target.closest('.cm-editor'));
    if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      open();
    }
  });
}
