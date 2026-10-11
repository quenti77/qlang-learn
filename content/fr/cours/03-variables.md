---
title: "Les variables"
---

# Les variables

Une variable est une BOÎTE ÉTIQUETÉE qui garde une valeur pour plus tard.

`let` crée une variable. Elle est TOUJOURS initialisée.

```qlang
let age = 30
print(age)
```

On peut changer sa valeur (réaffecter).

```qlang
-- (défini plus haut dans ce chapitre)
let age = 30

age = 31
print(age)
```

Le type est deviné (inféré) : ici age est un int.
On peut aussi l'écrire explicitement après les deux-points.

```qlang
let taille: float = 1.75
let prenom: string = "Ada"
print("{prenom} mesure {taille} m")
```

Une variable garde son type : ceci serait une ERREUR (décommente pour voir) :

`age = "trente"`

`const` : le nom ne peut plus être réaffecté.

```qlang
const PI_APPROX = 3.14
print(PI_APPROX)
-- PI_APPROX = 3     -- erreur !
```

On peut calculer une variable à partir d'autres.

```qlang
let largeur = 4
let hauteur = 5
let aire = largeur * hauteur
print("aire = {aire}")
```

Raccourcis : x += 1 veut dire x = x + 1

```qlang
let compteur = 0
compteur += 1
compteur += 1
compteur *= 10
compteur -= 5
print(compteur)   -- 15
```

Échanger deux valeurs avec une variable temporaire

```qlang
let a = 1
let b = 2
let tmp = a
a = b
b = tmp
print("a={a} b={b}")
```

## Portée : une variable créée dans un bloc n'existe que dans ce bloc

```qlang
let x = 1
if true then
  let x = 100           -- une AUTRE variable x, qui cache la première
  print("dedans : {x}")
end
print("dehors : {x}")  -- 1
```

## Références : tableaux et structures sont PARTAGÉS, pas copiés

```qlang
let t1 = [1, 2, 3]
let t2 = t1          -- t2 désigne LE MÊME tableau
t2[0] = 99
print(t1)            -- [99, 2, 3]  surprise !
```

Les nombres, booléens et textes, eux, sont copiés.

```qlang
let n1 = 5
let n2 = n1
n2 = 6
print(n1)            -- 5
```

Un `const` fixe le NOM, pas le contenu d'un tableau.

```qlang
const liste = [1]
liste[0] = 2
print(liste)
```

## À retenir

- let = variable modifiable, const = nom figé.
- Le type d'une variable ne change jamais.
- Les tableaux se partagent (référence), les nombres se copient.
- x += 1, x -= 1, x *= 2 sont des raccourcis.
