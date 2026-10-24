---
title: "Guide web 1 : démarrer"
group: "Applications web"
---

# Guide web 1 : démarrer

Ce guide construit pas à pas une petite API de **liste de tâches** avec des comptes, des mots de passe, des
sessions et des routes protégées. Chaque morceau de code vient de l'exemple
[`examples/tasks`](https://github.com/quenti77/qlang-std/tree/main/examples/tasks) du paquet `qlang-std`, qui a
ses tests : ce que tu lis marche.

| Page | Sujet |
| --- | --- |
| 1. Démarrer (celle-ci) | le projet, l'installation, la première route |
| [2. Routes et contrôleurs](../37-web-routes/) | paramètres, réponses, contrôleurs, formulaires, fichiers, erreurs |
| [3. Services et données](../38-web-donnees/) | injection, base de données, migrations, validation |
| [4. Comptes et sécurité](../39-web-securite/) | mots de passe, sessions, gardes, CSRF, CORS, limitation de débit |
| [5. Tester et mettre en production](../40-web-production/) | tests, commandes, OpenAPI, traductions, `qlang serve` en production |
| [6. Temps réel et tâches de fond](../41-web-temps-reel/) | WebSocket, file de tâches |

Pour le contexte (PHP, Laravel, Symfony...) : un framework web de qlang est **un paquet écrit en qlang**,
pas une partie du langage. `qlang serve` lit les requêtes HTTP et appelle ta fonction
`handle(req: Request) -> Response` ; le paquet `web` y ajoute les routes, l'injection de dépendances et le
reste. Tu as besoin de `qlang` 0.55 ou plus.

## Créer le projet

```sh
mkdir tasks && cd tasks
qlang init .
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.9.0
```

`qlang init` crée `qlang.toml` ; `qlang add` y inscrit la dépendance `std` et la télécharge (les fichiers sont
dans `.qlang/packages`, la version exacte dans `qlang.lock`). On l'importe ensuite par `@std/...` :

```qlang-ref
import "@std/web/app.q" as web
```

## L'organisation

Il n'y a pas de dossier imposé. Celle de l'exemple, qui marche bien :

```
tasks/
  qlang.toml
  main.q            -- ce que `qlang serve` lance : une fonction handle
  app.q             -- build() : assemble l'application (les tests l'appellent aussi)
  providers.q       -- les services : configuration, base, dépôts
  controllers.q     -- les routes
  app_test.q        -- les tests
```

La séparation `main.q` / `app.q` compte : `main.q` démarre un serveur, `app.q` construit une application
qu'un test peut aussi utiliser sans ouvrir de port.

## Une première route

Une route est une **fonction** marquée d'une annotation. Ses paramètres disent d'où viennent leurs valeurs ;
ce qu'elle rend devient la réponse.

```qlang-ref
-- controllers.q
import "@std/web/app.q" as web

struct Health
  public status: string
end

#[web.Get("/health")]
fun health() -> Health
  Health { status: "ok" }
end
```

Une structure rendue devient du JSON. On assemble l'application :

```qlang-ref
-- app.q
import "@std/web/app.q" as web
import "controllers.q" as controllers

fun build() -> web.App
  let app = web.App.new([])
  app.controllers(Reflect.callables(controllers))
  app
end

export build
```

`Reflect.callables(controllers)` donne toutes les fonctions du fichier ; `app.controllers` garde celles qui
portent une annotation de route. Enfin `main.q`, que `qlang serve` appelle :

```qlang-ref
-- main.q
import "app.q" as tasks

let app = tasks.build()

let problems = app.validate()       -- services manquants, cycles, routes cachées : avant toute requête
if not problems.is_empty() then
  for p in problems do
    Log.error(p)
  end
  panic("the application is not wired correctly")
end

fun handle(req: Request) -> Response
  app.handle(req)
end
```

```sh
qlang serve main.q --dev --watch
curl localhost:8080/health          # {"status":"ok"}
```

- `--dev` montre l'erreur du programme dans la réponse `500` (jamais en production).
- `--watch` recharge le programme quand un fichier change.
- Le code en haut de `main.q` s'exécute une fois au démarrage (dans chaque worker) ; `handle` à chaque requête.

## Les pièges du début

- **Les annotations s'écrivent avec le nom du module** : `web.Get`, `web.Post`... (`Post` et `Delete` sont des
  noms de modèles trop courants pour être pris).
- **Ce qui passe d'un fichier à l'autre s'exporte** : `export build`, `export Credentials, NewTask`.
- **`{` dans une chaîne ouvre une interpolation** : écris `\{` pour une accolade littérale (JSON dans un
  test, par exemple).
- **Les champs sont privés par défaut** : un champ lu ou écrit hors de son fichier est `public`.
- **Plusieurs workers, plusieurs mémoires** : `qlang serve --workers 4` lance quatre workers (un par défaut)
  qui ne partagent rien. Une base `sqlite://:memory:` est alors différente dans chacun ; pour de vrai, utilise un
  fichier (`sqlite://tasks.db`) ou PostgreSQL/MySQL. Page 5.

Suite : [les routes et les contrôleurs](../37-web-routes/).
