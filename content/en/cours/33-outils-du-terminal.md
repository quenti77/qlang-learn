---
title: "Command-line tools"
---

# Command-line tools

So far, everything ran in the page. This lesson is **read-only**: the commands below are used in
a terminal, with the `qlang` program installed on your machine (see the installation page of the
documentation). They turn a single file into a real project: organised, tested, documented, with
dependencies.

## Starting a project

```sh
qlang init my-app       # qlang.toml, main.q and .gitignore
cd my-app
qlang run               # runs the `entry` file of qlang.toml
qlang check             # checks without running
```

`qlang.toml` describes the project: its name, its starting file (`entry`) and its dependencies.
`qlang check` is handy in an editor or an automation: it reports type errors without running
anything.

## Testing with `qlang test`

A test file is named `*_test.q` or `test_*.q`. Each `fun test_...()` without parameters in it is
a test, which passes if it does not stop on an error. The `assert_*` functions are made for this.

```
import double from "math.q"

fun test_double()
  assert_eq(double(21), 42)
end

fun test_negatives()
  assert_lt(double(-1), 0)
  assert_ne(double(1), 3)
end

fun test_ages()
  assert_len([1, 2, 3], 3)
  assert_contains([1, 2, 3], 2)
  assert_close(0.1 + 0.2, 0.3)
end
```

```sh
qlang test                       # every test of the project
qlang test math_test.q           # one file (or a folder)
qlang test --filter double       # the tests whose name contains "double"
```

A failing assertion shows both values and the line **of your test**. The exit code is `0` if
everything passes, `1` otherwise: a script or continuous integration can use it.

The available assertions: `assert_eq`, `assert_ne`, `assert_lt`, `assert_le`, `assert_gt`,
`assert_ge`, `assert_ok`, `assert_err`, `assert_some`, `assert_none`, `assert_len`,
`assert_empty`, `assert_contains`, `assert_not_contains`, `assert_contains_text`,
`assert_starts_with`, `assert_ends_with`, `assert_close` and `assert_within`.

## Documenting with `qlang doc`

A comment `--" … --"` placed right above a declaration becomes its documentation:

```
--" Doubles a number. --"
public fun double(n: int) -> int
  n * 2
end
```

```sh
qlang doc                  # Markdown for the whole project, on standard output
qlang doc lib.q -o API.md  # one file, written to API.md
```

You get a Markdown page with the exported names, their signatures, and the public fields,
methods and variants of the types. Test files are ignored.

## Packages

A project can depend on the code of other projects. List them in `qlang.toml`:

```toml
[dependencies]
std = { git = "https://github.com/quenti77/qlang-std", tag = "v0.1.0" }
utils = { path = "../utils" }
```

```sh
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.1.0
qlang install        # fetches the packages into .qlang/packages (versions of qlang.lock)
qlang update         # moves tags and branches forward
qlang remove std
```

A package is imported with `@`: `import "@std/csv.q" as csv`. `qlang-std` is a library in plain
qlang (reading CSV, text templates, TOML). Put `.qlang/` in your `.gitignore` and commit
`qlang.lock`, which remembers the exact versions.

## Running another program

`Process.run("git", ["status"])` starts a program of the machine (without going through a shell)
and returns a `Result`: the exit code and what the program wrote. It is **refused by default**:
you have to ask for it when starting.

```sh
qlang run --allow-process tool.q
```

It is the same principle as for files and the network: the language does nothing outside itself
unless the environment allows it. The web page never allows it, one more reason for this lesson
to stay a reading.

## Remember

- `qlang init` creates a project; `qlang run` and `qlang check` use it without a file name.
- `qlang test` runs the `fun test_...()` of the `*_test.q` files, with the `assert_*` functions.
- `qlang doc` generates a Markdown page from the `--" … --"` comments.
- `qlang add` / `install` / `update` manage dependencies; import them with `@name`.
- `Process.run` needs `--allow-process`.
