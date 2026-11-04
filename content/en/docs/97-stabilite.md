---
title: "Stability and deprecation"
group: "Guides"
---

# Stability and deprecation

qlang is at 1.0. This page says **what you can rely on**, **how a breaking
change is announced**, and **what 1.0 promises**. It replaces the habit of reading the whole CHANGELOG to know
whether an update is going to break something.

> The classification below is the author's: it says what we forbid ourselves to change
> lightly. If a line looks wrong to you, open an issue.

## The three levels

| Level | Promise |
| --- | --- |
| **Stable** | Does not change without notice. A breaking change follows the deprecation cycle below (at least two minor versions between the announcement and the removal) and appears in the "Cassant" (breaking) section of the CHANGELOG. |
| **Provisional** | May change from one version to the next, with a "Cassant" line in the CHANGELOG and, when possible, a warning beforehand. |
| **Experimental** | May change without warning or disappear. Only use it if you follow the project. |

Since 1.0, what is *stable* is **guaranteed**: what 1.0 promises is listed at the bottom of this page.

## The language

| Part | Level |
| --- | --- |
| Syntax: `let`, `fun`, `if`/`elseif`/`else`, `for`, `while`, `match`, `struct`, `enum`, `trait`, `impl`, `import`/`export`, interpolation `"{x}"` | **stable** |
| Variadic parameters (`fun f(...xs: int)`) and the spread `...` in a call, an array and a map | **stable** (since 1.1) |
| `File` and `Dir`, `fs.append`, `fs.remove`, `fs.remove_dir`, `fs.rename`, `fs.copy`, `fs.is_file` | provisional (since 1.1) |
| `Iterator`, `Iterable`, `KeyedIterable` and `Step` of the prelude: `for` and `...` on a type of the program, `map`, `filter`, `take`, `skip`, `collect` | provisional (since 1.1) |
| `Duration`, and the methods `datetime` gained in 1.1 (comparisons, `diff_in_*`, `start_of_*` / `end_of_*`, `with`, `format_in`, `humanize`) | provisional (since 1.1) |
| `Self` in a trait or an `impl`, a method without `self` called through a type parameter (`T.zero()`), the prelude traits `Zero` and `One` | provisional (since 1.1) |
| Basic types, `array`, `map`, `Set`, tuples, nullables `T?`, `??`, `?`, `Result`/`Error` | **stable** |
| Type checking, inference, generics and bounds (`T: Eq`, `Ord`) | **stable** |
| `Json.of` / `Json.to` / `Json.parse`, `string`, `int`, `float`, `bool` and their usual methods | **stable** |
| `uuid`, `ulid` (except the randomness), `regex`, `Hash`, `Base64`, `Hex`, `Url` (on text), `Format`, `Path` | **stable** (since 1.1) |
| `datetime`, `Crypto`, `Password`, the `*_bytes` variants of `Hash`, `Base64`, `Hex` and `Url` | provisional |
| `fs`, `env`, `http`, `Db`, `Redis`, `Process`, `Log` | provisional |
| Operator overloading (`Add`… `Neg`, `Eq`, `Ord`, `Index`, `IndexSet`, `Push`, `As<T>`), type aliases, annotations (`#[annotation]`, their compile-time check), `Any` | **stable** (since 1.1) |
| `Zone`, `Gzip`, `Zip`, `Tar`, `Panic.guard`, `Shared` | provisional (recent) |
| `Worker` (tasks), `Trace` (OpenTelemetry traces) | **experimental** |
| `Reflect` (constructors, `callable`), `extern fun` and providers, `Term` | **experimental** |
| Reserved words (`step`, `from`, `then`, `catch`, `public`, `end`...) | more may be **added** (announced as "Cassant") |
| Text of the error messages | **not promised** |
| Error codes (`Pxxx`, `Txxx`, `Rxxx`, `Wxxx`) | a published code keeps its meaning: it is not renumbered; new ones appear |

The **outputs meant for programs** (what `print` writes, `--log-format json`, `qlang run --json`) follow the level of
their part: an added key is not a breaking change, a removed or renamed key is.

## Commands and files

| Part | Level |
| --- | --- |
| `qlang run`, `check`, `fmt` (including `fmt --stdin`), `test` (existing options) | **stable** (options are added, none is removed without a cycle) |
| `qlang serve` (options, the `handle` protocol) | provisional; `Response.stream` / `sse` / `file` provisional; WebSocket **experimental** |
| `qlang install`, `add`, `update`, `remove`, `search`, `lsp`, `doc`, `lint` (rules `Q001` to `Q005`), `self-update` | provisional |
| `qlang init --web`, `qlang test --coverage` / `--group`, `qlang repl`, `qlang dap` | **experimental** |
| `qlang.toml`: `[package]` (`name`, `version`, `entry`, `main`, `qlang`) and `[dependencies]` | provisional |
| `qlang.toml`: `[externs]` | **experimental** |
| `qlang.lock` | provisional (readable format, do not edit it) |
| `install.sh`, `install.ps1`, Docker image, GitHub releases | provisional |

## `qlang-std` and the tools

