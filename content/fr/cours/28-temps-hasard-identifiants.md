---
title: "Heure, hasard et identifiants"
---

# Heure, hasard et identifiants

Un programme a parfois besoin de **l'heure** ou de **hasard** : lancer un dé, mélanger,
donner un identifiant unique à une commande. Le cœur de qlang ne lit ni l'horloge ni le hasard :
ils viennent de l'**environnement** (ici, la page web ; dans un terminal, le système).

## L'heure : `time.now()`

`time.now()` renvoie l'heure courante sous forme d'un `int` : le nombre de **millisecondes**
écoulées depuis le 1er janvier 1970 (UTC).

```qlang
let debut = time.now()
let fin = time.now()
print(fin >= debut)
print(fin - debut < 1000)
```

Pour mesurer une durée, on soustrait deux heures.

## Le hasard : `random`

`random.int(min, max)` donne un entier entre `min` et `max`, **les deux inclus**.
`random.float()` donne un nombre dans `[0, 1[`.

```qlang
let de = random.int(1, 6)
print(de >= 1 and de <= 6)

let x = random.float()
print(x >= 0.0 and x < 1.0)
```

Chaque exécution donne d'autres valeurs. `random.int(3, 1)` est une erreur : `min` doit être
inférieur ou égal à `max`.

## `uuid` : un identifiant sur 128 bits

Un `uuid` se compose de 128 bits, écrits `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. C'est un type à
part, pas une `string`.

```qlang
let id = uuid.v4()
print(id.version())
print((id as string).len())

print(uuid.NIL)
```

- `uuid.v4()` : un identifiant aléatoire.
- `uuid.v7()` : l'heure, puis du hasard : triable par date de création.
- `uuid.parse(texte)` : renvoie un `uuid?`, `none` si le texte est invalide.

```qlang
let u = uuid.parse("550e8400-e29b-41d4-a716-446655440000")
if u != none then
  print(u.version())
end
print(uuid.parse("pas un uuid") == none)
```

## `ulid` : un identifiant triable

Un `ulid` fait aussi 128 bits, mais il commence par l'**heure de création** (48 bits, en
millisecondes) suivie de **80 bits de hasard**. Il s'écrit avec 26 caractères.

```qlang
let a = ulid.at(1000)
let b = ulid.at(2000)
print(a < b)
print(a.time())
print((a as string).len())
```

`ulid.new()` utilise l'heure présente. `ulid.at(ms)` fixe l'heure : pratique pour comprendre
et pour tester. Deux `ulid` créés dans l'ordre sont **toujours** dans cet ordre, même dans la
même milliseconde.

```qlang
let ids: array<ulid> = []
for i in 0..5 do
  ids.push(ulid.new())
end
let tries = ids.slice(0, 5)
tries.sort()
print(tries == ids)
```

Les `uuid` et les `ulid` se comparent, se trient et peuvent être des clés de dictionnaire :

```qlang
let commandes: map<ulid, string> = {}
let premiere = ulid.at(1000)
commandes[premiere] = "café"
print(commandes[premiere])
```

## À retenir

- `time.now()` : millisecondes depuis 1970. `random.int(min, max)` inclut les deux bornes.
- `uuid` et `ulid` sont des types à part, comparables et utilisables comme clés.
- Un `ulid` contient l'heure : on peut le trier par date, et lire l'heure avec `.time()`.
- Le hasard n'est **pas** fait pour la sécurité (mots de passe, jetons).
