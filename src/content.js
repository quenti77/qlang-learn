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
