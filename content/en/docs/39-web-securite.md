---
title: "Web guide 4: accounts and security"
group: "Web applications"
---

# Web guide 4: accounts and security

This page adds accounts to the task API: signing up, signing in, staying signed in, and protecting routes. It reuses
the types and services of page 3 (`User`, `UserRow`, `Users`, `Me`, `Credentials`) and these imports:

```qlang-ref
import "@std/web/app.q" as web
import "@std/web/session.q" as session
```

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

## Tokens (JWT) for clients that are not browsers

A mobile app, a single-page application or another server do not use cookies: they send a **token** in the
`Authorization: Bearer ...` header. `@std/jwt.q` signs and checks it, `@std/web/auth.q` makes a guard of it.

```qlang-ref
import "@std/jwt.q" as jwt
import "@std/web/auth.q" as auth

struct Session
  public sub: string
  public email: string
  public iat: int
  public exp: int
end

-- issue: a 15-minute token in exchange for an email and a password
let now = time.now() div 1000
let signed = jwt.sign(Session { sub: "{row.id}", email: row.email, iat: now, exp: now + 900 }, jwt.Key.hs256(config.secret))

-- check: a guard, then the claims in the route
app.guard("jwt", auth.jwt_guard([jwt.Key.hs256(config.secret)], jwt.Options {}))
app.guard("admin", auth.scope_guard(["admin"]))
```

```qlang-ref
#[web.Get("/api/me")]
#[web.Guard("jwt")]
fun api_me(req: Request) -> Session?
  auth.claims_of<Session>(req)
end
```

What checking looks at, in order: the shape; **the algorithm is one of *your* keys' algorithms** (never what the token
asks for: `none` is refused, and a public key is never used as an HMAC secret); the signature, with the key the header's
`kid` names; `exp` and `nbf` (with `leeway` seconds of grace); `iss` and `aud` if you ask for them. A token without
`exp` is refused. An HMAC secret shorter than 32 characters is refused too. A guard that refuses answers `401` with
`WWW-Authenticate: Bearer` (`403` and `insufficient_scope` for `scope_guard`) and does not say why.

- **Key pairs.** `jwt.Key.rs256(pem)`, `es256`, `eddsa`...: **sign** with the private key (PKCS#8, `BEGIN PRIVATE KEY`)
  and **verify** with the public one (PEM or JWK).
- **The identity provider** (Auth0, Keycloak, Google) publishes its keys: `auth.fetch_jwks(url, cache, 3600)` reads them
  once an hour and the `kid` of each token picks the right one. Give them to `auth.jwt_guard(keys, jwt.Options { issuer:
  "https://...", audience: "my-api" })`.
- **A JWT is signed, not encrypted**: anybody can read its content. Put little in it, keep it short-lived (minutes) and
  renew it with a *refresh token* that you keep in your database: you can revoke that one, which you cannot do with a JWT
  that was already issued.
- **Algorithms.** `hs256`, `hs384`, `hs512` (secrets of at least 32, 48 and 64 characters), `rs256/384/512`,
  `ps256/384/512` (RSA-PSS, recommended over RS) and `es256/384`, `eddsa`. HS384, HS512 and PS need `qlang` 0.55.

### Refresh tokens

`@std/web/refresh.q` keeps refresh tokens in your database (a **hash**, never the token) and **rotates** them: each use
gives a new token and burns the old one. If a burnt token comes back (it was stolen), the whole session is closed.

```qlang-ref
import "@std/web/refresh.q" as rf

let refresh = rf.Refresh.new(db)
refresh.install().unwrap()

-- at login: an access token (15 min) and a refresh token (30 days)
let first = refresh.issue("{row.id}").unwrap()

-- on POST /token/refresh
let next = refresh.rotate(body.refresh_token)
if next.is_err() then
  return Response.json("\{\"error\": \"login\"\}").with_status(401)    -- invalid, expired or reused
end
-- sign a new JWT for next.unwrap().user, send next.unwrap().token
```

`revoke(token)` closes one session, `revoke_user(id)` all those of a user (a password change) and `purge()` deletes the
expired tokens.

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
