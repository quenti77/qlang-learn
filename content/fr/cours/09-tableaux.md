---
title: "Les tableaux"
---

# Les tableaux

Un tableau (*array*) range plusieurs valeurs **du même type**, dans l'ordre. Son type s'écrit
`array<int>`, `array<string>`, `array<array<int>>`…

## Lire et modifier

```qlang
let notes = [12, 15, 9, 18]
print(notes)
print(notes.len())        -- 4
print(notes[0])           -- 12 : le premier est à l'indice 0
print(notes[3])           -- 18 : le dernier est à len - 1
notes[1] = 16             -- modifier un élément
print(notes)
```

Un tableau vide doit avoir un type écrit :

```qlang
let vide: array<string> = []
print(vide.is_empty())
```

## Ajouter et retirer

```qlang
let notes = [12, 16, 9, 18]
notes.push(20)            -- ajoute à la fin
notes[] = 7               -- idem (autre écriture)
print(notes)
print(notes.pop())        -- retire et renvoie le dernier : 7
notes.insert(0, 1)        -- insère 1 à l'indice 0
print(notes)
print(notes.remove(0))    -- retire l'élément d'indice 0 et le renvoie
print(notes)
```

## Questions et statistiques

```qlang
let notes = [12, 16, 9, 18, 20]
print(notes.contains(18))
print(notes.index_of(18)) -- l'indice, ou none
print(notes.min())
print(notes.max())
print(notes.sum())
let moyenne = notes.sum() / notes.len()   -- int / int donne un float
print("moyenne = {moyenne}")
```

## Trier et inverser

Ces opérations se font **sur place** : le tableau lui-même est modifié.

```qlang
let desordre = [5, 2, 9, 1, 7]
desordre.sort()
print(desordre)
desordre.reverse()
print(desordre)
let mots = ["pomme", "ananas", "kiwi"]
mots.sort()
print(mots)
```

## `slice(début, fin)` : une copie d'une partie

```qlang
let tout = [10, 20, 30, 40, 50]
print(tout.slice(1, 4))   -- [20, 30, 40]
let copie = tout.slice(0, tout.len())   -- copie complète
copie[0] = 0
print(tout)               -- inchangé
```

## Partagé, pas copié

Quand on met un tableau dans une autre variable, on ne copie pas le tableau : les deux variables désignent le **même**
tableau. Changer l'un change l'autre.

```qlang
let t1 = [1, 2, 3]
let t2 = t1          -- t2 désigne le MÊME tableau
t2[0] = 99
print(t1)            -- [99, 2, 3]  surprise !
```

Les nombres, booléens et textes, eux, sont copiés (voir le chapitre 3). Pour obtenir une vraie copie, utilise `slice`.

Un `const` fixe le **nom**, pas le contenu d'un tableau.

```qlang
const liste = [1]
liste[0] = 2
print(liste)
```

## Passer un tableau à une fonction

Les tableaux sont partagés : la fonction modifie le tableau de l'appelant.

```qlang
fun doubler_tout(xs: array<int>)
  for i in 0..xs.len() do
    xs[i] = xs[i] * 2
  end
end
let t = [1, 2, 3]
doubler_tout(t)
print(t)
```

## Parcourir

```qlang
let tout = [10, 20, 30, 40, 50]

for x in tout do write("{x} ") end
print("")
for i in 0..tout.len() do
  write("{i}:{tout[i]} ")
end
print("")
for i, x in tout do write("{i}={x} ") end
print("")
```

## Un classique : chercher un maximum

```qlang
let valeurs = [4, 17, 9, 23, 8]
let max = valeurs[0]
for v in valeurs do
  if v > max then max = v end
end
print("max = {max}")
```

## Texte et tableau

```qlang
print(["a", "b", "c"].join("-"))
print("a-b-c".split("-"))
```

## Tableaux de tableaux : une grille

```qlang
let grille: array<array<int>> = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]
print(grille[1][2])       -- ligne 1, colonne 2 -> 6
for ligne in grille do
  for v in ligne do write("{v} ") end
  print("")
end
-- Somme de la diagonale
let diag = 0
for i in 0..3 do diag += grille[i][i] end
print("diagonale : {diag}")
```

Une grille remplie de zéros :

```qlang
let n = 3
let zeros: array<array<int>> = []
for i in 0..n do
  let ligne: array<int> = []
  for j in 0..n do ligne[] = 0 end
  zeros[] = ligne
end
zeros[1][1] = 5
print(zeros)
```

## Le piège : les indices hors limites

Un indice hors des limites est une erreur d'exécution. Essaie :

<!-- expect-error -->
```qlang
let tout = [10, 20, 30]
print(tout[10])
```

Vérifie toujours avant : `if i >= 0 and i < xs.len() then …`.

## Égalité

Deux tableaux sont égaux si tous leurs éléments le sont.

```qlang
print([1, 2] == [1, 2])
print([1, 2] == [2, 1])
```

## Un nombre variable d'arguments

Le **dernier** paramètre peut ramasser tous les arguments qui restent : on met `...` devant son nom. Son type est
celui d'**un élément** ; dans la fonction, c'est un tableau.

```qlang
fun somme(...nombres: int) -> int
  let total = 0
  for n in nombres do
    total += n
  end
  total
end
print(somme())          -- 0
print(somme(1, 2, 3))   -- 6
```

Et `...` devant une valeur fait l'inverse : il **déroule** un tableau en arguments, ou dans un autre tableau.

```qlang
fun somme(...nombres: int) -> int
  let total = 0
  for n in nombres do
    total += n
  end
  total
end
let xs = [1, 2, 3]
print(somme(...xs))            -- 6
print(somme(10, ...xs, 20))    -- 36
print([...xs, 4, ...xs])       -- [1, 2, 3, 4, 1, 2, 3]
```

## À retenir

- Les indices vont de 0 à `len() - 1`.
- `push`, `pop`, `insert`, `remove`, `sort`, `reverse` modifient **sur place** ;
  `slice` copie.
- Un tableau est une référence : deux variables peuvent le partager, et une fonction qui le reçoit peut le modifier.
- `...nombres: int` ramasse les arguments restants dans un tableau ; `...liste` déroule un tableau.
