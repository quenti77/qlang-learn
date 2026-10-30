---
title: "Guide web 4 : comptes et sécurité"
group: "Applications web"
---

# Guide web 4 : comptes et sécurité

Cette page ajoute les comptes à l'API de tâches : s'inscrire, se connecter, rester connecté, et protéger des
routes. Elle reprend les types et les services de la page 3 (`User`, `UserRow`, `Users`, `Me`, `Credentials`) et
ces importations :

```qlang-ref
import "@std/web/app.q" as web
import "@std/web/session.q" as session
```

## Les mots de passe

Ne range jamais un mot de passe : range son **empreinte**. `Password` (Argon2id, avec un sel au hasard) est dans
le langage :

```qlang-ref
let hash = Password.hash("correct horse battery").unwrap()     -- "$argon2id$v=19$m=19456,t=2,p=1$..."
Password.verify("correct horse battery", hash).unwrap()        -- true
Password.needs_rehash(hash).unwrap()                           -- true si les réglages ont vieilli
```

L'inscription hache et range ; la connexion vérifie, avec **le même message** pour un email inconnu et un
mauvais mot de passe (ne dis pas lequel des deux) :

```qlang-ref
#[web.Post("/login")]
fun login(#[web.Body] input: Credentials, users: Users, req: Request) -> Result<User, HttpError>
  let row = users.by_email(input.email)
  let refused = HttpError { status: 401, message: "wrong email or password" }
  if row == none then
    return Result<User, HttpError>.Err(refused)
  end
  let ok = Password.verify(input.password, row.password_hash)
  if ok.is_err() or not ok.unwrap() then
    return Result<User, HttpError>.Err(refused)
  end
  let s = session.session_of(req)
  s.set("user", "{row.id}")
  Result<User, HttpError>.Ok(User { id: row.id, email: row.email })
end
```

La structure rendue au client (`User`) n'a pas le champ `password_hash` : `Json.of` n'écrit que ce qui est dans la
structure rendue. Garde une structure pour la ligne de base (`UserRow`) et une pour ce qui sort (`User`).

## Les sessions

`@std/web/session.q` garde ce que l'utilisateur a fait (qui est connecté, un message à montrer une fois) dans un
**cookie signé** : pas de stockage côté serveur, donc rien à partager entre les workers. Le navigateur ne peut pas
le modifier (il est signé), mais il peut le lire : n'y mets pas de secret. Il est limité à environ 3 Ko.

```qlang-ref
import "@std/web/session.q" as session

app.use(session.sessions(config.secret))        -- un secret long, connu du serveur seul
```

Dans une route : `session.session_of(req)` donne la session, avec `get(clé)`, `set(clé, valeur)`, `remove`,
`clear()` (déconnexion), `flash_set(message)` / `flash()` (un message pour la requête suivante) et
`csrf_token()`. Les changements sont écrits dans le cookie `qs` par le middleware (`HttpOnly`, `SameSite=Lax`).
**Derrière HTTPS**, utilise `session.sessions_with(secret, true)` pour ajouter l'attribut `Secure`.

- **Elle expire.** Le cookie signé porte sa propre date de fin : une session sans activité pendant deux heures est
  oubliée, et un vieux cookie copié ne marche plus. `session.sessions_using(secret, session.Options { secure: true,
  lifetime: 1800, same_site: "Strict" })` choisit la durée (en secondes), `Secure` et `SameSite`.
- **Change d'identité à la connexion.** Appelle `s.regenerate()` quand l'utilisateur se connecte ou se déconnecte :
  le jeton CSRF et l'identifiant (`s.id()`) changent, donc ceux vus avant ne servent plus (fixation de session).
- **Redonner ce qu'il a tapé.** Après une erreur de validation : `s.flash_input(form)` puis une redirection ;
  la page du formulaire lit `s.old("titre")` (une seule fois ; les champs `password...` ne sont jamais gardés).

- **Côté serveur, quand le cookie ne suffit plus.** `session.Options { store: ... }` garde les données sur le
  serveur, dans n'importe quel `cache.Store` : une base de données (`cache.DbStore.new(db, "sessions")`, à
  installer une fois avec `install()`) ou Redis (`cache.RedisStore.new(redis, "app:")`). Le cookie ne porte plus
  qu'un identifiant aléatoire signé : pas de limite de taille, déconnexion immédiate partout (`clear()` efface la
  ligne), et `regenerate()` retire vraiment l'ancien identifiant. Tous les workers voient les mêmes sessions.

```qlang-ref
import "@std/web/cache.q" as cache

let store = cache.DbStore.new(db, "sessions")
app.use(session.sessions_using(config.secret, session.Options { store: store, secure: true }))
```

Le secret vient de l'environnement (`TASKS_SECRET`), jamais du code ; le changer déconnecte tout le monde.

## Les gardes : protéger des routes

