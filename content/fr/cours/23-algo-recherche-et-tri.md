---
title: "Algorithmes : recherche et tri"
---

# Algorithmes : recherche et tri

Un algorithme est une méthode précise pour résoudre un problème. On compare les algorithmes
par leur **coût** : combien d'étapes pour `n` éléments ?

| Coût | Nom | Exemple |
| --- | --- | --- |
| O(1) | constant | accéder à `xs[i]` |
| O(log n) | logarithmique | la recherche dichotomique |
| O(n) | linéaire | parcourir un tableau |
| O(n log n) | | les bons tris |
| O(n²) | | deux boucles imbriquées (les tris simples) |

## Recherche linéaire : O(n)

```qlang
fun recherche_lineaire(xs: array<int>, cible: int) -> int?
  for i, x in xs do
    if x == cible then return i end
  end
  none
end
print(recherche_lineaire([4, 8, 15, 16, 23, 42], 16))   -- 3
print(recherche_lineaire([4, 8], 99))                   -- none
```

## Recherche dichotomique : O(log n)

Elle demande un tableau **trié**. On coupe l'espace de recherche en deux à chaque étape.

```qlang
fun dichotomie(xs: array<int>, cible: int) -> int?
  let bas = 0
  let haut = xs.len() - 1
  while bas <= haut do
    let milieu = (bas + haut) div 2
    if xs[milieu] == cible then
      return milieu
    elseif xs[milieu] < cible then
      bas = milieu + 1
    else
      haut = milieu - 1
    end
  end
  none
end
let tries = [1, 3, 5, 7, 9, 11, 13]
print(dichotomie(tries, 11))   -- 5
print(dichotomie(tries, 4))    -- none
```

## Tri à bulles : O(n²)

Simple mais lent : on échange les voisins mal placés.

```qlang
fun tri_bulles(xs: array<int>)
  let n = xs.len()
  for i in 0..n do
    for j in 0..(n - i - 1) do
      if xs[j] > xs[j + 1] then
        let tmp = xs[j]
        xs[j] = xs[j + 1]
        xs[j + 1] = tmp
      end
    end
  end
end
let a = [5, 2, 9, 1, 7, 3]
tri_bulles(a)
print(a)
```

## Tri par sélection : O(n²)

On cherche le minimum et on le place devant.

```qlang
fun tri_selection(xs: array<int>)
  let n = xs.len()
  for i in 0..n do
    let imin = i
    for j in (i + 1)..n do
      if xs[j] < xs[imin] then imin = j end
    end
    let tmp = xs[i]
    xs[i] = xs[imin]
    xs[imin] = tmp
  end
end
let b = [29, 3, 17, 8, 1]
tri_selection(b)
print(b)
```

## Tri par insertion : O(n²)

Rapide sur du presque trié. C'est comme trier des cartes dans sa main.

```qlang
fun tri_insertion(xs: array<int>)
  for i in 1..xs.len() do
    let cle = xs[i]
    let j = i - 1
    while j >= 0 and xs[j] > cle do
      xs[j + 1] = xs[j]
      j -= 1
    end
    xs[j + 1] = cle
  end
end
let c = [9, 4, 6, 2, 8]
tri_insertion(c)
print(c)
```

## Tri fusion : O(n log n)

C'est « diviser pour régner » : on coupe en deux, on trie chaque moitié (récursivement),
puis on fusionne.

```qlang
fun fusionner(g: array<int>, d: array<int>) -> array<int>
  let res: array<int> = []
  let i = 0
  let j = 0
  while i < g.len() and j < d.len() do
    if g[i] <= d[j] then
      res[] = g[i]
      i += 1
    else
      res[] = d[j]
      j += 1
    end
  end
  while i < g.len() do
    res[] = g[i]
    i += 1
  end
  while j < d.len() do
    res[] = d[j]
    j += 1
  end
  res
end

fun tri_fusion(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let m = xs.len() div 2
  fusionner(tri_fusion(xs.slice(0, m)), tri_fusion(xs.slice(m, xs.len())))
end
print(tri_fusion([38, 27, 43, 3, 9, 82, 10]))
```

## Tri rapide : O(n log n) en moyenne

On choisit un pivot, on sépare les plus petits des plus grands, puis on recommence.

```qlang
fun tri_rapide(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let pivot = xs[0]
  let petits: array<int> = []
  let grands: array<int> = []
  for i in 1..xs.len() do
    if xs[i] < pivot then petits[] = xs[i] else grands[] = xs[i] end
  end
  let res = tri_rapide(petits)
  res[] = pivot
  for g in tri_rapide(grands) do res[] = g end
  res
end
print(tri_rapide([38, 27, 43, 3, 9, 82, 10]))
```

## Les comparer au tri natif

Un bon réflexe : vérifier que ton tri donne le même résultat que `sort`.

```qlang
fun tri_rapide(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let pivot = xs[0]
  let petits: array<int> = []
  let grands: array<int> = []
  for i in 1..xs.len() do
    if xs[i] < pivot then petits[] = xs[i] else grands[] = xs[i] end
  end
  let res = tri_rapide(petits)
  res[] = pivot
  for g in tri_rapide(grands) do res[] = g end
  res
end

let ref = [8, 3, 5, 1, 9, 2, 7]
let natif = ref.slice(0, ref.len())
natif.sort()
assert(tri_rapide(ref) == natif, "tri rapide == sort natif")
print("le tri rapide concorde avec sort")
```

## À retenir

- La dichotomie exige un tableau trié et divise le travail par 2 à chaque tour.
- Les tris simples sont en O(n²) ; le tri fusion et le tri rapide en O(n log n).
- En pratique, on utilise `xs.sort()`, mais comprendre les tris est formateur.
