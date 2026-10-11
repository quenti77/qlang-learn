---
title: "Les boucles"
---

# Les boucles

Répéter une action sans la réécrire 100 fois.

## while : répète TANT QUE la condition est vraie

```qlang
let n = 1
while n <= 5 do
  write("{n} ")
  n += 1            -- sans ça : boucle infinie !
end
print("")
```

## for + intervalle : un nombre de tours connu

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

## for sur un tableau / une chaîne

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

## break et continue

```qlang
for i in 1..=10 do
  if i mod 2 == 0 then continue end   -- saute les pairs
  if i > 7 then break end             -- arrête tout
  write("{i} ")
end
print("")
```

Il n'y a pas de `loop` : on écrit while true

```qlang
let essais = 0
while true do
  essais += 1
  if essais * essais > 50 then break end
end
print("premier essai dont le carré dépasse 50 : {essais}")
```

## Boucles imbriquées : une boucle dans une boucle

```qlang
for ligne in 1..=3 do
  for col in 1..=4 do
    let cell = (ligne * col) as string
    write(cell.pad_left(3, " "))
  end
  print("")
end
```

Dessiner un triangle

```qlang
for i in 1..=5 do
  print("*".repeat(i))
end
```

## Patrons classiques

1. Accumuler (somme)

```qlang
let somme = 0
for i in 1..=100 do
  somme += i
end
print("1+2+...+100 = {somme}")      -- 5050
```

2. Compter

```qlang
let pairs = 0
for i in 1..=20 do
  if i mod 2 == 0 then pairs += 1 end
end
print("pairs entre 1 et 20 : {pairs}")
```

3. Chercher un maximum

```qlang
let valeurs = [4, 17, 9, 23, 8]
let max = valeurs[0]
for v in valeurs do
  if v > max then max = v end
end
print("max = {max}")
```

4. FizzBuzz, le classique des entretiens

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

## À retenir

- while = tant que ; for = pour chaque.
- a..b exclut b, a..=b l'inclut. `step` règle le pas.
- break sort de la boucle, continue passe au tour suivant.
- Boucle infinie ? qlang s'arrête tout seul après 100 millions d'étapes (R900).
