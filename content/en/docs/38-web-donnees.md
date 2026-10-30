---
title: "Web guide 3: services and data"
group: "Web applications"
---

# Web guide 3: services and data

## Services: a function that returns a `T` provides a `T`

A handler needs a database, a configuration, a repository. Rather than creating them by hand, you write
**providers**: functions whose return type is the service and whose parameters are its needs. The container
finds them by type, builds each service the first time it is asked for and checks the whole graph before the
first request.

```qlang-ref
-- providers.q
import "@std/web/container.q" as di

struct Config
  public database: string
  public secret: string
end

#[di.Service]
struct Tasks
  db: Db
end

struct User
  public id: int
  public email: string
end

--" A user as the table holds it, with the hash of the password (never sent out). --"
struct UserRow
  public id: int
  public email: string
  public password_hash: string
end

struct Task
  public id: int
  public title: string
  public done: bool
end

--" A task as the table holds it: SQLite keeps a boolean as 0 or 1. --"
struct TaskRow
  public id: int
  public title: string
  public done: int
end

impl TaskRow
  public fun to_task(self) -> Task
    Task { id: self.id, title: self.title, done: self.done != 0 }
  end
end

--" Who is making the request: filled in by a guard (page 4). --"
struct Me
  public id: int
  public email: string
end

#[di.Service]
struct Users
  db: Db
end

fun make_config() -> Config
  Config { database: env.get("TASKS_DB") ?? "sqlite://:memory:", secret: env.get("TASKS_SECRET") ?? "dev-only-secret" }
end

fun make_db(config: Config) -> Db
  Db.connect(config.database).unwrap()
end

```

The structures at the start are the ones **the following pages reuse**: `Task` and `User` are what the API returns,
`TaskRow` and `UserRow` what the tables hold (more on that with the database), `Me` the user making the request (filled
in by a guard, page 4), `Users` and `Tasks` the services that talk to the database.

```qlang-ref
let app = web.App.new(Reflect.callables(providers))
app.services(Reflect.constructors(providers))
```

A parameter `tasks: Tasks` of a route receives the `Tasks` service, built with the `Db` that `make_db` provides,
which received `Config`. Two ways to declare a service:

- **a function** (`make_config`, `make_db`): it returns the service, its parameters are what it needs. The name
  does not matter, **only the returned type does**. Use it for what needs code (reading the environment, opening a
  connection).
- **a structure marked `#[di.Service]`** (`Users`, `Tasks`): its **fields** are its dependencies and the container
  builds it by itself, like Laravel's autowiring. The fields can stay private.
  `app.services(Reflect.constructors(providers))` takes every marked structure of a file; a structure without
  the mark is not a service.

For an interface (a trait), say which implementation is the service:

```qlang-ref
app.bind<Mailer, ResendMailer>()      -- whoever asks for a `Mailer` gets a `ResendMailer`
```

A test calls `app.container.set(other)` to put another one in.

### Lifetimes

| Annotation | The service is built |
| --- | --- |
| (nothing) | once for the application (*singleton*) |
| `#[di.Scoped]` | once **per request** |
| `#[di.Transient]` | every time it is asked for |

(with `import "@std/web/container.q" as di`). A service that depends on the request (the signed-in user) is
`Scoped`; a singleton cannot depend on a `Scoped` service: `app.validate()` reports it.

```qlang-ref
#[di.Scoped]
fun make_me(req: Request) -> Me
  let held = req.attrs["me"]
  let me = if held == none then none else held.as<Me>() end
  me ?? Me { id: 0, email: "" }
end
```

`Request` is always available as a service. `req.attrs` is a bag of values that guards and middleware fill in
for the rest of the request.

### Provider traps

- **Every top-level function of the file is a provider** (`Reflect.callables` takes them all). A helper function
  that returns a type (`fun to_task(row: TaskRow) -> Task`) would become a provider of `Task`: put it in an
  `impl` (`row.to_task()`) or in a file that is not given to the container.
