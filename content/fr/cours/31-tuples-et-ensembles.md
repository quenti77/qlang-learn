---
title: "Tuples et ensembles"
---

# Tuples et ensembles

Deux outils pour les petites données : le **tuple** groupe quelques valeurs sans qu'on déclare
une structure, et l'**ensemble** (`Set`) garde des valeurs sans doublon.

## Les tuples

Un tuple regroupe un nombre fixe de valeurs, de types éventuellement différents. Son type
s'écrit `(int, string)`, sa valeur `(1, "a")`. On lit un élément par sa position, à partir de 0.

```qlang
fun bornes(xs: array<int>) -> (int, int)
  (xs[0], xs[xs.len() - 1])
end

let b = bornes([3, 1, 2])
print(b)               -- (3, 2)
print(b.0)             -- 3
print(b.1)             -- 2
```

Un tuple ne change pas : `b.0 = 5` est refusé, on en construit un nouveau. Deux tuples
s'égalent quand tous leurs éléments sont égaux.

<!-- expect-error -->
```qlang
let t = (1, "a")
t.0 = 5
```

## Déstructurer

`let (a, b) = t` prend un tuple en morceaux. `_` ignore un élément.

```qlang
fun bornes(xs: array<int>) -> (int, int)
  (xs[0], xs[xs.len() - 1])
end

let (lo, hi) = bornes([3, 1, 2])
print("de {lo} à {hi}")

let gens: array<(string, int)> = [("ana", 31), ("bob", 27)]
for (nom, age) in gens do
  print("{nom} a {age} ans")
end
for i, (nom, _) in gens do
  print("{i}: {nom}")
end
```

On peut aussi affecter plusieurs variables d'un coup. La valeur de droite est calculée en
entier avant que la première cible ne change, donc l'échange tient en une ligne :

```qlang
let a = 1
let b = 2
(a, b) = (b, a)
print("{a} {b}")

let xs = [10, 20, 30]
(xs[0], xs[2]) = (xs[2], xs[0])
print(xs)

let cur = 0
let next = 1
for _ in 0..10 do
  (cur, next) = (next, cur + next)
end
print(cur)
```

## Tuples et `match`

Un `match` peut défaire un tuple, ce qui est pratique pour regarder deux valeurs à la fois.

```qlang
fun fizzbuzz(n: int) -> string
  match (n mod 3, n mod 5)
    case (0, 0) then "FizzBuzz"
    case (0, _) then "Fizz"
    case (_, 0) then "Buzz"
    else "{n}"
  end
end

for i in 1..=15 do
  print(fizzbuzz(i))
end
```

## Les ensembles

Un `Set<T>` est une collection de valeurs **sans doublon**, qui garde l'ordre d'ajout. Il est
disponible sans `import`. On le crée avec `Set.of(tableau)` ou, vide, avec `Set<T>.new()`.

```qlang
let a = Set.of([1, 2, 2, 3])
print(a)                        -- Set(1, 2, 3)
print(a.len())

let vus = Set<string>.new()
print(vus.add("x"))             -- true : nouvelle valeur
print(vus.add("x"))             -- false : déjà là
print(vus.contains("x"))
vus.remove("x")
print(vus.is_empty())
```

Les opérations d'ensemble donnent un **nouvel** ensemble :

```qlang
let a = Set.of([1, 2, 3])
let b = Set.of([2, 3, 4])
print(a.union(b))               -- Set(1, 2, 3, 4)
print(a.intersect(b))           -- Set(2, 3)
print(a.difference(b))          -- Set(1)
print(Set.of([2, 3]).is_subset(a))
for v in a do
  print(v)
end
```

Un cas classique : retirer les doublons d'un tableau, ou savoir si on a déjà vu une valeur.

```qlang
fun premier_doublon(xs: array<int>) -> int?
  let vus = Set<int>.new()
  for x in xs do
    if not vus.add(x) then return x end
  end
  none
end

print(premier_doublon([4, 8, 15, 8, 16]))
print(Set.of([3, 1, 3, 2, 1]).to_array())
```

Un tuple peut être une valeur d'ensemble (ou une clé de dictionnaire) : pratique pour des
coordonnées.

```qlang
let visites = Set<(int, int)>.new()
visites.add((0, 0))
visites.add((1, 2))
visites.add((0, 0))
print(visites.len())
print(visites.contains((1, 2)))
```

## À retenir

- Un tuple groupe des valeurs de types différents ; on le lit avec `t.0`, `t.1`, on le défait
  avec `let (a, b) = t`, et `(a, b) = (b, a)` échange deux variables.
- `match` accepte des motifs de tuple : `case (0, _) then …`.
- `Set<T>` : pas de doublon, ordre d'ajout conservé ; `add` dit si la valeur était nouvelle.
- Les valeurs d'un ensemble suivent la règle des clés de dictionnaire (pas de tableau).
