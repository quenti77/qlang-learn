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

## À retenir

- `fun nom(param: type) -> type_retour … end`
- Dernière expression = valeur renvoyée ; `return` pour sortir plus tôt.
- Récursion = cas de base + cas récursif.
- Une fonction est une valeur : on peut la ranger dans une variable ou la passer à une autre fonction.
- Limite de profondeur : 1000 appels imbriqués (erreur `R901`) ; 250 sur ce site, où le
  navigateur a moins de place.
