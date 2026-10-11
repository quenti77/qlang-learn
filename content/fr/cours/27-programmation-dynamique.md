---
title: "Programmation dynamique et glouton"
---

# Programmation dynamique et glouton

L'idée : un gros problème est fait de petits problèmes qui se répètent. On stocke chaque
réponse (dans un tableau ou un dictionnaire) pour ne la calculer qu'une fois.

## Les escaliers

De combien de façons peut-on monter `n` marches, par pas de 1 ou 2 ?

```qlang
fun escaliers(n: int) -> int
  let t: array<int> = [1, 1]
  for i in 2..=n do
    t[] = t[i - 1] + t[i - 2]
  end
  t[n]
end
print(escaliers(10))   -- 89
```

## Le rendu de monnaie

Le moins de pièces pour atteindre une somme.

```qlang
fun rendu(pieces: array<int>, somme: int) -> int?
  let t: array<int?> = [0]
  for s in 1..=somme do
    let best: int? = none
    for p in pieces do
      if p <= s then
        let prev = t[s - p]
        if prev != none then
          if best == none or prev + 1 < best then best = prev + 1 end
        end
      end
    end
    t[] = best
  end
  t[somme]
end
print(rendu([1, 5, 10, 25], 63))   -- 6
print(rendu([4, 6], 7))            -- none : impossible
```

## Les algorithmes gloutons

À chaque étape, on prend le meilleur choix local. C'est rapide, mais pas toujours optimal :
voici un contre-exemple.

```qlang
-- (défini plus haut dans ce chapitre)
fun rendu(pieces: array<int>, somme: int) -> int?
  let t: array<int?> = [0]
  for s in 1..=somme do
    let best: int? = none
    for p in pieces do
      if p <= s then
        let prev = t[s - p]
        if prev != none then
          if best == none or prev + 1 < best then best = prev + 1 end
        end
      end
    end
    t[] = best
  end
  t[somme]
end

fun rendu_glouton(pieces: array<int>, somme: int) -> int
  let p = pieces.slice(0, pieces.len())
  p.sort()
  p.reverse()
  let n = 0
  for piece in p do
    while somme >= piece do
      somme -= piece
      n += 1
    end
  end
  n
end
print(rendu_glouton([1, 5, 10, 25], 63))   -- 6 : optimal
print(rendu_glouton([1, 3, 4], 6))         -- 3 (4+1+1) alors que 3+3 = 2 pièces !
print(rendu([1, 3, 4], 6))                 -- 2
```

## La plus longue sous-suite commune (LCS)

```qlang
fun lcs(a: string, b: string) -> int
  let t: array<array<int>> = []
  for i in 0..=a.len() do
    let ligne: array<int> = []
    for j in 0..=b.len() do ligne[] = 0 end
    t[] = ligne
  end
  for i in 1..=a.len() do
    for j in 1..=b.len() do
      if a[i - 1] == b[j - 1] then
        t[i][j] = t[i - 1][j - 1] + 1
      else
        t[i][j] = t[i - 1][j].max(t[i][j - 1])
      end
    end
  end
  t[a.len()][b.len()]
end
print(lcs("ABCBDAB", "BDCABA"))   -- 4
```

## Le sac à dos 0/1

Maximiser la valeur sans dépasser la capacité.

```qlang
fun sac_a_dos(poids: array<int>, valeurs: array<int>, capacite: int) -> int
  let best: array<int> = []
  for c in 0..=capacite do best[] = 0 end
  for i in 0..poids.len() do
    let c = capacite
    while c >= poids[i] do
      best[c] = best[c].max(best[c - poids[i]] + valeurs[i])
      c -= 1
    end
  end
  best[capacite]
end
print(sac_a_dos([1, 3, 4, 5], [1, 4, 5, 7], 7))   -- 9
```

## Le sous-tableau de somme maximale

L'algorithme de Kadane le trouve en un seul passage, en O(n).

```qlang
fun kadane(xs: array<int>) -> int
  let courant = xs[0]
  let meilleur = xs[0]
  for i in 1..xs.len() do
    courant = xs[i].max(courant + xs[i])
    meilleur = meilleur.max(courant)
  end
  meilleur
end
print(kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]))   -- 6
```

## À retenir

- Programmation dynamique : des sous-problèmes qui se recoupent, plus une mémoire.
- Glouton : rapide, mais à prouver (il peut se tromper).
