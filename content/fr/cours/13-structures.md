---
title: "Les structures (struct)"
---

# Les structures (struct)

Une struct regroupe plusieurs valeurs liées sous un même nom : c'est TON
propre type. Une `impl` lui ajoute des comportements (méthodes).

```qlang
struct Point
  public x: int
  public y: int
end
```

Créer une valeur : on nomme les champs

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

let p = Point { x: 3, y: 4 }
print(p.x)
print(p.y)
p.x = 10
print(p)                  -- Point { x: 10, y: 4 }
```

Raccourci : si la variable porte le nom du champ

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

let x = 1
let y = 2
let q = Point { x, y }
print(q)
```

Copie avec modification : ..autre reprend les champs

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

let x = 1

let y = 2

let q = Point { x, y }

let r = Point { ..q, y: 99 }
print(r)
```

Les structs sont des RÉFÉRENCES : partagées, pas copiées

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

let p = Point { x: 3, y: 4 }

let s = p
s.x = 0
print(p.x)                -- 0 !
```

## Méthodes : bloc impl

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

impl Point
  -- méthode statique (pas de self) : s'appelle sur le type
  public fun new(x: int, y: int) -> Point
    Point { x, y }
  end

  public fun origine() -> Point
    Point.new(0, 0)
  end

  -- méthode d'instance (premier paramètre `self`)
  public fun distance_carree(self, autre: Point) -> int
    let dx = self.x - autre.x
    let dy = self.y - autre.y
    dx * dx + dy * dy
  end

  public fun deplacer(self, dx: int, dy: int)
    self.x += dx
    self.y += dy
  end

  public fun clone(self) -> Point
    Point { x: self.x, y: self.y }
  end
end

let a = Point.new(0, 0)
let b = Point.new(3, 4)
print(a.distance_carree(b))     -- 25
b.deplacer(1, 1)
print(b)
let c = b.clone()
c.x = 1000
print(b.x)                       -- inchangé : c est une vraie copie
```

## Champs privés, valeurs par défaut, champs statiques

```qlang
struct Compte
  public titulaire: string
  private solde: int = 0                -- défaut : on peut l'omettre
  private static nb_comptes: int = 0    -- appartient au type, pas à l'instance
end

impl Compte
  public fun ouvrir(titulaire: string) -> Compte
    Compte.nb_comptes += 1
    Compte { titulaire }
  end

  public fun deposer(self, montant: int)
    assert(montant > 0, "le montant doit être positif")
    self.solde += montant
  end

  public fun retirer(self, montant: int) -> bool
    if montant > self.solde then return false end
    self.solde -= montant
    true
  end

  public fun solde(self) -> int
    self.solde
  end

  public fun total() -> int
    Compte.nb_comptes
  end
end

let compte = Compte.ouvrir("Ada")
compte.deposer(100)
print(compte.retirer(30))     -- true
print(compte.retirer(500))    -- false
print(compte.solde())         -- 70
Compte.ouvrir("Linus")
print(Compte.total())         -- 2
-- print(compte.solde)         -- ERREUR : champ privé (encapsulation)
```

Une struct peut contenir d'autres structs et des tableaux

```qlang
-- (défini plus haut dans ce chapitre)
struct Point
  public x: int
  public y: int
end

impl Point
  -- méthode statique (pas de self) : s'appelle sur le type
  public fun new(x: int, y: int) -> Point
    Point { x, y }
  end

  public fun origine() -> Point
    Point.new(0, 0)
  end

  -- méthode d'instance (premier paramètre `self`)
  public fun distance_carree(self, autre: Point) -> int
    let dx = self.x - autre.x
    let dy = self.y - autre.y
    dx * dx + dy * dy
  end

  public fun deplacer(self, dx: int, dy: int)
    self.x += dx
    self.y += dy
  end

  public fun clone(self) -> Point
    Point { x: self.x, y: self.y }
  end
end

struct Rectangle
  public coin: Point
  public largeur: int
  public hauteur: int
end
let rect = Rectangle { coin: Point.new(1, 1), largeur: 4, hauteur: 3 }
print(rect.coin.x + rect.largeur)
```

## À retenir

- struct = données ; impl = comportements.
- `self` en premier paramètre = méthode d'instance ; sinon statique.
- private (défaut) / protected / public contrôlent qui accède à quoi :
  cacher les détails s'appelle l'ENCAPSULATION.
- Pas de constructeur magique : on écrit `new` soi-même.
