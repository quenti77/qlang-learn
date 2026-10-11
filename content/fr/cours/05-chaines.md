---
title: "Les chaînes de caractères"
---

# Les chaînes de caractères

Une `string` est du texte. Elle est **immuable** : on ne la modifie jamais sur place,
les opérations en créent une nouvelle.

## Longueur, indices et extraits

```qlang
let s = "Bonjour le monde"

print(s.len())              -- 16 : nombre de caractères
print(s[0])                 -- "B" : le premier caractère a l'indice 0 !
print(s[8])                 -- "l"
print(s.substring(0, 7))    -- "Bonjour" (début inclus, fin exclue)
```

## Concaténer (coller)

```qlang
print("Bon" + "jour")
let nom = "Ada"
print("Salut " + nom + " !")
print("Salut {nom} !")        -- plus pratique
```

## Transformations

Elles renvoient une nouvelle chaîne.

```qlang
-- (défini plus haut dans ce chapitre)
let s = "Bonjour le monde"

print(s.upper())
print(s.lower())
print("  espaces  ".trim() + "|")
print("  espaces  ".trim_start() + "|")
print("  espaces  ".trim_end() + "|")
print("python".capitalize())
print("abc".reverse())
print("ha".repeat(3))
print(s.replace("o", "0"))
```

## Questions

Elles renvoient un `bool`.

```qlang
-- (défini plus haut dans ce chapitre)
let s = "Bonjour le monde"

print(s.contains("jour"))
print(s.starts_with("Bon"))
print(s.ends_with("monde"))
print("".is_empty())
print("12345".is_digit())
print("abc".is_alpha())
print("   ".is_blank())
```

## Chercher

On obtient l'indice de la première occurrence, ou `none`.

```qlang
-- (défini plus haut dans ce chapitre)
let s = "Bonjour le monde"

print(s.index_of("o"))       -- 1
print(s.last_index_of("o"))  -- 12
print(s.index_of("z"))       -- none
print(s.count("o"))          -- 3
```

## Découper et assembler

```qlang
let mots = "pomme,poire,prune".split(",")
print(mots)
print(mots.len())
print(mots.join(" + "))
print("un deux  trois".words())
print("l1\nl2\nl3".lines())
print("abc".chars())
```

## Aligner du texte

Pratique pour faire des tableaux.

```qlang
print("7".pad_left(3, "0"))     -- 007
print("ab".pad_right(5, ".") + "|")
```

## Parcourir les caractères

```qlang
for c in "abc" do
  write("[{c}] ")
end
print("")
```

## Codes Unicode

Chaque caractère a un numéro.

```qlang
print("A".code())      -- 65
print(66.char())       -- "B"
print("é".code())      -- 233
-- Astuce : décaler une lettre (chiffre de César)
print(("a".code() + 3).char())   -- "d"
```

## Comparer

```qlang
print("abc" == "abc")
print("abc" < "abd")
print("Z" < "a")       -- les majuscules viennent avant les minuscules
```

## Convertir en nombre

```qlang
print("42".to_int())
print("4.5".to_float())
print("x".to_int())    -- none
```

## Sur plusieurs lignes

Une chaîne peut s'étendre sur plusieurs lignes.

```qlang
let poeme = "Roses rouges
Violettes bleues"
print(poeme)
```

## À retenir

- Les indices commencent à 0.
- Une chaîne ne change jamais : on obtient une nouvelle chaîne.
- `split`, `join`, `replace`, `contains`, `index_of` couvrent 90 % des besoins.
