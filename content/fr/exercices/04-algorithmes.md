---
title: "Algorithmes"
---

# Algorithmes

## Exercice 1

Renvoie le n-ième nombre de Fibonacci de façon itérative (fib(0)=0, fib(1)=1).

```qlang-exercise
fun fib(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fib(10) == 55, "10")
assert(fib(50) == 12586269025, "50")
print("exercice 1 OK")
```

```qlang-solution
fun fib(n: int) -> int
  let a = 0
  let b = 1
  for i in 0..n do
    let t = a + b
    a = b
    b = t
  end
  a
end
```

```qlang-hint
Garde les deux derniers nombres de la suite, et avance d'un cran à chaque tour.

`a` et `b` valent 0 et 1 au départ. À chaque tour : `let t = a + b`, `a = b`, `b = t`. Après `n` tours, renvoie `a`.
```

## Exercice 2

Renvoie le PGCD de deux entiers (Euclide).

```qlang-exercise
fun pgcd(a: int, b: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(pgcd(48, 18) == 6, "48,18")
assert(pgcd(7, 13) == 1, "premiers entre eux")
print("exercice 2 OK")
```

```qlang-solution
fun pgcd(a: int, b: int) -> int
  if b == 0 then a else pgcd(b, a mod b) end
end
```

```qlang-hint
Euclide : le PGCD de `a` et `b` est celui de `b` et du reste de `a` divisé par `b`.

Cas d'arrêt : si `b == 0`, le résultat est `a`. Sinon, rappelle la fonction avec `(b, a mod b)`.
```

## Exercice 3

Recherche dichotomique : renvoie l'indice de cible dans un tableau trié, ou none.

```qlang-exercise
fun cherche(xs: array<int>, cible: int) -> int?
  none   -- TODO
end
```

```qlang-tests
assert(cherche([1, 3, 5, 7], 5) == 2, "trouve")
assert(cherche([1, 3, 5, 7], 4) == none, "absent")
print("exercice 3 OK")
```

```qlang-solution
fun cherche(xs: array<int>, cible: int) -> int?
  let bas = 0
  let haut = xs.len() - 1
  while bas <= haut do
    let m = (bas + haut) div 2
    if xs[m] == cible then return m end
    if xs[m] < cible then bas = m + 1 else haut = m - 1 end
  end
  none
end
```

```qlang-hint
À chaque étape, regarde l'élément du milieu : la cible est avant, après, ou c'est lui.

Garde deux bornes `bas` et `haut`. Tant que `bas <= haut`, `m = (bas + haut) div 2`, puis réduis l'intervalle d'un côté. Si la boucle finit, renvoie `none`.
```

## Exercice 4

Tri par insertion en place.

```qlang-exercise
fun trier(xs: array<int>)
  -- TODO
end
```

```qlang-tests
let t = [5, 2, 9, 1]
trier(t)
assert(t == [1, 2, 5, 9], "tri")
print("exercice 4 OK")
```

```qlang-solution
fun trier(xs: array<int>)
  for i in 1..xs.len() do
    let cle = xs[i]
    let j = i - 1
    while j >= 0 and xs[j] > cle do
      xs[j + 1] = xs[j]
      j -= 1
    end
    xs[j + 1] = cle
  end
end
```

```qlang-hint
Prends chaque élément à partir du deuxième et fais-le « reculer » jusqu'à sa place dans la partie déjà triée.

Pour chaque `i`, garde `let cle = xs[i]`, décale vers la droite les éléments plus grands (`while j >= 0 and xs[j] > cle`), puis place `cle`.
```

## Exercice 5

Renvoie true si les parenthèses "(" et ")" d'une chaîne sont équilibrées.

```qlang-exercise
fun equilibre(s: string) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(equilibre("(()())"), "ok")
assert(not equilibre("(()"), "manque )")
assert(not equilibre(")("), "ordre")
print("exercice 5 OK")
```

```qlang-solution
fun equilibre(s: string) -> bool
  let n = 0
  for c in s do
    if c == "(" then n += 1 end
    if c == ")" then
      n -= 1
      if n < 0 then return false end
    end
  end
  n == 0
end
```

```qlang-hint
Compte les parenthèses ouvertes qui ne sont pas encore fermées.

Ajoute 1 pour `(` et retire 1 pour `)`. Si le compte devient négatif, c'est déséquilibré ; à la fin il doit valoir 0.
```
