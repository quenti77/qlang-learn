---
title: "Fonctions avancées : fermetures (closures)"
---

# Fonctions avancées : fermetures (closures)

Une fonction anonyme **se souvient** des variables autour d'elle, même après que la
fonction qui l'a créée soit terminée. On appelle ça une *fermeture* (*closure*).

## Un compteur

```qlang
fun creer_compteur() -> fun() -> int
  let n = 0                 -- cette variable survit dans la fermeture
  fun() -> int
    n += 1
    n
  end
end

let c1 = creer_compteur()
let c2 = creer_compteur()      -- compteur indépendant
c1()
c1()
print(c1())    -- 3
print(c2())    -- 1
```

## Une usine à fonctions

```qlang
fun additionneur(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end
let plus5 = additionneur(5)
let plus100 = additionneur(100)
print(plus5(1))
print(plus100(1))
```

## Composer deux fonctions

`(f ∘ g)(x) = f(g(x))`

```qlang
-- (défini plus haut dans ce chapitre)
fun additionneur(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end

let plus5 = additionneur(5)

fun composer(f: fun(int) -> int, g: fun(int) -> int) -> fun(int) -> int
  fun(x: int) -> int
    f(g(x))
  end
end
let double_puis_plus5 = composer(plus5, fun(x: int) -> int x * 2 end)
print(double_puis_plus5(10))     -- 25
```

## Un tableau de fonctions

```qlang
let operations: array<fun(int, int) -> int> = [
  fun(a: int, b: int) -> int a + b end,
  fun(a: int, b: int) -> int a - b end,
  fun(a: int, b: int) -> int a * b end
]
for op in operations do
  write("{op(6, 3)} ")
end
print("")
```

## Un dictionnaire de fonctions

On l'appelle une « table de dispatch ».

```qlang
let calc: map<string, fun(int, int) -> int> = {
  "+": fun(a: int, b: int) -> int a + b end,
  "*": fun(a: int, b: int) -> int a * b end
}
let f = calc["*"]
if f != none then print(f(7, 6)) end
```

## Une mémoïsation : une fermeture avec un cache

```qlang
fun memoiser(f: fun(int) -> int) -> fun(int) -> int
  let cache: map<int, int> = {}
  fun(x: int) -> int
    let deja = cache[x]
    if deja != none then return deja end
    let r = f(x)
    cache[x] = r
    r
  end
end
let lent = fun(x: int) -> int
  print("  (calcul de {x})")
  x * x
end
let rapide = memoiser(lent)
print(rapide(9))
print(rapide(9))    -- pas de nouveau calcul
```

## Une fonction d'ordre supérieur

Appeler une action `n` fois :

```qlang
fun repeter(n: int, action: fun(int))
  for i in 0..n do action(i) end
end
let total = 0
repeter(5, fun(i: int) total += i end)    -- modifie la variable extérieure
print(total)
```

Une fonction est une valeur : on peut en passer une à une autre fonction pour traiter un tableau. Voici les trois
grands classiques.

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

- Une fermeture capture les variables englobantes **et** peut les modifier.
- Utile pour : les compteurs, les usines de fonctions, les caches, les *callbacks*.
- Une fonction est une valeur : `map` / `filter` / `reduce` en découlent.
