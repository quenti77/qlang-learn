---
title: "Erreurs, assert et robustesse"
---

# Erreurs, `assert` et robustesse

Il y a trois familles d'erreurs :

1. **À la lecture** (à la compilation) : code mal écrit, types incompatibles. qlang refuse
   de démarrer et dit où. Les codes commencent par `L`, `P` ou `T`.
2. **À l'exécution** : division par zéro, indice hors limites, `panic`. Le programme
   s'arrête avec la pile des appels. Les codes commencent par `R`.
3. **Logiques** : le programme tourne mais donne un mauvais résultat. Ce sont les plus
   vicieuses ! On les chasse avec des tests (`assert`).

qlang n'a pas de `try` / `catch` : on prévient les erreurs avec des types nullables et des
vérifications.

## `assert` : tester

`assert(condition, message)` arrête le programme si la condition est fausse. C'est un outil
de test : « je suis sûr que ceci est vrai ».

```qlang
assert(1 + 1 == 2, "les maths fonctionnent")
assert(10 mod 3 == 1)

fun additionner(a: int, b: int) -> int
  a + b
end
assert(additionner(2, 3) == 5, "2 + 3 = 5")
assert(additionner(-1, 1) == 0, "cas limite")
```

Écrire de petits tests donne confiance en son code :

```qlang
fun inverser(s: string) -> string
  let r = ""
  for c in s do
    r = c + r
  end
  r
end
assert(inverser("abc") == "cba")
assert(inverser("") == "")
assert(inverser("a") == "a")
print("tous les tests passent")
```

Et quand un `assert` échoue ? Change `"cba"` en `"abc"` ci-dessus : le message indique la
ligne du test qui a échoué.

## `panic` : s'arrêter volontairement

`panic(message)` arrête le programme quand l'état est impossible.

```qlang
fun racine_entiere(n: int) -> int
  if n < 0 then
    panic("racine d'un négatif !")
  end
  n.sqrt() as int
end
print(racine_entiere(49))
```

## Mieux que paniquer : un nullable

On renvoie `none` et on laisse l'appelant décider.

```qlang
fun diviser(a: int, b: int) -> float?
  if b == 0 then return none end
  a / b
end
let r = diviser(10, 0)
if r == none then
  print("division impossible")
else
  print(r)
end
```

Quand l'appelant doit savoir **pourquoi** ça a échoué, on renvoie un `Result` : voir la leçon
« Result et l'opérateur `?` ».

## Valider avant d'agir

```qlang
fun lire_indice(xs: array<int>, i: int) -> int?
  if i < 0 or i >= xs.len() then return none end
  xs[i]
end
print(lire_indice([5, 6, 7], 1))
print(lire_indice([5, 6, 7], 9))
```

## Voir des erreurs d'exécution

Exécute chaque exemple pour voir le message.

<!-- expect-error -->
```qlang
print(1 div 0)                 -- division par zéro
```

<!-- expect-error -->
```qlang
print([1, 2, 3][5])            -- indice hors limites
```

<!-- expect-error -->
```qlang
panic("boum")                  -- arrêt volontaire
```

<!-- expect-error -->
```qlang
print(int.MAX + 1)             -- dépassement d'entier
```

Deux autres erreurs d'exécution viennent des limites de qlang : `R900` (trop d'étapes : une
boucle infinie ?) et `R901` (trop d'appels imbriqués : une récursion infinie ?).

Dans un terminal, le programme se termine avec le code de sortie 0 en cas de succès, 1 pour
une erreur de compilation et 2 pour une erreur d'exécution. C'est utile dans des scripts shell.

## À retenir

- Les erreurs de types sont attrapées **avant** l'exécution : c'est un cadeau.
- `assert` pour tester ; `panic` pour l'impossible ; un nullable pour l'échec normal.
- Lis toujours le message d'erreur en entier : ligne, colonne, extrait.
