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

--" Un utilisateur tel que la table le garde, avec l'empreinte du mot de passe (jamais envoyée). --"
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

--" Une tâche telle que la table la garde : SQLite range un booléen en 0 ou 1. --"
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

--" Qui fait la requête : rempli par une garde (page 4). --"
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

Les structures du début sont celles que **les pages suivantes réutilisent** : `Task` et `User` sont ce que l'API
rend, `TaskRow` et `UserRow` ce que les tables contiennent (on y revient avec la base de données), `Me` l'utilisateur
qui fait la requête (rempli par une garde, page 4), `Users` et `Tasks` les services qui parlent à la base.

```qlang-ref
let app = web.App.new(Reflect.callables(providers))
app.services(Reflect.constructors(providers))
```

Un paramètre `tasks: Tasks` d'une route reçoit le service `Tasks`, construit avec le `Db` fourni par `make_db`, qui
a reçu `Config`. Deux façons de déclarer un service :

- **une fonction** (`make_config`, `make_db`) : elle rend le service, ses paramètres sont ce dont elle a besoin. Le
  nom n'a pas d'importance, **seul le type rendu compte**. C'est pour ce qui demande du code (lire l'environnement,
  ouvrir une connexion).
- **une structure marquée `#[di.Service]`** (`Users`, `Tasks`) : ses **champs** sont ses dépendances et le conteneur
  la construit tout seul, comme l'autowiring de Laravel. Les champs peuvent rester privés.
  `app.services(Reflect.constructors(providers))` prend toutes les structures marquées d'un fichier ; une structure
  sans la marque n'est pas un service.

Pour une interface (un trait), dis laquelle des implémentations est le service :

```qlang-ref
app.bind<Mailer, ResendMailer>()      -- qui demande un `Mailer` reçoit un `ResendMailer`
```

Un test fait `app.container.set(autre)` pour en mettre une autre.

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

Il n'y a **pas d'ORM** qui cache le SQL : un « dépôt » est une structure qui regroupe les requêtes d'une table
(`Users`, `Tasks`), ce qui garde le SQL hors des routes et se remplace dans un test. Voici les deux de l'exemple, ceux
que les routes de la suite reçoivent en paramètre :

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

### Les relations, sans « N+1 »

Charger les articles de chaque utilisateur avec une requête **par utilisateur** est le piège classique. `@std/web/relations.q`
charge ce qui se rattache à une liste de lignes avec **une requête par relation**, et rend chaque ligne avec ses voisines :

```qlang-ref
import "@std/web/relations.q" as rel

let users = q.Query.table("users").all_as<User>(db).unwrap()

-- un utilisateur a plusieurs articles (une requête pour tous)
let loaded = rel.has_many<User, Post>(db, users, "id", "posts", "user_id").unwrap()
for u in loaded do
  print("{u.item.name} : {u.related.len()} article(s)")
end

-- un article appartient à un utilisateur ; un utilisateur a un profil ; plusieurs rôles par une table pivot
rel.belongs_to<Post, User>(db, posts, "user_id", "users", "id")
rel.has_one<User, Profile>(db, users, "id", "profiles", "user_id")
rel.belongs_to_many<User, Role>(db, users, "id", "role_user", "user_id", "role_id", "roles", "id")
```

Le résultat est un tableau de `With<P, R>` : `item` est la ligne de départ, `related` ce qui s'y rattache (un tableau, ou
un `O?` pour `belongs_to` et `has_one`). `has_many_where` ajoute une fonction qui règle la requête des enfants (un tri, un
filtre). Les noms sont vérifiés comme dans `Query`, et les valeurs sont toujours des `?`.

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
