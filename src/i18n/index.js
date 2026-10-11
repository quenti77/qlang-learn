import fr from './fr.json';
import en from './en.json';

export const languages = ['fr', 'en'];
export const defaultLanguage = 'fr';
const tables = { fr, en };

/** The text for `key` in `lang`; a missing key falls back to French, then to the key. */
export function t(lang, key) {
  return tables[lang]?.[key] ?? tables[defaultLanguage][key] ?? key;
}

export function strings(lang) {
  return { ...tables[defaultLanguage], ...tables[lang] };
}
