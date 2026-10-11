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
