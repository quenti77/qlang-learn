---
title: "Web guide 2: routes and controllers"
group: "Web applications"
---

# Web guide 2: routes and controllers

## The data of this page

The examples on this page need nothing more than four small structures and two arrays in memory instead of a database
(the database comes on page 3, accounts and passwords on page 4):

```qlang-ref
struct Task
  public id: int
  public title: string
  public done: bool
end

struct NewTask
  public title: string
end

struct Credentials
  public email: string
  public password: string
end

struct User
  public id: int
  public email: string
end

let tasks: array<Task> = []
let users: array<User> = []
```

The routes below read and change these arrays; they are lost when the server stops, which is enough to learn routes.

## Route annotations

| Annotation | Used for |
| --- | --- |
| `#[web.Get("/p")]`, `Post`, `Put`, `Patch`, `Delete` | the method and the path; `:id` is a path parameter |
| `#[web.Route("/p", method: "OPTIONS")]` | any other method |
| `#[web.Status(201)]` | the status of a successful answer (200 by default) |
| `#[web.Guard("auth")]` | a guard to pass first (page 4) |
| `#[web.Doc("Summary")]`, `#[web.Tag("tasks")]` | OpenAPI documentation (page 5) |

## Where the parameters come from

Each parameter of the function is filled in from its annotation. The type matters: the value is **read as that
type** (`int`, `float`, `bool`, `uuid`, `datetime`, nullable...); if it does not fit, the client gets `400` with
the detail.

| Parameter | Filled with |
| --- | --- |
| `#[web.Path] id: int` | the `:id` of the path |
| `#[web.Query] done: bool?` | `?done=true`; `none` when missing (the type must be nullable, otherwise `400`) |
| `#[web.Body] input: NewTask` | the body, **JSON or form**, read as that type, then validated (`422` with the detail) |
| `#[web.Header("X-Token")] token: string` | a header |
| `#[web.CookieValue("sid")] sid: string?` | a cookie |
| `req: Request` | the request itself (`req.method`, `req.headers`, `req.cookies`, `req.raw`...) |
| `tasks: Tasks` | a **service**: a value the application builds for you (a database, a repository, the signed-in user). See page 3; this page does not need any |

The name of the parameter is the one used in the request; `#[web.Path("id")]` gives another name explicitly.

```qlang-ref
#[web.Get("/tasks/:id")]
fun show(#[web.Path] id: int) -> Task?
  for t in tasks do
    if t.id == id then
      return t
    end
  end
  none
end
```

`GET /tasks/7` gives the task as JSON, or `404` when the function gives `none`, or `400` when the id is not an integer.

## What the function returns

| Returned value | Response |
| --- | --- |
| a `Response` | as it is (see "Responses" below) |
| a `string` | plain text |
| a structure, an array, a number... | JSON (`200`, or the `#[web.Status]`) |
| `none` (type `T?`) | `404` |
| nothing | `204` |
| `Result<T, E>` | the `Ok` as above; the `Err` as an error |

For an error, `HttpError { status: 409, message: "..." }` gives that status; an ordinary `Error` is a `500`
whose detail goes to the log, **never to the client**. The body of an error is always the same:

```
{"error":{"status":409,"message":"this email is already used","details":[]}}
```

For a `422`, `details` has one element per refused field: `{"field": "title", "message": "..."}`.

```qlang-ref
#[web.Post("/register")]
#[web.Status(201)]
fun register(#[web.Body] input: Credentials) -> Result<User, HttpError>
  for u in users do
    if u.email == input.email then
      return Result<User, HttpError>.Err(HttpError { status: 409, message: "this email is already used" })
    end
  end
  let user = User { id: users.len() + 1, email: input.email }
  users.push(user)
  Result<User, HttpError>.Ok(user)
end
```

(This route does not keep the password: a password is never stored as it is, page 4 shows how to hash it.)

## A controller as a class

When routes go together (same prefix, same guards), a **structure** groups them: its annotated public methods
are the routes.

```qlang-ref
#[web.Controller("/tasks")]
struct TaskController
end

impl TaskController
  #[web.Get("/")]
  public fun list(self, #[web.Query] done: bool?) -> array<Task>
    tasks.filter(fun(t: Task) -> bool done == none or t.done == done end)
  end

  #[web.Post("/")]
  #[web.Status(201)]
  public fun create(self, #[web.Body] input: NewTask) -> Task
    let task = Task { id: tasks.len() + 1, title: input.title, done: false }
    tasks.push(task)
    task
  end
end
```

