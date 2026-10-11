---
title: "Variables, conditions, boucles, fonctions"
---

# Variables, conditions, boucles, fonctions

## Exercice 1

Renvoie le carré d'un nombre.

```qlang-exercise
fun carre(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(carre(4) == 16, "carre(4)")
assert(carre(-3) == 9, "carre(-3)")
print("exercice 1 OK")
```

```qlang-solution
fun carre(n: int) -> int
  n * n
end
```

## Exercice 2

Renvoie true si n est pair.

```qlang-exercise
fun est_pair(n: int) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(est_pair(4), "4")
assert(not est_pair(7), "7")
print("exercice 2 OK")
```

```qlang-solution
fun est_pair(n: int) -> bool
  n mod 2 == 0
end
```

## Exercice 3

Renvoie le plus grand de trois entiers (sans utiliser max).

```qlang-exercise
fun max3(a: int, b: int, c: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(max3(1, 5, 3) == 5, "milieu")
assert(max3(9, 5, 3) == 9, "debut")
assert(max3(-1, -5, -3) == -1, "negatifs")
print("exercice 3 OK")
```

```qlang-solution
fun max3(a: int, b: int, c: int) -> int
  let m = a
  if b > m then m = b end
  if c > m then m = c end
  m
end
```

## Exercice 4

Renvoie la somme des entiers de 1 à n avec une boucle.

```qlang-exercise
fun somme_jusqua(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(somme_jusqua(10) == 55, "10")
assert(somme_jusqua(0) == 0, "0")
print("exercice 4 OK")
```

```qlang-solution
fun somme_jusqua(n: int) -> int
  let s = 0
  for i in 1..=n do s += i end
  s
end
```

## Exercice 5

Renvoie "Fizz" si n multiple de 3, "Buzz" si de 5, "FizzBuzz" si des deux, sinon n en texte.

```qlang-exercise
fun fizzbuzz(n: int) -> string
  ""   -- TODO
end
```

```qlang-tests
assert(fizzbuzz(15) == "FizzBuzz", "15")
assert(fizzbuzz(9) == "Fizz", "9")
assert(fizzbuzz(10) == "Buzz", "10")
assert(fizzbuzz(7) == "7", "7")
print("exercice 5 OK")
```

```qlang-solution
fun fizzbuzz(n: int) -> string
  if n mod 15 == 0 then return "FizzBuzz" end
  if n mod 3 == 0 then return "Fizz" end
  if n mod 5 == 0 then return "Buzz" end
  n as string
end
```

## Exercice 6

Renvoie n! (factorielle) de façon récursive.

```qlang-exercise
fun fact(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fact(0) == 1, "0")
assert(fact(5) == 120, "5")
print("exercice 6 OK")
```

```qlang-solution
fun fact(n: int) -> int
  if n <= 1 then return 1 end
  n * fact(n - 1)
end
```
