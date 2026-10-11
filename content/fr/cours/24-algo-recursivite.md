---
title: "Algorithmes — récursivité et diviser pour régner"
---

# Algorithmes — récursivité et diviser pour régner

Puissance rapide : x^n en O(log n) en élevant au carré

```qlang
fun puissance(x: int, n: int) -> int
  if n == 0 then return 1 end
  let moitie = puissance(x, n div 2)
  if n mod 2 == 0 then moitie * moitie else moitie * moitie * x end
end
print(puissance(2, 30))
```

PGCD : algorithme d'Euclide (vieux de 2300 ans, toujours le meilleur)

```qlang
fun pgcd(a: int, b: int) -> int
  if b == 0 then a else pgcd(b, a mod b) end
end
print(pgcd(1071, 462))     -- 21
```

Somme des chiffres

```qlang
fun somme_chiffres(n: int) -> int
  if n < 10 then n else n mod 10 + somme_chiffres(n div 10) end
end
print(somme_chiffres(12345))   -- 15
```

Palindrome

```qlang
fun palindrome(s: string) -> bool
  if s.len() < 2 then return true end
  if s[0] != s[s.len() - 1] then return false end
  palindrome(s.substring(1, s.len() - 1))
end
print(palindrome("kayak"))
print(palindrome("bonjour"))
```

Tours de Hanoï : déplacer n disques de A vers C en passant par B

```qlang
let coups = 0
fun hanoi(n: int, de: string, vers: string, via: string)
  if n == 0 then return end
  hanoi(n - 1, de, via, vers)
  coups += 1
  if n == 3 then print("disque {n} : {de} -> {vers}") end
  hanoi(n - 1, via, vers, de)
end
hanoi(4, "A", "C", "B")
print("{coups} coups (2^4 - 1 = 15)")
```

Toutes les permutations d'un tableau (retour sur trace / backtracking)

```qlang
fun permutations(xs: array<int>) -> array<array<int>>
  if xs.len() <= 1 then return [xs] end
  let res: array<array<int>> = []
  for i in 0..xs.len() do
    let reste: array<int> = []
    for j in 0..xs.len() do
      if j != i then reste[] = xs[j] end
    end
    for p in permutations(reste) do
      let nouvelle = [xs[i]]
      for v in p do nouvelle[] = v end
      res[] = nouvelle
    end
  end
  res
end
let perms = permutations([1, 2, 3])
print(perms.len())
for p in perms do print(p) end
```

Tous les sous-ensembles (l'ensemble des parties)

```qlang
fun sous_ensembles(xs: array<int>, i: int) -> array<array<int>>
  if i == xs.len() then return [[]] end
  let sans = sous_ensembles(xs, i + 1)
  let res: array<array<int>> = []
  for s in sans do res[] = s end
  for s in sans do
    let avec = [xs[i]]
    for v in s do avec[] = v end
    res[] = avec
  end
  res
end
print(sous_ensembles([1, 2, 3], 0))
```

Le problème des N reines : placer N reines sans qu'elles se menacent

```qlang
fun reines(n: int, ligne: int, cols: array<int>) -> int
  if ligne == n then return 1 end
  let total = 0
  for c in 0..n do
    let ok = true
    for r in 0..ligne do
      let d = cols[r] - c
      if d == 0 or d.abs() == ligne - r then ok = false end
    end
    if ok then
      cols[ligne] = c
      total += reines(n, ligne + 1, cols)
    end
  end
  total
end
let cols: array<int> = []
for i in 0..6 do cols[] = 0 end
print("solutions pour 6 reines : {reines(6, 0, cols)}")   -- 4
```

Fibonacci : naïf (exponentiel) vs itératif (linéaire)

```qlang
fun fib_iteratif(n: int) -> int
  let a = 0
  let b = 1
  for i in 0..n do
    let t = a + b
    a = b
    b = t
  end
  a
end
print(fib_iteratif(80))
```

## À retenir

- Toute récursion = cas de base + appel sur un problème plus petit.
- Diviser pour régner : puissance rapide, tri fusion, dichotomie.
- Retour sur trace : essayer, vérifier, annuler (reines, permutations).
- Profondeur max 1000 : pour de grosses données, préfère une boucle.
