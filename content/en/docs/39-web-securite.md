---
title: "Web guide 4: accounts and security"
group: "Web applications"
---

# Web guide 4: accounts and security

This page adds accounts to the task API: signing up, signing in, staying signed in, and protecting routes.

## Passwords

Never store a password: store its **hash**. `Password` (Argon2id, with a random salt) is part of the language:

```qlang-ref
let hash = Password.hash("correct horse battery").unwrap()     -- "$argon2id$v=19$m=19456,t=2,p=1$..."
Password.verify("correct horse battery", hash).unwrap()        -- true
Password.needs_rehash(hash).unwrap()                           -- true if the settings have aged
```

Signing up hashes and stores; signing in verifies, with **the same message** for an unknown email and a wrong
password (do not say which of the two):

```qlang-ref
#[web.Post("/login")]
fun login(#[web.Body] input: Credentials, users: Users, req: Request) -> Result<User, HttpError>
  let row = users.by_email(input.email)
  let refused = HttpError { status: 401, message: "wrong email or password" }
  if row == none then
    return Result<User, HttpError>.Err(refused)
  end
  let ok = Password.verify(input.password, row.password_hash)
  if ok.is_err() or not ok.unwrap() then
    return Result<User, HttpError>.Err(refused)
  end
  let s = session.session_of(req)
  s.set("user", "{row.id}")
  Result<User, HttpError>.Ok(User { id: row.id, email: row.email })
end
```

The structure returned to the client (`User`) has no `password_hash` field: `Json.of` only writes what is in
the structure that is returned. Keep one structure for the database row (`UserRow`) and one for what goes out
(`User`).

## Sessions

`@std/web/session.q` keeps what the user did (who is signed in, a message to show once) in a **signed cookie**:
no server-side storage, so nothing to share between workers. The browser cannot change it (it is signed), but it
can read it: put no secret in it. It is limited to about 3 KB.

```qlang-ref
import "@std/web/session.q" as session

app.use(session.sessions(config.secret))        -- a long secret, known only to the server
```

In a route: `session.session_of(req)` gives the session, with `get(key)`, `set(key, value)`, `remove`, `clear()`
(sign out), `flash_set(message)` / `flash()` (a message for the next request) and `csrf_token()`. Changes are
written in the cookie `qs` by the middleware (`HttpOnly`, `SameSite=Lax`). **Behind HTTPS**, use
`session.sessions_with(secret, true)` to add the `Secure` attribute.

The secret comes from the environment (`TASKS_SECRET`), never from the code; changing it signs everybody out.

## Guards: protecting routes

A **guard** is a function that receives the request and returns `none` to let it through, or a response to stop
it. You name it once, then apply it with an annotation:

```qlang-ref
app.guard("auth", fun(req: Request) -> Response?
  let id = int.parse(session.session_of(req).get("user") ?? "")
  if id == none then
    return web.Problem { status: 401, message: "sign in first" }.to_response()
  end
  let users = app.container.get<Users>().unwrap()
  let row = users.by_id(id)
  if row == none then
    return web.Problem { status: 401, message: "sign in first" }.to_response()
  end
  req.attrs["me"] = Any.of(Me { id: row.id, email: row.email })
  none
end)
```

```qlang-ref
#[web.Get("/me")]
#[web.Guard("auth")]
fun me(who: Me) -> Me
  who
end
```

- `#[web.Guard("auth")]` goes on a function, a method, or **on a whole controller structure**.
- You can stack several (`#[web.Guard("auth")]` then `#[web.Guard("admin")]`): they run in order.
- A guard can also redirect (`Response.redirect("/login")`) for a pages application.
- What it learns (the user) goes in `req.attrs`; the `Me` service (`Scoped`, page 3) gives it back to the routes,
  which no longer need to know about the session.
- `app.validate()` reports a guard that is annotated but never defined.

Routes **without** a guard (`/health`, `/register`, `/login`) are public: that is what separates public from
private, not a prefix.

For **permissions** (admin, owner): a second guard, or a test in the route with `HttpError { status: 403, ... }`.
To make sure a resource belongs to the user, filter by `user_id` in the repository (like `tasks.find(who.id,
id)`): someone else's task is then a plain `404`.

## CSRF

A browser sends cookies by itself, even from another site: for an application with **pages and forms** (not for
an API called with a token), add `app.use(session.csrf_protect())`. It refuses (`403`) a `POST`, `PUT`, `PATCH`
or `DELETE` that does not repeat the session token in the `X-CSRF-Token` header or the `_csrf` form field; give
the token to the page with `session.csrf_token()`.

## API tokens

For clients that are not browsers, `mw.bearer_token(fun(token: string) -> bool ... end)`
(`@std/web/middleware.q`) refuses (`401`) requests without an acceptable `Authorization: Bearer ...`. Compare a
secret with `Crypto.equal(a, b)` (constant time); `Crypto.token(32)` makes a random token (a `Result<string,
Error>`).

## Headers, CORS, rate

```qlang-ref
import "@std/web/middleware.q" as mw
import "@std/web/cache.q" as cache
import "@std/web/limit.q" as limit

app.use(mw.request_id())                     -- an identifier per request, in the header and the log
app.use(mw.logging())                        -- GET /tasks -> 200 (3 ms)
app.use(mw.security_headers())               -- nosniff, X-Frame-Options, Referrer-Policy
app.use(mw.cors(["https://app.example"]))    -- or mw.cors_with(mw.CorsOptions { ... })
app.use(limit.rate_limit(cache.Cache.memory(), 100, 60, limit.by_header("x-forwarded-for")))
```

- The **first** middleware added is the outermost; put `request_id` then `logging` first.
- `cors_with(CorsOptions { origins: [...], credentials: true, expose: [...], max_age: 600 })` tunes it.
- `rate_limit(cache, 100, 60, key)`: 100 requests a minute per key, otherwise `429` with `Retry-After`. The
  counter lives in the cache: in memory it counts **per worker**; with `Cache.files(folder)`, for the machine; with `Cache.redis(redis, "limit:")`, **exactly for every machine** (the
  count is one atomic step).
  Behind a proxy, count by the header it sets; do not trust `x-forwarded-for` if a client can reach the server
  directly.

## A checklist

- Passwords hashed with `Password`, same sign-in message for both failures.
- Session secret in the environment, `sessions_with(secret, true)` behind HTTPS.
- A guard on everything private; filter by owner in the queries.
- Bodies validated (`422`), never SQL built by hand with values.
- `--dev` never in production; `500` errors show nothing to the client.
- Rate limit at least on `/login` and `/register`.

Next: [testing and going to production](../40-web-production/).
