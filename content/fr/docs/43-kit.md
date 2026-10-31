---
title: "kit : générer, tester et regarder son application"
group: "Outils"
---

# kit : générer, tester et regarder son application

`kit` est l'outil en ligne de commande du framework. Il est écrit en qlang (dépôt
[`qlang-kit`](https://github.com/quenti77/qlang-kit)) et il fait quatre choses : **générer** du code (contrôleurs,
modèles, migrations...), **lancer les tests** en surveillant les fichiers, **parcourir une base de données** et
**regarder une application qui tourne**. Les écrans sont de vraies interfaces en terminal (menus, tableaux, saisie,
souris), construites sur `Term`, le terminal de `qlang` 0.63 ou plus.

## Installer kit

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang-kit/main/install.sh | sh
kit version
```

L'installateur télécharge l'archive de la release, **vérifie sa somme de contrôle** (un téléchargement abîmé ou
remplacé est refusé) et garde chaque version dans `~/.local/share/kit/versions`. La commande `kit` qu'il pose dans
`~/.local/bin` choisit la version à lancer :

1. la variable `KIT_VERSION`, si elle existe ;
2. sinon le fichier `.kit-version` le plus proche, en remontant les dossiers ;
3. sinon la dernière version installée.

```sh
kit versions          # les versions installées
kit install 0.1.0     # en ajouter une (les autres restent)
kit use 0.1.0         # ce dossier utilise la 0.1.0 (écrit .kit-version)
kit update            # installer la dernière release
```

## Dans un projet : la même version pour tout le monde

Pour que toute l'équipe lance le même `kit`, fais-en une **dépendance du projet** :

```sh
kit init              # ajoute kit à qlang.toml et écrit kit.q
qlang install         # télécharge la version, la fixe dans qlang.lock
qlang run --allow-process kit.q -- make controller Post
```

La version est celle de `qlang.toml` (et de `qlang.lock`) : elle change quand on change la dépendance, pas quand
quelqu'un met à jour sa machine. `--allow-process` est la permission de lancer des programmes ; seul `kit test` en a
besoin (il lance `qlang test`). Avec la commande globale, `kit test` la demande tout seul et les autres commandes
tournent sans permission.

## Générer du code : kit make

```sh
kit make controller BlogPost
kit make migration create_blog_posts_table
kit make --list
```

Chaque générateur écrit un fichier à sa place et dit ce qu'il a fait :

| Type | Écrit | Remarques |
| --- | --- | --- |
| `controller` | `controllers/blog_posts.q` et son test `tests/blog_posts_test.q` | ajouté à `App.boot(...)` de `app.q` |
| `model` | `models/blog_post.q` | une structure et les requêtes qui la lisent |
| `migration` | `migrations/<date>_<nom>.q` | `create_x_table` crée la table, un autre nom donne une migration vide ; ajoutée à la liste de `migrations.q` (créé au besoin), dont `all()` donne les migrations au migrateur |
| `provider` | `providers/<nom>.q` | un service et la fonction `make_<nom>` qui le construit ; ajouté à `App.boot(...)` de `app.q` |
| `job` | `jobs/<nom>.q` | une structure et son gestionnaire |
| `middleware`, `policy`, `resource` | `middleware/`, `policies/`, `resources/` | de quoi remplir |
| `factory`, `seeder` | `factories/`, `seeders/` | pour `db:seed` |
| `command` | `commands/<nom>.q` | une commande de `cli.q` |
| `test` | `tests/<noms>_test.q` | un test HTTP de `/<noms>` |

Le nom s'écrit comme on veut (`BlogPost`, `blog_post`, `blog-post`) : kit en tire le type, le fichier, l'URL et le nom de
table (`blog_posts`, avec le pluriel anglais). Un fichier qui existe déjà **arrête** la commande avant d'écrire quoi que
ce soit, sauf avec `--force`. Quelques options :

- `--dry-run` montre ce qui serait écrit, sans rien écrire ;
- `--no-test` et `--no-register` pour un contrôleur ;
- `--no-interaction` pour ne jamais poser de question (CI).

Sans argument, `kit make` **demande** le type et le nom (texte, choix avec autocomplétion). Une réponse donnée sur la ligne
de commande est utilisée sans question ; sans terminal, une question qui n'a pas de réponse est une erreur qui dit
laquelle donner.

### Changer les gabarits

Les fichiers viennent de **gabarits** (`stubs/`). Pour en changer un, mets le tien dans le dossier `stubs/` du projet :
`stubs/controller.stub` remplace celui de kit. `kit make --publish-stubs` copie ceux de kit dans le projet pour partir
de là. Les champs sont `{{Name}}` (`BlogPost`), `{{name}}` (`blog_post`), `{{names}}`, `{{kebab}}`, `{{route}}`,
`{{table}}` et `{{id}}` ; un champ inconnu dans un gabarit est une erreur.

### L'assistant

`kit wizard` est `kit make` en plein écran : on choisit le type, on tape le nom, et on voit **avant d'écrire** la liste des
fichiers créés ou changés avec leur contenu. `t`, `r` et `f` règlent le test, l'enregistrement et le remplacement ;
`Ctrl+S` écrit.

## Lancer les tests : kit test

```sh
kit test
```

L'écran montre chaque test avec ✓ ou ✗, et pour un échec le message et le **code source autour de la ligne**. Il surveille
les fichiers `.q` : dès que l'un change, les tests repartent. `r` relance tout, `Entrée` relance le test choisi, `f` ne garde
que les échecs, `w` coupe la surveillance.

## Parcourir une base : kit db

```sh
kit db --url sqlite://app.db        # ou postgres://..., mysql://..., ou DATABASE_URL
```

À gauche les tables ; à droite quatre onglets (`1` à `4`) : les **lignes** (par pages de 50, `n` et `p`), la **structure**,
un éditeur **SQL** (`Ctrl+R` lance) et les **migrations** (appliquées, ou en attente quand un fichier de `migrations/` n'est
pas dans `schema_migrations`). L'outil **lit seulement**, sauf avec `--write`.

## Regarder l'application : kit dashboard

```sh
kit dashboard --url http://localhost:8000 --log storage/app.log
```

Il lit ce que l'application sert déjà : `/health`, `/metrics` (le format Prometheus de `web/metrics.q`) et `/openapi.json`
(`openapi_route`), plus son journal JSON (`qlang serve --log-format json`). Cinq onglets : la **vue d'ensemble** (santé,
totaux, routes les plus sollicitées, dernières erreurs), les **routes**, les **requêtes** (par route : nombre, erreurs, p50 et
p95), les **logs** (filtre par niveau et par texte) et les avertissements **N+1** du mode `--dev`.

## Réglages : kit.json

```json
{
  "theme": "sunset",
  "themes": {
    "sunset": { "base": "dark", "accent": "#ff8800", "error": "bright-red", "selection": "#334455" }
  },
  "keys": { "quit": "ctrl+q" },
  "db": { "url": "sqlite://app.db" },
  "dashboard": { "url": "http://localhost:8000", "log": "storage/app.log" }
}
```

Le fichier `kit.json` du projet et `~/.config/kit/kit.json` (le tien) sont fusionnés clé par clé, le projet l'emportant. Les
thèmes intégrés sont `dark`, `light`, `high-contrast` et `mono` (sans couleur) ; un thème à toi part de l'un d'eux. Une
couleur s'écrit `#rrggbb`, par son nom (`red`, `bright-cyan`) ou `palette:N`. Une erreur est signalée à l'endroit où elle
est (`themes.sunset.accent: ...`), et un réglage inconnu en est une aussi, pour qu'une faute de frappe ne passe pas.
`kit config` montre ce qui est en vigueur.
