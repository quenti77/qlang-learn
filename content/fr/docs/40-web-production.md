---
title: "Guide web 5 : tester et mettre en production"
group: "Applications web"
---

# Guide web 5 : tester et mettre en production

Cette page reprend l'application des pages précédentes : `tasks.build()` (le fichier `app.q` qui monte l'application),
les types `Task`, `NewTask`, `Credentials` et le service `Tasks`. Les exemples de test ont aussi besoin d'un compte :

```qlang-ref
let ADA = Credentials { email: "ada@example.com", password: "correct horse battery" }
```

## Tester sans serveur

`@std/web/testing.q` envoie des requêtes directement à `App.handle` : pas de port, pas de socket, le même code
que pour une vraie requête (middleware, injection, validation, gardes). Le `Client` garde les cookies d'une
requête à l'autre, donc une connexion et ce qui suit se testent comme une seule visite.

```qlang-ref
-- app_test.q
import "app.q" as tasks
import "@std/web/testing.q" as testing

fun signed_in() -> testing.Client
  let client = testing.Client.new(tasks.build())
  client.post_json("/register", ADA).expect_status(201)
  client.post_json("/login", ADA).expect_status(200)
  client
end

fun test_a_user_creates_and_lists_tasks()
  let client = signed_in()
  let made = client.post_json("/tasks", NewTask { title: "Write the guide" }).expect_status(201)
  assert_eq(made.json<Task>().unwrap().title, "Write the guide")
  assert_eq(client.get("/tasks").json<array<Task>>().unwrap().len(), 1)
end

fun test_private_routes_need_a_login()
  testing.Client.new(tasks.build()).get("/tasks").expect_status(401)
end
```

```sh
qlang test                      # tous les fichiers *_test.q
qlang test app_test.q --filter login
```

| Méthode du client | Fait |
| --- | --- |
| `get(chemin)`, `delete(chemin)` | une requête sans corps ; un `?a=1` dans le chemin est lu comme le serveur le lit |
| `post(chemin, texte)`, `put`, `patch` | avec un corps texte |
| `post_json(chemin, valeur)`, `put_json` | le corps est le JSON de la valeur (`Json.of`) |
| `post_form(chemin, {"champ": "valeur"})` | un formulaire HTML |
| `header(nom, valeur)`, `bearer(jeton)` | en-têtes envoyés avec toutes les requêtes suivantes |
| `forget_cookies()` | oublie les cookies (un autre visiteur) |

La réponse (`Reply`) : `status`, `headers`, `body`, `cookies`, `header(nom)`, `json<T>()` et les vérifications
`expect_status(code)` et `expect_body_contains(texte)`, qui arrêtent le test avec le corps de la réponse et rendent
la réponse pour chaîner.

Chaque test construit **sa propre application** (`tasks.build()`) : avec `sqlite://:memory:`, chaque test a donc
sa base vide. Pour remplacer un service, `app.container.set(faux)` avant la première requête.

## Des commandes, à côté du serveur

Migrations, import de données, tâche planifiée : ce sont des **commandes**, avec les mêmes fournisseurs que
l'API. `@std/cli.q` :

```qlang-ref
import "@std/cli.q" as cli

#[cli.Command("tasks:purge", "Supprime les tâches terminées")]
fun purge(tasks: Tasks, console: cli.Console, #[cli.Opt(description: "ne rien supprimer")] dry: bool) -> int
  ...
  0
end

let program = cli.Cli.new(Reflect.callables(providers))     -- les mêmes services que l'application
program.named("tasks")
program.add(Reflect.callables(commands))
program.main()
```

```sh
qlang run console.q -- tasks:purge --dry
qlang run console.q -- help
```

`@std/web/commands.q` apporte `routes:list`, `db:migrate`, `db:rollback`, `db:status` et `locale:missing`. Un
paramètre `#[cli.Arg]` est un mot de la ligne, `#[cli.Opt]` une option (un `bool` est un drapeau),
`console` écrit et lit (`line`, `error`, `table`, `ask`, `confirm`), le reste vient du conteneur. Le code de sortie est
celui que la commande rend (`0` si rien) ; `Cli.run(args, Console.captured([]))` teste une commande.

