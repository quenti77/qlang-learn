---
title: "Les dictionnaires"
---

# Les dictionnaires

Un dictionnaire (map<K, V>) associe une CLÉ à une VALEUR, comme un annuaire :
on cherche par nom, pas par position.
Les clés : int, string, bool ou enum. L'ordre d'insertion est conservé.

```qlang
let ages = { "ana": 31, "bob": 27 }
print(ages)

ages["cleo"] = 45            -- ajouter
ages["bob"] = 28             -- remplacer
print(ages["ana"])           -- 31

-- Lire une clé ABSENTE donne none : le type est donc int?
print(ages["zed"])           -- none

-- Il faut vérifier avant d'utiliser
let v = ages["ana"]
if v != none then
  print("ana + 1 = {v + 1}")
end

-- Ou donner une valeur par défaut avec get
print(ages.get("zed", 0))    -- 0

-- Questions et nettoyage
print(ages.has("ana"))
print(ages.len())
print(ages.remove("ana"))    -- renvoie l'ancienne valeur
print(ages.has("ana"))
print(ages.keys())
print(ages.values())

-- Parcours : clé ET valeur
for nom, age in ages do
  print("{nom} a {age} ans")
end
```

Dictionnaire vide : type obligatoire

```qlang
let stock: map<string, int> = {}
stock["pommes"] = 10
stock["poires"] = 4
stock["pommes"] += 5          -- ok car la clé existe
print(stock)
```

## Cas d'usage 1 : compter les occurrences

```qlang
let texte = "le chat et le chien et le chat"
let compte: map<string, int> = {}
for mot in texte.words() do
  compte[mot] = compte.get(mot, 0) + 1
end
print(compte)
```

## Cas d'usage 2 : regrouper

```qlang
let par_taille: map<int, array<string>> = {}
for mot in ["a", "bb", "cc", "d", "eee"] do
  let k = mot.len()
  let groupe = par_taille.get(k, [])
  groupe[] = mot
  par_taille[k] = groupe
end
print(par_taille)
```

## Cas d'usage 3 : mémoïsation (se souvenir d'un résultat déjà calculé)

```qlang
let memo: map<int, int> = {}
fun fib(n: int) -> int
  if n < 2 then return n end
  let connu = memo[n]
  if connu != none then return connu end
  let r = fib(n - 1) + fib(n - 2)
  memo[n] = r
  r
end
print(fib(80))     -- instantané grâce au cache
```

Dictionnaires imbriqués

```qlang
let annuaire: map<string, map<string, string>> = {
  "ada": { "ville": "Londres", "tel": "123" },
  "linus": { "ville": "Helsinki", "tel": "456" }
}
let ada = annuaire["ada"]
if ada != none then
  print(ada["ville"])
end
```

Égalité : indépendante de l'ordre

```qlang
print({ "a": 1, "b": 2 } == { "b": 2, "a": 1 })
```

## À retenir

- d[clé] renvoie V? (none si absent) ; d.get(clé, défaut) renvoie V.
- for k, v in d parcourt dans l'ordre d'insertion.
- Parfait pour compter, regrouper, indexer, mettre en cache.
