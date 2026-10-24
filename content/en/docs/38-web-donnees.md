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
struct Config
  public database: string
  public secret: string
end

struct Tasks
  public db: Db
end

fun make_config() -> Config
  Config { database: env.get("TASKS_DB") ?? "sqlite://:memory:", secret: env.get("TASKS_SECRET") ?? "dev-only-secret" }
end

fun make_db(config: Config) -> Db
  Db.connect(config.database).unwrap()
end

fun make_tasks(db: Db) -> Tasks
  Tasks { db: db }
end
```

```qlang-ref
let app = web.App.new(Reflect.callables(providers))
```

A parameter `tasks: Tasks` of a route receives the service built by `make_tasks`, which received `Db`, which
received `Config`. The name of the functions does not matter, **only the returned type does**.

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

There is **no ORM** with relations: a "repository" is a structure that groups the queries of one table
(`Users`, `Tasks`), which keeps SQL out of the routes and can be replaced in a test.

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
