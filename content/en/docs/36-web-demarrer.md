---
title: "Web guide 1: getting started"
group: "Web applications"
---

# Web guide 1: getting started

This guide builds a small **task list** API step by step, with accounts, passwords, sessions and protected
routes. Every piece of code comes from the
[`examples/tasks`](https://github.com/quenti77/qlang-std/tree/main/examples/tasks) example of the `qlang-std`
package, which has its tests: what you read works.

| Page | Subject |
| --- | --- |
| 1. Getting started (this one) | the project, installation, the first route |
| [2. Routes and controllers](../37-web-routes/) | parameters, responses, controllers, forms, files, errors |
| [3. Services and data](../38-web-donnees/) | injection, database, migrations, validation |
| [4. Accounts and security](../39-web-securite/) | passwords, sessions, guards, CSRF, CORS, rate limiting |
| [5. Testing and going to production](../40-web-production/) | tests, commands, OpenAPI, translations, `qlang serve` in production |
| [6. Real time and background jobs](../41-web-temps-reel/) | WebSocket, job queue |

For context (PHP, Laravel, Symfony...): a web framework for qlang is **a package written in qlang**, not a part
of the language. `qlang serve` reads HTTP requests and calls your function `handle(req: Request) -> Response`;
the `web` package adds routes, dependency injection and the rest. You need `qlang` 0.55 or more.

## Create the project

```sh
mkdir tasks && cd tasks
qlang init .
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.9.0
```

`qlang init` creates `qlang.toml`; `qlang add` writes the `std` dependency in it and downloads it (the files
are in `.qlang/packages`, the exact version in `qlang.lock`). You then import it with `@std/...`:

```qlang-ref
import "@std/web/app.q" as web
```

## The layout

No folder is imposed. The one of the example, which works well:

```
tasks/
  qlang.toml
  main.q            -- what `qlang serve` runs: a handle function
  app.q             -- build(): puts the application together (tests call it too)
  providers.q       -- the services: configuration, database, repositories
  controllers.q     -- the routes
  app_test.q        -- the tests
```

The `main.q` / `app.q` split matters: `main.q` starts a server, `app.q` builds an application that a test can
use too, without opening a port.

## A first route

A route is a **function** with an annotation. Its parameters say where their values come from; what it
returns becomes the response.

```qlang-ref
-- controllers.q
import "@std/web/app.q" as web

struct Health
  public status: string
end

#[web.Get("/health")]
fun health() -> Health
  Health { status: "ok" }
end
```

A structure that is returned becomes JSON. Now put the application together:

```qlang-ref
-- app.q
import "@std/web/app.q" as web
import "controllers.q" as controllers

fun build() -> web.App
  let app = web.App.new([])
  app.controllers(Reflect.callables(controllers))
  app
end

export build
```

`Reflect.callables(controllers)` gives every function of the file; `app.controllers` keeps those that carry a
route annotation. Finally `main.q`, which `qlang serve` calls:

```qlang-ref
-- main.q
import "app.q" as tasks

let app = tasks.build()

let problems = app.validate()       -- missing services, cycles, hidden routes: before any request
if not problems.is_empty() then
  for p in problems do
    Log.error(p)
  end
  panic("the application is not wired correctly")
end

fun handle(req: Request) -> Response
  app.handle(req)
end
```

```sh
qlang serve main.q --dev --watch
curl localhost:8080/health          # {"status":"ok"}
```

- `--dev` shows the error of the program in the `500` response (never in production).
- `--watch` reloads the program when a file changes.
- The code at the top of `main.q` runs once at startup (in each worker); `handle` runs for each request.

## Early traps

- **Annotations are written with the module name**: `web.Get`, `web.Post`... (`Post` and `Delete` are too common
  as model names to be taken).
- **What goes from one file to another is exported**: `export build`, `export Credentials, NewTask`.
- **`{` in a string opens an interpolation**: write `\{` for a literal brace (JSON in a test, for example).
- **Fields are private by default**: a field read or written outside its file is `public`.
- **Several workers, several memories**: `qlang serve --workers 4` starts four workers (one by default) that
  share nothing. A `sqlite://:memory:` database is then different in each; for real use a file
  (`sqlite://tasks.db`) or PostgreSQL/MySQL. Page 5.

Next: [routes and controllers](../37-web-routes/).
