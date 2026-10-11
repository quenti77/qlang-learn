---
title: "Tableaux, chaînes, dictionnaires"
---

# Tableaux, chaînes, dictionnaires

## Exercice 1

Renvoie la moyenne d'un tableau non vide (float).

```qlang-exercise
fun moyenne(xs: array<int>) -> float
  0.0   -- TODO
end
```

```qlang-tests
assert(moyenne([2, 4, 6]) == 4.0, "moyenne")
print("exercice 1 OK")
```

```qlang-solution
fun moyenne(xs: array<int>) -> float
  xs.sum() / xs.len()
end
```

```qlang-hint
La moyenne est la somme divisée par le nombre d'éléments.

`xs.sum()` donne la somme et `xs.len()` la taille. Le `/` donne toujours un `float`.
```

## Exercice 2

Renvoie un nouveau tableau sans les doublons (ordre conservé).

```qlang-exercise
fun sans_doublons(xs: array<int>) -> array<int>
  []   -- TODO
end
```

```qlang-tests
assert(sans_doublons([1, 2, 1, 3, 2]) == [1, 2, 3], "doublons")
print("exercice 2 OK")
```

```qlang-solution
fun sans_doublons(xs: array<int>) -> array<int>
  let res: array<int> = []
  for x in xs do
    if not res.contains(x) then res[] = x end
  end
  res
end
```

```qlang-hint
Construis un nouveau tableau, et n'y ajoute un élément que s'il n'y est pas déjà.

`res.contains(x)` te dit si `x` est déjà dans `res`, et `res[] = x` ajoute à la fin.
```

## Exercice 3

Renvoie true si la chaîne est un palindrome (ignore la casse).

```qlang-exercise
fun palindrome(s: string) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(palindrome("Kayak"), "kayak")
assert(not palindrome("abc"), "abc")
print("exercice 3 OK")
```

```qlang-solution
fun palindrome(s: string) -> bool
  let m = s.lower()
  m == m.reverse()
end
```

```qlang-hint
Un palindrome se lit pareil dans les deux sens. Ignore la casse en passant tout en minuscules.

`s.lower()` met en minuscules et `.reverse()` inverse une chaîne : compare les deux avec `==`.
```

## Exercice 4

Renvoie le nombre de mots d'une phrase.

```qlang-exercise
fun nb_mots(s: string) -> int
  0   -- TODO
end
```

```qlang-tests
assert(nb_mots("le chat dort") == 3, "3")
assert(nb_mots("") == 0, "vide")
print("exercice 4 OK")
```

```qlang-solution
fun nb_mots(s: string) -> int
  s.words().len()
end
```

```qlang-hint
Il existe une méthode de chaîne qui coupe un texte en mots.

`s.words()` renvoie un tableau de mots ; il ne reste qu'à en donner la taille avec `len()`.
```

## Exercice 5

Renvoie un dictionnaire lettre -> nombre d'occurrences.

```qlang-exercise
fun frequences(s: string) -> map<string, int>
  let m: map<string, int> = {}
  m   -- TODO
end
```

```qlang-tests
let f = frequences("banane")
assert(f.get("a", 0) == 2, "a")
assert(f.get("n", 0) == 2, "n")
assert(f.get("z", 0) == 0, "z")
print("exercice 5 OK")
```

```qlang-solution
fun frequences(s: string) -> map<string, int>
  let m: map<string, int> = {}
  for c in s do
    m[c] = m.get(c, 0) + 1
  end
  m
end
```

```qlang-hint
Parcours la chaîne caractère par caractère et compte dans le dictionnaire.

Pour chaque lettre `c` : `m[c] = m.get(c, 0) + 1` (`get` donne 0 si la lettre n'est pas encore là).
```

## Exercice 6

Fais pivoter un tableau d'un cran vers la gauche : [1,2,3] -> [2,3,1] (nouveau tableau).

```qlang-exercise
fun rotation(xs: array<int>) -> array<int>
  xs   -- TODO
end
```

```qlang-tests
assert(rotation([1, 2, 3]) == [2, 3, 1], "rotation")
print("exercice 6 OK")
```

```qlang-solution
fun rotation(xs: array<int>) -> array<int>
  if xs.is_empty() then return [] end
  let res = xs.slice(1, xs.len())
  res[] = xs[0]
  res
end
```

```qlang-hint
Le résultat est le tableau sans son premier élément, suivi de ce premier élément.

`xs.slice(1, xs.len())` donne le tableau sans le premier ; ajoute `xs[0]` à la fin avec `res[] = xs[0]`. Pense au tableau vide.
```
