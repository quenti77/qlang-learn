---
title: "Structures, énumérations, traits, génériques"
---

# Structures, énumérations, traits, génériques

## Exercice 1

Complète Rectangle.aire() et Rectangle.perimetre().

```qlang-exercise
struct Rectangle
  public l: int
  public h: int
end
impl Rectangle
  public fun aire(self) -> int
    0   -- TODO
  end
  public fun perimetre(self) -> int
    0   -- TODO
  end
end
```

```qlang-tests
let r = Rectangle { l: 3, h: 4 }
assert(r.aire() == 12, "aire")
assert(r.perimetre() == 14, "perimetre")
print("exercice 1 OK")
```

```qlang-solution
struct Rectangle
  public l: int
  public h: int
end
impl Rectangle
  public fun aire(self) -> int
    self.l * self.h
  end
  public fun perimetre(self) -> int
    2 * (self.l + self.h)
  end
end
```

```qlang-hint
Dans une méthode, les champs se lisent avec `self` : `self.l`, `self.h`.

L'aire est `l * h`, le périmètre `2 * (l + h)`.
```

## Exercice 2

Surcharge + pour Fraction (a/b) sans simplifier : 1/2 + 1/3 = 5/6.

```qlang-exercise
struct Fraction
  public n: int
  public d: int
end
impl Add for Fraction
  public fun add(self, o: Fraction) -> Fraction
    self   -- TODO
  end
end
```

```qlang-tests
let s = Fraction { n: 1, d: 2 } + Fraction { n: 1, d: 3 }
assert(s.n == 5 and s.d == 6, "1/2 + 1/3")
print("exercice 2 OK")
```

```qlang-solution
struct Fraction
  public n: int
  public d: int
end
impl Add for Fraction
  public fun add(self, o: Fraction) -> Fraction
    Fraction { n: self.n * o.d + o.n * self.d, d: self.d * o.d }
  end
end
```

```qlang-hint
a/b + c/d = (a·d + c·b) / (b·d). Crée une nouvelle `Fraction` avec ce résultat.

`Fraction { n: self.n * o.d + o.n * self.d, d: self.d * o.d }`
```

## Exercice 3

Complète la pile : empiler, depiler (renvoie T?).

```qlang-exercise
struct Pile<T>
  private items: array<T>
end
impl<T> Pile<T>
  public fun nouvelle() -> Pile<T>
    Pile { items: [] }
  end
  public fun empiler(self, v: T)
    -- TODO
  end
  public fun depiler(self) -> T?
    none   -- TODO
  end
end
```

```qlang-tests
let p = Pile<int>.nouvelle()
p.empiler(1)
p.empiler(2)
assert(p.depiler() == 2, "2")
assert(p.depiler() == 1, "1")
assert(p.depiler() == none, "vide")
print("exercice 3 OK")
```

```qlang-solution
struct Pile<T>
  private items: array<T>
end
impl<T> Pile<T>
  public fun nouvelle() -> Pile<T>
    Pile { items: [] }
  end
  public fun empiler(self, v: T)
    self.items[] = v
  end
  public fun depiler(self) -> T?
    self.items.pop()
  end
end
```

```qlang-hint
Les éléments sont rangés dans le tableau `self.items` : la pile se manipule par sa fin.

Empiler : `self.items[] = v`. Dépiler : la méthode `pop()` d'un tableau renvoie déjà un `T?` (`none` si vide).
```

## Exercice 4

Écris une fonction générique plus_petit<T: Ord> qui renvoie le minimum d'un tableau non vide.

```qlang-exercise
fun plus_petit<T: Ord>(xs: array<T>) -> T
  xs[0]   -- TODO
end
```

```qlang-tests
assert(plus_petit([3, 1, 2]) == 1, "ints")
assert(plus_petit(["b", "a"]) == "a", "strings")
print("exercice 4 OK")
```

```qlang-solution
fun plus_petit<T: Ord>(xs: array<T>) -> T
  let m = xs[0]
  for x in xs do
    if x < m then m = x end
  end
  m
end
```

```qlang-hint
Le type `T: Ord` garantit qu'on peut comparer deux éléments avec `<`.

Garde le plus petit vu jusqu'ici : `let m = xs[0]`, puis `if x < m then m = x end` dans une boucle.
```
