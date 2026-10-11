---
title: "Les traits"
---

# Les traits

Un trait est un **contrat** : une liste de méthodes qu'un type promet de fournir. Des types
sans lien entre eux peuvent respecter le même contrat.

## Déclarer un trait et l'implémenter

Le trait ne contient que des signatures. `impl Trait for Type` prouve que le type respecte
le contrat.

```qlang
trait Forme
  fun aire(self) -> float
  fun nom(self) -> string
end

struct Cercle
  public r: float
end

impl Forme for Cercle
  public fun aire(self) -> float
    float.PI * self.r * self.r
  end
  public fun nom(self) -> string
    "cercle"
  end
end

let c = Cercle { r: 2.0 }
print("{c.nom()} d'aire {c.aire()}")
```

## Un trait sert de type

On peut traiter toutes les formes de la même façon : un trait s'utilise comme type de
paramètre, de variable ou d'élément de tableau.

```qlang
trait Forme
  fun aire(self) -> float
  fun nom(self) -> string
end

struct Cercle
  public r: float
end

struct Rectangle
  public l: float
  public h: float
end

impl Forme for Cercle
  public fun aire(self) -> float
    float.PI * self.r * self.r
  end
  public fun nom(self) -> string
    "cercle"
  end
end

impl Forme for Rectangle
  public fun aire(self) -> float
    self.l * self.h
  end
  public fun nom(self) -> string
    "rectangle"
  end
end

fun afficher(f: Forme)
  print("{f.nom()} d'aire {f.aire()}")
end

let formes: array<Forme> = [Cercle { r: 1.0 }, Rectangle { l: 2.0, h: 3.0 }]
for f in formes do
  afficher(f)
end

fun plus_grande(fs: array<Forme>) -> Forme
  let best = fs[0]
  for f in fs do
    if f.aire() > best.aire() then best = f end
  end
  best
end
print(plus_grande(formes).nom())
```

## Implémenter un trait pour un type existant

On peut le faire pour `int`, `string`…

```qlang
trait Decrivable
  fun decrire(self) -> string
end
impl Decrivable for int
  public fun decrire(self) -> string
    if self mod 2 == 0 then "l'entier pair {self}" else "l'entier impair {self}" end
  end
end
impl Decrivable for string
  public fun decrire(self) -> string
    "le texte \"{self}\" de {self.len()} lettres"
  end
end
print(4.decrire())
print("salut".decrire())
```

## À retenir

- `trait` = des signatures seulement ; `impl Trait for Type` = la preuve que le type respecte
  le contrat.
- Un trait est utilisable comme type de paramètre ou d'élément de tableau.
- Limite actuelle : pas de méthode par défaut dans un trait.
