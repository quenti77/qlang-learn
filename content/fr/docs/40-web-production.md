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
import "@std/web/container.q" as di

#[cli.Command("tasks:purge", "Supprime les tâches terminées")]
fun purge(tasks: Tasks, console: cli.Console, #[cli.Opt(description: "ne rien supprimer")] dry: bool) -> int
  ...
  0
end

let program = cli.Cli.new(Reflect.callables(providers).concat(di.services_of(Reflect.constructors(providers))))     -- les mêmes services que l'application
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

## Déboguer en développement

`qlang serve main.q --watch --dev` : quand ton code échoue pendant une requête, la réponse `500` est une **page
d'erreur détaillée** : le message et le code, la ligne fautive avec celles autour, la pile des appels, la requête
(sans les cookies ni les jetons) et le **SQL exécuté, avec la durée de chaque requête**. Le format suit l'en-tête
`Accept` : une page HTML pour un navigateur, du JSON pour `curl -H 'Accept: application/json'`, du texte sinon.

Une requête SQL exécutée au moins trois fois avec le même texte est le signe d'un **N+1** (une requête par ligne
au lieu d'une pour toutes) : le serveur écrit `N+1? GET /posts ran the same statement 12 times ...` dans sa sortie
d'erreur, et une réponse réussie porte `Server-Timing: db;dur=...`. Les relations de `@std/web/relations.q`
(page 3) existent pour les éviter.

La page montre le code de ton programme : `--dev` est **refusé** si `--bind` n'est pas une adresse locale (sauf
`--dev-public`), et sans `--dev` la réponse ne dit rien de plus que `Internal Server Error`.

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
| `--max-connections N`, `--max-body TAILLE`, `--max-headers TAILLE` | connexions simultanées (64), corps de requête (1 Mo), ligne et en-têtes (64 Ko) ; au-delà, `503`, `413`, `431` |
| `--read-timeout S`, `--idle-timeout S` | temps laissé pour envoyer toute la requête (20 s, sinon `408`) et silence toléré sur une connexion persistante (5 s) |
| `--no-access-log` | n'écrit pas la ligne de chaque requête |
| `--log-format json`, `--log-level` | le journal sur la sortie d'erreur, un objet JSON par ligne |
| `--dev`, `--watch` | **développement seulement** |

- **HTTPS et protection** : `qlang serve` parle HTTP, c'est un choix assumé ; mets-le derrière un proxy inverse
  (Caddy, nginx, Traefik...) qui garde le certificat et fait TLS, limite la taille des requêtes et ajoute des
  délais. Démarre qlang avec `--bind 127.0.0.1`, et fais **remplacer** `X-Forwarded-For` et `X-Forwarded-Proto` par le
  proxy (Caddy `reverse_proxy` le fait ; nginx : `proxy_set_header X-Forwarded-For $remote_addr;`
  `proxy_set_header X-Forwarded-Proto $scheme;`). Côté programme, `@std/web/proxy.q` donne `is_https(req)`,
  `client_ip(req)` et `redirect_to_https()`, et `sessions_with(secret, true)` ajoute `Secure` au cookie.
- **Envoyer un fichier** : `Response.file("rapports/mai.pdf")` (ou `Response.download(chemin, "mai.pdf")` pour
  forcer l'enregistrement) laisse le serveur lire le fichier par morceaux : un gros fichier ne remplit pas la
  mémoire et le worker est libre tout de suite. `404` s'il manque, `403` hors de `--root`. Vérifie toi-même qui a le
  droit de le télécharger, et ne fabrique jamais le chemin avec ce que le client a écrit sans le nettoyer
  (`Path.normalize`). Il n'y a pas encore de `Range` (reprise).
- **Docker** : l'image officielle `ghcr.io/quenti77/qlang` ne contient que `qlang`, tourne en utilisateur non
  root : `docker run --rm -v "$PWD":/app -p 8080:8080 ghcr.io/quenti77/qlang:latest serve main.q --bind 0.0.0.0`.
- **Mises à jour** : `qlang self-update` remplace qlang par la dernière version après avoir vérifié sa somme de
  contrôle ; `qlang = "0.65"` dans le `[package]` de `qlang.toml` refuse de démarrer avec un qlang plus ancien.
- **Configuration** par variables d'environnement (`env.get`), lue dans un fournisseur `Config` ; aucun secret dans
  le code.
- **Base** : un fichier SQLite convient à un seul serveur ; PostgreSQL ou MySQL (`Db.connect("postgres://...")`,
  `mysql://...?sslmode=...`) au-delà. Lance les migrations avec `db:migrate`, pas à chaque démarrage de chaque
  worker.
- **Erreurs** : une erreur du programme va dans le journal avec sa pile ; avec `--log-format json`, c'est **une
  ligne** `{"level":"error","message":...,"context":{"code","location","stack":[...],"method","url"}}`, sans le
  code source, que ton outil de journaux peut chercher et regrouper.
- **Journal** : `Log.info/warning/error` et les autres niveaux de PSR-3, avec un contexte JSON facultatif (`Log.error("échec", {"commande": 42})`) ; le middleware
  `logging()` écrit une ligne par requête.
- **Processus** : lance `qlang serve` sous systemd, Docker ou un équivalent qui le relance ; un déploiement
  remplace le fichier et redémarre.

## Et ensuite

La référence de chaque fonction est dans
[`API.md`](https://github.com/quenti77/qlang-std/blob/main/API.md) du paquet. Ce qui n'existe pas :
un ORM qui écrit le SQL à ta place, des tableaux de bord graphiques. Le serveur et les types (`Request`, `Response`, `Db`,
`Crypto`, `Log`) sont décrits dans la [référence du langage](../26-prelude-reseau-bases-de-donnees-et-systeme/).
