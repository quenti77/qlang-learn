---
title: "Guide web 2 : routes et contrôleurs"
group: "Applications web"
---

# Guide web 2 : routes et contrôleurs

## Les données de cette page

Les exemples de cette page n'ont besoin de rien d'autre que quatre petites structures et deux tableaux en mémoire à la
place d'une base de données (la base arrive page 3, les comptes et les mots de passe page 4) :

```qlang-ref
struct Task
  public id: int
  public title: string
  public done: bool
end

struct NewTask
  public title: string
end

struct Credentials
  public email: string
  public password: string
end

struct User
  public id: int
  public email: string
end

let tasks: array<Task> = []
let users: array<User> = []
```

Les routes ci-dessous lisent et modifient ces tableaux ; ils sont perdus à l'arrêt du serveur, ce qui suffit pour
apprendre les routes.

## Les annotations de route

| Annotation | Sert à |
| --- | --- |
| `#[web.Get("/p")]`, `Post`, `Put`, `Patch`, `Delete` | la méthode et le chemin ; `:id` est un paramètre du chemin |
| `#[web.Route("/p", method: "OPTIONS")]` | une autre méthode |
| `#[web.Status(201)]` | le statut d'une réponse réussie (200 par défaut) |
| `#[web.Guard("auth")]` | une garde à passer d'abord (page 4) |
| `#[web.Doc("Résumé")]`, `#[web.Tag("tâches")]` | la documentation OpenAPI (page 5) |

## D'où viennent les paramètres

Chaque paramètre de la fonction est rempli d'après son annotation. Le type compte : la valeur est **lue comme
ce type** (`int`, `float`, `bool`, `uuid`, `datetime`, nullable...) ; si elle ne convient pas, le client reçoit
`400` avec le détail.

| Paramètre | Rempli avec |
| --- | --- |
| `#[web.Path] id: int` | le `:id` du chemin |
| `#[web.Query] done: bool?` | `?done=true` ; `none` s'il manque (le type doit être nullable, sinon `400`) |
| `#[web.Body] input: NewTask` | le corps, **JSON ou formulaire**, lu comme ce type, puis validé (`422` avec le détail) |
| `#[web.Header("X-Token")] token: string` | un en-tête |
| `#[web.CookieValue("sid")] sid: string?` | un cookie |
| `req: Request` | la requête elle-même (`req.method`, `req.headers`, `req.cookies`, `req.raw`...) |
| `tasks: Tasks` | un **service** : une valeur que l'application construit pour toi (une base, un dépôt, l'utilisateur connecté). Voir la page 3 ; cette page n'en a pas besoin |

Le nom du paramètre est celui utilisé dans la requête ; `#[web.Path("id")]` donne un autre nom explicitement.

```qlang-ref
#[web.Get("/tasks/:id")]
fun show(#[web.Path] id: int) -> Task?
  for t in tasks do
    if t.id == id then
      return t
    end
  end
  none
end
```

`GET /tasks/7` rend la tâche en JSON, ou `404` si la fonction rend `none`, ou `400` si l'identifiant n'est pas un entier.

## Ce que la fonction rend

| Valeur rendue | Réponse |
| --- | --- |
| une `Response` | telle quelle (page « Réponses » plus bas) |
| une `string` | du texte brut |
| une structure, un tableau, un nombre... | du JSON (`200`, ou le `#[web.Status]`) |
| `none` (type `T?`) | `404` |
| rien | `204` |
| `Result<T, E>` | l'`Ok` comme ci-dessus ; l'`Err` comme une erreur |

Pour une erreur, `HttpError { status: 409, message: "..." }` donne ce statut ; une `Error` ordinaire est un
`500` dont le détail va dans le journal, **jamais au client**. Le corps d'une erreur est toujours le même :

```
{"error":{"status":409,"message":"this email is already used","details":[]}}
```

`details` contient, pour un `422`, un élément par champ refusé : `{"field": "title", "message": "..."}`.

```qlang-ref
#[web.Post("/register")]
#[web.Status(201)]
fun register(#[web.Body] input: Credentials) -> Result<User, HttpError>
  for u in users do
    if u.email == input.email then
      return Result<User, HttpError>.Err(HttpError { status: 409, message: "this email is already used" })
    end
  end
  let user = User { id: users.len() + 1, email: input.email }
  users.push(user)
  Result<User, HttpError>.Ok(user)
end
```

(Cette route ne garde pas le mot de passe : un mot de passe ne se stocke jamais tel quel, la page 4 montre comment
le hacher.)

## Un contrôleur en classe

Quand des routes vont ensemble (même préfixe, mêmes gardes), une **structure** les regroupe : ses méthodes
publiques annotées sont les routes.

```qlang-ref
#[web.Controller("/tasks")]
struct TaskController
end

impl TaskController
  #[web.Get("/")]
  public fun list(self, #[web.Query] done: bool?) -> array<Task>
    tasks.filter(fun(t: Task) -> bool done == none or t.done == done end)
  end

  #[web.Post("/")]
  #[web.Status(201)]
  public fun create(self, #[web.Body] input: NewTask) -> Task
    let task = Task { id: tasks.len() + 1, title: input.title, done: false }
    tasks.push(task)
    task
  end
end
```

```qlang-ref
app.controller(TaskController {})
```

`#[web.Controller("/tasks")]` donne le préfixe (`GET /tasks`, `POST /tasks`). Une annotation `#[web.Guard("auth")]` sur la
structure s'appliquerait à toutes ses méthodes (les gardes sont l'objet de la page 4). L'instance vit autant que
l'application : **ce qui change à chaque requête arrive en paramètre de la méthode**, jamais dans des champs. Quand
les routes auront des services (page 3), le contrôleur les recevra de la même façon, et un fournisseur saura le construire :
`app.controller_from_container<TaskController>()`.

