---
title: "None et les types nullables"
---

# None et les types nullables

Parfois une valeur peut ne pas exister : on cherche un élément qui n'est pas là, on lit un
nombre dans un texte invalide… qlang l'exprime dans le **type** : `int?` signifie « un
`int`, **ou** `none` ». Le compilateur t'oblige à gérer le cas « rien » : impossible
d'oublier !

```qlang
let a: int = 5
-- let b: int = none     -- ERREUR : int ne peut pas être none
let c: int? = none       -- OK
let d: int? = 7          -- OK aussi
print(c)
print(d)
```

`print(d + 1)` est refusé tant qu'on n'a pas vérifié : `d` peut être `none`.

## Après un test

Après un test, le compilateur **sait** que la valeur est présente.

```qlang
-- (défini plus haut dans ce chapitre)
let d: int? = 7          -- OK aussi

if d != none then
  print(d + 1)           -- ici d est un int
end
```

## Sortie anticipée

Après le `if`, la valeur est forcément présente.

```qlang
fun double_ou_zero(x: int?) -> int
  if x == none then
    return 0
  end
  x * 2                  -- x est un int ici
end
print(double_ou_zero(21))
print(double_ou_zero(none))
```

## Avec `and`

À droite de `and`, la vérification est connue.

```qlang
let age: int? = 30
print(age != none and age > 18)
```

## Où rencontre-t-on des nullables ?

```qlang
print(int.parse("12"))          -- int?
print([1, 2, 3].index_of(9))    -- int?
let vide: array<int> = []
print(vide.pop())               -- none
print(vide.max())               -- none
let m = { "a": 1 }
print(m["z"])                   -- none
```

## Un exemple utile : une saisie sécurisée

```qlang
fun lire_age(texte: string) -> string
  let n = texte.to_int()
  if n == none then return "'{texte}' n'est pas un nombre" end
  if n < 0 then return "âge négatif" end
  "âge valide : {n}"
end
print(lire_age("42"))
print(lire_age("abc"))
print(lire_age("-3"))
```

## Une limite

Le test fonctionne sur des **variables**, pas sur `obj.champ` ni sur un appel. On copie
d'abord dans une variable :

```qlang
let resultat = int.parse("5")
if resultat != none then
  print(resultat * 2)
end
```

Appeler une méthode ou lire un champ sur une valeur nullable est une erreur de
compilation : avec `let s: string? = "abc"`, `print(s.len())` est refusé. Vérifie
d'abord `s != none`.

## À retenir

- `T?` = `T` ou `none`. Le compilateur oblige à tester avant d'utiliser.
- `if x == none then return … end`, puis `x` est utilisable.
- Beaucoup d'opérations qui peuvent échouer renvoient un nullable.