| Part | Level |
| --- | --- |
| `csv.q`, `toml.q`, `yaml.q`, `xml.q`, `template.q`, `jwt.q`, `i18n.q`, `cli.q` | provisional |
| `web/app.q`, `web/session.q`, `web/validate.q`, `web/migrate.q`, `web/query.q`, `web/cache.q`, `web/middleware.q`, `web/health.q`, `web/limit.q`, `web/auth.q`, `web/upload.q`, `web/testing.q` | provisional |
| `queue.q`, `schedule.q`, `mail.q`, `notify.q`, `s3.q` | provisional |
| `web/container.q` (injection), `web/openapi.q`, `web/ws.q`, `web/relations.q`, `web/policy.q`, `web/resource.q`, `web/seed.q`, `web/queue_admin.q`, `web/metrics.q`, `web/events.q`, `web/commands.q`, `web/locale.q`, `web/refresh.q`, `web/proxy.q`, `web/accounts.q` | **experimental** |
| `qlang-test` (package), `kit` | **experimental** (0.x) |

While the std is at 0.x, none of its modules is *stable*; a breaking change in a *provisional* module is written in
the CHANGELOG of `qlang-std`.

## How we deprecate

A fixed cycle: **announce, warn, remove**.

1. **Announce**: the version that deprecates says so in the CHANGELOG ("Déprécié" section), and the function gets
   `#[deprecated("use X; will be removed in 0.N")]`.
2. **Warn**: every call to something deprecated produces the warning `W001` at the call, in `qlang check`, `qlang run`,
   `qlang lsp` (so in the editor) and the JSON protocol. It is only a warning: the program runs. `--deny-warnings`
   (on `check`, `run`, `test`) turns it into an error: put it in the CI of a project to avoid surprises.
3. **Remove**: **two minor versions** after the announcement at the earliest (deprecated in 0.69: removed in 0.71 or
   later), with a line in the "Cassant" section of the CHANGELOG.

```
#[deprecated("use Log.warning; Log.warn will be removed in 0.72")]
public fun warn(...)
```

A module that calls its own deprecated function gets no warning: the warning is for the callers.

**First case**: `Log.warn` (another name for `Log.warning`) was deprecated in 0.69 and removed in 0.83. `qlang migrate` still rewrites the calls that remain.

## The "Cassant" section

Every CHANGELOG version that breaks something has a **Cassant** section at the top, with *before*, *after* and *how to
adapt*. The breaking changes of recent versions are collected in [the migration guide](../98-migration/). Versions
before this rule did not always mark their breaking changes: their complete list is the CHANGELOG itself.

## What 1.0 promises

1.0 freezes a **subset** whose executable definition is the conformance suite
([qlang-conformance](https://github.com/quenti77/qlang-conformance)): **a line is only promised when conformance cases
cover it**.

| Promise | Conformance cases |
| --- | --- |
| Variables, constants, operators, numbers, comments | `variables_and_const`, `arithmetic`, `comparisons_and_logic`, `number_formatting`, `comments`, `conversions` |
| `if`, `while`, `for`, `break`, `continue`, `match` | `control_flow`, `for_with_two_variables`, `match_expressions` |
| Functions, closures, generics | `functions_and_closures`, `closures`, `named_arguments`, `generics` |
| Strings, arrays, maps, sets, tuples | `strings`, `string_library`, `arrays`, `maps`, `sets`, `tuples` |
| Optional values, `Result` and `?` | `nullables`, `optionals`, `results` |
| Structures, traits, enums, inheritance | `structs`, `traits`, `enums`, `inheritance` |
| `Json.parse`, `Json.of`, `Json.to`; modules | `json`, `modules` |
| The codes of the common errors | the `compile_*`, `runtime_errors` and `arithmetic_errors` folders |
| The `run`, `check`, `fmt` and `test` commands | not in the conformance suite (it only covers the language): integration tests of `qlang`, option by option (`--max-steps` and `--seed`: `cli_options`; `--max-memory`, `--filter`, `--group`, `--coverage`, `--deny-warnings`, `--check`, `--stdin`, `--root`, `--extern`, `--allow-process`: one file each) |
| The format of `qlang.toml` (`[package]`, `[dependencies]`, `[stability]`) and of `qlang.lock` | integration tests `manifest_format`: the exact text of the lock, a hand-written lock that is obeyed, every key accepted, `qlang = "…"` stopping a project that asks for more |
| Variadic parameters `...xs` and the spread `...` (promised since 1.1) | `variadics`, `compile_variadics`, `runtime_variadics` |
| Operator overloading, type aliases, annotations, `Any` (promised since 1.1) | `operator_overloading`, `type_aliases`, `compile_type_aliases`, `annotations`, `compile_annotations`, `any_values`, `compile_any` |
| The small library modules (promised since 1.1): `Base64`, `Hex`, `Url`, `Hash`, `regex`, `Path`, `Format`, `uuid`, `ulid` | `encodings`, `hashes`, `regex`, `path`, `format`, `identifiers` |

Outside the promise: reflection, `extern`, the HTTP server and the web library, `Term`, tasks and traces, and everything
marked provisional or experimental. Each version of qlang has its tag in the conformance repository (`v0.X.Y` = the
suite of qlang `0.X.Y`). A package states the level of its files in `[stability]` of its `qlang.toml`; `qlang doc`
writes it under the title of each file and `qlang doc --require-levels` fails for a file without one.

