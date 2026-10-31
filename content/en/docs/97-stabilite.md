---
title: "Stability and deprecation"
group: "Guides"
---

# Stability and deprecation

qlang is at 0.x: a version comes out almost every day. This page says **what you can rely on**, **how a breaking
change is announced**, and **what 1.0 will promise**. It replaces the habit of reading the whole CHANGELOG to know
whether an update is going to break something.

> The classification below is a **proposal** by the author of the project: it says what we forbid ourselves to change
> lightly. If a line looks wrong to you, open an issue.

## The three levels

| Level | Promise |
| --- | --- |
| **Stable** | Does not change without notice. A breaking change follows the deprecation cycle below (at least two minor versions between the announcement and the removal) and appears in the "Cassant" (breaking) section of the CHANGELOG. |
| **Provisional** | May change from one version to the next, with a "Cassant" line in the CHANGELOG and, when possible, a warning beforehand. |
| **Experimental** | May change without warning or disappear. Only use it if you follow the project. |

Today nothing is "guaranteed 1.0": *stable* means "we will treat it as if 1.0 were here".

## The language

| Part | Level |
| --- | --- |
| Syntax: `let`, `fun`, `if`/`elseif`/`else`, `for`, `while`, `match`, `struct`, `enum`, `trait`, `impl`, `import`/`export`, interpolation `"{x}"` | **stable** |
| Basic types, `array`, `map`, `Set`, tuples, nullables `T?`, `??`, `?`, `Result`/`Error` | **stable** |
| Type checking, inference, generics and bounds (`T: Eq`, `Ord`) | **stable** |
| `Json.of` / `Json.to` / `Json.parse`, `string`, `int`, `float`, `bool` and their usual methods | **stable** |
| `datetime`, `uuid`, `ulid`, `regex`, `Hash`, `Base64`, `Hex`, `Url`, `Crypto`, `Password`, `Format`, `Path` | provisional |
| `fs`, `env`, `http`, `Db`, `Redis`, `Process`, `Log` | provisional |
| Operator overloading, type aliases, annotations (`#[annotation]`), `Any` | provisional |
| `Zone`, `Gzip`, `Zip`, `Tar`, `Panic.guard`, `Shared` | provisional (recent) |
| `Reflect` (constructors, `callable`), `extern fun` and providers, `Term`, `Worker` (tasks) | **experimental** |
| Reserved words (`step`, `from`, `then`, `catch`, `public`, `end`...) | more may be **added** (announced as "Cassant") |
| Text of the error messages | **not promised** |
| Error codes (`Pxxx`, `Txxx`, `Rxxx`, `Wxxx`) | a published code keeps its meaning: it is not renumbered; new ones appear |

The **outputs meant for programs** (what `print` writes, `--log-format json`, `qlang run --json`) follow the level of
their part: an added key is not a breaking change, a removed or renamed key is.

## Commands and files

| Part | Level |
| --- | --- |
| `qlang run`, `check`, `fmt`, `test` (existing options) | **stable** (options are added, none is removed without a cycle) |
| `qlang serve` (options, the `handle` protocol) | provisional; `Response.stream` / `sse` / `file` provisional; WebSocket **experimental** |
| `qlang install`, `add`, `update`, `remove`, `search`, `lsp`, `doc`, `self-update` | provisional |
| `qlang init --web`, `qlang test --coverage` / `--group`, `qlang lint`, `qlang repl`, `qlang dap`, `qlang fmt --stdin` | **experimental** |
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

**First case**: `Log.warn` (another name for `Log.warning`) is deprecated in 0.69, removed in 0.72 at the earliest.

## The "Cassant" section

Every CHANGELOG version that breaks something has a **Cassant** section at the top, with *before*, *after* and *how to
adapt*. The breaking changes of recent versions are collected in [the migration guide](../98-migration/). Versions
before this rule did not always mark their breaking changes: their complete list is the CHANGELOG itself.

## What 1.0 will promise (proposal)

The frozen subset would be: the syntax and semantics of the language, the basic types and collections,
`Result`/`Error`, `Json.of/to`, modules and `import`/`export`, the `run`/`check`/`fmt`/`test` commands, and the error
codes. Left out of the promise: reflection, `extern`, the HTTP server and its web library, `Term`, and everything that
is young. The *executable* definition of that promise would be the language conformance suite (see
[issue #128](https://github.com/quenti77/qlang/issues/128)): **a line is only promised once a conformance test covers
it**.