**Un `s` de différence** : `app.controllers(Reflect.callables(module))` (pluriel) ajoute les **fonctions** d'un module qui
portent une annotation de route ; `app.controller(instance)` (singulier) ajoute les méthodes d'**un** contrôleur, une
instance de structure. Donner un tableau à la version singulière s'arrête sur un message qui le dit.

Fonctions ou classes ? Les deux se mélangent dans la même application ; l'exemple complet (`examples/tasks` du paquet)
garde les routes de compte en fonctions et celles des tâches en classe.

## Préfixes et groupes

`app.prefix("/api")` s'applique aux routes ajoutées **ensuite** ; on le change ou on l'efface entre deux
groupes :

```qlang-ref
import "api_routes.q" as api_routes          -- un fichier qui contient des fonctions annotées

app.prefix("/api")
app.controllers(Reflect.callables(api_routes))
app.prefix("")
app.get("/health", fun(req: Request) -> Response Response.text("ok") end)
```

Pour ce qui est commun à un groupe (une authentification, un contrôle de droits), utilise une **garde**
(page 4) plutôt qu'un préfixe.

`app.get(chemin, fonction)`, `post`, `put`, `patch`, `delete` ajoutent aussi une route à partir d'une simple
fonction `fun(Request) -> Response`, sans injection.

## Les réponses

Une route peut rendre une `Response` pour tout contrôler :

```qlang-ref
#[web.Get("/old")]
fun old() -> Response
  Response.redirect("/new")                       -- 302 avec Location
end

#[web.Get("/page")]
fun page() -> Response
  Response.html("<h1>Bonjour</h1>")
end

#[web.Get("/export")]
fun export() -> Response
  let res = Response.text("a,b\n1,2")
  res.headers["Content-Type"] = "text/csv"
  res.headers["Content-Disposition"] = "attachment; filename=\"data.csv\""
  res.with_cookie(Cookie { name: "seen", value: "1", max_age: 60 })
end
```

`Response.json(texte)`, `Response.bytes(octets, type)`, `.with_status(code)`, `.with_cookie(...)` complètent
la liste. Pour les flux (`Response.stream`, événements serveur `Response.sse`), voir la référence du langage.

## Formulaires et fichiers

- **Formulaire HTML.** `#[web.Body]` lit aussi `application/x-www-form-urlencoded` : les champs sont convertis
  en nombres ou booléens selon la structure, puis validés comme du JSON. Un champ `bool` absent vaut `false`
  (case décochée). (Un corps qui commence par `{` ou `[` reste lu comme du JSON, même avec le type que `curl -d`
  envoie par défaut.)
- **Envoi de fichier.** Prends `req: Request` et lis `req.multipart()` :

```qlang-ref
#[web.Post("/upload")]
fun upload(req: Request) -> Result<string, HttpError>
  let parts = req.multipart()
  if parts.is_err() then
    return Result<string, HttpError>.Err(HttpError { status: 400, message: "not a multipart form" })
  end
  let names: array<string> = []
  for p in parts.unwrap() do
    names.push("{p.name}:{p.filename ?? "-"}:{p.data.len()}")
  end
  Result<string, HttpError>.Ok(names.join(","))
end
```

`Part.name`, `filename` (`none` pour un champ ordinaire), `content_type` et `data` (des `bytes` ; `text()` pour
du texte). Pour ne pas tout vérifier à la main, `@std/web/upload.q` lit le formulaire et applique tes règles :

```qlang-ref
import "@std/web/upload.q" as up

#[web.Post("/avatar")]
fun avatar(req: Request) -> Result<string, web.Problem>
  let rules = up.Rules { max_size: 2097152, types: ["image/png", "image/jpeg"], required: true }
  let sent = up.receive(req, rules)
  if sent.is_err() then
    return Result<string, web.Problem>.Err(sent.unwrap_err())     -- 400, 413, 415 ou 422
  end
  let saved = sent.unwrap().files[0].save("storage/avatars")      -- nom aléatoire
  Result<string, web.Problem>.Ok(saved.unwrap())
end
```

Le **type est lu dans le contenu** du fichier (PNG, JPEG, GIF, WebP, PDF, ZIP, gzip), pas dans le `Content-Type`
que le navigateur annonce et que n'importe qui peut changer ; `save` ne reprend jamais le nom envoyé
(`../../etc/passwd`). Le corps d'une requête est borné par `qlang serve --max-body` (1 Mo par défaut :
`--max-body 20m` pour des photos). Les champs de texte du même formulaire sont dans `sent.unwrap().fields`.
Pour tester : `client.post_multipart("/avatar", {"nom": "Ada"}, [testing.TestFile { ... }])`.

## Des pages d'erreur, une 404 sur mesure

- `app.not_found(fun(req: Request) -> Response ... end)` répond quand aucune route ne convient.
- Un middleware qui réécrit les échecs pour les navigateurs :

```qlang-ref
fun pretty_errors() -> web.Middleware
  fun(req: Request, next: web.Handler) -> Response
    let res = next(req)
    let wants_html = (req.header("accept") ?? "").contains("text/html")
    if res.status >= 400 and wants_html then
      let page = Response.html("<h1>Erreur {res.status}</h1>")
      page.status = res.status
      return page
    end
    res
  end
end

app.use(pretty_errors())
```

Un middleware est une fonction `fun(req, next) -> Response` : il peut répondre à la place de la route, changer
la requête avant `next(req)` ou la réponse après. Le premier ajouté est le plus extérieur (page 4 et 5 :
`logging`, `security_headers`, `cors`, `sessions`...).

Suite : [les services et les données](../38-web-donnees/).
