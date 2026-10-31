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

Today there is one rule: `Log.warn` → `Log.warning` (0.69). What is not a rename stays described below.

## 0.69: `Log.warn` is deprecated (not removed yet)

- **Before**: `Log.warn("message")`.
- **After**: `Log.warning("message")`. `Log.warn` still works, with the warning `W001`. Removal in 0.72 at the earliest.
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
