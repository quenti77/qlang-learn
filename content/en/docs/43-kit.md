---
title: "kit: generate, test and watch your application"
group: "Tools"
---

# kit: generate, test and watch your application

`kit` is the command line tool of the framework. It is written in qlang (repository
[`qlang-kit`](https://github.com/quenti77/qlang-kit)) and does four things: **generate** code (controllers, models,
migrations...), **run the tests** while watching the files, **browse a database** and **watch a running application**.
The screens are real terminal interfaces (menus, tables, input, mouse), built on `Term`, the terminal of `qlang` 0.63 or
later.

## Installing kit

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang-kit/main/install.sh | sh
kit version
```

The installer downloads the release archive, **checks its checksum** (a damaged or replaced download is refused) and keeps
every version in `~/.local/share/kit/versions`. The `kit` command it puts in `~/.local/bin` chooses the version to run:

1. the `KIT_VERSION` variable, if it is set;
2. else the nearest `.kit-version` file, going up the folders;
3. else the latest version installed.

```sh
kit versions          # the versions installed
kit install 0.1.0     # add one (the others stay)
kit use 0.1.0         # this folder uses 0.1.0 (writes .kit-version)
kit update            # install the latest release
```

## In a project: the same version for everybody

For the whole team to run the same `kit`, make it a **dependency of the project**:

```sh
kit init              # adds kit to qlang.toml and writes kit.q
qlang install         # downloads the version, pins it in qlang.lock
qlang run --allow-process kit.q -- make controller Post
```

The version is the one in `qlang.toml` (and `qlang.lock`): it changes when the dependency changes, not when somebody
updates their machine. `--allow-process` is the permission to start programs; only `kit test` needs it (it starts
`qlang test`). With the global command, `kit test` asks for it by itself and the other commands run with no permission.

## Generating code: kit make

```sh
kit make controller BlogPost
kit make migration create_blog_posts_table
kit make --list
```

Each generator writes a file where it belongs and says what it did:

| Kind | Writes | Notes |
| --- | --- | --- |
| `controller` | `controllers/blog_posts.q` and its test `tests/blog_posts_test.q` | added to `App.boot(...)` in `app.q` |
| `model` | `models/blog_post.q` | a struct and the queries that read it |
| `migration` | `migrations/<date>_<name>.q` | `create_x_table` creates the table, any other name gives a blank migration |
| `job` | `jobs/<name>.q` | a struct and its handler |
| `middleware`, `policy`, `resource` | `middleware/`, `policies/`, `resources/` | something to fill in |
| `factory`, `seeder` | `factories/`, `seeders/` | for `db:seed` |
| `command` | `commands/<name>.q` | a `cli.q` command |
| `test` | `tests/<names>_test.q` | an HTTP test of `/<names>` |

Write the name as you like (`BlogPost`, `blog_post`, `blog-post`): kit derives the type, the file, the URL and the table
name (`blog_posts`, with English plurals) from it. A file that already exists **stops** the command before anything is
written, unless you give `--force`. A few options:

- `--dry-run` shows what would be written, and writes nothing;
- `--no-test` and `--no-register` for a controller;
- `--no-interaction` never asks a question (CI).

With no argument, `kit make` **asks** for the kind and the name (text, a choice with autocompletion). An answer given on the
command line is used without asking; with no terminal, a question that has no answer is an error that says which one to give.

### Changing the stubs

The files come from **stubs** (`stubs/`). To change one, put yours in the `stubs/` folder of the project: `stubs/controller.stub`
replaces kit's. `kit make --publish-stubs` copies kit's into the project to start from. The fields are `{{Name}}`
(`BlogPost`), `{{name}}` (`blog_post`), `{{names}}`, `{{kebab}}`, `{{route}}`, `{{table}}` and `{{id}}`; an unknown field in a
stub is an error.

### The wizard

`kit wizard` is `kit make` full screen: pick the kind, type the name, and see **before anything is written** the list of
files that would be created or changed, with their content. `t`, `r` and `f` set the test, the registration and the
replacing; `Ctrl+S` writes.

## Running the tests: kit test

```sh
kit test
```

The screen shows every test with ✓ or ✗, and for a failure the message and the **source around the line**. It watches the
`.q` files: as soon as one changes, the tests run again. `r` runs everything again, `Enter` runs the selected test, `f` keeps
only the failures, `w` stops the watching.

## Browsing a database: kit db

```sh
kit db --url sqlite://app.db        # or postgres://..., mysql://..., or DATABASE_URL
```

The tables are on the left; on the right there are four tabs (`1` to `4`): the **rows** (50 to a page, `n` and `p`), the
**structure**, a **SQL** editor (`Ctrl+R` runs) and the **migrations** (applied, or pending when a file of `migrations/` is not
in `schema_migrations`). The tool only **reads**, unless it is started with `--write`.

## Watching the application: kit dashboard

```sh
kit dashboard --url http://localhost:8000 --log storage/app.log
```

It reads what the application already serves: `/health`, `/metrics` (the Prometheus format of `web/metrics.q`) and
`/openapi.json` (`openapi_route`), plus its JSON log (`qlang serve --log-format json`). Five tabs: the **overview** (health,
totals, the busiest routes, the latest errors), the **routes**, the **requests** (per route: count, errors, p50 and p95), the
**logs** (filter by level and by text) and the **N+1** warnings of `--dev`.

## Settings: kit.json

```json
{
  "theme": "sunset",
  "themes": {
    "sunset": { "base": "dark", "accent": "#ff8800", "error": "bright-red", "selection": "#334455" }
  },
  "keys": { "quit": "ctrl+q" },
  "db": { "url": "sqlite://app.db" },
  "dashboard": { "url": "http://localhost:8000", "log": "storage/app.log" }
}
```

The project's `kit.json` and `~/.config/kit/kit.json` (yours) are merged key by key, the project winning. The built-in themes
are `dark`, `light`, `high-contrast` and `mono` (no colour); a theme of your own starts from one of them. A colour is written
`#rrggbb`, by name (`red`, `bright-cyan`) or `palette:N`. A mistake is reported where it is (`themes.sunset.accent: ...`), and
an unknown setting is a mistake too, so that a typo does not go unnoticed. `kit config` shows what is in use.
