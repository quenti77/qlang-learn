---
title: "Web guide 5: testing and going to production"
group: "Web applications"
---

# Web guide 5: testing and going to production

This page builds on the application from the previous pages: `tasks.build()` (the `app.q` file that assembles the
application), the `Task`, `NewTask` and `Credentials` types and the `Tasks` service. The test examples also need an account:

```qlang-ref
let ADA = Credentials { email: "ada@example.com", password: "correct horse battery" }
```

## Testing without a server

`@std/web/testing.q` sends requests straight to `App.handle`: no port, no socket, the same code as a real
request (middleware, injection, validation, guards). The `Client` keeps the cookies from one request to the
next, so signing in and what follows are tested as a single visit.

```qlang-ref
-- app_test.q
import "app.q" as tasks
import "@std/web/testing.q" as testing

fun signed_in() -> testing.Client
  let client = testing.Client.new(tasks.build())
  client.post_json("/register", ADA).expect_status(201)
  client.post_json("/login", ADA).expect_status(200)
  client
end

fun test_a_user_creates_and_lists_tasks()
  let client = signed_in()
  let made = client.post_json("/tasks", NewTask { title: "Write the guide" }).expect_status(201)
  assert_eq(made.json<Task>().unwrap().title, "Write the guide")
  assert_eq(client.get("/tasks").json<array<Task>>().unwrap().len(), 1)
end

fun test_private_routes_need_a_login()
  testing.Client.new(tasks.build()).get("/tasks").expect_status(401)
end
```

```sh
qlang test                      # every *_test.q file
qlang test app_test.q --filter login
```

| Client method | Does |
| --- | --- |
| `get(path)`, `delete(path)` | a request without a body; an `?a=1` in the path is read as the server reads it |
| `post(path, text)`, `put`, `patch` | with a text body |
| `post_json(path, value)`, `put_json` | the body is the JSON of the value (`Json.of`) |
| `post_form(path, {"field": "value"})` | an HTML form |
| `header(name, value)`, `bearer(token)` | headers sent with all the following requests |
| `forget_cookies()` | forgets the cookies (another visitor) |

The reply (`Reply`): `status`, `headers`, `body`, `cookies`, `header(name)`, `json<T>()` and the checks
`expect_status(code)` and `expect_body_contains(text)`, which stop the test with the body of the response and
give the reply back for chaining.

Each test builds **its own application** (`tasks.build()`): with `sqlite://:memory:`, each test therefore has its
own empty database. To replace a service, `app.container.set(fake)` before the first request.

## Commands, next to the server

Migrations, data import, a scheduled task: these are **commands**, with the same providers as the API.
`@std/cli.q`:

```qlang-ref
import "@std/cli.q" as cli
import "@std/web/container.q" as di

#[cli.Command("tasks:purge", "Deletes the finished tasks")]
fun purge(tasks: Tasks, console: cli.Console, #[cli.Opt(description: "delete nothing")] dry: bool) -> int
  ...
  0
end

let program = cli.Cli.new(Reflect.callables(providers).concat(di.services_of(Reflect.constructors(providers))))     -- the same services as the application
program.named("tasks")
program.add(Reflect.callables(commands))
program.main()
```

```sh
qlang run console.q -- tasks:purge --dry
qlang run console.q -- help
```

`@std/web/commands.q` brings `routes:list`, `db:migrate`, `db:rollback`, `db:status` and `locale:missing`. A
`#[cli.Arg]` parameter is a word of the line, `#[cli.Opt]` an option (a `bool` is a flag), `console` writes and
reads (`line`, `error`, `table`, `ask`, `confirm`), the rest comes from the container. The exit code is the one the
command returns (`0` if nothing); `Cli.run(args, Console.captured([]))` tests a command.

## API documentation

`@std/web/openapi.q` describes the routes (paths, parameters, bodies, returned types, validation rules) as
OpenAPI 3.1, read from the annotations and the types:

```qlang-ref
import "@std/web/openapi.q" as oa

oa.openapi_route(app, "/openapi.json", "Tasks", "1.0.0")      -- GET /openapi.json
```

`#[web.Doc("Lists the tasks")]` and `#[web.Tag("tasks")]` add a summary and a group. Paste the document into a
tool like Swagger UI or Redoc, or generate a client.

## Translations

`@std/i18n.q`: one JSON file per language, `{name}` placeholders, plurals, the fallback `fr-CA` → `fr` → default
language → the key. On the web, `use_locale(app, translator, ["en", "fr"])` (`@std/web/locale.q`) chooses the
language of each request (`?lang=`, cookie, `Accept-Language`) and gives the routes a `lang: i18n.Lang`
parameter. See the "Web applications" page for details. The validation messages of the package stay in English.

## Events and cache

- `@std/web/events.q`: `events.listen<TaskDone>(fun(e: TaskDone) ... end)` then `events.dispatch(TaskDone { ...
  })`, so that sending a mail or a statistic is not written in the route. Listeners run in the request, in
  order; there is no queue.
- `@std/web/cache.q`: `Cache.memory()` (per worker), `Cache.files(folder)` (the machine) or `Cache.redis(redis, "app:")` (every
  machine), `cache.remember<T>(key, seconds, function)`, `cache.increment(key, seconds)` (a counter, atomic with
  Redis).

## Going to production

```sh
TASKS_DB=sqlite://tasks.db TASKS_SECRET=... \
  qlang serve main.q --bind 127.0.0.1 --port 8080 --workers 4 --compress --log-format json
```

| Option | Does |
| --- | --- |
| `--workers N` | N workers (1 to 64, one by default); they share nothing: file or server database, sessions in a cookie |
| `--bind`, `--port` | the address; behind a proxy, `127.0.0.1` |
| `--compress` | gzip of text responses |
| `--static DIR` | serves the static files of a folder |
| `--max-steps N`, `--max-memory MB` | limits against a runaway program |
| `--log-format json`, `--log-level` | the log on the error output, one JSON object per line |
| `--dev`, `--watch` | **development only** |

- **HTTPS and protection**: `qlang serve` speaks HTTP; put it behind a reverse proxy (nginx, Caddy...) that does
  TLS, limits request sizes and adds timeouts. Then turn on `sessions_with(secret, true)`.
- **Configuration** by environment variables (`env.get`), read in a `Config` provider; no secret in the code.
- **Database**: a SQLite file suits a single server; PostgreSQL or MySQL (`Db.connect("postgres://...")`,
  `mysql://...?sslmode=...`) beyond that. Run migrations with `db:migrate`, not at each start of each worker.
- **Log**: `Log.info/warning/error` and the other PSR-3 levels, with an optional JSON context (`Log.error("failed", {"order": 42})`); the `logging()`
  middleware writes one line per request.
- **Process**: run `qlang serve` under systemd, Docker or an equivalent that restarts it; a deployment replaces
  the file and restarts.

## What next

The reference of each function is in the package's
[`API.md`](https://github.com/quenti77/qlang-std/blob/main/API.md). What does not exist: an ORM that writes
the SQL for you, graphical dashboards. The server and the types (`Request`, `Response`, `Db`, `Crypto`, `Log`)
are described in the [language reference](../26-prelude-network-databases-and-the-system/).
