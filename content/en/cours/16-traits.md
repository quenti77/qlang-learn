---
title: "Traits"
---

# Traits

A trait is a **contract**: a list of methods that a type promises to provide. Unrelated types
can follow the same contract.

## Declaring a trait and implementing it

The trait only contains signatures. `impl Trait for Type` proves that the type follows the
contract.

```qlang
trait Shape
  fun area(self) -> float
  fun name(self) -> string
end

struct Circle
  public r: float
end

impl Shape for Circle
  public fun area(self) -> float
    float.PI * self.r * self.r
  end
  public fun name(self) -> string
    "circle"
  end
end

let c = Circle { r: 2.0 }
print("{c.name()} with area {c.area()}")
```

## A trait is a type

All shapes can be treated the same way: a trait can be used as the type of a parameter, a
variable or an array element.

```qlang
trait Shape
  fun area(self) -> float
  fun name(self) -> string
end

struct Circle
  public r: float
end

struct Rectangle
  public w: float
  public h: float
end

impl Shape for Circle
  public fun area(self) -> float
    float.PI * self.r * self.r
  end
  public fun name(self) -> string
    "circle"
  end
end

impl Shape for Rectangle
  public fun area(self) -> float
    self.w * self.h
  end
  public fun name(self) -> string
    "rectangle"
  end
end

fun show(s: Shape)
  print("{s.name()} with area {s.area()}")
end

let shapes: array<Shape> = [Circle { r: 1.0 }, Rectangle { w: 2.0, h: 3.0 }]
for s in shapes do
  show(s)
end

fun largest(ss: array<Shape>) -> Shape
  let best = ss[0]
  for s in ss do
    if s.area() > best.area() then best = s end
  end
  best
end
print(largest(shapes).name())
```

## Implementing a trait for an existing type

You can do it for `int`, `string`…

```qlang
trait Describable
  fun describe(self) -> string
end
impl Describable for int
  public fun describe(self) -> string
    if self mod 2 == 0 then "the even integer {self}" else "the odd integer {self}" end
  end
end
impl Describable for string
  public fun describe(self) -> string
    "the text \"{self}\" with {self.len()} letters"
  end
end
print(4.describe())
print("hello".describe())
```

## Remember

- `trait` = signatures only; `impl Trait for Type` = the proof that the type follows the
  contract.
- A trait can be used as the type of a parameter or of an array element.
- Current limit: no default method in a trait.
