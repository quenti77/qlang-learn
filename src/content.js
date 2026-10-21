// The lessons: content/<lang>/cours/<NN-name>.md, with `title` in the front matter.
// A lesson has the same file name in every language.
const files = import.meta.glob('/content/*/cours/*.md', { eager: true });

export function lessons(lang) {
  return Object.entries(files)
    .map(([file, mod]) => {
      const [, , l, , name] = file.split('/');
      const slug = name.replace(/\.md$/, '');
      return { lang: l, slug, title: mod.frontmatter.title, part: partOf(slug), headings: outline(mod), Content: mod.Content };
    })
    .filter((x) => x.lang === lang)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** The h2/h3 headings of a page, for its "on this page" outline. */
function outline(mod) {
  return mod.getHeadings().filter((h) => h.depth === 2 || h.depth === 3);
}

// The lessons are grouped in parts by their number (the two digits that start the file name).
// The title of a part is the i18n key `part.<id>`.
export const parts = [
  { id: 'basics', from: 1, to: 8 },
  { id: 'collections', from: 9, to: 12 },
  { id: 'types', from: 13, to: 18 },
  { id: 'solid', from: 19, to: 22 },
  { id: 'algorithms', from: 23, to: 27 },
  { id: 'beyond', from: 28, to: 30 },
  { id: 'more', from: 31, to: 32 },
  { id: 'project', from: 33, to: 33 },
];
export const partOf = (slug) => {
  const n = Number(slug.slice(0, 2));
  return parts.find((p) => n >= p.from && n <= p.to)?.id;
};

/** The lessons by part, in order: [{ id, lessons }]. */
export function lessonParts(lang) {
  const all = lessons(lang);
  return parts.map((p) => ({ id: p.id, lessons: all.filter((l) => l.part === p.id) })).filter((p) => p.lessons.length);
}

// Which pages of the documentation go with which lesson: lesson number -> documentation numbers
// (the number at the start of a documentation file name, the same in every language).
const lessonDocs = {
  1: [10, 1, 2], 2: [12], 3: [13], 4: [14], 5: [12, 23], 6: [15], 7: [16], 8: [17], 9: [23], 10: [23],
  11: [12], 12: [15], 13: [18], 14: [18], 15: [19], 16: [19], 17: [20], 18: [21], 19: [17], 20: [22],
  21: [25, 29], 22: [26], 28: [24], 29: [24], 30: [26], 31: [12, 23], 32: [20, 25],
};

/** The documentation pages that go with a lesson (slug). */
export function docsForLesson(lang, slug) {
  const wanted = lessonDocs[Number(slug.slice(0, 2))] || [];
  const pages = docPages(lang);
  return wanted.map((n) => {
    const page = pages.find((p) => Number(p.slug.slice(0, 2)) === n);
    if (!page) console.warn(`lessonDocs: lesson ${slug} points to documentation page ${n}, which does not exist in ${lang}`);
    return page;
  }).filter(Boolean);
}

/** The lessons that go with a documentation page (slug). */
export function lessonsForDoc(lang, slug) {
  const n = Number(slug.slice(0, 2));
  return lessons(lang).filter((l) => (lessonDocs[Number(l.slug.slice(0, 2))] || []).includes(n));
}

export function hasLesson(lang, slug) {
  return lessons(lang).some((l) => l.slug === slug);
}

// The exercises: content/<lang>/exercices/<NN-name>.md, one page per series of exercises.
const exerciseFiles = import.meta.glob('/content/*/exercices/*.md', { eager: true });
const exerciseSources = import.meta.glob('/content/*/exercices/*.md', { eager: true, query: '?raw', import: 'default' });

// The part of the course each series of exercises goes with.
const seriesPart = { '01-bases': 'basics', '02-tableaux-chaines': 'collections', '03-structs-traits': 'types', '04-algorithmes': 'algorithms' };

/** The series of exercises that go with a part of the course. */
export const exercisesForPart = (lang, partId) => exerciseSeries(lang).filter((s) => s.part === partId);

export function exerciseSeries(lang) {
  return Object.entries(exerciseFiles)
    .map(([file, mod]) => {
      const [, , l, , name] = file.split('/');
      const text = exerciseSources[file] ?? '';
      const slug = name.replace(/\.md$/, '');
      return { lang: l, slug, title: mod.frontmatter.title, count: (text.match(/^## /gm) || []).length, part: seriesPart[slug], headings: outline(mod), Content: mod.Content };
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
      return { lang: l, slug: name.replace(/\.md$/, ''), title: mod.frontmatter.title, group: mod.frontmatter.group, headings: outline(mod), Content: mod.Content };
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

/**
 * The slug of the page of `section` in `lang` that matches `slug` of the other language: the
 * same slug, or (documentation pages are named after their titles) the same number. Or null.
 */
export function counterpart(lang, section, slug) {
  const pages = { cours: lessons, exercices: exerciseSeries, docs: docPages }[section](lang);
  const same = pages.find((p) => p.slug === slug) || pages.find((p) => section === 'docs' && p.slug.slice(0, 2) === slug.slice(0, 2));
  return same ? same.slug : null;
}

/** Is there a page `slug` in `section` in this language? (to link to the same page in another language) */
export function pageExists(lang, section, slug) {
  const pages = { cours: lessons, exercices: exerciseSeries, docs: docPages }[section];
  return pages(lang).some((p) => p.slug === slug);
}
