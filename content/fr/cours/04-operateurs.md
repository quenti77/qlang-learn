---
title: "Opérateurs"
---

# Opérateurs

## Arithmétique

```qlang
print(7 + 2)       -- 9
print(7 - 2)       -- 5
print(7 * 2)       -- 14
print(7 / 2)       -- 3.5  : `/` donne TOUJOURS un float
print(7 div 2)     -- 3    : division entière (on jette le reste)
print(7 mod 2)     -- 1    : le reste de la division (aussi noté %)
print(7 % 2)       -- 1
print(2 ** 10)     -- 1024 : puissance
print(-7 div 2)    -- -3   (on tronque vers zéro)
print(5.5 mod 2)   -- 1.5
```

## Mélanger `int` et `float`

```qlang
print(1 + 2.5)     -- 3.5
print(1 == 1.0)    -- true
```

## Priorité

Comme en maths, `*` passe avant `+`. Les parenthèses forcent l'ordre.

```qlang
print(2 + 3 * 4)   -- 14
print((2 + 3) * 4) -- 20
print(2 ** 3 ** 2) -- 512 (2 ** 9) : la puissance s'évalue de droite à gauche
print(-2 ** 2)     -- -4 : c'est -(2 ** 2)
```

Astuce : `mod` sert à tester pair/impair, multiple, etc.

```qlang
print(10 mod 2 == 0)    -- true : 10 est pair
print(15 mod 5 == 0)    -- true : 15 est multiple de 5
```

## Comparaisons

Elles donnent un `bool`.

```qlang
print(3 < 5)
print(3 <= 3)
print(3 > 5)
print(3 >= 4)
print(3 == 3)
print(3 != 4)
print("a" < "b")        -- ordre alphabétique
print("abc" == "abc")
```

## Logique : `and`, `or`, `not`

```qlang
print(true and false)   -- false
print(true or false)    -- true
print(not true)         -- false
let age = 20
print(age >= 18 and age < 65)   -- true
```

`and` et `or` sont « paresseux » : si le côté gauche suffit, le droit n'est jamais
calculé. Ici `1 div 0` serait une erreur, mais il n'est pas évalué :

```qlang
print(false and (1 div 0 == 0))   -- false, pas d'erreur
```

## Intervalles

`a..b` exclut `b` et `a..=b` l'inclut. Ils servent surtout avec `for`.

```qlang
for i in 0..3 do write("{i} ") end
print("")
for i in 0..=3 do write("{i} ") end
print("")
```

## Fonctions numériques

```qlang
print(10.abs())          -- 10
print((-10).abs())       -- 10
print(3.min(8))          -- 3
print(3.max(8))          -- 8
print(2.pow(8))          -- 256
print(16.sqrt())         -- 4.0
print(3.7.floor())       -- 3
print(3.2.ceil())        -- 4
print(3.5.round())       -- 4
print(float.PI)
print(int.MAX)
```

## Attention aux flottants

Les ordinateurs sont inexacts avec les décimales.

```qlang
print(0.1 + 0.2)         -- 0.30000000000000004 ! (ce n'est pas un bug de qlang)
```

## Débordement

Un `int` ne dépasse pas 64 bits : dépasser est une erreur d'exécution. Essaie
`print(int.MAX + 1)` dans l'exemple précédent.

## À retenir

- `/` donne un float, `div` un entier, `mod` le reste.
- `and`, `or`, `not` combinent des booléens.
- Les comparaisons ne se chaînent pas : `a < b < c` est interdit, écris
  `a < b and b < c`.
