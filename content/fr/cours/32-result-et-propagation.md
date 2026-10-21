---
title: "Result et l'opérateur ?"
---

# `Result` et l'opérateur `?`

Un nullable dit « il n'y a pas de valeur », mais pas **pourquoi**. Quand l'appelant doit
savoir ce qui a échoué, on renvoie un `Result`.

## `Ok` ou `Err`

`Result<T, E>` est une énumération à deux variantes, disponible sans `import` : `Ok(valeur)`
quand tout va bien, `Err(erreur)` sinon. `Error` est une structure du prélude avec un champ
`message`.

```qlang
fun diviser(a: int, b: int) -> Result<int, Error>
  if b == 0 then
    return Err(Error { message: "division par zéro" })
  end
  Ok(a div b)
end

match diviser(10, 2)
  case Ok(v) then print("résultat : {v}")
  case Err(e) then print("erreur : {e.message}")
end

match diviser(1, 0)
  case Ok(v) then print("résultat : {v}")
  case Err(e) then print("erreur : {e.message}")
end
```

Le compilateur vérifie que `match` traite `Ok` **et** `Err` : on ne peut pas lire la valeur sans
avoir regardé si l'opération a réussi.

## Questions simples

`is_ok()` et `is_err()` disent de quel côté on est. `unwrap()` donne la valeur, mais arrête le
programme si c'est une erreur : à réserver aux tests et aux cas « impossibles ».

```qlang
let r: Result<int, Error> = Ok(5)
print(r.is_ok())
print(r.unwrap())

let e: Result<int, Error> = Err(Error { message: "raté" })
print(e.is_err())
print(e.unwrap_err().message)
```

## Propager avec `?`

Quand plusieurs étapes peuvent échouer, tester chaque résultat alourdit le code. Dans une
fonction qui renvoie elle-même un `Result`, `expr?` donne la valeur d'un `Ok`, et **quitte la
fonction avec l'erreur** si c'est un `Err`.

```qlang
fun lire_age(texte: string) -> Result<int, Error>
  let n = int.parse(texte)
  if n == none then
    return Err(Error { message: "pas un nombre : {texte}" })
  end
  if n < 0 then
    return Err(Error { message: "âge négatif" })
  end
  Ok(n)
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  let x = lire_age(a)?
  let y = lire_age(b)?
  Ok(x + y)
end

match total_ages("30", "12")
  case Ok(v) then print("total : {v}")
  case Err(e) then print(e.message)
end
match total_ages("30", "abc")
  case Ok(v) then print("total : {v}")
  case Err(e) then print(e.message)
end
```

Le type d'erreur doit être le même des deux côtés (ici `Error`) : il n'y a pas de conversion
automatique. `?` n'a de sens que dans une fonction (sinon, erreur de compilation).

<!-- expect-error -->
```qlang
let x = Result<int, Error>.Ok(1)?
print(x)
```

## `?` sur un nullable

`?` marche aussi sur un nullable : il donne la valeur, ou quitte la fonction avec `none`.
La fonction doit alors renvoyer un nullable.

```qlang
fun premier_mot(s: string) -> string?
  let mots = s.split(" ")
  if mots.len() == 0 then return none end
  mots[0]
end

fun majuscule_du_premier(s: string) -> string?
  let m = premier_mot(s)?
  m.upper()
end

print(majuscule_du_premier("bonjour le monde"))
print(majuscule_du_premier(""))
```

## Choisir : nullable, `Result` ou `panic`

- **Nullable** : « pas de valeur » suffit (recherche, lecture d'un nombre).
- **`Result`** : l'appelant a besoin de savoir pourquoi, ou on enchaîne des étapes avec `?`.
- **`panic`** : l'état est impossible, c'est un bug du programme.

## À retenir

- `Result<T, E>` : `Ok(valeur)` ou `Err(erreur)` ; `match` doit traiter les deux.
- `expr?` : la valeur, ou on quitte la fonction avec l'erreur (ou `none` pour un nullable).
- `is_ok`, `is_err`, `unwrap`, `unwrap_err` pour les cas simples.
