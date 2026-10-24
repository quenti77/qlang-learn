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

### Several workers: a relay per worker

Each worker gets a `Relay`: a `Hub` (the connections of this worker) plus a **feed** of messages. The relay reads
the feed **once per interval and room, whatever the number of connections**, then fans out in memory. Each
connection calls `relay.pump()` in its `on_tick`: the call returns at once until the interval has passed.

```qlang-ref
import "@std/web/ws.q" as ws

let hub = ws.Hub.new()
let bus = ws.Bus.new(db, "sqlite")      -- "postgres" or "mysql" for those databases
bus.install().unwrap()                  -- the table, if it does not exist
let relay = ws.Relay.new(bus, hub, 250)

Response.websocket(WebSocketHandler {
  tick_ms: 100,
  on_open: fun(c: WebSocket)
    hub.join("lobby", c)
    relay.watch("lobby")
  end,
  on_message: fun(c: WebSocket, m: WsMessage) bus.publish("lobby", m.text ?? "").unwrap() end,
  on_tick: fun(c: WebSocket) relay.pump() end,
  on_close: fun(c: WebSocket) hub.leave(c) end,
})
```

Two feeds:

| Feed | Messages go through | Cost |
| --- | --- | --- |
| `Bus` + `Relay.new(bus, hub, ms)` | a table of your database | one query per interval, room and worker, even without messages |
| `RedisBus` + `Relay.with_feed(RedisFeed.open(url, "app:").unwrap(), hub, 50)` | **Redis** publish/subscribe | nothing while nobody speaks: Redis pushes |

With Redis, each worker subscribes once per room and publishes with `RedisBus.new(redis, "app:").publish(room,
text)`. This is what real systems do (Laravel Reverb, Socket.IO adapters). With the database, the cost stays
constant as connections grow, but it does not drop to zero: an interval of 250 ms is enough for a chat.
(`Bus.deliver` reads once per *connection*: for a few dozen only.) `bus.prune(3600)` deletes the messages older
than an hour. The complete example is `examples/chat` of the package:

```sh
CHAT_DB=sqlite://chat.db qlang serve examples/chat/main.q --workers 2
CHAT_REDIS=redis://127.0.0.1:6379 qlang serve examples/chat/main.q --workers 2
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
`@std/queue.q` keeps the jobs in your database, with nothing else to run, or in **Redis**.

```qlang-ref
import "@std/queue.q" as qq

struct SendWelcome
  public email: string
end

let queue = qq.Queue.new(db, "sqlite")          -- or qq.Queue.redis(redis, "default")
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
- **Database or Redis?** With the database, a job added in a transaction only exists once the transaction commits,
  and there is nothing else to run; a worker looks every second. With Redis, the worker **waits on the list** (it
  does not poll) and a job that is added starts at once; delayed jobs and the ones a dead worker left "running" are
  put back in the list. The code is the same on both sides.
- Several workers may run: each **marks** a job before doing it. A job left "running" for more than
  `queue.timeout` seconds (the worker died) is given again: a function must therefore be safe to run twice.
- On the command line: `@std/web/commands.q` brings `queue:work` (`--once` to stop when nothing is left),
  `queue:failed` and `queue:retry <id>`. Run the worker under systemd, Docker or whatever restarts it.
- Tests give their own clock (`queue.clock`) so as not to wait.

### Queue options

Annotations go on the job structure (`import "@std/queue.q" as qq`):

```qlang-ref
#[qq.Retry(tries: 5, backoff: [10, 60, 300])]     -- 5 tries; waits of 10 s, 1 min, then 5 min
#[qq.Unique(seconds: 3600)]                       -- no two identical jobs waiting or running
#[qq.Delay(seconds: 30)]                          -- starts 30 s after it is pushed
struct SendWelcome
  public email: string
end
```

- `push` gives `false` when an identical `Unique` job is already there; the lock is freed when the job is done (or
  abandoned), or after `seconds`.
- **Job middleware**: `queue.use(m)` (every job) or `queue.handle_with<T>(function, [m])` (one type). A middleware
  receives the job and `next`, and returns an `Outcome`: `next()` to run it, `Outcome.release(10)` to give it back and
  try again in 10 s **without counting an attempt**. Two are provided: `qq.rate_limited(cache, qq.by_kind, 10, 60)` (at
  most 10 jobs of a type per minute; the others wait for the next window) and
  `qq.without_overlapping(cache, qq.by_kind, 120, 5)` (never two jobs of a type at once). With `Cache.redis`, the count
  is exact for every worker.
- **The worker**: `queue.work_with(qq.WorkOptions { max_jobs: 500, max_seconds: 3600 })` stops by itself (so that the
  process is restarted with fresh memory), and **stops cleanly** on Ctrl-C or `kill`: it finishes the job it is doing,
  then leaves (`Process.stopping()`). On the command line: `queue:work --max-jobs 500 --max-time 3600`.

### Several queues, chains and batches

A mail job should not wait behind a thousand image resizes. `queue.lane(name, driver)` adds a queue next to `default`, and
`#[qq.OnQueue(name: "high")]` sends a type of job to its own. The worker serves the queues **in the order you give it**:
as long as the first one has work, it does not touch the next.

```qlang-ref
queue.lane("high", qq.DbDriver { db: db, dialect: "sqlite", table: "jobs_high" })   -- or qq.RedisDriver { redis: r, name: "high" }
queue.work_with(qq.WorkOptions { queues: ["high", "default"] })                    -- on the command line: queue:work --queues high,default
queue.push_on("high", Resize { id: 1 })                                             -- or #[qq.OnQueue(name: "high")] on the type
```

A worker that serves several queues looks at them in turn (at least every 250 ms with Redis); with a single queue it waits
on the list as before. Failed jobs say which queue they come from (`queue:failed`).

A **chain** runs jobs one after the other: each starts when the previous one is done, and none starts if one gives up
(then the `on_failure` job is added). A **batch** runs jobs in parallel and adds a job when **all** are done, or, once,
when one gives up:

```qlang-ref
queue.chain().add(Download { url: u }).add(Convert { id: 1 }).add(Notify { user: 7 }).on_failure(Alarm { why: "convert" }).dispatch()
queue.batch().add(Resize { id: 1 }).add(Resize { id: 2 }).add(Resize { id: 3 }).when_done(Summary { n: 3 }).when_failed(Alarm { why: "resize" }).dispatch()
```

The count of a batch is kept by the driver (a row in the database, or `DECR` in Redis): however many workers finish the
jobs, the closing job is added **once**.

### The queue dashboard

`@std/web/queue_admin.q` adds routes behind a guard of yours: `queue_admin.mount(app, queue, "/admin/queue", my_guard)`
gives a page (waiting jobs, failed jobs with their error), `GET …/stats` as JSON, and `POST …/retry/:id`,
`POST …/forget/:id`. Put your admin check and your CSRF protection in the guard.

### Resuming after a drop

A client that loses its connection misses messages. With `bus.numbered = true` each message is sent as
`{"room", "id", "text"}`; the client keeps the last `id` and, when it reconnects (`/chat?after=41`), the route calls
`bus.replay(conn, "lobby", after)` in `on_open`: the missed messages come first, then `deliver` goes on. The client ignores
an `id` it already has. Only the database bus keeps messages: with Redis a message nobody was listening to is gone.

## What next

What is still missing: an ORM that writes the SQL for you (on purpose), per-tenant queues, graphical dashboards.
Relations, batches and chains are there. For all the rest, the "Web applications" page and the
[guide](../36-web-demarrer/) say how the pieces fit together.