```qlang-ref
app.controller(TaskController {})
```

`#[web.Controller("/tasks")]` gives the prefix (`GET /tasks`, `POST /tasks`). A `#[web.Guard("auth")]` on the structure
would apply to all its methods (guards are the subject of page 4). The instance lives as long as the application:
**what changes with each request comes in as a parameter of the method**, never in fields. Once the routes have
services (page 3), the controller will receive them the same way, and a provider will be able to build it:
`app.controller_from_container<TaskController>()`.

**One letter apart**: `app.controllers(Reflect.callables(module))` (plural) adds the **functions** of a module that carry
a route annotation; `app.controller(instance)` (singular) adds the methods of **one** controller, an instance of a
struct. Giving an array to the singular one stops with a message that says so.

Functions or classes? Both mix in the same application; the full example (`examples/tasks` of the package) keeps the
account routes as functions and the task routes as a class.

## Prefixes and groups

`app.prefix("/api")` applies to the routes added **afterwards**; you change it or clear it between two groups:

```qlang-ref
import "api_routes.q" as api_routes          -- a file that holds annotated functions

app.prefix("/api")
app.controllers(Reflect.callables(api_routes))
app.prefix("")
app.get("/health", fun(req: Request) -> Response Response.text("ok") end)
```

For what a group has in common (authentication, a permission check), use a **guard** (page 4) rather than a
prefix.

`app.get(path, function)`, `post`, `put`, `patch`, `delete` also add a route from a plain function
`fun(Request) -> Response`, without injection.

## Responses

A route can return a `Response` to control everything:

```qlang-ref
#[web.Get("/old")]
fun old() -> Response
  Response.redirect("/new")                       -- 302 with Location
end

#[web.Get("/page")]
fun page() -> Response
  Response.html("<h1>Hello</h1>")
end

#[web.Get("/export")]
fun export() -> Response
  let res = Response.text("a,b\n1,2")
  res.headers["Content-Type"] = "text/csv"
  res.headers["Content-Disposition"] = "attachment; filename=\"data.csv\""
  res.with_cookie(Cookie { name: "seen", value: "1", max_age: 60 })
end
```

`Response.json(text)`, `Response.bytes(bytes, type)`, `.with_status(code)`, `.with_cookie(...)` complete the
list. For streams (`Response.stream`, server-sent events `Response.sse`), see the language reference.

## Forms and files

- **HTML form.** `#[web.Body]` also reads `application/x-www-form-urlencoded`: the fields are turned into
  numbers or booleans according to the structure, then validated like JSON. A missing `bool` field is `false`
  (an unchecked box). (A body that starts with `{` or `[` is still read as JSON, even with the type that
  `curl -d` sends by default.)
- **File upload.** Take `req: Request` and read `req.multipart()`:

```qlang-ref
#[web.Post("/upload")]
fun upload(req: Request) -> Result<string, HttpError>
  let parts = req.multipart()
  if parts.is_err() then
    return Result<string, HttpError>.Err(HttpError { status: 400, message: "not a multipart form" })
  end
  let names: array<string> = []
  for p in parts.unwrap() do
    names.push("{p.name}:{p.filename ?? "-"}:{p.data.len()}")
  end
  Result<string, HttpError>.Ok(names.join(","))
end
```

`Part.name`, `filename` (`none` for an ordinary field), `content_type` and `data` (`bytes`; `text()` for text).
Write the file with `fs.write_bytes(path, p.data)` after checking the name and the size.

## Error pages, a custom 404

- `app.not_found(fun(req: Request) -> Response ... end)` answers when no route fits.
- A middleware that rewrites failures for browsers:

```qlang-ref
fun pretty_errors() -> web.Middleware
  fun(req: Request, next: web.Handler) -> Response
    let res = next(req)
    let wants_html = (req.header("accept") ?? "").contains("text/html")
    if res.status >= 400 and wants_html then
      let page = Response.html("<h1>Error {res.status}</h1>")
      page.status = res.status
      return page
    end
    res
  end
end

app.use(pretty_errors())
```

A middleware is a function `fun(req, next) -> Response`: it can answer instead of the route, change the request
before `next(req)` or the response after it. The first one added is the outermost (pages 4 and 5: `logging`,
`security_headers`, `cors`, `sessions`...).

Next: [services and data](../38-web-donnees/).
