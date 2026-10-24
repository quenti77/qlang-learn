---
title: "Guide web 2 : routes et contrôleurs"
group: "Applications web"
---

# Guide web 2 : routes et contrôleurs

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
| `tasks: Tasks` | le **service** de ce type (page 3) |

Le nom du paramètre est celui utilisé dans la requête ; `#[web.Path("id")]` donne un autre nom explicitement.

```qlang-ref
#[web.Get("/tasks/:id")]
fun show(#[web.Path] id: int, who: Me, tasks: Tasks) -> Task?
  tasks.find(who.id, id)
end
```

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
fun register(#[web.Body] input: Credentials, users: Users) -> Result<User, HttpError>
  if users.by_email(input.email) != none then
    return Result<User, HttpError>.Err(HttpError { status: 409, message: "this email is already used" })
  end
  ...
end
```

## Un contrôleur en classe

Quand des routes vont ensemble (même préfixe, mêmes gardes), une **structure** les regroupe : ses méthodes
publiques annotées sont les routes.

```qlang-ref
#[web.Controller("/tasks")]
#[web.Guard("auth")]
struct TaskController
end

impl TaskController
  #[web.Get("/")]
  public fun list(self, who: Me, tasks: Tasks, #[web.Query] done: bool?) -> array<Task>
    tasks.for_user(who.id, done)
  end

  #[web.Post("/")]
  #[web.Status(201)]
  public fun create(self, #[web.Body] input: NewTask, who: Me, tasks: Tasks) -> Task
    tasks.add(who.id, input.title)
  end
end
```

```qlang-ref
app.controller(controllers.TaskController {})
```

`#[web.Controller("/tasks")]` donne le préfixe, `#[web.Guard]` sur la structure s'applique à toutes ses
méthodes. L'instance vit autant que l'application : **ce qui change à chaque requête arrive en paramètre de la
méthode** (l'utilisateur, un dépôt), pas dans des champs. Si un fournisseur sait construire le contrôleur :
`app.controller_from_container<TaskController>()`.

Fonctions ou classes ? Les deux se mélangent dans la même application ; l'exemple garde les routes de compte en
fonctions et celles des tâches en classe.

## Préfixes et groupes

`app.prefix("/api")` s'applique aux routes ajoutées **ensuite** ; on le change ou on l'efface entre deux
groupes :

```qlang-ref
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
du texte). Écris le fichier avec `fs.write_bytes(chemin, p.data)` en vérifiant le nom et la taille.

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
