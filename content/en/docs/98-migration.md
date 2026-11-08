---
title: "Migrating between versions"
group: "Guides"
---

# Migrating between versions

This page keeps, for each breaking change, what changes and how to adapt. The rule is in
[the stability page](../97-stabilite/): from 0.69 on, every CHANGELOG version that breaks something has a **Cassant**
section, and the change appears here.

To find what might break **before** upgrading: run `qlang check --deny-warnings` (or `qlang test --deny-warnings`) on
the project with the current version; what is deprecated shows up as `W001`.

## `qlang migrate`

`qlang migrate` rewrites the **mechanical** part of a breaking change: a rename of `Type.name`. It replaces names
**in code** (never inside a string or a comment) and checks that the result has exactly the same tokens, the renamed
names aside, before writing.

```sh
qlang migrate --rules     # the known renames, with the version that announces them
qlang migrate --check     # lists the files that would change, without touching them (code 1: for CI)
qlang migrate             # rewrites
```

Today there is one rule: `Log.warn` → `Log.warning` (deprecated in 0.69, removed in 0.83). What is not a rename stays described below.

## 1.3: `File.is_link()` of a missing path (provisional)

- **Before**: `File.of("missing").is_link()` gave `err` ("not found"), while `exists()` and `is_file()` gave `ok(false)`.
- **After**: `ok(false)`, like the other two.
- **Adapting**: a program that relied on the `err` to know whether the path exists should call `exists()`.
  This change touches a part that used to be provisional (`File`, stable since 1.3).

## 1.1: the tokens of `datetime.format` (provisional)

- **Before**: only `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss` and `SSS` were tokens; any other letter was kept as it was, so
  `d.format("D/M/Y")` wrote `D/M/Y`.
- **After**: `D`, `M`, `H`, `h`, `A`, `d` (in a group of 3 or 4), `Y` (in a group of 2 or 3) and `W` (in a group of 2)
  are tokens too (day, month, hour, 12-hour clock, `AM`/`PM`, name of the day, 2-digit year, ISO week).
  `d.format("D/M/Y")` writes the day and the month, and keeps a lone `Y`.
- **How to adapt**: put the text that contains one of these letters between brackets: `d.format("[Date:] DD/MM/YYYY")`.
  Find the patterns with `grep -n "\.format(" *.q`. This change touches a provisional part (`datetime`).

## 1.0: `qlang fmt` writes four spaces and tidies the spaces of a line

- **Before**: two spaces per level; only the spaces at the start and end of a line changed.
- **After**: four spaces per level; a single space between two elements of a line, none inside parentheses and
  brackets, before a comma or a dot, nor between a name and the `(` of its call; a space after each comma. A missing
  space is never added, except after a comma.
- **To adapt**: run `qlang fmt` once on the project, then commit. A CI that runs `qlang fmt --check` fails until that
  is done. The meaning of programs does not change (the result has exactly the same tokens).

## 1.0: the rules of `qlang lint` are `Q001` to `Q005`

- **Before**: `qlang lint` reported `L001` to `L005`, the same codes as the errors of reading the text (`L001` unknown
  character, `L002` unterminated string…).
- **After**: the rules of `qlang lint` are `Q001` (unused variable), `Q002` (unused private function), `Q003` (unused
  import), `Q004` (code after `return`, `break` or `continue`), `Q005` (too many paths). `Lxxx` now only names reading
  errors.
- **To adapt**: replace `L001`…`L005` with `Q001`…`Q005` wherever a script or a CI filters the output of `qlang lint`.

## 0.83: `Log.warn` is removed

Deprecated in 0.69 (warning `W001`), removed fourteen minor versions later.

- **Before**: `Log.warn("message")`.
- **After**: `Log.warning("message")`. `Log.warn` no longer exists: the call is a compile error.
- **Adapting**: replace `Log.warn(` by `Log.warning(` (search and replace in the project).

## 0.61: `--dev` is refused outside `localhost`

- **Before**: `qlang serve app.q --dev --bind 0.0.0.0` showed detailed errors to everybody.
- **After**: refused, because the error page shows the code, the stack and the SQL queries.
- **Adapting**: do not use `--dev` in production; if it is wanted on a trusted network, add `--dev-public`.

## 0.57: `Log.warn` writes the level `warning`

- **Before**: the level written was `warn` (`"level":"warn"` in JSON).
- **After**: `warning`, as in PSR-3.
- **Adapting**: update the log tools' filters that looked for `warn`.

## 0.36: remote database in clear refused, memory limit

- `Db.connect("postgres://remote-host/…")` without `sslmode` in the URL is **refused** (the password went out in clear).
  Adapting: `?sslmode=require`, or `?sslmode=disable` if that is what you want.
- With `--root`, the file of a `sqlite://` database must be inside the folder.
- A program's memory is limited to 1 GB (`R904`): `--max-memory MB` changes it, `0` removes it.
- A response of more than 64 MB from an `extern` provider is refused.

## Before 0.36

Breaking changes were not marked separately: see the
[CHANGELOG](https://github.com/quenti77/qlang/blob/main/CHANGELOG.md).
