---
title: "Les génériques"
---

# Les génériques

Les génériques permettent d'écrire **une** fonction ou **un** type qui marche pour
plusieurs types, au lieu de copier-coller une version par type. `T` est un type « à
remplir ».

Sans générique, il faudrait `premier_int`, `premier_string`, `premier_float`…

## Des fonctions génériques

```qlang
fun premier<T>(xs: array<T>) -> T?
  if xs.is_empty() then return none end
  xs[0]
end
print(premier([10, 20]))
print(premier(["a", "b"]))
let rien: array<float> = []
print(premier(rien))

fun echanger<T>(xs: array<T>, i: int, j: int)
  let tmp = xs[i]
  xs[i] = xs[j]
  xs[j] = tmp
end
let nums = [1, 2, 3]
echanger(nums, 0, 2)
print(nums)
let lettres = ["a", "b"]
echanger(lettres, 0, 1)
print(lettres)
```

## Les bornes

`T` doit respecter un contrat (un trait) pour qu'on puisse l'utiliser.

```qlang
fun plus_grand<T: Ord>(a: T, b: T) -> T
  if a > b then a else b end
end
print(plus_grand(3, 8))
print(plus_grand("pomme", "poire"))
print(plus_grand(2.5, 1.5))

fun additionner<T: Add>(a: T, b: T) -> T
  a + b
end
print(additionner(1, 2))
print(additionner("ab", "cd"))

fun maximum<T: Ord>(xs: array<T>) -> T?
  if xs.is_empty() then return none end
  let m = xs[0]
  for x in xs do
    if x > m then m = x end
  end
  m
end
print(maximum([3, 9, 2]))
print(maximum(["b", "z", "a"]))
```

Plusieurs bornes se combinent avec `+` :

```qlang
fun sont_egaux_ordonnes<T: Eq + Ord>(a: T, b: T) -> bool
  a == b and not (a < b)
end
print(sont_egaux_ordonnes(4, 4))
```

## Des structures génériques

```qlang
struct Paire<A, B>
  public premier: A
  public second: B
end

impl<A, B> Paire<A, B>
  public fun inverser(self) -> Paire<B, A>
    Paire { premier: self.second, second: self.premier }
  end
end

let p = Paire { premier: 1, second: "un" }
print(p)
print(p.inverser())
```

Un conteneur générique : une boîte.

```qlang
struct Boite<T>
  public contenu: T
end
impl<T> Boite<T>
  public fun nouvelle(c: T) -> Boite<T>
    Boite { contenu: c }
  end
  public fun lire(self) -> T
    self.contenu
  end
end
let b = Boite<int>.nouvelle(5)
print(b.lire() + 1)
let bs = Boite<string>.nouvelle("hé")
print(bs.lire())
```

## Préciser le type

Quand le type ne peut pas être deviné, on l'écrit entre chevrons.

```qlang
-- (défini plus haut dans ce chapitre)
fun additionner<T: Add>(a: T, b: T) -> T
  a + b
end

struct Boite<T>
  public contenu: T
end

let vide: array<Boite<int>> = []
print(vide.len())
print(additionner<float>(1.5, 2.5))
```

## À retenir

- `fun f<T>(…)`, `struct S<T>`, `impl<T> S<T>`.
- Sans borne, on ne peut presque rien faire d'un `T` : on ajoute `T: Ord`, `T: Add`…
- qlang devine `T` d'après les arguments, sinon on le précise : `f<int>(…)`.
