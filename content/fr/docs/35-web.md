---
title: "Applications web"
group: "Outils"
---

# Applications web

qlang sait servir du HTTP (`qlang serve app.q`), et le paquet **`web`** de
[`qlang-std`](https://github.com/quenti77/qlang-std) apporte ce dont une application est faite :
routes, injection de dépendances, validation, accès à la base, middleware et sessions. Tout est écrit
en qlang ; il demande `qlang` 0.49 ou plus.

## Installer

Dans le dossier du projet :

```sh
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.2.0
```

Puis, dans un fichier `.q` :

```
import "@std/web/app.q" as web
```

## Une première route

Une route est une fonction. Ses paramètres disent d'où viennent ses valeurs ; ce qu'elle rend devient la
réponse.

```
-- controllers.q
import "@std/web/app.q" as web

struct Greeting
  public message: string
end

#[web.Get("/hello/:name")]
fun hello(#[web.Path] name: string, #[web.Query] shout: bool?) -> Greeting
  Greeting { message: "Bonjour {name}" }
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
curl localhost:8080/hello/ada      # {"message":"Bonjour ada"}
```

| Paramètre | Rempli avec |
| --- | --- |
| `#[web.Path] id: int` | le `:id` de la route, lu comme le type du paramètre (`400` s'il ne convient pas) |
| `#[web.Query] page: int?` | le `?page=` de l'URL (`none` s'il manque, si le type le permet) |
| `#[web.Body] input: NewUser` | le corps JSON, lu comme ce type, puis validé (`422` avec le détail) |
| `#[web.Header("X-Token")] token: string` | un en-tête ; `#[web.CookieValue("sid")]` un cookie |
| `posts: Posts` | le service de ce type (voir plus bas) ; `req: Request` est la requête elle-même |

Ce que la fonction rend : une `Response` telle quelle, une `string` en texte, le reste en JSON, `none` en
`404`, rien en `204` ; un `Result` donne son `Ok` de la même façon et son `Err` comme une erreur
(`HttpError { status, message }`, ou une `Error`, qui est un `500` dont le détail va au journal, pas au
client). `#[web.Status(201)]` fixe le statut d'une réponse réussie.

Les annotations s'écrivent avec le nom du module (`web.Get`) : `Post`, `Delete`... sont des noms de
modèles trop courants pour les prendre.

## Les services

Une fonction qui rend un `T` *fournit* un `T` ; ses paramètres sont ses besoins. Le conteneur trouve les
fournisseurs par le type qu'ils rendent, construit chaque service la première fois qu'on en a besoin et
vérifie tout le graphe avant la première requête.

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
let problems = app.validate()     -- services manquants, cycles, routes cachées par une autre : avant toute requête
```

Un service est construit une fois (un *singleton*). `#[Scoped]` en fait un par requête, `#[Transient]` un
nouveau à chaque fois. Hors d'une route, `app.container.get<Posts>()` donne un service.

## Validation

Les règles sont des annotations sur les champs ; un `#[web.Body]` est vérifié avant que ta fonction ne
s'exécute.

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
est ce que le client reçoit pour un corps incorrect.

## Base, migrations, middleware, sessions

- `@std/web/query.q` : `Query.table("users").where("age", ">=", 18).order_by("name", "asc").all_as<User>(db)`.
  Les valeurs passent toujours par `?` ; les noms de table et de colonne sont vérifiés.
- `@std/web/migrate.q` : `Migrator.new(db).run(migrations)` ; chaque migration a un SQL `up` et un SQL `down`
  et s'exécute dans une transaction.
- `@std/web/middleware.q` : `app.use(logging())`, `security_headers()`, `cors([...])`, `bearer_token(...)`,
  `request_id()`.
- `@std/web/session.q` : sessions dans un cookie signé, messages flash et protection CSRF.

Une API complète (SQLite, migrations, validation, middleware) est dans le dossier
[`examples/blog`](https://github.com/quenti77/qlang-std/tree/main/examples/blog) du paquet. En production,
lance `qlang serve` derrière un proxy inverse (TLS, compression) et donne-lui assez de `--workers`.
