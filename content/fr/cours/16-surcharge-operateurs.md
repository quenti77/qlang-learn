---
title: "Surcharge d'opérateurs et conversions"
---

# Surcharge d'opérateurs et conversions

Dans qlang, `a + b` est du sucre pour `a.add(b)`. En implémentant les traits
des opérateurs, tes propres types peuvent s'utiliser avec + - * == < [] as...

```qlang
struct Vec2
  public x: int
  public y: int
end

impl Add for Vec2                    -- v + w
  public fun add(self, o: Vec2) -> Vec2
    Vec2 { x: self.x + o.x, y: self.y + o.y }
  end
end

impl Sub for Vec2                    -- v - w
  public fun sub(self, o: Vec2) -> Vec2
    Vec2 { x: self.x - o.x, y: self.y - o.y }
  end
end

impl Mul<int> for Vec2               -- v * 3
  public fun mul(self, k: int) -> Vec2
    Vec2 { x: self.x * k, y: self.y * k }
  end
end

impl Mul<Vec2> for int               -- 3 * v (on peut même étendre int !)
  public fun mul(self, v: Vec2) -> Vec2
    v * self
  end
end

impl Neg for Vec2                    -- -v
  public fun neg(self) -> Vec2
    Vec2 { x: -self.x, y: -self.y }
  end
end

impl Eq for Vec2                     -- ==  et  !=
  public fun eq(self, o: Vec2) -> bool
    self.x == o.x and self.y == o.y
  end
end

impl As<string> for Vec2             -- print, "{v}", v as string
  public fun convert(self) -> string
    "({self.x}, {self.y})"
  end
end

let v = Vec2 { x: 1, y: 2 }
let w = Vec2 { x: 10, y: 20 }
print(v + w)
print(w - v)
print(v * 3)
print(3 * v)
print(-v)
print(v == Vec2 { x: 1, y: 2 })
print(v != w)
print("le vecteur est {v}")
let somme = v
somme += w                           -- += utilise Add
print(somme)
```

Ord : pour < <= > >=, la méthode cmp renvoie négatif / zéro / positif

```qlang
struct Version
  public majeur: int
  public mineur: int
end
impl Ord for Version
  public fun cmp(self, o: Version) -> int
    if self.majeur != o.majeur then return self.majeur - o.majeur end
    self.mineur - o.mineur
  end
end
impl As<string> for Version
  public fun convert(self) -> string
    "v{self.majeur}.{self.mineur}"
  end
end
let v1 = Version { majeur: 1, mineur: 9 }
let v2 = Version { majeur: 2, mineur: 0 }
print(v1 < v2)
print(v1 >= v2)
-- Avec Ord, sort / min / max fonctionnent sur tes types
let versions = [v2, v1, Version { majeur: 1, mineur: 2 }]
versions.sort()
print(versions)
print(versions.max())
```

Indexation : v[i], v[i] = x, v[] = x

```qlang
struct Pile
  public items: array<int>
end
impl Index<int> for Pile
  public fun index(self, i: int) -> int
    self.items[i]
  end
end
impl IndexSet<int, int> for Pile
  public fun set_index(self, i: int, valeur: int)
    self.items[i] = valeur
  end
end
impl Push<int> for Pile
  public fun push(self, valeur: int)
    self.items[] = valeur
  end
end
let pile = Pile { items: [1, 2] }
pile[] = 3
pile[0] = 100
print(pile[0] + pile[2])
print(pile.items)
```

Tableau récapitulatif
  + Add  add   |  - Sub  sub    |  * Mul  mul     |  / Div  divide
  div IntDiv int_div  |  mod/% Mod modulo  |  ** Pow pow  |  -x Neg neg
  == != Eq eq  |  < <= > >= Ord cmp
  a[i] Index  |  a[i]=v IndexSet  |  a[]=v Push  |  x as T  As<T>
