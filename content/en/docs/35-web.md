---
title: "Web applications"
group: "Tools"
---

# Web applications

qlang can serve HTTP (`qlang serve app.q`), and the **`web`** package of
[`qlang-std`](https://github.com/quenti77/qlang-std) adds what an application is made of: routes,
dependency injection, validation, a database layer, middleware and sessions. All of it is written in
qlang; it needs `qlang` 0.51 or more.

## Install

In the project folder:

```sh
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.4.0
```

Then, in a `.q` file:

```
import "@std/web/app.q" as web
```

## A first route

A route is a function. Its parameters say where its values come from; what it returns becomes the
response.

```
-- controllers.q
import "@std/web/app.q" as web

struct Greeting
  public message: string
end

#[web.Get("/hello/:name")]
fun hello(#[web.Path] name: string, #[web.Query] shout: bool?) -> Greeting
  Greeting { message: "Hello {name}" }
end
```

```
-- main.q
import "@std/web/app.q" as web
import "controllers.q" as controllers

let app = web.App.new([])
app.controllers(Reflect.callables(controllers))

fun handle(req: Request) -> Response
  app.handle(req)
end
```

```sh
qlang serve main.q --dev
curl localhost:8080/hello/ada      # {"message":"Hello ada"}
```

| Parameter | Filled with |
| --- | --- |
| `#[web.Path] id: int` | the `:id` of the route, read as the type of the parameter (`400` if it does not fit) |
| `#[web.Query] page: int?` | the `?page=` of the URL (`none` when absent if the type allows it) |
| `#[web.Body] input: NewUser` | the JSON body, read as that type, then validated (`422` with the details) |
| `#[web.Header("X-Token")] token: string` | a header; `#[web.CookieValue("sid")]` a cookie |
| `posts: Posts` | the service of that type (see below); `req: Request` is the request itself |

What the function returns: a `Response` as it is, a `string` as text, anything else as JSON, `none`
as `404`, no value as `204`; a `Result` gives its `Ok` the same way and its `Err` as an error
(`HttpError { status, message }`, or an `Error`, which is a `500` whose details go to the log, not to
the client). `#[web.Status(201)]` sets the status of a successful answer.

The annotations are written with the name of the module (`web.Get`): `Post`, `Delete`... are names
of models too common to take.

## Services

A function that returns a `T` *provides* a `T`; its parameters are what it needs. The container
finds the providers by the type they return, builds each service when it is first needed and checks
the whole graph before the first request.

```
-- providers.q
struct Config
  public database: string
end

struct Posts
  public db: Db
end

fun make_config() -> Config
  Config { database: "sqlite://blog.db" }
end

fun make_db(config: Config) -> Db
  Db.connect(config.database).unwrap()
end

fun make_posts(db: Db) -> Posts
  Posts { db: db }
end
```

```
import "providers.q" as providers

let app = web.App.new(Reflect.callables(providers))
let problems = app.validate()     -- missing services, cycles, routes hidden by another: before any request
```

A service is built once (a *singleton*). `#[Scoped]` makes one per request, `#[Transient]` a new one
each time. Outside a route, `app.container.get<Posts>()` gives a service.

## Validation

Rules are annotations on the fields; a `#[web.Body]` is checked before your function runs.

```
import "@std/web/validate.q" as v

struct NewUser
  #[v.NotBlank, v.Length(2, 40)]
  public name: string
  #[v.Email]
  public email: string
  #[v.Min(18)]
  public age: int
end
```

`{"error": {"status": 422, "message": "validation failed", "details": [{"field": "name", "message": "must not be blank"}]}}`
is what the client gets for a bad body.

## Controllers as classes

Routes can also be the methods of a structure: `#[web.Controller("/posts")]` on the structure gives the
prefix, `#[web.Get("/:id")]` on its public methods the route.

```
#[web.Controller("/shelf")]
struct Shelf
  public label: string
end

impl Shelf
  #[web.Get("/")]
  public fun all(self, posts: Posts) -> string
    "{self.label}: {posts.all().len()}"
  end
end

app.controller(Shelf { label: "books" })
-- or, if a provider returns a Shelf: app.controller_from_container<Shelf>()
```

The instance lives as long as the application: what changes with each request comes in as a parameter of
the method, as for a function.

## Testing without a server

`@std/web/testing.q` sends requests straight to `App.handle` and keeps the cookies from one request to
the next.

```
import "@std/web/testing.q" as t

fun test_creating_a_post()
  let client = t.Client.new(build_app())
  client.bearer("secret")
  let r = client.post_json("/posts", NewPost { title: "Hello" })
  r.expect_status(201)
  assert_eq(r.json<Post>().unwrap().title, "Hello")
end
```

## Events, cache, rate limiting, CORS

- `@std/web/events.q`: `events.listen<UserRegistered>(fun(e: UserRegistered) ... end)`, then
  `events.dispatch(UserRegistered { ... })`. The listeners of a type are called in order.
- `@std/web/cache.q`: `Cache.memory()` or `Cache.files("/tmp/cache")`;
  `cache.remember<array<Post>>("top", 60, fun() -> array<Post> ... end)`. Memory belongs to one worker;
  files are shared by all of them.
- `@std/web/limit.q`: `app.use(rate_limit(cache, 100, 60, by_header("x-forwarded-for")))` answers `429`
  with `Retry-After` beyond 100 requests a minute.
- `cors_with(CorsOptions { origins: [...], credentials: true, expose: [...] })` tunes CORS.

## Command-line commands

`@std/cli.q` makes commands with the same idea as routes: a function whose parameters say where their
values come from.

```
import "@std/cli.q" as cli

#[cli.Command("greet", "Says hello")]
fun greet(#[cli.Arg] name: string, #[cli.Opt(short: "l")] loud: bool, console: cli.Console) -> int
  console.line(if loud then "HELLO {name}" else "Hello {name}" end)
  0
end

let program = cli.Cli.new(Reflect.callables(providers))   -- the services the commands need
program.add(Reflect.callables(commands))
program.main()
```

```sh
qlang run main.q -- greet Ada --loud
qlang run main.q -- help               # the list of commands
qlang run main.q -- greet --help       # the usage of one command
```

`#[cli.Arg]` is a word of the line (an `array<T>` takes the rest), `#[cli.Opt]` an option (`--count 3`,
`-c 3`; a `bool` is a flag), `console: cli.Console` the console (`line`, `error`, `table`, `ask`,
`confirm`), any other parameter a service. A returned `int` is the exit code, an `Err` a message on the
error output with code `1`; a wrong line gives `2`, an unknown command `127`.
`Cli.run(args, Console.captured([]))` runs a command without a process: that is how they are tested.
`@std/web/commands.q` brings `routes:list`, `db:migrate`, `db:rollback`, `db:status` and `locale:missing`.

## Translations

`@std/i18n.q` reads one JSON file per language.

```
import "@std/i18n.q" as i18n

let tr = i18n.Translator.new("en")
tr.load("fr", "lang/fr.json").unwrap()
tr.load("en", "lang/en.json").unwrap()

tr.t("fr", "welcome", { "name": "Ada" })     -- Bonjour Ada
tr.tn("fr", "cart.items", 3, {})             -- 3 articles
```

A nested object makes a dotted key (`cart.items`); an object whose keys are `one`, `other`, `few`... is a
message with plural forms, chosen by `tn` according to the language. `fr-CA` falls back to `fr`, then to
the default language, then to the key itself. `tr.negotiate(header, ["en", "fr"])` picks the language from
`Accept-Language`, `tr.number("fr", 1234.5, 2)` writes a number the way the language does and
`tr.missing("fr")` lists what is left to translate. On the web, `use_locale(app, tr, ["en", "fr"])`
(`@std/web/locale.q`) chooses the language of each request (`?lang=`, cookie, `Accept-Language`) and gives
handlers a `lang: i18n.Lang` parameter.

## OpenAPI documentation

`openapi_route(app, "/openapi.json", "Blog", "1.0.0")` adds a route that describes the API as OpenAPI 3.1:
paths, parameters, bodies, return types and validation rules, read from the annotations and the types.
`#[web.Doc("Lists the posts")]` and `#[web.Tag("posts")]` add a summary and a group.

## Database, migrations, middleware, sessions

- `@std/web/query.q`: `Query.table("users").where("age", ">=", 18).order_by("name", "asc").all_as<User>(db)`.
  Values always go through `?`; table and column names are checked.
- `@std/web/migrate.q`: `Migrator.new(db).run(migrations)`; each migration has `up` and `down` SQL and
  runs in a transaction.
- `@std/web/middleware.q`: `app.use(logging())`, `security_headers()`, `cors([...])`, `bearer_token(...)`,
  `request_id()`.
- `@std/web/session.q`: sessions in a signed cookie, flash messages and CSRF protection.

A complete API (SQLite, migrations, validation, middleware) is in the
[`examples/blog`](https://github.com/quenti77/qlang-std/tree/main/examples/blog) folder of the
package. For production, run `qlang serve` behind a reverse proxy (TLS, compression) and give it
enough `--workers`.
