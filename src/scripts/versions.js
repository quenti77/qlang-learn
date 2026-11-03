// The version selector of the header and the banner above the page. The list of versions is
// versions.json, at the root of the site: a version built long ago still knows the later ones.
const select = document.querySelector('[data-version-select]');
const banner = document.querySelector('[data-version-banner]');

if (select && banner) {
  const text = JSON.parse(document.getElementById('ui-strings').textContent);
  const fill = (key, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), text[key]);
  const { version, siteBase } = select.dataset;
  const prefix = `${siteBase}${version}/`;
  // this page without the version in front: what to look for in another version
  const here = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) : '';
  // the home page of a version in the language of this page (the root of a version picks one and drops the query)
  const home = (name) => `${siteBase}${name}/${document.documentElement.lang}/`;
  const exists = (url) => fetch(url, { method: 'HEAD' }).then((r) => r.ok, () => false);

  const manifest = await fetch(`${siteBase}versions.json`).then((r) => (r.ok ? r.json() : null), () => null);
  if (manifest) {
    // the latest first, then the others as the manifest lists them
    const names = [manifest.latest, ...manifest.versions.map((v) => v.name).filter((n) => n !== manifest.latest)];
    select.replaceChildren(
      ...names.map((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name === manifest.latest ? fill('version.latest', { v: name }) : name;
        option.selected = name === version;
        return option;
      })
    );
    select.addEventListener('change', async () => {
      const target = `${siteBase}${select.value}/`;
      // keep the page when the other version has it, else the home page of that version
      location.assign((await exists(target + here)) ? target + here + location.hash : `${home(select.value)}?missing=${encodeURIComponent(version)}`);
    });

    // the lessons and the exercises are written for the latest version only: the menu leads there
    if (version !== manifest.latest) {
      for (const a of document.querySelectorAll('[data-testid="nav-lessons"], [data-testid="nav-exercises"]')) {
        a.setAttribute('href', a.getAttribute('href').replace(prefix, `${siteBase}${manifest.latest}/`));
      }
    }

    const current = manifest.versions.find((v) => v.name === version);
    const lines = [];
    const missing = new URLSearchParams(location.search).get('missing');
    if (missing) lines.push(fill('version.missing', { v: version }));
    if (version !== manifest.latest) {
      const same = `${siteBase}${manifest.latest}/${here}`;
      const link = document.createElement('a');
      link.textContent = fill('version.old.link', { latest: manifest.latest });
      link.href = (await exists(same)) ? same : home(manifest.latest);
      lines.push(fill('version.old', { v: version, latest: manifest.latest }), current?.status === 'archived' ? fill('version.archived') : '', link);
    }
    if (current?.status === 'next') lines.push(fill('version.next'));
    if (lines.length) {
      banner.replaceChildren(...lines.filter(Boolean).flatMap((l, i) => [i ? ' ' : '', l]).filter((x) => x !== ''));
      banner.hidden = false;
    }
  }
}
