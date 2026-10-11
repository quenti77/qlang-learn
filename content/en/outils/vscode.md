---
title: "VS Code extension"
---

# VS Code extension

To write qlang on your own computer, the **qlang** extension for VS Code (files ending in `.q`)
brings syntax highlighting, errors underlined as you type, tooltips and completion. It relies on the
real compiler: you see the same errors as in the terminal.

## What it does

- **Syntax highlighting**: keywords, types, numbers (`0xFF_FF`, `0b0101`, `1_000`), strings with
  `{interpolation}` and the three kinds of comments (`--`, `--( … --)`, `--" … --"`).
- **Errors as you type**: underlined in the editor and listed in the Problems panel, including the
  ones in imported modules.
- **Tooltips**: hover a name to see its type (`names: array<string>`), the signature of a function
  or method, and the `--" … --"` comment written above its declaration. Built-in methods (`len`,
  `push`, `split`…) are explained.
- **Completion**: after a `.`, the fields and methods of the value's type (the public members, and
  all of them on `self`); after `Type.`, the variants of an enum and the static functions;
  elsewhere, the variables in scope, the names of the file, the built-in functions, keywords and
  types.
- **Parameter hints**: typing `(` or `,` in a call shows the signature with the current parameter
  in bold.
- **Run**: the ▶ button in the title bar (or the command **qlang: Run File**) saves the file and
  runs it in a terminal, where `read()` works with your keyboard.
- **Snippets**: `fun`, `if`, `for`, `foreach`, `while`, `match`, `struct`, `impl`, `trait`, `enum`,
  `import`… (type the prefix, then Tab).
- Comment toggling, auto-closing brackets and quotes, and automatic indentation around
  `then … end`, `do … end` and `fun … end`.

## Install

The extension calls the `qlang` program. The installer of the project installs both (and updates
them: just run the same command again):

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh -s -- --vscode
```

For a given VS Code profile, add `--profile ProfileName`. Without the script, download the program
for your machine and `qlang.vsix` from the
[releases page](https://github.com/quenti77/qlang/releases/latest), then:

```sh
code --install-extension qlang.vsix
```

**Windows**: there is no prebuilt program yet. Install Rust, then
`cargo install --git https://github.com/quenti77/qlang qlang-cli`; the extension (`qlang.vsix`) is
on the releases page.

If `qlang` is not in your `PATH`, set **qlang.path** to its full path. This setting is only read
from your **user** settings, never from a project's `.vscode/settings.json`: a downloaded project
cannot choose the program the extension runs.

## Settings

| Setting                     | Default | Meaning                                          |
| --------------------------- | ------- | ------------------------------------------------ |
| `qlang.path`                | `qlang` | The program to run                               |
| `qlang.diagnostics.enabled` | `true`  | Check files while you type                       |
| `qlang.diagnostics.delay`   | `400`   | Milliseconds to wait after you stop typing       |

## Limits

Tooltips and completion need a file the compiler can read: with a syntax error elsewhere in the
file, the extension reuses its previous answer. After a `.`, it asks the compiler about the code
without the `.name` being typed, so that it still compiles. The texts of these tooltips are in
English, like the error messages.
