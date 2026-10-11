---
title: "Les conditions"
---

# Les conditions

Un programme doit pouvoir **choisir** : faire ceci *si* quelque chose est vrai, sinon
faire cela.

Dans les exemples de ce chapitre, on utilise une température :

```qlang
let temperature = 25
```

## `if` … `then` … `end`

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature > 20 then
  print("Il fait chaud")
end
```

## `else` : sinon

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature > 30 then
  print("canicule")
else
  print("pas de canicule")
end
```

## `elseif` : plusieurs cas

Le premier qui est vrai gagne.

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature < 0 then
  print("gel")
elseif temperature < 15 then
  print("frais")
elseif temperature < 25 then
  print("doux")
else
  print("chaud")
end
```

## Sur une seule ligne

Tout peut tenir sur une ligne.

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature == 25 then print("pile 25") end
```

La condition **doit** être un `bool`. Il n'y a pas de « vrai/faux implicite » : `if 1 then`
ou `if "texte" then` sont des erreurs. C'est voulu : moins de pièges.

## Combiner des conditions

```qlang
let age = 17
let accompagne = true
if age >= 18 or (age >= 12 and accompagne) then
  print("Entrée autorisée")
end

if not (age >= 18) then
  print("Mineur")
end
```

## `if` comme expression

`if` produit une valeur (le `else` est alors obligatoire).

```qlang
-- (défini plus haut dans ce chapitre)
let age = 17

let statut = if age >= 18 then "majeur" else "mineur" end
print(statut)
```

C'est pratique pour un maximum, une valeur absolue…

```qlang
let a = 8
let b = 12
let plus_grand = if a > b then a else b end
print("max = {plus_grand}")
```

## Conditions imbriquées

```qlang
let note = 14
if note >= 10 then
  if note >= 16 then
    print("Très bien")
  else
    print("Reçu")
  end
else
  print("Refusé")
end
```

## Exemple classique : l'année bissextile

```qlang
fun est_bissextile(annee: int) -> bool
  (annee mod 4 == 0 and annee mod 100 != 0) or annee mod 400 == 0
end
print(est_bissextile(2024))   -- true
print(est_bissextile(1900))   -- false
print(est_bissextile(2000))   -- true
```

## Comparer des chaînes

```qlang
let mot_de_passe = "secret"
if mot_de_passe == "secret" then
  print("accès accordé")
end
```

## À retenir

- `if` / `elseif` / `else` / `end` : un seul `end` pour toute la chaîne.
- La condition est toujours un `bool`.
- `if` peut servir de valeur : `let x = if c then 1 else 2 end`.
