// The lessons: content/<lang>/cours/<NN-name>.md, with `title` in the front matter.
// A lesson has the same file name in every language.
const files = import.meta.glob('/content/*/cours/*.md', { eager: true });

export function lessons(lang) {
  return Object.entries(files)
    .map(([file, mod]) => {
      const [, , l, , name] = file.split('/');
      return { lang: l, slug: name.replace(/\.md$/, ''), title: mod.frontmatter.title, Content: mod.Content };
    })
    .filter((x) => x.lang === lang)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function hasLesson(lang, slug) {
  return lessons(lang).some((l) => l.slug === slug);
}

// The exercises: content/<lang>/exercices/<NN-name>.md, one page per series of exercises.
const exerciseFiles = import.meta.glob('/content/*/exercices/*.md', { eager: true });
const exerciseSources = import.meta.glob('/content/*/exercices/*.md', { eager: true, query: '?raw', import: 'default' });

export function exerciseSeries(lang) {
  return Object.entries(exerciseFiles)
    .map(([file, mod]) => {
      const [, , l, , name] = file.split('/');
      const text = exerciseSources[file] ?? '';
      return { lang: l, slug: name.replace(/\.md$/, ''), title: mod.frontmatter.title, count: (text.match(/^## /gm) || []).length, Content: mod.Content };
    })
    .filter((x) => x.lang === lang)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// The documentation: pages written for this site (content/<lang>/docs/*.md) and pages generated
// by `npm run sync` from qlang's own documents (content/fr/docs-generated/*.md). The number at the
// start of a file name orders them; `group` in the front matter groups them in the menu.
const docFiles = import.meta.glob('/content/*/docs/*.md', { eager: true });
const generatedDocFiles = import.meta.glob('/content/*/docs-generated/*.md', { eager: true });

export function docPages(lang) {
  return Object.entries({ ...docFiles, ...generatedDocFiles })
    .map(([file, mod]) => {
      const [, , l, , name] = file.split('/');
      return { lang: l, slug: name.replace(/\.md$/, ''), title: mod.frontmatter.title, group: mod.frontmatter.group, Content: mod.Content };
    })
    .filter((x) => x.lang === lang)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** The pages of the documentation by group, in order: [{ name, pages }]. */
export function docGroups(lang) {
  const groups = [];
  for (const page of docPages(lang)) {
    let group = groups.find((g) => g.name === page.group);
    if (!group) groups.push((group = { name: page.group, pages: [] }));
    group.pages.push(page);
  }
  return groups;
}

/** Is there a page `slug` in `section` in this language? (to link to the same page in another language) */
export function pageExists(lang, section, slug) {
  const pages = { cours: lessons, exercices: exerciseSeries, docs: docPages }[section];
  return pages(lang).some((p) => p.slug === slug);
}
