---
title: "Algorithmes : nombres et textes"
---

# Algorithmes : nombres et textes

## Les nombres premiers

```qlang
fun est_premier(n: int) -> bool
  if n < 2 then return false end
  let d = 2
  while d * d <= n do
    if n mod d == 0 then return false end
    d += 1
  end
  true
end
for n in 1..30 do
  if est_premier(n) then write("{n} ") end
end
print("")
```

## Le crible d'Ératosthène

Tous les nombres premiers jusqu'à `n`, très efficacement.

```qlang
fun crible(n: int) -> array<int>
  let premier: array<bool> = []
  for i in 0..=n do premier[] = true end
  let res: array<int> = []
  for i in 2..=n do
    if premier[i] then
      res[] = i
      let k = i * i
      while k <= n do
        premier[k] = false
        k += i
      end
    end
  end
  res
end
print(crible(60))
```

## Décomposition en facteurs premiers

```qlang
fun facteurs(n: int) -> array<int>
  let res: array<int> = []
  let d = 2
  while n > 1 do
    while n mod d == 0 do
      res[] = d
      n = n div d
    end
    d += 1
  end
  res
end
print(facteurs(360))     -- [2, 2, 2, 3, 3, 5]
```

## Conversion en binaire

Ou dans n'importe quelle base jusqu'à 10.

```qlang
fun en_base(n: int, base: int) -> string
  if n == 0 then return "0" end
  let s = ""
  while n > 0 do
    s = (n mod base) as string + s
    n = n div base
  end
  s
end
print(en_base(42, 2))     -- 101010
print(en_base(255, 8))    -- 377
```

## Les nombres parfaits

Un exercice classique (comme les nombres d'Armstrong…).

```qlang
fun est_parfait(n: int) -> bool
  let s = 0
  for d in 1..n do
    if n mod d == 0 then s += d end
  end
  s == n and n > 1
end
for n in 1..500 do
  if est_parfait(n) then write("{n} ") end
end
print("")
```

## Les textes

### Compter les voyelles

```qlang
fun voyelles(s: string) -> int
  let n = 0
  for c in s.lower() do
    if "aeiouy".contains(c) then n += 1 end
  end
  n
end
print(voyelles("Programmation"))
```

### Anagrammes

Deux mots sont des anagrammes s'ils ont les mêmes lettres une fois triées.

```qlang
fun trier_lettres(s: string) -> string
  let cs = s.chars()
  cs.sort()
  cs.join("")
end
fun anagrammes(a: string, b: string) -> bool
  trier_lettres(a) == trier_lettres(b)
end
print(anagrammes("chien", "niche"))
print(anagrammes("chien", "chat"))
```

### Le chiffre de César

```qlang
fun cesar(s: string, decalage: int) -> string
  let res = ""
  for c in s do
    let code = c.code()
    if code >= 97 and code <= 122 then
      res += ((code - 97 + decalage) mod 26 + 97).char()
    else
      res += c
    end
  end
  res
end
let secret = cesar("bonjour le monde", 3)
print(secret)
print(cesar(secret, 23))     -- 26 - 3 : on retrouve le message
```

### Le mot le plus fréquent

```qlang
fun plus_frequent(texte: string) -> string?
  let compte: map<string, int> = {}
  for m in texte.lower().words() do
    compte[m] = compte.get(m, 0) + 1
  end
  let best: string? = none
  let n = 0
  for m, c in compte do
    if c > n then
      n = c
      best = m
    end
  end
  best
end
print(plus_frequent("le chat voit le chien et le rat"))
```

### Parenthèses bien équilibrées

On utilise une pile.

```qlang
fun equilibre(s: string) -> bool
  let pile: array<string> = []
  for c in s do
    if "([\{".contains(c) then
      pile[] = c
    elseif ")]\}".contains(c) then
      let haut = pile.pop()
      if haut == none then return false end
      let attendu = match c
        case ")" then "("
        case "]" then "["
        else "\{"
      end
      if haut != attendu then return false end
    end
  end
  pile.is_empty()
end
print(equilibre("(a[b]\{c\})"))
print(equilibre("(a[b)]"))
```

### Distance de Levenshtein

C'est le nombre de modifications pour passer d'un mot à l'autre (programmation dynamique).

```qlang
fun levenshtein(a: string, b: string) -> int
  let prev: array<int> = []
  for j in 0..=b.len() do prev[] = j end
  for i in 1..=a.len() do
    let cur = [i]
    for j in 1..=b.len() do
      let cout = if a[i - 1] == b[j - 1] then 0 else 1 end
      cur[] = (prev[j] + 1).min((cur[j - 1] + 1).min(prev[j - 1] + cout))
    end
    prev = cur
  end
  prev[b.len()]
end
print(levenshtein("kitten", "sitting"))   -- 3
```

## À retenir

- Les chaînes se parcourent comme des tableaux de caractères en lecture seule : boucle
  `for`, indices, `code()` / `char()`.
- Une pile (un tableau avec `push` / `pop`) sert pour les parenthèses, pour annuler, pour
  évaluer une expression.
- Programmation dynamique : mémoriser des sous-résultats.
