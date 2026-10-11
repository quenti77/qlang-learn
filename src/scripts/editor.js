// The code editor of the lessons and exercises: CodeMirror 6 with qlang highlighting.
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting, bracketMatching, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';
import { qlangLanguage } from './qlang-language.js';

// The colors are CSS variables (see site.css), so that the light and dark themes just work.
const highlight = HighlightStyle.define([
  { tag: [t.comment, t.docComment], color: 'var(--tok-comment)', fontStyle: 'italic' },
  { tag: t.string, color: 'var(--tok-string)' },
  { tag: t.number, color: 'var(--tok-number)' },
  { tag: [t.controlKeyword, t.definitionKeyword, t.modifier], color: 'var(--tok-keyword)', fontWeight: '600' },
  { tag: t.operatorKeyword, color: 'var(--tok-operator-word)', fontWeight: '600' },
  { tag: [t.atom, t.self], color: 'var(--tok-atom)' },
  { tag: t.typeName, color: 'var(--tok-type)' },
  { tag: t.definition(t.typeName), color: 'var(--tok-type)', fontWeight: '600' },
  { tag: t.definition(t.function(t.variableName)), color: 'var(--tok-function)', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--tok-function)' },
  { tag: t.propertyName, color: 'var(--tok-property)' },
  { tag: t.constant(t.variableName), color: 'var(--tok-atom)' },
  { tag: t.operator, color: 'var(--tok-operator)' },
]);

const theme = EditorView.theme({
  '&': { color: 'var(--fg)', backgroundColor: 'var(--surface)', fontSize: '0.93rem' },
  '.cm-content': { fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace', padding: '0.8rem 0', caretColor: 'var(--fg)', lineHeight: '1.55' },
  '.cm-line': { padding: '0 1rem' },
  '&.cm-focused': { outline: '2px solid var(--accent)', outlineOffset: '-2px' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-activeLine': { backgroundColor: 'var(--active-line)' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { backgroundColor: 'var(--selection)' },
  '.cm-cursor': { borderLeftColor: 'var(--fg)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--selection)', outline: '1px solid var(--muted)' },
  '.cm-scroller': { overflow: 'auto', minHeight: '3rem' },
});

/**
 * Put an editor in `host`. Returns `{ value, focus }`; `value` can be read and assigned.
 * `readOnly` shows highlighted code that cannot be changed; `onRun` is called on Ctrl+Enter.
 */
export function mountEditor(host, { doc = '', readOnly = false, onRun = null, label = '' } = {}) {
  const extensions = [
    qlangLanguage,
    syntaxHighlighting(highlight),
    theme,
    EditorView.lineWrapping.of ? [] : [],
    EditorView.contentAttributes.of({ 'aria-label': label || 'qlang', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
  ];
  if (readOnly) {
    extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  } else {
    extensions.push(
      history(),
      drawSelection(),
      highlightActiveLine(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (onRun ? (onRun(), true) : false) }])),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab])
    );
  }
  const view = new EditorView({ state: EditorState.create({ doc, extensions }), parent: host });
  const api = {
    get value() {
      return view.state.doc.toString();
    },
    set value(text) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    },
    focus: () => view.focus(),
    view,
  };
  host.qlangEditor = api; // the end-to-end tests read and set the code through this
  return api;
}
