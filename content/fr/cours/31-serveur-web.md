---
title: "Un serveur web"
---

# Un serveur web

Un programme qlang peut **répondre à des requêtes HTTP** : c'est ce que fait un site ou une API.
Dans un terminal, on le lance avec :

```sh
qlang serve app.q
```

Le serveur écoute sur un port (8080 par défaut), exécute le fichier **une fois**, puis appelle sa
fonction `handle` pour chaque requête reçue. Dans la page, il n'y a pas de réseau : on va donc
**appeler `handle` nous-mêmes** avec de fausses requêtes. Le code est exactement celui qu'on
mettrait dans `app.q`.

## Requête et réponse

Deux structures sont fournies, sans rien déclarer : `Request` (ce que le client envoie) et
`Response` (ce qu'on lui répond).

```qlang
let req = Request { method: "GET", url: "/hello?name=Ada", path: "/hello", query: { "name": "Ada" } }
print(req.method)
print(req.path)
print(req.query.get("name", "inconnu"))

let rep = Response { status: 200, body: "Bonjour" }
print(rep.status)
print(rep.body)
```

Dans une vraie requête, `url` est la cible telle que reçue, `path` le chemin décodé, et `query`
les paramètres décodés (`?name=Ada`). `headers` contient les en-têtes (noms en minuscules) et
`body` le corps, ou `none`.

## La fonction `handle`

`handle` prend une `Request` et renvoie une `Response`. C'est la seule chose obligatoire.

```qlang
fun handle(req: Request) -> Response
  if req.path == "/hello" then
    let name = req.query.get("name", "toi")
    Response { status: 200, body: "Bonjour {name} !" }
  else
    Response { status: 404, body: "Introuvable" }
  end
end

let r = handle(Request { method: "GET", url: "/hello?name=Ada", path: "/hello", query: { "name": "Ada" } })
print("{r.status} {r.body}")
let r2 = handle(Request { method: "GET", url: "/autre", path: "/autre" })
print("{r2.status} {r2.body}")
```

Pour ne pas répéter les champs, on écrit seulement ceux qui servent : `headers`, `body`, `path`
et `query` ont une valeur par défaut.

## Des raccourcis pour répondre

On n'a pas besoin d'écrire les en-têtes à la main : `Response` a des raccourcis.

```qlang
print(Response.text("salut").status)
print(Response.html("<h1>Titre</h1>").headers.get("Content-Type", ""))
print(Response.json("\{\"ok\": true\}").body)
print(Response.redirect("/ailleurs").status)
print(Response.not_found().status)

let creee = Response.text("fait").with_status(201).with_header("X-Id", "7")
print(creee.status)
print(creee.headers.get("X-Id", ""))
```

`with_status` et `with_header` renvoient la réponse elle-même, donc on les enchaîne.

## Garder un état

Le code **en dehors de `handle`** ne s'exécute qu'une fois, au démarrage. Ses variables vivent
tant que le serveur tourne : un compteur de visites s'écrit donc tout seul.

```qlang
let visites = 0

fun handle(req: Request) -> Response
  visites += 1
  Response.text("Visite numéro {visites}")
end

for i in 0..3 do
  let r = handle(Request { method: "GET", url: "/", path: "/" })
  print(r.body)
end
```

Si une requête provoque une erreur (un `panic`, une boucle infinie), le serveur répond
`500 Internal Server Error` **sans détail** au client, écrit le détail dans son journal, et
continue.

## Le routeur

Avec plusieurs pages, un grand `if` devient pénible. Un `Router` associe des chemins à des
fonctions. Dans un chemin, `:nom` accepte un segment et le met dans `req.params`.

```qlang
let routeur = Router.new()

routeur.get("/", fun(req: Request) -> Response
  Response.text("Accueil")
end)

routeur.get("/items/:id", fun(req: Request) -> Response
  let id = req.params.get("id", "?")
  Response.text("Objet {id}")
end)

fun handle(req: Request) -> Response
  routeur.handle(req)
end

let a = handle(Request { method: "GET", url: "/items/42", path: "/items/42" })
print("{a.status} {a.body}")
let b = handle(Request { method: "GET", url: "/", path: "/" })
print("{b.status} {b.body}")
```

Quand rien ne correspond, le routeur répond tout seul. Un chemin connu avec une autre méthode
donne `405` et l'en-tête `Allow`, un chemin inconnu donne `404` :

```qlang
let routeur = Router.new()
routeur.get("/items/:id", fun(req: Request) -> Response Response.text("lu") end)
routeur.post("/items", fun(req: Request) -> Response Response.text("créé").with_status(201) end)

fun demande(methode: string, chemin: string)
  let r = routeur.handle(Request { method: methode, url: chemin, path: chemin })
  print("{methode} {chemin} -> {r.status}")
end

demande("GET", "/items/3")
demande("POST", "/items")
demande("DELETE", "/items/3")
demande("GET", "/ailleurs")
```

Un `*` à la fin d'un chemin accepte le reste (`/fichiers/*`), et `routeur.fallback(f)` remplace
la réponse `404`.

## Le lancer pour de vrai

Enregistre le programme dans `app.q`, puis, dans un terminal :

```sh
qlang serve app.q --port 8080
curl http://127.0.0.1:8080/hello?name=Ada
```

Quelques options utiles : `--static public` sert les fichiers d'un dossier (pages HTML, CSS,
images) avant d'appeler le programme, `--workers 4` répond à plusieurs requêtes à la fois (chaque
worker a ses propres variables), `--max-steps` limite le travail par requête. Ctrl-C arrête le
serveur proprement.

Ce serveur est volontairement simple : pas de HTTPS, par exemple. Pour le mettre sur Internet,
place-le **derrière un proxy inverse** (nginx, Caddy...) et ne l'expose pas directement.

## À retenir

- `qlang serve app.q` appelle `handle(req: Request) -> Response` pour chaque requête.
- La requête donne `method`, `path`, `query`, `headers` et `body` ; la réponse, un `status`, un
  `body` et des `headers`.
- `Response.text`, `.html`, `.json`, `.redirect`, `.not_found` évitent d'écrire les en-têtes.
- Les variables hors de `handle` sont gardées d'une requête à l'autre.
- Un `Router` associe des chemins (`/items/:id`) à des fonctions et gère les erreurs `404` et `405`.
