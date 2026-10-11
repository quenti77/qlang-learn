// Syntax highlighting for qlang (a CodeMirror stream parser). The same word lists as the
// grammar of the VS Code extension.
import { StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const CONTROL = new Set('if then elseif else end while for in step do break continue match case return'.split(' '));
const DECL = new Set('fun struct impl trait enum let const'.split(' '));
const MODIFIER = new Set('public private protected static override extends import export from as'.split(' '));
const OPERATOR_WORDS = new Set('and or not div mod'.split(' '));
const ATOMS = new Set(['true', 'false', 'none']);
const SELF = new Set(['self', 'super']);
const TYPES = new Set('int float bool string array map range'.split(' '));
const NAMES_AFTER = { fun: 'fnDef', struct: 'typeDef', enum: 'typeDef', trait: 'typeDef', extends: 'type' };

const tokenTable = {
  comment: t.comment,
  doc: t.docComment,
  string: t.string,
  number: t.number,
  control: t.controlKeyword,
  decl: t.definitionKeyword,
  modifier: t.modifier,
  opword: t.operatorKeyword,
  atom: t.atom,
  self: t.self,
  type: t.typeName,
  typeDef: t.definition(t.typeName),
  fnDef: t.definition(t.function(t.variableName)),
  fn: t.function(t.variableName),
  member: t.propertyName,
  method: t.function(t.propertyName),
  constant: t.constant(t.variableName),
  operator: t.operator,
  punctuation: t.punctuation,
  name: t.variableName,
};

const qlang = {
  name: 'qlang',
  startState: () => ({ block: null, after: null, dot: false }),
  token(stream, state) {
    // inside a block comment `--( ... --)` or a documentation comment `--" ... --"`
    if (state.block) {
      const end = state.block === 'doc' ? '--"' : '--)';
      const kind = state.block;
      while (!stream.eol()) {
        if (stream.match(end)) {
          state.block = null;
          break;
        }
        stream.next();
      }
      return kind;
    }
    if (stream.eatSpace()) return null;
    if (stream.match('--(')) {
      state.block = 'comment';
      while (!stream.eol()) {
        if (stream.match('--)')) {
          state.block = null;
          break;
        }
        stream.next();
      }
      return 'comment';
    }
    if (stream.match('--"')) {
      state.block = 'doc';
      while (!stream.eol()) {
        if (stream.match('--"')) {
          state.block = null;
          break;
        }
        stream.next();
      }
      return 'doc';
    }
    if (stream.match('--')) {
      stream.skipToEnd();
      return 'comment';
    }
    const wasDot = state.dot;
    state.dot = false;
    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        const c = stream.next();
        if (c === '\\') stream.next();
        else if (c === '"') break;
      }
      return 'string';
    }
    if (stream.match(/^0[xX][0-9a-fA-F_]+/) || stream.match(/^0[bB][01_]+/) || stream.match(/^\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?/)) return 'number';
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const word = stream.current();
      const call = /^\s*(\(|<[^>]*>\s*\()/.test(stream.string.slice(stream.pos));
      const pending = state.after;
      state.after = null;
      if (wasDot) return call ? 'method' : 'member';
      if (pending && !CONTROL.has(word)) return pending;
      if (NAMES_AFTER[word]) state.after = NAMES_AFTER[word];
      if (CONTROL.has(word)) return 'control';
      if (DECL.has(word)) return 'decl';
      if (MODIFIER.has(word)) return 'modifier';
      if (OPERATOR_WORDS.has(word)) return 'opword';
      if (ATOMS.has(word)) return 'atom';
      if (SELF.has(word)) return 'self';
      if (TYPES.has(word) || /^[A-Z][a-z0-9]/.test(word) || /^[A-Z]$/.test(word)) return 'type';
      if (/^[A-Z][A-Z0-9_]+$/.test(word)) return 'constant';
      return call ? 'fn' : 'name';
    }
    if (stream.match('..=') || stream.match('..') || stream.match('->') || stream.match(/^[=!<>+\-*/%]=/) || stream.match(/^\*\*/)) return 'operator';
    const c = stream.next();
    if (c === '.') {
      state.dot = true;
      return 'punctuation';
    }
    if ('+-*/%=<>?'.includes(c)) return 'operator';
    return 'punctuation';
  },
  languageData: { commentTokens: { line: '--', block: { open: '--(', close: '--)' } }, closeBrackets: { brackets: ['(', '[', '{', '"'] } },
  tokenTable,
};

export const qlangLanguage = StreamLanguage.define(qlang);
