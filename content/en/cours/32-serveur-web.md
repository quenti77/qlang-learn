---
title: "A web server"
---

# A web server

A qlang program can **answer HTTP requests**: that is what a website or an API does. In a
terminal, you start it with:

```sh
qlang serve app.q
```

The server listens on a port (8080 by default), runs the file **once**, then calls its `handle`
function for every request it receives. In the page there is no network, so we will **call
`handle` ourselves** with fake requests. The code is exactly what you would put in `app.q`.

## Request and response

Two structures are provided, with nothing to declare: `Request` (what the client sends) and
`Response` (what we answer).

```qlang
let req = Request { method: "GET", url: "/hello?name=Ada", path: "/hello", query: { "name": "Ada" } }
print(req.method)
print(req.path)
print(req.query.get("name", "unknown"))

let rep = Response { status: 200, body: "Hello" }
print(rep.status)
print(rep.body)
```

In a real request, `url` is the target as received, `path` the decoded path, and `query` the
decoded parameters (`?name=Ada`). `headers` holds the headers (names in lower case) and `body`
the body, or `none`.

## The `handle` function

`handle` takes a `Request` and returns a `Response`. It is the only required thing.

```qlang
fun handle(req: Request) -> Response
  if req.path == "/hello" then
    let name = req.query.get("name", "you")
    Response { status: 200, body: "Hello {name}!" }
  else
    Response { status: 404, body: "Not found" }
  end
end

let r = handle(Request { method: "GET", url: "/hello?name=Ada", path: "/hello", query: { "name": "Ada" } })
print("{r.status} {r.body}")
let r2 = handle(Request { method: "GET", url: "/other", path: "/other" })
print("{r2.status} {r2.body}")
```

To avoid repeating fields, we only write the ones we need: `headers`, `body`, `path` and `query`
have a default value.

## Shortcuts to answer

We do not need to write the headers by hand: `Response` has shortcuts.

```qlang
print(Response.text("hi").status)
print(Response.html("<h1>Title</h1>").headers.get("Content-Type", ""))
print(Response.json("\{\"ok\": true\}").body)
print(Response.redirect("/elsewhere").status)
print(Response.not_found().status)

let made = Response.text("done").with_status(201).with_header("X-Id", "7")
print(made.status)
print(made.headers.get("X-Id", ""))
```

`with_status` and `with_header` return the response itself, so they can be chained.

## Keeping a state

The code **outside `handle`** only runs once, at startup. Its variables live as long as the
server runs: a visit counter writes itself.

```qlang
let visits = 0

fun handle(req: Request) -> Response
  visits += 1
  Response.text("Visit number {visits}")
end

for i in 0..3 do
  let r = handle(Request { method: "GET", url: "/", path: "/" })
  print(r.body)
end
```

If a request causes an error (a `panic`, an infinite loop), the server answers
`500 Internal Server Error` **with no detail** to the client, writes the detail in its log, and
carries on.

## The router

With several pages, a big `if` becomes tedious. A `Router` matches paths to functions. In a path,
`:name` accepts a segment and puts it in `req.params`.

```qlang
let router = Router.new()

router.get("/", fun(req: Request) -> Response
  Response.text("Home")
end)

router.get("/items/:id", fun(req: Request) -> Response
  let id = req.params.get("id", "?")
  Response.text("Item {id}")
end)

fun handle(req: Request) -> Response
  router.handle(req)
end

let a = handle(Request { method: "GET", url: "/items/42", path: "/items/42" })
print("{a.status} {a.body}")
let b = handle(Request { method: "GET", url: "/", path: "/" })
print("{b.status} {b.body}")
```

When nothing matches, the router answers by itself. A known path with another method gives
`405` and the `Allow` header, an unknown path gives `404`:

```qlang
let router = Router.new()
router.get("/items/:id", fun(req: Request) -> Response Response.text("read") end)
router.post("/items", fun(req: Request) -> Response Response.text("created").with_status(201) end)

fun ask(method: string, path: string)
  let r = router.handle(Request { method: method, url: path, path: path })
  print("{method} {path} -> {r.status}")
end

ask("GET", "/items/3")
ask("POST", "/items")
ask("DELETE", "/items/3")
ask("GET", "/elsewhere")
```

A `*` at the end of a path accepts the rest (`/files/*`), and `router.fallback(f)` replaces the
`404` response.

## Running it for real

Save the program in `app.q`, then, in a terminal:

```sh
qlang serve app.q --port 8080
curl http://127.0.0.1:8080/hello?name=Ada
```

A few useful options: `--static public` serves the files of a folder (HTML pages, CSS, images)
before calling the program, `--workers 4` answers several requests at once (each worker has its
own variables), `--max-steps` limits the work per request. Ctrl-C stops the server cleanly.

This server is deliberately simple: no HTTPS, for example. To put it on the Internet, place it
**behind a reverse proxy** (nginx, Caddy...) and do not expose it directly.

## Remember

- `qlang serve app.q` calls `handle(req: Request) -> Response` for every request.
- The request gives `method`, `path`, `query`, `headers` and `body`; the response, a `status`, a
  `body` and `headers`.
- `Response.text`, `.html`, `.json`, `.redirect`, `.not_found` save writing the headers.
- Variables outside `handle` are kept from one request to the next.
- A `Router` matches paths (`/items/:id`) to functions and handles the `404` and `405` errors.