## La documentation de l'API

`@std/web/openapi.q` décrit les routes (chemins, paramètres, corps, types rendus, règles de validation) en
OpenAPI 3.1, lu dans les annotations et les types :

```qlang-ref
import "@std/web/openapi.q" as oa

oa.openapi_route(app, "/openapi.json", "Tasks", "1.0.0")      -- GET /openapi.json
```

`#[web.Doc("Liste les tâches")]` et `#[web.Tag("tâches")]` ajoutent un résumé et un groupe. Colle le document
dans un outil comme Swagger UI ou Redoc, ou génère un client.

## Traductions

`@std/i18n.q` : un fichier JSON par langue, des `{nom}` à remplir, des pluriels, le repli `fr-CA` → `fr` → langue
par défaut → la clé. Côté web, `use_locale(app, traducteur, ["en", "fr"])` (`@std/web/locale.q`) choisit la langue de
chaque requête (`?lang=`, cookie, `Accept-Language`) et donne un paramètre `lang: i18n.Lang` aux routes. Voir la page
« Applications web » pour le détail. Les messages de validation du paquet restent en anglais.

## Événements et cache

- `@std/web/events.q` : `events.listen<TaskDone>(fun(e: TaskDone) ... end)` puis `events.dispatch(TaskDone { ... })`,
  pour que l'envoi d'un mail ou une statistique ne soit pas écrit dans la route. Les écouteurs tournent dans la
  requête, dans l'ordre ; il n'y a pas de file d'attente.
- `@std/web/cache.q` : `Cache.memory()` (par worker), `Cache.files(dossier)` (la machine) ou `Cache.redis(redis, "app:")` (toutes
  les machines), `cache.remember<T>(clé, secondes, fonction)`, `cache.increment(clé, secondes)` (un compteur, atomique
  avec Redis).

## Mettre en production

```sh
TASKS_DB=sqlite://tasks.db TASKS_SECRET=... \
  qlang serve main.q --bind 127.0.0.1 --port 8080 --workers 4 --compress --log-format json
```

| Option | Rôle |
| --- | --- |
| `--workers N` | N workers (1 à 64, un par défaut) ; ils ne partagent rien : base en fichier ou serveur, sessions en cookie |
| `--bind`, `--port` | l'adresse ; derrière un proxy, `127.0.0.1` |
| `--compress` | gzip des réponses texte |
| `--static DIR` | sert les fichiers statiques d'un dossier |
| `--max-steps N`, `--max-memory MB` | bornes contre un programme qui s'emballe |
| `--log-format json`, `--log-level` | le journal sur la sortie d'erreur, un objet JSON par ligne |
| `--dev`, `--watch` | **développement seulement** |

- **HTTPS et protection** : `qlang serve` parle HTTP ; mets-le derrière un proxy inverse (nginx, Caddy...) qui fait
  TLS, limite la taille des requêtes et ajoute des délais. Active alors `sessions_with(secret, true)`.
- **Configuration** par variables d'environnement (`env.get`), lue dans un fournisseur `Config` ; aucun secret dans
  le code.
- **Base** : un fichier SQLite convient à un seul serveur ; PostgreSQL ou MySQL (`Db.connect("postgres://...")`,
  `mysql://...?sslmode=...`) au-delà. Lance les migrations avec `db:migrate`, pas à chaque démarrage de chaque
  worker.
- **Journal** : `Log.info/warning/error` et les autres niveaux de PSR-3, avec un contexte JSON facultatif (`Log.error("échec", {"commande": 42})`) ; le middleware
  `logging()` écrit une ligne par requête.
- **Processus** : lance `qlang serve` sous systemd, Docker ou un équivalent qui le relance ; un déploiement
  remplace le fichier et redémarre.

## Et ensuite

La référence de chaque fonction est dans
[`API.md`](https://github.com/quenti77/qlang-std/blob/main/API.md) du paquet. Ce qui n'existe pas :
un ORM qui écrit le SQL à ta place, des tableaux de bord graphiques. Le serveur et les types (`Request`, `Response`, `Db`,
`Crypto`, `Log`) sont décrits dans la [référence du langage](../26-prelude-reseau-bases-de-donnees-et-systeme/).
