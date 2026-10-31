---
title: "Other editors and the debugger"
group: "Tools"
---

# Other editors and the debugger

`qlang lsp` speaks the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) on the standard
input and output: errors as you type, hovers, completion, go to definition, references, rename, outline, formatting
(`textDocument/formatting`). Tell the editor to start it for `*.q` files. These settings follow each editor's
documentation; only VS Code (the extension of the repository) is tested with each version.

Highlighting comes from a TextMate grammar,
[`editors/vscode/syntaxes/qlang.tmLanguage.json`](https://github.com/quenti77/qlang/blob/main/editors/vscode/syntaxes/qlang.tmLanguage.json),
which Sublime Text, JetBrains and others can read.

## Neovim (0.11 or later)

```lua
vim.filetype.add({ extension = { q = "qlang" } })
vim.lsp.config("qlang", {
  cmd = { "qlang", "lsp" },
  filetypes = { "qlang" },
  root_markers = { "qlang.toml", ".git" },
})
vim.lsp.enable("qlang")
```

Before 0.11, with `nvim-lspconfig`: `vim.lsp.start({ name = "qlang", cmd = { "qlang", "lsp" }, root_dir = vim.fn.getcwd() })`
in a `FileType qlang` autocommand. Formatting: `vim.lsp.buf.format()`, or `qlang fmt --stdin` as a formatter
(`conform.nvim`: `formatters_by_ft.qlang = { "qlang_fmt" }` with `command = "qlang"`, `args = { "fmt", "--stdin" }`).

## Helix

In `~/.config/helix/languages.toml`:

```toml
[language-server.qlang]
command = "qlang"
args = ["lsp"]

[[language]]
name = "qlang"
scope = "source.qlang"
file-types = ["q"]
roots = ["qlang.toml"]
comment-token = "--"
indent = { tab-width = 2, unit = "  " }
language-servers = ["qlang"]
formatter = { command = "qlang", args = ["fmt", "--stdin"] }
auto-format = true
```

## Emacs (eglot)

```elisp
(add-to-list 'auto-mode-alist '("\\.q\\'" . prog-mode))
(with-eval-after-load 'eglot
  (add-to-list 'eglot-server-programs '((prog-mode :language-id "qlang") . ("qlang" "lsp"))))
```

(restrict it to a `qlang-mode` major mode if you define one, so the server does not start for other `prog-mode` files).

## Sublime Text (LSP package)

`Preferences > Package Settings > LSP > Settings`:

```json
{
  "clients": {
    "qlang": {
      "enabled": true,
      "command": ["qlang", "lsp"],
      "selector": "source.qlang"
    }
  }
}
```

With the repository's TextMate grammar so that `source.qlang` exists.

## JetBrains (IntelliJ IDEA, PyCharm, GoLand…)

JetBrains IDEs read an LSP server through the **LSP4IJ** plugin: `Language Servers` > `+` > *New Language Server*,
command `qlang lsp`, and in *Mappings* the file extension `*.q`. The TextMate grammar loads through
`Settings > Editor > TextMate Bundles`. There is no dedicated JetBrains plugin yet.

## Zed

Zed declares a language through an extension (grammar + server). There is none for qlang yet: until there is, use
`qlang fmt --stdin` as an external formatter and `qlang check` in the terminal.

## Debugger (DAP)

`qlang dap` is a debug adapter ([Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)) on the
standard input and output: breakpoints, steps (into, over, out), pause, call stack, variables (arrays, dictionaries,
structures, enumerations that unfold) and `evaluate` for a variable name (`a`, `a.field`, `a.0`). The launch
configuration takes `program` (required), `args`, `cwd`, `stopOnEntry` and `allowProcess`. VS Code: the repository's
extension wires it up (F5 on a `.q` file).

Other editors (same caveat as above: settings taken from each one's documentation):

```lua
-- Neovim, with nvim-dap
local dap = require("dap")
dap.adapters.qlang = { type = "executable", command = "qlang", args = { "dap" } }
dap.configurations.qlang = {
  { type = "qlang", request = "launch", name = "Debug the file", program = "${file}" },
}
```

```toml
# Helix, in languages.toml (in the qlang [[language]] block)
[language.debugger]
name = "qlang"
transport = "stdio"
command = "qlang"
args = ["dap"]

[[language.debugger.templates]]
name = "file"
request = "launch"
completion = [ { name = "program", completion = "filename" } ]
args = { program = "{0}" }
```

Emacs: `dape` or `dap-mode` with the command `qlang dap` and `:program`; JetBrains: LSP4IJ also handles a DAP adapter
(*Debug Adapter Protocol* in the settings).

Good to know: the program runs in the plain interpreter (like `--coverage`), so more slowly; its `print` goes to the
editor's console; reading the keyboard (`read()`) is not available (the input is the protocol's); a breakpoint on a line
without a statement (blank, comment, `end`) never stops.

## Formatting and analysis from any editor

- `qlang fmt --stdin`: the program on the input, laid out on the output (code 65 if the file does not parse).
- `qlang lint file.q`: warnings as `file:line:column: warning[L00x]: …`, readable by most editors as compiler output.
