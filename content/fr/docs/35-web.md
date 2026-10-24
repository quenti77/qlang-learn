---
title: "Applications web"
group: "Applications web"
---

# Applications web

qlang sait servir du HTTP (`qlang serve app.q`), et le paquet **`web`** de
[`qlang-std`](https://github.com/quenti77/qlang-std) apporte ce dont une application est faite :
routes, injection de dépendances, validation, accès à la base, middleware et sessions. Tout est écrit
en qlang ; il demande `qlang` 0.52 ou plus.

> Un **guide pas à pas** (projet, routes, données, comptes, production) suit cette page : commence par
> [Guide web 1 : démarrer](../36-web-demarrer/).

## Installer

Dans le dossier du projet :

```sh
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.6.0
```

Puis, dans un fichier `.q` :

```qlang-ref
import "@std/web/app.q" as web
```

## Une première route

Une route est une fonction. Ses paramètres disent d'où viennent ses valeurs ; ce qu'elle rend devient la
réponse.

```qlang-ref
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

```qlang-ref
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

```qlang-ref
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

```qlang-ref
import "providers.q" as providers

let app = web.App.new(Reflect.callables(providers))
let problems = app.validate()     -- services manquants, cycles, routes cachées par une autre : avant toute requête
```

Un service est construit une fois (un *singleton*). `#[Scoped]` en fait un par requête, `#[Transient]` un
nouveau à chaque fois. Hors d'une route, `app.container.get<Posts>()` donne un service.

## Validation

Les règles sont des annotations sur les champs ; un `#[web.Body]` est vérifié avant que ta fonction ne
s'exécute.

```qlang-ref
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

## Contrôleurs en classes

Les routes peuvent aussi être les méthodes d'une structure : `#[web.Controller("/posts")]` sur la
structure donne le préfixe, `#[web.Get("/:id")]` sur ses méthodes publiques la route.

```qlang-ref
#[web.Controller("/shelf")]
struct Shelf
  public label: string
end

impl Shelf
  #[web.Get("/")]
  public fun all(self, posts: Posts) -> string
    "{self.label}: {posts.all().len()}"
  end
end

app.controller(Shelf { label: "livres" })
-- ou, si un fournisseur rend une Shelf : app.controller_from_container<Shelf>()
```

L'instance vit autant que l'application : ce qui change à chaque requête arrive en paramètre de la
méthode, comme pour une fonction.

## Tester sans serveur

`@std/web/testing.q` envoie des requêtes directement à `App.handle` et garde les cookies d'une requête à
l'autre.

```qlang-ref
import "@std/web/testing.q" as t

fun test_creating_a_post()
  let client = t.Client.new(build_app())
  client.bearer("secret")
  let r = client.post_json("/posts", NewPost { title: "Hello" })
  r.expect_status(201)
  assert_eq(r.json<Post>().unwrap().title, "Hello")
end
```

## Événements, cache, limitation de débit, CORS

- `@std/web/events.q` : `events.listen<UserRegistered>(fun(e: UserRegistered) ... end)`, puis
  `events.dispatch(UserRegistered { ... })`. Les écouteurs d'un type sont appelés dans l'ordre.
- `@std/web/cache.q` : `Cache.memory()` ou `Cache.files("/tmp/cache")` ;
  `cache.remember<array<Post>>("top", 60, fun() -> array<Post> ... end)`. La mémoire est celle d'un worker ;
  des fichiers sont partagés par tous.
- `@std/web/limit.q` : `app.use(rate_limit(cache, 100, 60, by_header("x-forwarded-for")))` répond `429`
  avec `Retry-After` au-delà de 100 requêtes par minute.
- `cors_with(CorsOptions { origins: [...], credentials: true, expose: [...] })` règle finement le CORS.

## Commandes en ligne de commande

`@std/cli.q` fait des commandes avec la même idée que les routes : une fonction, dont les paramètres
disent d'où viennent leurs valeurs.

```qlang-ref
import "@std/cli.q" as cli

#[cli.Command("greet", "Dit bonjour")]
fun greet(#[cli.Arg] name: string, #[cli.Opt(short: "l")] loud: bool, console: cli.Console) -> int
  console.line(if loud then "BONJOUR {name}" else "Bonjour {name}" end)
  0
end

let program = cli.Cli.new(Reflect.callables(providers))   -- les services dont les commandes ont besoin
program.add(Reflect.callables(commands))
program.main()
```

```sh
qlang run main.q -- greet Ada --loud
qlang run main.q -- help               # la liste des commandes
qlang run main.q -- greet --help       # l'usage d'une commande
```

`#[cli.Arg]` est un mot de la ligne (un `array<T>` prend le reste), `#[cli.Opt]` une option (`--count 3`,
`-c 3` ; un `bool` est un drapeau), `console: cli.Console` la console (`line`, `error`, `table`, `ask`,
`confirm`), tout autre paramètre un service. Un `int` rendu est le code de sortie, un `Err` un message sur
la sortie d'erreur et le code `1` ; une ligne fausse donne `2`, une commande inconnue `127`.
`Cli.run(args, Console.captured([]))` lance une commande sans processus : c'est ainsi qu'on les teste.
`@std/web/commands.q` apporte `routes:list`, `db:migrate`, `db:rollback`, `db:status` et `locale:missing`.

## Traductions

`@std/i18n.q` lit un fichier JSON par langue.

```qlang-ref
import "@std/i18n.q" as i18n

let tr = i18n.Translator.new("en")
tr.load("fr", "lang/fr.json").unwrap()
tr.load("en", "lang/en.json").unwrap()

tr.t("fr", "welcome", { "name": "Ada" })     -- Bonjour Ada
tr.tn("fr", "cart.items", 3, {})             -- 3 articles
```

Un objet imbriqué fait une clé pointée (`cart.items`) ; un objet dont les clés sont `one`, `other`, `few`...
est un message à formes du pluriel, choisi par `tn` selon la langue. `fr-CA` se replie sur `fr`, puis sur la
langue par défaut, puis sur la clé elle-même. `tr.negotiate(entête, ["en", "fr"])` choisit la langue d'après
`Accept-Language`, `tr.number("fr", 1234.5, 2)` écrit un nombre à la manière de la langue et
`tr.missing("fr")` liste ce qui reste à traduire. Côté web, `use_locale(app, tr, ["en", "fr"])`
(`@std/web/locale.q`) choisit la langue de chaque requête (`?lang=`, cookie, `Accept-Language`) et
donne un paramètre `lang: i18n.Lang` aux gestionnaires.

## Documentation OpenAPI

`openapi_route(app, "/openapi.json", "Blog", "1.0.0")` ajoute une route qui décrit l'API en OpenAPI 3.1 :
chemins, paramètres, corps, types de retour et règles de validation, lus dans les annotations et les types.
`#[web.Doc("Liste les articles")]` et `#[web.Tag("posts")]` ajoutent un résumé et un groupe.

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