Une **garde** est une fonction qui reçoit la requête et rend `none` pour la laisser passer, ou une réponse pour
l'arrêter. On la nomme une fois, puis on l'applique par annotation :

```qlang-ref
app.guard("auth", fun(req: Request) -> Response?
  let id = int.parse(session.session_of(req).get("user") ?? "")
  if id == none then
    return web.Problem { status: 401, message: "sign in first" }.to_response()
  end
  let users = app.container.get<Users>().unwrap()
  let row = users.by_id(id)
  if row == none then
    return web.Problem { status: 401, message: "sign in first" }.to_response()
  end
  req.attrs["me"] = Any.of(Me { id: row.id, email: row.email })
  none
end)
```

```qlang-ref
#[web.Get("/me")]
#[web.Guard("auth")]
fun me(who: Me) -> Me
  who
end
```

- `#[web.Guard("auth")]` se met sur une fonction, une méthode, ou **sur toute une structure contrôleur**.
- On peut en empiler plusieurs (`#[web.Guard("auth")]` puis `#[web.Guard("admin")]`) : elles passent dans l'ordre.
- La garde peut aussi rediriger (`Response.redirect("/login")`) pour une application à pages.
- Ce qu'elle apprend (l'utilisateur) va dans `req.attrs` ; le service `Me` (`Scoped`, page 3) le redonne aux
  routes, qui n'ont plus à connaître la session.
- `app.validate()` signale une garde annotée mais jamais définie.

Les routes **sans** garde (`/health`, `/register`, `/login`) sont publiques : c'est ce qui sépare le public du
privé, pas un préfixe.

Pour des **droits** (admin, propriétaire) : une deuxième garde ou un test dans la route avec un
`HttpError { status: 403, ... }`. Pour vérifier qu'une ressource appartient à l'utilisateur, filtre par
`user_id` dans le dépôt (comme `tasks.find(who.id, id)`) : une tâche d'un autre est alors un simple `404`.

## Jetons (JWT) pour les clients qui ne sont pas des navigateurs

Une application mobile, une application web monopage ou un autre serveur n'utilisent pas de cookie : ils envoient un
**jeton** dans l'en-tête `Authorization: Bearer ...`. `@std/jwt.q` le signe et le vérifie, `@std/web/auth.q` en fait une
garde.

```qlang-ref
import "@std/jwt.q" as jwt
import "@std/web/auth.q" as auth

struct Session
  public sub: string
  public email: string
  public iat: int
  public exp: int
end

-- émettre : un jeton de 15 minutes contre un email et un mot de passe
let now = time.now() div 1000
let signed = jwt.sign(Session { sub: "{row.id}", email: row.email, iat: now, exp: now + 900 }, jwt.Key.hs256(config.secret))

-- vérifier : une garde, puis les revendications dans la route
app.guard("jwt", auth.jwt_guard([jwt.Key.hs256(config.secret)], jwt.Options {}))
app.guard("admin", auth.scope_guard(["admin"]))
```

```qlang-ref
#[web.Get("/api/me")]
#[web.Guard("jwt")]
fun api_me(req: Request) -> Session?
  auth.claims_of<Session>(req)
end
```

Ce que la vérification contrôle, dans l'ordre : la forme ; **l'algorithme est celui de *tes* clés** (jamais ce que le
jeton demande : `none` est refusé, et une clé publique ne sert jamais de secret HMAC) ; la signature, avec la clé que
désigne le `kid` de l'en-tête ; `exp` et `nbf` (avec `leeway` secondes de marge) ; `iss` et `aud` si tu les demandes.
Un jeton sans `exp` est refusé. Un secret HMAC de moins de 32 caractères est refusé aussi. Une garde qui refuse répond
`401` avec `WWW-Authenticate: Bearer` (`403` et `insufficient_scope` pour `scope_guard`) et ne dit pas pourquoi.

- **Clés asymétriques.** `jwt.Key.rs256(pem)`, `es256`, `eddsa`... : on **signe** avec la clé privée (PKCS#8,
  `BEGIN PRIVATE KEY`) et on **vérifie** avec la publique (PEM ou JWK).
- **Le fournisseur d'identité** (Auth0, Keycloak, Google) publie ses clés : `auth.fetch_jwks(url, cache, 3600)` les lit une
  fois par heure et le `kid` de chaque jeton choisit la bonne. Donne-les à `auth.jwt_guard(keys, jwt.Options { issuer:
  "https://...", audience: "mon-api" })`.
- **Un JWT est signé, pas chiffré** : n'importe qui lit son contenu. Mets-y peu de choses, une durée courte (quelques
  minutes) et renouvelle-le avec un *jeton de rafraîchissement* que tu gardes dans ta base : tu peux le révoquer, ce que
  tu ne peux pas faire d'un JWT déjà émis.
