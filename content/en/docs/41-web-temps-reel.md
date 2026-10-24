---
title: "Web guide 6: real time and background jobs"
group: "Web applications"
---

# Web guide 6: real time and background jobs

Two needs that an ordinary HTTP request cannot meet: **pushing** news to the browser (a chat,
notifications), and **postponing** long work (sending a mail, resizing an image). Both are done with
`qlang serve` and the `std` package.

## WebSocket

A route becomes a WebSocket when it returns `Response.websocket(...)`. The guards and middleware of the
route run first, like for any request: a guard that refuses (`401`) stops the connection before the upgrade.

```qlang-ref
#[web.Get("/chat")]
#[web.Guard("auth")]
fun chat(req: Request, who: Me, hub: ws.Hub) -> Response
  Response.websocket(WebSocketHandler {
    on_open: fun(c: WebSocket)
      hub.join("lobby", c)
      c.send("welcome {who.email}")
    end,
    on_message: fun(c: WebSocket, m: WsMessage)
      hub.broadcast("lobby", "{who.email}: {m.text ?? ""}", c.id)
    end,
    on_close: fun(c: WebSocket) hub.leave(c) end,
  })
end
```

| Callback | Called |
| --- | --- |
| `on_message(c, m)` | for each message of the client (`m.text`, or `m.data` and `m.binary` for bytes) |
| `on_open(c)` | when the connection is open |
| `on_tick(c)` | every `tick_ms` milliseconds (1000 by default; 0: never) |
| `on_close(c)` | when it ends (the client leaves, or `c.close()`); nothing can be written any more |

A `WebSocket` offers `send(text)`, `send_bytes(bytes)`, `close()`, `close_with(code, reason)`, `is_open()`, `id`
(unique), `request` (the original request, with `attrs` filled by the guards) and `data`, a map of yours to
remember who is connected, in which room...

### What to know

- **A worker serves many connections**, one callback at a time. A callback must therefore be **short**: never
  wait in it (`time.sleep`, a slow request). Each call has its own step budget.
- **Workers share nothing.** A `Hub` (`@std/web/ws.q`) keeps connections in rooms, but only those **of its
  worker**: it suits `--workers 1`, or what only concerns the connection. To talk to everybody with several
  workers, go through the database: `Bus` writes the messages in a table and each connection reads the new
  ones in its `on_tick`.
- **Check `Origin`.** A browser lets any page open a WebSocket to your server, with the visitor's cookies.
  `ws.origin_guard(["https://app.example"])` is a guard (`app.guard("origin", ...)`, then
  `#[web.Guard("origin")]`) that refuses the other origins.
- Limits: messages of 1 MB at most, a `ping` every 30 s, a client that sends an invalid frame is closed
  (`1002`). There is no TLS in `qlang serve`: a reverse proxy does `wss://`.

### Several workers: the bus

```qlang-ref
import "@std/web/ws.q" as ws

let bus = ws.Bus.new(db, "sqlite")      -- "postgres" or "mysql" for those databases
bus.install().unwrap()                  -- the table, if it does not exist

Response.websocket(WebSocketHandler {
  tick_ms: 300,
  on_open: fun(c: WebSocket) bus.deliver(c, "lobby") end,         -- notes where the room stands
  on_message: fun(c: WebSocket, m: WsMessage) bus.publish("lobby", m.text ?? "").unwrap() end,
  on_tick: fun(c: WebSocket) bus.deliver(c, "lobby") end,         -- sends what has come since
})
```

`bus.prune(3600)` deletes the messages older than an hour: run it from time to time. A database read every
300 ms per connection is enough for a chat or notifications; beyond a few thousand connections, use a real
message broker. The complete example is `examples/chat` of the package (an HTML page and a room):

```sh
CHAT_DB=sqlite://chat.db qlang serve examples/chat/main.q --workers 2
```

### Testing a WebSocket

`WsClient` (`@std/web/testing.q`) opens a WebSocket on the application **without a network** and plays the
events one by one:

```qlang-ref
let a = testing.WsClient.open(app, "/chat?name=ada")
assert_eq(a.received(), ["welcome ada"])
a.send("hi")                       -- on_message
b.received()                       -- what the others received
a.close()                          -- on_close
testing.WsClient.try_open(app, "/chat", {"origin": "https://evil.example"})   -- an Err: 403
```

## The job queue

Long work is not done during the request: you **write it down** (a *job*) and a separate process does it.
`@std/queue.q` keeps the jobs in your database, with nothing else to run.

```qlang-ref
import "@std/queue.q" as qq

struct SendWelcome
  public email: string
end

let queue = qq.Queue.new(db, "sqlite")
queue.install().unwrap()
queue.handle<SendWelcome>(fun(job: SendWelcome) -> string?
  let sent = mailer.send(job.email, "Welcome")
  if sent.is_err() then sent.unwrap_err().message else none end
end)
```

```qlang-ref
-- in a route
queue.push(SendWelcome { email: input.email }).unwrap()
queue.push_in(SendWelcome { email: input.email }, 3600).unwrap()      -- not before an hour
```

```qlang-ref
-- worker.q: a separate process, with the same providers as the application
queue.work(false)                                                      -- never returns
```

- A job is a structure with public fields (stored as JSON); **its type finds its function**.
- The function returns `none` when it is done, or the **text that says why** it failed. It must never `panic`
  (that would stop the worker).
- A failure is tried again later (10 s, 1 min, 5 min, then 15 min) up to `max_attempts` times (3 by default),
  then the job moves to the table of abandoned jobs: `queue.failed()`, `retry_failed(id)`, `forget_failed(id)`.
- Several workers may run: each **marks** a job before doing it. A job left "running" for more than
  `queue.timeout` seconds (the worker died) is given again: a function must therefore be safe to run twice.
- On the command line: `@std/web/commands.q` brings `queue:work` (`--once` to stop when nothing is left),
  `queue:failed` and `queue:retry <id>`. Run the worker under systemd, Docker or whatever restarts it.
- Tests give their own clock (`queue.clock`) so as not to wait.

## What next

What is still missing: a message broker for thousands of connections, ready-made JWT, ORM relations. For all
the rest, the "Web applications" page and the [guide](../36-web-demarrer/) say how the pieces fit together.
