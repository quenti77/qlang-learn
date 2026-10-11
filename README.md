# qlang-learn

Learn to program with [qlang](https://github.com/quenti77/qlang), in the browser: lessons whose
code blocks can be edited and run on the spot (qlang is compiled to WebAssembly and runs in a Web
Worker, no server), then exercises. French and English.

## Work on the site

```sh
npm install
QLANG_REPO=../qlang npm run dev     # use a local build of qlang (see below)
```

`npm run sync` puts `qlang.wasm` and `qlang.mjs` in place: from a local checkout of qlang
(`QLANG_REPO=../qlang`, after `cargo build --profile wasm --target wasm32-unknown-unknown -p qlang-wasm`
there), or, without it, from the release named in `QLANG_VERSION`.

## Tests

```sh
npx playwright install chromium firefox     # once
QLANG_REPO=../qlang npm run test:e2e
```

The end-to-end tests (Playwright) build the site and drive it in real browsers (Chromium,
Firefox, a phone-sized Chromium) with the real `qlang.wasm`: running and editing code, errors,
`read()`, the step limit, the timeout that kills a runaway program, recursion, language switch.
`npm run check-content` checks that every lesson exists in every language with the same code blocks.

## Content

```
content/<lang>/cours/NN-name.md     a lesson (front matter: title)
src/i18n/<lang>.json                texts of the interface
```

A ```` ```qlang ```` block becomes an editor with a Run button (and an input field if it calls
`read()`). A lesson has the same file name in every language.

## Decisions

- Static site (Astro), no server, no account: the progress will live in the browser.
- qlang's call depth is limited to 250 in the browser: WebAssembly recursion uses the browser's
  small call stack (Chromium overflows near 500 nested qlang calls). See `src/scripts/engine.js`.
- A program running more than 8 s is killed by terminating its worker.
- Compiler messages (errors, hover texts) are in English in both languages for now.

## To do

Convert the 28 lessons of `qlang-algo`, exercises (statement, starter code, hidden tests, hints,
solution), progress in the browser, a real code editor (CodeMirror) with the hover and
completion of the VS Code extension, deployment.
