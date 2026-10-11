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
