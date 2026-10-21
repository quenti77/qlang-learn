---
title: "Tuples, ensembles, Result"
---

# Tuples, ensembles, Result

## Exercice 1

Écris `bornes(xs)` : elle renvoie le plus petit et le plus grand élément d'un tableau (non vide) sous la forme d'un tuple `(min, max)`.

```qlang-exercise
fun bornes(xs: array<int>) -> (int, int)
  (0, 0)   -- TODO
end
```

```qlang-tests
assert(bornes([3, 1, 2]) == (1, 3), "bornes de [3, 1, 2]")
assert(bornes([5]) == (5, 5), "un seul élément")
let (lo, hi) = bornes([-4, 9, 0])
assert(lo == -4 and hi == 9, "déstructuration")
print("exercice 1 OK")
```

```qlang-solution
fun bornes(xs: array<int>) -> (int, int)
  let lo = xs[0]
  let hi = xs[0]
  for x in xs do
    if x < lo then lo = x end
    if x > hi then hi = x end
  end
  (lo, hi)
end
```

```qlang-hint
Pars du premier élément pour `lo` et pour `hi`, puis parcours le tableau.

Le tuple se construit avec des parenthèses : `(lo, hi)` est la dernière expression de la fonction.
```

## Exercice 2

Écris `fibonacci(n)` avec une affectation de tuple `(a, b) = (b, a + b)` : `fibonacci(0)` vaut 0, `fibonacci(1)` vaut 1, `fibonacci(10)` vaut 55.

```qlang-exercise
fun fibonacci(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fibonacci(0) == 0, "fibonacci(0)")
assert(fibonacci(1) == 1, "fibonacci(1)")
assert(fibonacci(10) == 55, "fibonacci(10)")
assert(fibonacci(50) == 12586269025, "fibonacci(50)")
print("exercice 2 OK")
```

```qlang-solution
fun fibonacci(n: int) -> int
  let a = 0
  let b = 1
  for _ in 0..n do
    (a, b) = (b, a + b)
  end
  a
end
```

```qlang-hint
Garde deux variables : `a` (le terme courant, 0 au départ) et `b` (le suivant, 1 au départ).

À chaque tour, `(a, b) = (b, a + b)` avance d'un cran. Après `n` tours, `a` est le résultat.
```

## Exercice 3

Écris `quadrant(x, y)` avec un `match` sur le tuple `(x, y)` : `"origine"` pour `(0, 0)`, `"axe x"` si seul `y` vaut 0, `"axe y"` si seul `x` vaut 0, sinon `"haut"` ou `"bas"` selon que `y` est positif ou négatif.

```qlang-exercise
fun quadrant(x: int, y: int) -> string
  "?"   -- TODO
end
```

```qlang-tests
assert(quadrant(0, 0) == "origine", "origine")
assert(quadrant(5, 0) == "axe x", "axe x")
assert(quadrant(0, -3) == "axe y", "axe y")
assert(quadrant(2, 7) == "haut", "haut")
assert(quadrant(-2, -7) == "bas", "bas")
print("exercice 3 OK")
```

```qlang-solution
fun quadrant(x: int, y: int) -> string
  match (x, y)
    case (0, 0) then "origine"
    case (_, 0) then "axe x"
    case (0, _) then "axe y"
    case (_, b) if b > 0 then "haut"
    else "bas"
  end
end
```

```qlang-hint
Les cas sont essayés dans l'ordre : mets `(0, 0)` en premier.

`_` accepte n'importe quelle valeur, et une garde `if` permet de tester une valeur liée : `case (_, b) if b > 0`.
```

## Exercice 4

Écris `premier_doublon(xs)` : elle renvoie le premier élément qui apparaît pour la deuxième fois, ou `none` s'il n'y en a pas. Utilise un `Set`.

```qlang-exercise
fun premier_doublon(xs: array<int>) -> int?
  none   -- TODO
end
```

```qlang-tests
assert(premier_doublon([4, 8, 15, 8, 16, 4]) == 8, "le premier doublon est 8")
assert(premier_doublon([1, 2, 3]) == none, "pas de doublon")
assert(premier_doublon([]) == none, "tableau vide")
print("exercice 4 OK")
```

```qlang-solution
fun premier_doublon(xs: array<int>) -> int?
  let vus = Set<int>.new()
  for x in xs do
    if not vus.add(x) then return x end
  end
  none
end
```

```qlang-hint
`vus.add(x)` ajoute `x` à l'ensemble et renvoie `true` si la valeur était nouvelle, `false` si elle y était déjà.

Si `add` renvoie `false`, c'est un doublon : renvoie `x`.
```

## Exercice 5

Écris `communs(a, b)` : le nombre de valeurs présentes dans les deux tableaux (chaque valeur est comptée une seule fois). Utilise `Set.of` et `intersect`.

```qlang-exercise
fun communs(a: array<int>, b: array<int>) -> int
  0   -- TODO
end
```

```qlang-tests
assert(communs([1, 2, 3], [2, 3, 4]) == 2, "2 et 3")
assert(communs([1, 1, 2], [1, 1, 1]) == 1, "doublons comptés une fois")
assert(communs([1], [2]) == 0, "rien en commun")
print("exercice 5 OK")
```

```qlang-solution
fun communs(a: array<int>, b: array<int>) -> int
  Set.of(a).intersect(Set.of(b)).len()
end
```

```qlang-hint
`Set.of(tableau)` crée un ensemble sans doublon.

`ensemble1.intersect(ensemble2)` donne un nouvel ensemble ; `len()` en donne la taille.
```

## Exercice 6

Écris `lire_age(texte)` qui renvoie `Ok(age)` si le texte est un entier entre 0 et 150, sinon `Err` avec un message (`"pas un nombre"` ou `"age invalide"`). Écris ensuite `total_ages(a, b)` qui additionne deux âges en utilisant `?`.

```qlang-exercise
fun lire_age(texte: string) -> Result<int, Error>
  Err(Error { message: "TODO" })
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  Err(Error { message: "TODO" })
end
```

```qlang-tests
assert_eq(assert_ok(lire_age("42")), 42)
assert_eq(assert_err(lire_age("abc")).message, "pas un nombre")
assert_eq(assert_err(lire_age("200")).message, "age invalide")
assert_eq(assert_err(lire_age("-1")).message, "age invalide")
assert_eq(assert_ok(total_ages("30", "12")), 42)
assert_eq(assert_err(total_ages("30", "x")).message, "pas un nombre")
assert_eq(assert_err(total_ages("999", "12")).message, "age invalide")
print("exercice 6 OK")
```

```qlang-solution
fun lire_age(texte: string) -> Result<int, Error>
  let n = int.parse(texte)
  if n == none then
    return Err(Error { message: "pas un nombre" })
  end
  if n < 0 or n > 150 then
    return Err(Error { message: "age invalide" })
  end
  Ok(n)
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  let x = lire_age(a)?
  let y = lire_age(b)?
  Ok(x + y)
end
```

```qlang-hint
`int.parse(texte)` renvoie un `int?` : `none` si le texte n'est pas un nombre.

Dans `total_ages`, `lire_age(a)?` donne la valeur du `Ok`, ou quitte la fonction avec l'erreur.
```
