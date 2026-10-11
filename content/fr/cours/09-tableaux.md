---
title: "Les tableaux"
---

# Les tableaux

Un tableau (array) range plusieurs valeurs DU MÊME TYPE dans l'ordre.
Type : array<int>, array<string>, array<array<int>>...

```qlang
let notes = [12, 15, 9, 18]
print(notes)
print(notes.len())        -- 4
print(notes[0])           -- 12 : le premier est à l'indice 0
print(notes[3])           -- 18 : le dernier est à len - 1
notes[1] = 16             -- modifier un élément
print(notes)

-- Un tableau vide doit avoir un type écrit
let vide: array<string> = []
print(vide.is_empty())

-- Ajouter / retirer
notes.push(20)            -- ajoute à la fin
notes[] = 7               -- idem (autre écriture)
print(notes)
print(notes.pop())        -- retire et renvoie le dernier : 7
notes.insert(0, 1)        -- insère 1 à l'indice 0
print(notes)
print(notes.remove(0))    -- retire l'élément d'indice 0 et le renvoie
print(notes)

-- Questions
print(notes.contains(18))
print(notes.index_of(18)) -- indice ou none

-- Statistiques
print(notes.min())
print(notes.max())
print(notes.sum())
let moyenne = notes.sum() / notes.len()   -- int / int donne un float
print("moyenne = {moyenne}")
```

Trier et inverser (SUR PLACE : le tableau lui-même est modifié)

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

slice(debut, fin) : une COPIE d'une partie

```qlang
let tout = [10, 20, 30, 40, 50]
print(tout.slice(1, 4))   -- [20, 30, 40]
let copie = tout.slice(0, tout.len())   -- copie complète
copie[0] = 0
print(tout)               -- inchangé
```

Parcourir

```qlang
-- (défini plus haut dans ce chapitre)
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

Texte <-> tableau

```qlang
print(["a", "b", "c"].join("-"))
print("a-b-c".split("-"))
```

Tableaux de tableaux = grille / matrice

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

Créer une grille remplie de zéros

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

PIÈGE : un indice hors limites est une erreur d'exécution.

`print(tout[10])   -- décommente pour voir R-erreur`

Toujours vérifier : if i >= 0 and i < xs.len() then ...

Égalité : deux tableaux sont égaux si tous leurs éléments le sont

```qlang
print([1, 2] == [1, 2])
print([1, 2] == [2, 1])
```

## À retenir

- Indices de 0 à len-1.
- push/pop/insert/remove/sort/reverse modifient SUR PLACE ;
  slice copie.
- Un tableau est une référence : deux variables peuvent le partager.