- **Two providers of the same type**: the last one wins; keep one provider per type, or make distinct types
  (`struct ReadDb`, `struct WriteDb`).
- **A test replaces a service** with `app.container.set(value)`.
- `app.container.get<Tasks>()` gives a service outside a route (in a guard, a command).

## The database

`Db.connect("sqlite://tasks.db")`, `postgres://...` and `mysql://...` give a `Db`; `db.query(sql,
[Json.number(1.0)])` reads, `db.execute(sql, [...])` writes: the values (`Json`) always go through `?`. To avoid
writing SQL for everyday needs, `@std/web/query.q` provides a **query builder**:

```qlang-ref
import "@std/web/query.q" as q

q.Query.table("tasks").where("user_id", "=", 1).where("done", "=", 0).order_by("id", "asc").all_as<TaskRow>(db)
q.Query.table("tasks").where("id", "=", 3).first_as<TaskRow>(db)             -- Result<TaskRow?, Error>
q.Query.table("tasks").insert(db, { "title": Json.string("Write"), "user_id": Json.number(1.0) })
q.Query.table("tasks").where("id", "=", 3).update(db, { "done": Json.number(1.0) })
q.Query.table("tasks").where("id", "=", 3).delete(db)
```

Values are never in the SQL text, and table names, column names and operators are checked: an error, never an
injection. `all_as<T>` reads each row as a structure `T`: the field names are the column names.

One trap when reading:

- **SQLite stores a boolean as an integer** (0 or 1). Read the column in a structure with `done: int`, then
  convert (`row.done != 0`): the example has a `TaskRow` for that and a `to_task()` method.

There is **no ORM** that hides the SQL: a "repository" is a structure that groups the queries of one table
(`Users`, `Tasks`), which keeps SQL out of the routes and can be replaced in a test. Here are the two of the example,
the ones the routes that follow receive as parameters:

```qlang-ref
import "@std/web/query.q" as q

impl Users
  public fun by_email(self, email: string) -> UserRow?
    q.Query.table("users").where("email", "=", email).first_as<UserRow>(self.db).unwrap()
  end

  public fun register(self, email: string, password: string) -> Result<User, Error>
    let hash = Password.hash(password)
    if hash.is_err() then
      return Result<User, Error>.Err(hash.unwrap_err())
    end
    q.Query.table("users").insert(self.db, { "email": Json.string(email), "password_hash": Json.string(hash.unwrap()) })?
    let found = self.by_email(email)
    if found == none then
      return Result<User, Error>.Err(Error { message: "the user was not saved" })
    end
    Result<User, Error>.Ok(User { id: found.id, email: found.email })
  end
end

impl Tasks
  public fun for_user(self, user: int, done: bool?) -> array<Task>
    let query = q.Query.table("tasks").where("user_id", "=", user)
    if done != none then
      query = query.where("done", "=", if done then 1 else 0 end)
    end
    query.order_by("id", "asc").all_as<TaskRow>(self.db).unwrap().map(fun(r: TaskRow) -> Task r.to_task() end)
  end
end
```

### Relations, without "N+1"

Loading the posts of each user with one query **per user** is the classic trap. `@std/web/relations.q` loads what
relates to a list of rows with **one query per relation** and gives each row back with its neighbours:

```qlang-ref
import "@std/web/relations.q" as rel

let users = q.Query.table("users").all_as<User>(db).unwrap()

-- a user has many posts (one query for all of them)
let loaded = rel.has_many<User, Post>(db, users, "id", "posts", "user_id").unwrap()
for u in loaded do
  print("{u.item.name}: {u.related.len()} post(s)")
end

-- a post belongs to a user; a user has one profile; many roles through a pivot table
rel.belongs_to<Post, User>(db, posts, "user_id", "users", "id")
rel.has_one<User, Profile>(db, users, "id", "profiles", "user_id")
rel.belongs_to_many<User, Role>(db, users, "id", "role_user", "user_id", "role_id", "roles", "id")
```

