---
title: "Guide web 3 : services et données"
group: "Applications web"
---

# Guide web 3 : services et données

## Les services : une fonction qui rend un `T` fournit un `T`

Un handler a besoin d'une base, d'une configuration, d'un dépôt. Plutôt que de les créer à la main, tu écris
des **fournisseurs** : des fonctions dont le type de retour est le service et dont les paramètres sont ses
besoins. Le conteneur les trouve par le type, construit chaque service la première fois qu'on le demande et
vérifie tout le graphe avant la première requête.

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

Un paramètre `tasks: Tasks` d'une route reçoit le service construit par `make_tasks`, qui a reçu `Db`, qui a
reçu `Config`. Le nom des fonctions n'a pas d'importance, **seul le type rendu compte**.

### Durées de vie

| Annotation | Le service est construit |
| --- | --- |
| (rien) | une fois pour l'application (*singleton*) |
| `#[di.Scoped]` | une fois **par requête** |
| `#[di.Transient]` | à chaque fois qu'on le demande |

(avec `import "@std/web/container.q" as di`). Un service qui dépend de la requête (l'utilisateur connecté) est
`Scoped` ; un singleton ne peut pas dépendre d'un service `Scoped` : `app.validate()` le signale.

```qlang-ref
#[di.Scoped]
fun make_me(req: Request) -> Me
  let held = req.attrs["me"]
  let me = if held == none then none else held.as<Me>() end
  me ?? Me { id: 0, email: "" }
end
```

`Request` est toujours disponible comme service. `req.attrs` est un sac de valeurs que les gardes et les
middleware remplissent pour la suite de la requête.

### Les pièges des fournisseurs

- **Toutes les fonctions de premier niveau du fichier sont des fournisseurs** (`Reflect.callables` les prend
  toutes). Une fonction utilitaire qui rend un type (`fun to_task(row: TaskRow) -> Task`) deviendrait un
  fournisseur de `Task` : mets-la dans un `impl` (`row.to_task()`) ou dans un fichier qui n'est pas passé au
  conteneur.
- **Deux fournisseurs du même type** : le dernier gagne ; garde un seul fournisseur par type, ou fais des types
  distincts (`struct ReadDb`, `struct WriteDb`).
- **Un test remplace un service** par `app.container.set(valeur)`.
- `app.container.get<Tasks>()` donne un service hors d'une route (dans une garde, une commande).

## La base de données

`Db.connect("sqlite://tasks.db")`, `postgres://...` et `mysql://...` donnent un `Db` ; `db.query(sql, [Json.number(1.0)])`
lit, `db.execute(sql, [...])` écrit : les valeurs (des `Json`) passent toujours par des `?`. Pour ne pas écrire de SQL
pour le courant, `@std/web/query.q` fournit un **constructeur de requêtes** :

```qlang-ref
import "@std/web/query.q" as q

q.Query.table("tasks").where("user_id", "=", 1).where("done", "=", 0).order_by("id", "asc").all_as<TaskRow>(db)
q.Query.table("tasks").where("id", "=", 3).first_as<TaskRow>(db)             -- Result<TaskRow?, Error>
q.Query.table("tasks").insert(db, { "title": Json.string("Écrire"), "user_id": Json.number(1.0) })
q.Query.table("tasks").where("id", "=", 3).update(db, { "done": Json.number(1.0) })
q.Query.table("tasks").where("id", "=", 3).delete(db)
```

Les valeurs ne sont jamais dans le texte SQL, et les noms de table, de colonne et les opérateurs sont vérifiés :
une erreur, jamais une injection. `all_as<T>` lit chaque ligne comme une structure `T` : les noms des champs sont
ceux des colonnes.

Un piège de lecture :

- **SQLite range un booléen en entier** (0 ou 1). Lis la colonne dans une structure avec `done: int`, puis
  convertis (`row.done != 0`) : l'exemple a un `TaskRow` pour cela et une méthode `to_task()`.

Il n'y a **pas d'ORM** avec des relations : un « dépôt » est une structure qui regroupe les requêtes d'une
table (`Users`, `Tasks`), ce qui garde le SQL hors des routes et se remplace dans un test.

## Les migrations

Une migration est un identifiant (trié : commence par un numéro) et le SQL qui applique ou défait le
changement. Elles s'exécutent dans une transaction et sont mémorisées dans la table `schema_migrations` :
une migration appliquée ne se rejoue jamais.

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

L'exemple migre au démarrage (pratique avec SQLite). Pour une base partagée, préfère les commandes
`db:migrate`, `db:rollback` et `db:status` de la page 5, lancées par toi plutôt que par chaque worker.

## La validation

Les règles sont des **annotations sur les champs** de la structure du corps ; elles sont vérifiées avant que ta
fonction ne s'exécute, et `422` donne un détail par champ.

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

| Règle | Veut dire |
| --- | --- |
| `NotBlank`, `Required` | pas vide (texte) ; pas `none` |
| `Length(min, max)` | longueur d'un texte ou d'un tableau (`max: -1` : sans limite) |
| `Min(n)`, `Max(n)` | bornes d'un nombre |
| `Email`, `Pattern("regex")`, `OneOf(["a", "b"])` | forme d'un texte |
| `Valid` | vérifie la structure (ou chaque structure du tableau) que porte le champ |

Un champ `none` n'est pas vérifié (ajoute `Required` pour l'interdire). Tes règles : `app.rule("Slug", fun(a:
AnnotationInfo, valeur: Any) -> string? ... end)` rend le message si la valeur est mauvaise, sinon `none`, et
`#[Slug]` marche comme les autres. `app.validate_bodies(false)` coupe la vérification.

Suite : [comptes et sécurité](../39-web-securite/).
