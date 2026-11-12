---
title: "Operator overloading and conversions"
---

# Operator overloading and conversions

In qlang, `a + b` is sugar for `a.add(b)`. By implementing the operator traits, your own
types can be used with `+`, `-`, `*`, `==`, `<`, `[]`, `as`…

## Arithmetic operators and `==`

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

impl Mul<Vec2> for int               -- 3 * v (you can even extend int!)
  public fun mul(self, v: Vec2) -> Vec2
    v * self
  end
end

impl Neg for Vec2                    -- -v
  public fun neg(self) -> Vec2
    Vec2 { x: -self.x, y: -self.y }
  end
end

impl Eq for Vec2                     -- ==  and  !=
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
print("the vector is {v}")
let total = v
total += w                           -- += uses Add
print(total)
```

## Comparing with `Ord`

For `<`, `<=`, `>` and `>=`, the `cmp` method returns a negative number, zero or a positive
number. With `Ord`, `sort`, `min` and `max` also work on your types.

```qlang
struct Version
  public major: int
  public minor: int
end
impl Ord for Version
  public fun cmp(self, o: Version) -> int
    if self.major != o.major then return self.major - o.major end
    self.minor - o.minor
  end
end
impl As<string> for Version
  public fun convert(self) -> string
    "v{self.major}.{self.minor}"
  end
end
let v1 = Version { major: 1, minor: 9 }
let v2 = Version { major: 2, minor: 0 }
print(v1 < v2)
print(v1 >= v2)
-- With Ord, sort / min / max work on your types
let versions = [v2, v1, Version { major: 1, minor: 2 }]
versions.sort()
print(versions)
print(versions.max())
```

## Indexing

`v[i]`, `v[i] = x` and `v[] = x` go through the `Index`, `IndexSet` and `Push` traits.

```qlang
struct Stack
  public items: array<int>
end
impl Index<int> for Stack
  public fun index(self, i: int) -> int
    self.items[i]
  end
end
impl IndexSet<int, int> for Stack
  public fun set_index(self, i: int, value: int)
    self.items[i] = value
  end
end
impl Push<int> for Stack
  public fun push(self, value: int)
    self.items[] = value
  end
end
let stack = Stack { items: [1, 2] }
stack[] = 3
stack[0] = 100
print(stack[0] + stack[2])
print(stack.items)
```

## Summary

| Written | Trait | Method |
| --- | --- | --- |
| `a + b` | `Add` | `add` |
| `a - b` | `Sub` | `sub` |
| `a * b` | `Mul` | `mul` |
| `a / b` | `Div` | `divide` |
| `a div b` | `IntDiv` | `int_div` |
| `a mod b`, `a % b` | `Mod` | `modulo` |
| `a ** b` | `Pow` | `pow` |
| `-a` | `Neg` | `neg` |
| `a == b`, `a != b` | `Eq` | `eq` |
| `<`, `<=`, `>`, `>=` | `Ord` | `cmp` |
| `a[i]` | `Index` | `index` |
| `a[i] = v` | `IndexSet` | `set_index` |
| `a[] = v` | `Push` | `push` |
| `x as T` | `As<T>` | `convert` |
