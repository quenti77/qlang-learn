---
title: "Erreurs, assert et robustesse"
---

# Erreurs, assert et robustesse

Il y a trois familles d'erreurs :
1. À la LECTURE / compilation (code mal écrit, types incompatibles) :
       qlang refuse de démarrer et dit où. Codes L..., P..., T...
2. À l'EXÉCUTION (division par zéro, indice hors limites, panic) :
       le programme s'arrête avec la pile des appels. Codes R...
3. LOGIQUES : le programme tourne mais donne un mauvais résultat.
       Les plus vicieuses ! On les chasse avec des tests (assert).

qlang n'a pas de try/catch : on prévient les erreurs avec des types
nullables et des vérifications.

assert(condition, message) : arrête le programme si la condition est fausse.
C'est un outil de TEST : "je suis sûr que ceci est vrai".

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

panic(message) : arrêt volontaire quand l'état est impossible

```qlang
fun racine_entiere(n: int) -> int
  if n < 0 then
    panic("racine d'un négatif !")
  end
  n.sqrt() as int
end
print(racine_entiere(49))
```

Mieux que paniquer : renvoyer un nullable, laisser l'appelant décider

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

Valider avant d'agir

```qlang
fun lire_indice(xs: array<int>, i: int) -> int?
  if i < 0 or i >= xs.len() then return none end
  xs[i]
end
print(lire_indice([5, 6, 7], 1))
print(lire_indice([5, 6, 7], 9))
```

Erreurs d'exécution possibles (décommente UNE ligne à la fois pour les voir) :

`print(1 div 0)                 -- division par zéro`

`print([1, 2, 3][5])            -- indice hors limites`

`panic("boum")                  -- arrêt volontaire`

`print(int.MAX + 1)             -- dépassement d'entier`

while true do end              -- R900 : trop d'étapes (boucle infinie ?)
fun f(n: int) -> int f(n + 1) end   f(0)   -- R901 : récursion infinie

Codes de sortie du programme : 0 succès, 1 erreur de compilation,
2 erreur d'exécution. Utile dans des scripts shell.

## À retenir

- Les erreurs de types sont attrapées AVANT l'exécution : c'est un cadeau.
- assert pour tester ; panic pour l'impossible ; nullable pour l'échec normal.
- Lis toujours le message d'erreur en entier : ligne, colonne, extrait.
