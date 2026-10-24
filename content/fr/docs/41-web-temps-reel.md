---
title: "Guide web 6 : temps réel et tâches de fond"
group: "Applications web"
---

# Guide web 6 : temps réel et tâches de fond

Deux besoins que l'on ne peut pas satisfaire dans une requête HTTP ordinaire : **pousser** des
nouvelles au navigateur (un chat, des notifications), et **différer** un travail long (envoyer un mail,
redimensionner une image). Les deux se font avec `qlang serve` et le paquet `std`.

## WebSocket

Une route devient un WebSocket quand elle rend `Response.websocket(...)`. Les gardes et les middleware de la
route passent d'abord, comme pour toute requête : une garde qui refuse (`401`) arrête la connexion avant la
mise à niveau.

```qlang-ref
#[web.Get("/chat")]
#[web.Guard("auth")]
fun chat(req: Request, who: Me, hub: ws.Hub) -> Response
  Response.websocket(WebSocketHandler {
    on_open: fun(c: WebSocket)
      hub.join("lobby", c)
      c.send("welcome {who.email}")
    end,
    on_message: fun(c: WebSocket, m: WsMessage)
      hub.broadcast("lobby", "{who.email}: {m.text ?? ""}", c.id)
    end,
    on_close: fun(c: WebSocket) hub.leave(c) end,
  })
end
```

| Fonction de rappel | Appelée |
| --- | --- |
| `on_message(c, m)` | à chaque message du client (`m.text`, ou `m.data` et `m.binary` pour des octets) |
| `on_open(c)` | quand la connexion est ouverte |
| `on_tick(c)` | toutes les `tick_ms` millisecondes (1000 par défaut ; 0 : jamais) |
| `on_close(c)` | quand elle se termine (le client part, ou `c.close()`) ; on ne peut plus écrire |

Une `WebSocket` offre `send(texte)`, `send_bytes(octets)`, `close()`, `close_with(code, raison)`, `is_open()`,
`id` (unique), `request` (la requête d'origine, avec `attrs` rempli par les gardes) et `data`, une table à toi pour
retenir qui est connecté, dans quel salon...

### Ce qu'il faut savoir

- **Un worker sert beaucoup de connexions**, une fonction de rappel à la fois. Une fonction de rappel doit donc
  être **courte** : n'attends jamais dedans (`time.sleep`, requête lente). Chaque appel a son budget d'étapes.
- **Les workers ne partagent rien.** Un `Hub` (`@std/web/ws.q`) range des connexions dans des salons, mais
  seulement celles **de son worker** : il convient à `--workers 1`, ou à ce qui ne concerne que la connexion.
  Pour parler à tout le monde avec plusieurs workers, passe par la base : `Bus` écrit les messages dans une
  table et chaque connexion lit les nouveaux dans son `on_tick`.
- **Vérifie `Origin`.** Un navigateur laisse n'importe quelle page ouvrir un WebSocket vers ton serveur, avec les
  cookies du visiteur. `ws.origin_guard(["https://app.example"])` est une garde (`app.guard("origin", ...)`,
  puis `#[web.Guard("origin")]`) qui refuse les autres origines.
- Limites : messages de 1 Mo au plus, un `ping` toutes les 30 s, un client qui envoie une trame invalide est
  fermé (`1002`). Pas de TLS dans `qlang serve` : un proxy inverse fait `wss://`.

### Plusieurs workers : le bus

```qlang-ref
import "@std/web/ws.q" as ws

let bus = ws.Bus.new(db, "sqlite")      -- "postgres" ou "mysql" pour ces bases
bus.install().unwrap()                  -- la table, si elle n'existe pas

Response.websocket(WebSocketHandler {
  tick_ms: 300,
  on_open: fun(c: WebSocket) bus.deliver(c, "lobby") end,         -- note où en est le salon
  on_message: fun(c: WebSocket, m: WsMessage) bus.publish("lobby", m.text ?? "").unwrap() end,
  on_tick: fun(c: WebSocket) bus.deliver(c, "lobby") end,         -- envoie ce qui est arrivé depuis
})
```

`bus.prune(3600)` supprime les messages de plus d'une heure : lance-le de temps en temps. Une base lue toutes les
300 ms par connexion suffit pour un chat ou des notifications ; au-delà de quelques milliers de connexions,
prends un vrai courtier de messages. L'exemple complet est `examples/chat` du paquet (une page HTML et un salon) :

```sh
CHAT_DB=sqlite://chat.db qlang serve examples/chat/main.q --workers 2
```

### Tester un WebSocket

`WsClient` (`@std/web/testing.q`) ouvre un WebSocket sur l'application **sans réseau** et joue les événements un
par un :

```qlang-ref
let a = testing.WsClient.open(app, "/chat?name=ada")
assert_eq(a.received(), ["welcome ada"])
a.send("hi")                       -- on_message
b.received()                       -- ce que les autres ont reçu
a.close()                          -- on_close
testing.WsClient.try_open(app, "/chat", {"origin": "https://evil.example"})   -- un Err : 403
```

## La file de tâches

Un travail long ne se fait pas pendant la requête : on l'**écrit** (un *job*) et un processus à part le fait.
`@std/queue.q` range les jobs dans ta base, sans rien d'autre à lancer.

```qlang-ref
import "@std/queue.q" as qq

struct SendWelcome
  public email: string
end

let queue = qq.Queue.new(db, "sqlite")
queue.install().unwrap()
queue.handle<SendWelcome>(fun(job: SendWelcome) -> string?
  let sent = mailer.send(job.email, "Welcome")
  if sent.is_err() then sent.unwrap_err().message else none end
end)
```

```qlang-ref
-- dans une route
queue.push(SendWelcome { email: input.email }).unwrap()
queue.push_in(SendWelcome { email: input.email }, 3600).unwrap()      -- pas avant une heure
```

```qlang-ref
-- worker.q : un processus à part, avec les mêmes fournisseurs que l'application
queue.work(false)                                                      -- ne rend jamais la main
```

- Un job est une structure à champs publics (rangée en JSON) ; **son type trouve sa fonction**.
- La fonction rend `none` quand c'est fait, ou le **texte qui dit pourquoi** ça a échoué. Elle ne doit jamais faire
  `panic` (cela arrêterait le worker).
- Un échec est réessayé plus tard (10 s, 1 min, 5 min, puis 15 min) jusqu'à `max_attempts` fois (3 par défaut), puis
  le job passe dans la table des jobs abandonnés : `queue.failed()`, `retry_failed(id)`, `forget_failed(id)`.
- Plusieurs workers peuvent tourner : chacun **marque** un job avant de le faire. Un job laissé « en cours » plus de
  `queue.timeout` secondes (le worker est mort) est redonné : une fonction doit donc pouvoir être jouée deux fois sans
  mal.
- En ligne de commande : `@std/web/commands.q` apporte `queue:work` (`--once` pour s'arrêter quand il n'y a plus rien),
  `queue:failed` et `queue:retry <id>`. Lance le worker sous systemd, Docker ou ce qui le relance.
- Les tests donnent leur horloge (`queue.clock`) pour ne pas attendre.

## Et ensuite

Ce qui manque encore : un courtier de messages pour des milliers de connexions, JWT tout fait, relations d'ORM.
Pour tout le reste, la page « Applications web » et le [guide](../36-web-demarrer/) disent comment les pièces
s'assemblent.
