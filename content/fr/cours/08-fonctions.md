---
title: "Les fonctions"
---

# Les fonctions

Une fonction est un bout de code **nommé** qu'on peut réutiliser. Elle reçoit des
paramètres (les entrées) et peut renvoyer un résultat (la sortie).

## Une fonction sans résultat

```qlang
fun dire_bonjour(nom: string)
  print("Bonjour {nom} !")
end
dire_bonjour("Ada")
dire_bonjour("Linus")
```

## Une fonction avec résultat

On écrit `-> type` après les paramètres. La **dernière** expression du corps est la
valeur renvoyée.

```qlang
fun carre(x: int) -> int
  x * x
end
print(carre(7))
print(carre(carre(2)))     -- on peut imbriquer
```

## Plusieurs paramètres

```qlang
fun aire_rectangle(l: float, h: float) -> float
  l * h
end
print(aire_rectangle(3.0, 4.5))
```

## `return` : sortie anticipée

```qlang
fun signe(n: int) -> string
  if n > 0 then return "positif" end
  if n < 0 then return "négatif" end
  "nul"
end
print(signe(5))
print(signe(-5))
print(signe(0))
```

## Un prédicat

Une fonction qui renvoie un `bool` s'appelle un *prédicat*.

```qlang
fun est_pair(n: int) -> bool
  n mod 2 == 0
end
print(est_pair(10))
```

## Modifier un tableau

Les tableaux sont partagés : la fonction modifie le tableau de l'appelant.

```qlang
fun doubler_tout(xs: array<int>)
  for i in 0..xs.len() do
    xs[i] = xs[i] * 2
  end
end
let t = [1, 2, 3]
doubler_tout(t)
print(t)
```

## Peut-être rien : le type nullable

```qlang
fun premier_pair(xs: array<int>) -> int?
  for x in xs do
    if x mod 2 == 0 then return x end
  end
  none
end
print(premier_pair([1, 3, 6, 8]))   -- 6
print(premier_pair([1, 3]))         -- none
```

## La récursivité

Une fonction peut s'appeler elle-même. Il faut **toujours** un cas de base qui arrête
la récursion.

```qlang
fun factorielle(n: int) -> int
  if n <= 1 then return 1 end         -- cas de base
  n * factorielle(n - 1)              -- cas récursif
end
print(factorielle(5))    -- 120
print(factorielle(10))   -- 3628800

fun fibonacci(n: int) -> int
  if n < 2 then return n end
  fibonacci(n - 1) + fibonacci(n - 2)
end
for i in 0..10 do write("{fibonacci(i)} ") end
print("")
```

Un compte à rebours récursif :

```qlang
fun decompte(n: int)
  if n == 0 then
    print("Décollage !")
    return
  end
  print(n)
  decompte(n - 1)
end
decompte(3)
```

## Les fonctions sont des valeurs

On peut les ranger dans une variable, les passer en paramètre, les renvoyer.

```qlang
-- (défini plus haut dans ce chapitre)
fun carre(x: int) -> int
  x * x
end

fun appliquer(f: fun(int) -> int, x: int) -> int
  f(x)
end
print(appliquer(carre, 6))
```

## Fonction anonyme

Une fonction sans nom :

```qlang
-- (défini plus haut dans ce chapitre)
fun appliquer(f: fun(int) -> int, x: int) -> int
  f(x)
end

let triple = fun(x: int) -> int
  x * 3
end
print(triple(5))
print(appliquer(fun(x: int) -> int x + 100 end, 1))
```

## Appliquer une fonction à tous les éléments

C'est le fameux « map ».

```qlang
-- (défini plus haut dans ce chapitre)
fun carre(x: int) -> int
  x * x
end

let triple = fun(x: int) -> int
  x * 3
end

fun transformer(xs: array<int>, f: fun(int) -> int) -> array<int>
  let res: array<int> = []
  for x in xs do
    res[] = f(x)            -- `res[] = v` ajoute à la fin
  end
  res
end
print(transformer([1, 2, 3], carre))
print(transformer([1, 2, 3], triple))
```

## Filtrer

```qlang
-- (défini plus haut dans ce chapitre)
fun est_pair(n: int) -> bool
  n mod 2 == 0
end

fun filtrer(xs: array<int>, garder: fun(int) -> bool) -> array<int>
  let res: array<int> = []
  for x in xs do
    if garder(x) then res[] = x end
  end
  res
end
print(filtrer([1, 2, 3, 4, 5, 6], est_pair))
```

## Réduire

```qlang
fun reduire(xs: array<int>, depart: int, f: fun(int, int) -> int) -> int
  let acc = depart
  for x in xs do
    acc = f(acc, x)
  end
  acc
end
print(reduire([1, 2, 3, 4], 0, fun(a: int, b: int) -> int a + b end))   -- 10
print(reduire([1, 2, 3, 4], 1, fun(a: int, b: int) -> int a * b end))   -- 24
```

## À retenir

- `fun nom(param: type) -> type_retour … end`
- Dernière expression = valeur renvoyée ; `return` pour sortir plus tôt.
- Récursion = cas de base + cas récursif.
- Une fonction est une valeur : `map` / `filter` / `reduce` en découlent.
- Limite de profondeur : 1000 appels imbriqués (erreur `R901`) ; 250 sur ce site, où le
  navigateur a moins de place.
