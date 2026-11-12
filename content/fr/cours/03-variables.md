---
title: "Les variables"
---

# Les variables

Une variable est une **boîte étiquetée** qui garde une valeur pour plus tard.

## Créer une variable

`let` crée une variable. Elle est **toujours** initialisée.

```qlang
let age = 30
print(age)
```

## Changer sa valeur

On peut changer sa valeur : c'est une réaffectation.

```qlang
-- (défini plus haut dans ce chapitre)
let age = 30

age = 31
print(age)
```

## Le type

Le type est deviné (on dit *inféré*) : ici `age` est un `int`. On peut aussi l'écrire
explicitement après les deux-points.

```qlang
let taille: float = 1.75
let prenom: string = "Ada"
print("{prenom} mesure {taille} m")
```

Une variable garde son type : `age = "trente"` serait une **erreur**. Essaie-le dans
l'exemple ci-dessus.

## Les constantes

Avec `const`, le nom ne peut plus être réaffecté.

```qlang
const PI_APPROX = 3.14
print(PI_APPROX)
-- PI_APPROX = 3     -- erreur !
```

## Calculer avec des variables

On peut calculer une variable à partir d'autres.

```qlang
let largeur = 4
let hauteur = 5
let aire = largeur * hauteur
print("aire = {aire}")
```

## Les raccourcis

`x += 1` veut dire `x = x + 1`. Il existe aussi `-=`, `*=`…

```qlang
let compteur = 0
compteur += 1
compteur += 1
compteur *= 10
compteur -= 5
print(compteur)   -- 15
```

## Échanger deux valeurs

On utilise une variable temporaire.

```qlang
let a = 1
let b = 2
let tmp = a
a = b
b = tmp
print("a={a} b={b}")
```

## Copier une valeur

Quand on met une variable dans une autre, les nombres, les booléens et les textes sont **copiés** : les deux
variables sont ensuite indépendantes.

```qlang
let n1 = 5
let n2 = n1
n2 = 6
print(n1)            -- 5
```

Les tableaux, eux, se comportent autrement : on les voit au chapitre 9.

## À retenir

- `let` = variable modifiable, `const` = nom figé.
- Le type d'une variable ne change jamais.
- Les nombres, booléens et textes se copient d'une variable à l'autre.
- `x += 1`, `x -= 1`, `x *= 2` sont des raccourcis.
