---
title: "Les boucles"
---

# Les boucles

Une boucle répète une action sans qu'on ait à la réécrire 100 fois.

## `while` : répète tant que la condition est vraie

```qlang
let n = 1
while n <= 5 do
  write("{n} ")
  n += 1            -- sans ça : boucle infinie !
end
print("")
```

## `for` avec un intervalle : un nombre de tours connu

```qlang
for i in 0..5 do        -- 0,1,2,3,4 (5 exclu)
  write("{i} ")
end
print("")

for i in 1..=5 do       -- 1,2,3,4,5 (5 inclus)
  write("{i} ")
end
print("")

for i in 0..=10 step 2 do      -- de 2 en 2
  write("{i} ")
end
print("")

for i in 10..0 step -3 do      -- à rebours : 10, 7, 4, 1
  write("{i} ")
end
print("")
```

## `for` sur un tableau ou une chaîne

```qlang
let fruits = ["pomme", "poire", "prune"]
for f in fruits do
  print("J'aime la {f}")
end

for i, f in fruits do            -- avec l'indice
  print("{i} -> {f}")
end

for lettre in "abc" do
  write(lettre.upper())
end
print("")
```

## `break` et `continue`

`continue` passe au tour suivant, `break` sort de la boucle.

```qlang
for i in 1..=10 do
  if i mod 2 == 0 then continue end   -- saute les pairs
  if i > 7 then break end             -- arrête tout
  write("{i} ")
end
print("")
```

Il n'y a pas de `loop` : on écrit `while true`.

```qlang
let essais = 0
while true do
  essais += 1
  if essais * essais > 50 then break end
end
print("premier essai dont le carré dépasse 50 : {essais}")
```

## Boucles imbriquées

Une boucle peut contenir une autre boucle.

```qlang
for ligne in 1..=3 do
  for col in 1..=4 do
    let cell = (ligne * col) as string
    write(cell.pad_left(3, " "))
  end
  print("")
end
```

Un triangle :

```qlang
for i in 1..=5 do
  print("*".repeat(i))
end
```

## Patrons classiques

### Accumuler (une somme)

```qlang
let somme = 0
for i in 1..=100 do
  somme += i
end
print("1+2+...+100 = {somme}")      -- 5050
```

### Compter

```qlang
let pairs = 0
for i in 1..=20 do
  if i mod 2 == 0 then pairs += 1 end
end
print("pairs entre 1 et 20 : {pairs}")
```

### Chercher un maximum

```qlang
let valeurs = [4, 17, 9, 23, 8]
let max = valeurs[0]
for v in valeurs do
  if v > max then max = v end
end
print("max = {max}")
```

### FizzBuzz

Le classique des entretiens d'embauche.

```qlang
for i in 1..=15 do
  if i mod 15 == 0 then write("FizzBuzz ")
  elseif i mod 3 == 0 then write("Fizz ")
  elseif i mod 5 == 0 then write("Buzz ")
  else write("{i} ")
  end
end
print("")
```

## `for` sur son propre type

`for` parcourt un tableau, une chaîne, un intervalle ou un dictionnaire. Pour qu'il parcoure **ton** type, il suffit
d'implémenter `Iterator<T>` : une méthode `next` qui rend `Step.Item(valeur)` tant qu'il reste des éléments, puis
`Step.End`. (On n'utilise pas `T?` : un élément peut valoir `none` sans arrêter la boucle.)

```qlang
struct Compteur
  public n: int
  public max: int
end

impl Iterator<int> for Compteur
  public fun next(self) -> Step<int>
    if self.n >= self.max then
      return Step<int>.End
    end
    self.n += 1
    Step<int>.Item(self.n)
  end
end

for x in Compteur { n: 0, max: 3 } do
  print(x)
end
```

Un itérateur a aussi des méthodes **paresseuses** : `map`, `filter`, `take`, `skip` ne calculent rien tant qu'on ne
parcourt pas le résultat, et `collect()` en fait un tableau.

```qlang
struct Compteur
  public n: int
  public max: int
end

impl Iterator<int> for Compteur
  public fun next(self) -> Step<int>
    if self.n >= self.max then
      return Step<int>.End
    end
    self.n += 1
    Step<int>.Item(self.n)
  end
end

let pairs = Compteur { n: 0, max: 1000000000 }.filter(fun(x: int) -> bool x % 2 == 0 end)
print(pairs.map(fun(x: int) -> int x * x end).take(3).collect())
print([1, 2, 3].iter().map(fun(x: int) -> int x + 1 end).collect())
```

## À retenir

- `while` = tant que ; `for` = pour chaque.
- `a..b` exclut `b`, `a..=b` l'inclut. `step` règle le pas.
- `break` sort de la boucle, `continue` passe au tour suivant.
- Boucle infinie ? qlang s'arrête tout seul après un nombre limite d'étapes (erreur `R900`).
