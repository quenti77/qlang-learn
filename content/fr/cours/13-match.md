---
title: "Match"
---

# Match

`match` compare une valeur à plusieurs **motifs**. C'est un `if` / `elseif` plus lisible
quand on teste une même valeur. C'est aussi une expression : elle a une valeur.

```qlang
fun jour(n: int) -> string
  match n
    case 1 then "lundi"
    case 2 then "mardi"
    case 3 then "mercredi"
    case 4 then "jeudi"
    case 5 then "vendredi"
    case 6 then "samedi"
    case 7 then "dimanche"
    else "inconnu"
  end
end
print(jour(3))
print(jour(9))
```

## Intervalles

```qlang
fun mention(note: int) -> string
  match note
    case 0..10 then "refusé"           -- 0 à 9
    case 10..12 then "passable"        -- 10 et 11
    case 12..14 then "assez bien"
    case 14..16 then "bien"
    case 16..=20 then "très bien"      -- 16 à 20 inclus
    else "note invalide"
  end
end
print(mention(8))
print(mention(13))
print(mention(18))
print(mention(25))
```

## Garde

`case x if condition` : `x` désigne la valeur testée.

```qlang
fun classer(n: int) -> string
  match n
    case 0 then "zéro"
    case x if x < 0 then "négatif ({x})"
    case x if x mod 2 == 0 then "pair ({x})"
    else "impair"
  end
end
print(classer(0))
print(classer(-4))
print(classer(10))
print(classer(7))
```

## Sur des chaînes

```qlang
fun reponse(s: string) -> bool
  match s
    case "oui" then true
    case "o" then true
    else false
  end
end
print(reponse("oui"))
print(reponse("peut-être"))
```

## Sur un nullable

`case none` traite le cas « rien ».

```qlang
fun decrire(x: int?) -> string
  match x
    case none then "rien"
    case 0 then "zéro"
    case n then "un nombre : {n}"
  end
end
print(decrire(none))
print(decrire(0))
print(decrire(9))
```

## Sur un tuple

Un `match` peut défaire un tuple, ce qui est pratique pour regarder deux valeurs à la fois.

```qlang
fun fizzbuzz(n: int) -> string
  match (n mod 3, n mod 5)
    case (0, 0) then "FizzBuzz"
    case (0, _) then "Fizz"
    case (_, 0) then "Buzz"
    else "{n}"
  end
end

for i in 1..=15 do
  print(fizzbuzz(i))
end
```

## Avec une énumération

Un `match` sur une énumération (chapitre 18) est vérifié par le compilateur : il refuse qu'on oublie un cas.

## Le motif `_`

`_` accepte tout sans lui donner de nom.

```qlang
fun est_special(n: int) -> bool
  match n
    case 42 then true
    case _ then false
  end
end
print(est_special(42))
```

## `match` comme instruction

On peut ne pas utiliser sa valeur.

```qlang
let n = 3
match n
  case 3 then print("c'est trois")
  else print("autre")
end
```

## À retenir

- Les `case` sont essayés dans l'ordre ; le premier qui correspond gagne.
- Intervalles (`a..b`, `a..=b`), gardes (`if`), `none` et énumérations sont des motifs.
- Un tuple aussi : `case (0, _) then …`.
- Pas de `case 1, 2, 3` : un `case` par valeur (ou une garde).
- Pour qu'un `match` serve de valeur, il doit être exhaustif (`else`, ou énumération complète).