- **Algorithmes.** `hs256`, `hs384`, `hs512` (secrets d'au moins 32, 48 et 64 caractères), `rs256/384/512`,
  `ps256/384/512` (RSA-PSS, recommandé à la place de RS) et `es256/384`, `eddsa`. HS384, HS512 et PS demandent `qlang` 0.55.

### Jetons de rafraîchissement

`@std/web/refresh.q` garde les jetons de rafraîchissement dans ta base (un **hachage**, jamais le jeton) et les **fait
tourner** : chaque usage donne un nouveau jeton et brûle l'ancien. Si un jeton brûlé revient (il a été volé), toute la
session est fermée.

```qlang-ref
import "@std/web/refresh.q" as rf

let refresh = rf.Refresh.new(db)
refresh.install().unwrap()

-- à la connexion : un jeton d'accès (15 min) et un jeton de rafraîchissement (30 jours)
let first = refresh.issue("{row.id}").unwrap()

-- sur POST /token/refresh
let next = refresh.rotate(body.refresh_token)
if next.is_err() then
  return Response.json("\{\"error\": \"login\"\}").with_status(401)    -- invalid, expired ou reused
end
-- signer un nouveau JWT pour next.unwrap().user, rendre next.unwrap().token
```

`revoke(jeton)` ferme une session, `revoke_user(id)` toutes celles d'un utilisateur (changement de mot de passe) et
`purge()` supprime les jetons expirés.

## CSRF

Un navigateur envoie les cookies tout seul, même depuis le site d'un autre : pour une application à **pages et
formulaires** (pas pour une API appelée avec un jeton), ajoute `app.use(session.csrf_protect())`. Elle refuse
(`403`) un `POST`, `PUT`, `PATCH` ou `DELETE` qui ne répète pas le jeton de la session dans l'en-tête
`X-CSRF-Token` ou le champ de formulaire `_csrf` (aussi dans un formulaire avec fichiers) ; donne le jeton à la page
avec `session.csrf_token()`, ou écris le champ caché d'un coup avec `session.csrf_field()` (`<input type="hidden"
name="_csrf" ...>`). `session.csrf_protect_except(["/api/", "/webhooks/"])` laisse tranquilles les chemins qui
s'authentifient autrement. Les deux ensemble, avec des cookies sûrs, en une ligne :
`session.protect(app, secret, session.Options {})`.

## Jetons d'API

Pour des clients qui ne sont pas des navigateurs, `mw.bearer_token(fun(token: string) -> bool ... end)`
(`@std/web/middleware.q`) refuse (`401`) les requêtes sans `Authorization: Bearer ...` acceptable. Compare un
secret avec `Crypto.equal(a, b)` (temps constant) ; `Crypto.token(32)` fabrique un jeton au hasard (un `Result<string, Error>`).

## En-têtes, CORS, débit

```qlang-ref
import "@std/web/middleware.q" as mw
import "@std/web/cache.q" as cache
import "@std/web/limit.q" as limit

app.use(mw.request_id())                     -- un identifiant par requête, dans l'en-tête et le journal
app.use(mw.logging())                        -- GET /tasks -> 200 (3 ms)
app.use(mw.security_headers())               -- nosniff, X-Frame-Options, Referrer-Policy
app.use(mw.cors(["https://app.example"]))    -- ou mw.cors_with(mw.CorsOptions { ... })
app.use(limit.rate_limit(cache.Cache.memory(), 100, 60, limit.by_header("x-forwarded-for")))
```

- Le **premier** middleware ajouté est le plus extérieur ; mets `request_id` puis `logging` en tête.
- `cors_with(CorsOptions { origins: [...], credentials: true, expose: [...], max_age: 600 })` règle finement.
- `rate_limit(cache, 100, 60, clé)` : 100 requêtes par minute et par clé, sinon `429` avec `Retry-After`. Le
  compteur vit dans le cache : en mémoire, il compte **par worker** ; avec `Cache.files(dossier)`, pour la
  machine ; avec `Cache.redis(redis, "limit:")`, **exactement pour toutes les machines** (le compte est une seule
  opération atomique). Derrière un proxy, compte par l'en-tête qu'il fixe ; ne fais pas confiance à `x-forwarded-for` si un
  client peut joindre le serveur directement.

## Une liste de vérifications

- Mots de passe hachés avec `Password`, message de connexion identique pour les deux échecs.
- Secret de session dans l'environnement, `sessions_with(secret, true)` derrière HTTPS.
- Une garde sur tout ce qui est privé ; filtre par propriétaire dans les requêtes.
- Corps validés (`422`), jamais de SQL construit à la main avec des valeurs.
- `--dev` jamais en production ; les erreurs `500` ne montrent rien au client.
- Limite de débit au moins sur `/login` et `/register`.

Suite : [tester et mettre en production](../40-web-production/).
