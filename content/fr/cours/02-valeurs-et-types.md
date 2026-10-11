---
title: "Valeurs et types"
---

# Valeurs et types

Toute valeur a un TYPE : ce qu'elle est (un nombre entier, du texte...).
qlang vérifie les types AVANT de lancer le programme. Si tu mélanges des
choses incompatibles, il te le dit tout de suite, avec la ligne exacte.

int : nombre entier (64 bits)

```qlang
print(42)
print(-7)
print(1_000_000)      -- le _ sert à rendre les grands nombres lisibles
print(0xFF)           -- hexadécimal (base 16)  -> 255
print(0b1010)         -- binaire (base 2)       -> 10
```

float : nombre à virgule (on écrit un point)

```qlang
print(3.14)
print(2.5e3)          -- notation scientifique : 2.5 x 10^3 = 2500.0
print(1.0)            -- 1.0 est un float, 1 est un int : ce sont deux types !
```

bool : vrai ou faux (deux valeurs seulement)

```qlang
print(true)
print(false)
```

string : du texte

```qlang
print("bonjour")
print("")             -- la chaîne vide existe aussi
```

none : "rien du tout" (on y revient au cours 11)

```qlang
print(none)
```

## Interpolation : mettre des valeurs dans du texte avec { }

```qlang
print("1 + 2 = {1 + 2}")
print("Le double de 21 est {21 * 2}")
-- Pour afficher une vraie accolade : \{ et \}
print("Une accolade : \{ ouverte")
```

## Conversions : changer de type avec `as`

Pas de conversion automatique int -> float dans une variable :
on le demande explicitement.

```qlang
print(7 as float)         -- 7.0
print(3.99 as int)        -- 3  (on coupe la partie décimale, on n'arrondit pas)
print(42 as string)       -- "42" (du texte, plus un nombre)
print(true as string)     -- "true"
```

Convertir du texte en nombre peut ÉCHOUER ("abc" n'est pas un nombre).
Donc le résultat est "un int OU none" (on note int?).

```qlang
print(int.parse("123"))   -- 123
print(int.parse("abc"))   -- none
print(float.parse("2.5")) -- 2.5
```

## Les tableaux et dictionnaires (détaillés aux cours 09 et 10)

```qlang
print([1, 2, 3])
print({ "a": 1, "b": 2 })
```

## À retenir

- Types de base : int, float, bool, string.
- 1 (int) et 1.0 (float) sont des types différents.
- "{...}" insère une valeur dans un texte.
- `x as type` convertit quand la conversion réussit toujours.
- `int.parse(texte)` renvoie `none` si ça échoue.

## À essayer

- print(10 as string + "!")   puis   print(10 + "!")  (lis l'erreur)
- print(int.parse("12") )  puis avec "12.5"
