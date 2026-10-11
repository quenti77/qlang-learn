---
title: "Les conditions"
---

# Les conditions

Un programme doit pouvoir CHOISIR : faire ceci SI quelque chose est vrai,
sinon faire cela.

```qlang
let temperature = 25
```

if ... then ... end

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature > 20 then
  print("Il fait chaud")
end
```

else : sinon

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature > 30 then
  print("canicule")
else
  print("pas de canicule")
end
```

elseif : plusieurs cas, le premier qui est vrai gagne

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

Tout tient sur une ligne si on veut

```qlang
-- (défini plus haut dans ce chapitre)
let temperature = 25

if temperature == 25 then print("pile 25") end
```

La condition DOIT être un bool. Pas de "vrai/faux implicite" :
`if 1 then` ou `if "texte" then` sont des erreurs. C'est voulu : moins de pièges.

Combiner des conditions

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

if est une EXPRESSION : il produit une valeur (else obligatoire)

```qlang
-- (défini plus haut dans ce chapitre)
let age = 17

let statut = if age >= 18 then "majeur" else "mineur" end
print(statut)
```

Pratique pour un maximum, une valeur absolue...

```qlang
let a = 8
let b = 12
let plus_grand = if a > b then a else b end
print("max = {plus_grand}")
```

Conditions imbriquées

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

Exemple classique : année bissextile

```qlang
fun est_bissextile(annee: int) -> bool
  (annee mod 4 == 0 and annee mod 100 != 0) or annee mod 400 == 0
end
print(est_bissextile(2024))   -- true
print(est_bissextile(1900))   -- false
print(est_bissextile(2000))   -- true
```

Comparer des chaînes, des booléens

```qlang
let mot_de_passe = "secret"
if mot_de_passe == "secret" then
  print("accès accordé")
end
```

## À retenir

- if / elseif / else / end, un seul `end` pour toute la chaîne.
- La condition est toujours un bool.
- `if` peut servir de valeur : let x = if c then 1 else 2 end