The result is an array of `With<P, R>`: `item` is the row you started from, `related` what relates to it (an array, or
an `O?` for `belongs_to` and `has_one`). `has_many_where` adds a function that tunes the query of the children (an
order, a filter). Names are checked like in `Query`, and values are always `?`.

## Migrations

A migration is an identifier (sorted: start it with a number) and the SQL that applies or undoes the change.
They run in a transaction and are remembered in the table `schema_migrations`: an applied migration never runs
again.

```qlang-ref
import "@std/web/migrate.q" as migrate

fun make_db(config: Config) -> Db
  let db = Db.connect(config.database).unwrap()
  migrate.Migrator.new(db).run([
    migrate.Migration {
      id: "001_users",
      up: ["CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL)"],
      down: ["DROP TABLE users"],
    },
  ]).unwrap()
  db
end
```

The example migrates at startup (handy with SQLite). For a shared database, prefer the commands `db:migrate`,
`db:rollback` and `db:status` of page 5, run by you rather than by every worker.

**A dropped connection** (the database restarts, an idle timeout, a load balancer) is reopened by `qlang serve`
by itself, and the statement that revealed it is run again once: no need to restart the server. Inside a
transaction it is not (what was done there is lost): the error says so. Each worker has its own connection:
`--workers 8` opens 8 connections to the database.

## Test data: factories and seeds

`@std/web/seed.q` fills a database without writing ten `INSERT`s. A **factory** builds rows whose values change
from one row to the next (the function of a field receives the **number of the row**, 1, 2, 3...); a **state** is
a named variation:

```qlang-ref
import "@std/web/seed.q" as seed

let users = seed.Factory.table("users")
users.field("email", fun(n: int) -> Json Json.string("user{n}@example.com") end)
users.field("role", fun(n: int) -> Json Json.string("member") end)
users.state("admin", {"role": Json.string("admin")})

users.create(db)                                  -- one row; gives the inserted row
users.create_state(db, "admin", {})               -- an administrator
users.create_with(db, {"email": Json.string("ada@example.com")})   -- one chosen value
users.create_many(db, 25)                         -- 25 rows
users.make()                                      -- the row only, not saved
```

In a test it prepares a row; for a development database, a **seeder** (a named function that fills the database)
run by `qlang run console.q -- db:seed` (`--only name` for one):

```qlang-ref
let seeders = [
  seed.Seeder { name: "users", run: fun(d: Db) -> Result<bool, Error>
    seed.done(users.create_many(d, 10))
  end },
]
app.container.set(commands.Seeders { list: seeders })      -- then `db:seed` runs them
```

Each seeder runs in a transaction: if it fails, it is undone and the next ones do not run.

## Validation

Rules are **annotations on the fields** of the body structure; they are checked before your function runs, and
`422` gives one detail per field.

```qlang-ref
import "@std/web/validate.q" as v

struct Credentials
  #[v.Email]
  public email: string
  #[v.Length(8, 100)]
  public password: string
end

struct NewTask
  #[v.NotBlank, v.Length(1, 120)]
  public title: string
end
```

| Rule | Means |
| --- | --- |
| `NotBlank`, `Required` | not empty (text); not `none` |
| `Length(min, max)` | length of a text or an array (`max: -1`: no limit) |
| `Min(n)`, `Max(n)` | bounds of a number |
| `Email`, `Pattern("regex")`, `OneOf(["a", "b"])` | shape of a text |
| `Valid` | checks the structure (or each structure of the array) the field holds |

A `none` field is not checked (add `Required` to forbid it). Your own rules: `app.rule("Slug", fun(a:
AnnotationInfo, value: Any) -> string? ... end)` gives the message if the value is wrong, otherwise `none`, and
`#[Slug]` works like the others. `app.validate_bodies(false)` turns the check off.

Next: [accounts and security](../39-web-securite/).
