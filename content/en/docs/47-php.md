---
title: "qlang for PHP developers"
group: "Guides"
---

# qlang for PHP developers

If you write PHP (Laravel, Symfony), most of what you do has an equivalent. This page gives the correspondences
and, above all, the places where PHP habits trip you up.

## The equivalents

| PHP | qlang |
| --- | --- |
| `echo`, `print_r` | `print(x)` (also prints arrays and structures) |
| `$x = 1;` | `let x = 1` (typed: `let x: int = 1`) |
| `array(...)` (list or dictionary) | two types: `array<T>` for a list, `map<K, V>` for a dictionary |
| `$a ?? $b` | `a ?? b` (identical) |
| `null` | `none`, but only in a nullable type: `string?` |
| exceptions, `try`/`catch` | values: `Result<T, Error>` and the `?` operator |
| `json_encode`, `json_decode` | `Json.of(x).to_text()`, `Json.parse(text)` |
| `preg_match` | `regex.matches`, `regex.find`, `regex.find_all` |
| `DateTime`, `Carbon` | `datetime` (UTC) and `Zone` for time zones |
| `password_hash` | `Password.hash`, `Password.verify` |
| `PDO` | `Db.connect("sqlite://…" / "postgres://…" / "mysql://…")` |
| Eloquent, Doctrine | `@std/web/query.q` and `relations.q` (query builder, not a full ORM) |
| Composer, `composer.json` | `qlang.toml`, `qlang add`, `qlang install`, `qlang.lock` |
| `php artisan make:…` | `kit make controller|model|migration…` (see [kit](../43-kit/)) |
| `php artisan serve`, PHP-FPM | `qlang serve main.q --workers N` |
| `php artisan migrate` | `db:migrate` of `@std/web/commands.q` |
| queues, `schedule:run` | `@std/queue.q`, `@std/schedule.q` |
| PHPUnit, Pest | `qlang test` and [`qlang-test`](../44-tests/) |
| sessions, CSRF, middleware | `@std/web/session.q`, `csrf_protect`, `app.use(...)` |
| `Log::info` (PSR-3) | `Log.info`, `Log.error`, with a JSON context |

## The traps

- **Everything is typed, nothing is silently converted.** `"5" + 1` is an error, not `6`. Convert by hand:
  `int.parse("5")` gives an `int?` (`none` if it is not a number).
- **`/` is decimal division.** `7 / 2` is `3.5`; for integer division, `7 div 2` (and `%` for the remainder).
- **No exceptions.** A function that can fail gives a `Result`. `?` returns the error to the caller; `unwrap()`
  stops the program on an error (like an uncaught exception).
- **`none` is not everywhere.** A `string` variable can never be `none`; you need `string?`, and the compiler
  makes you test before using it.
- **Arrays and dictionaries are different.** `[1, 2]` is not `{"a": 1}`. Reading a key of a dictionary gives a
  `T?`: `d["a"] ?? 0`.
- **`{` and `}` in a string interpolate.** `"value: {x}"`; for literal braces, `\{` and `\}`.
- **Workers share nothing.** A global variable is not common to all the requests the way you might expect from
  PHP-FPM... not even between two requests handled by **different workers**. For what must last: a database,
  Redis, or a shared cache (`Cache.redis`).
- **Integers are 64 bits and overflow is an error**; they do not turn into floats.
- **Some words are reserved** (`step`, `from`, `then`, `end`, `public`...): a field cannot be called `end`.
- **A file is only imported if it exports**: `export total` at the end of `cart.q`.
- **No magic globals**: no `$_GET`; the request is the `req` argument of your function.

## Where to start

1. The [web guide](../36-web-demarrer/) builds a complete API, from routes to tests.
2. [Recipes](../45-cookbook/) for everyday little things.
3. [Deploying](../46-deployer/) for production.
