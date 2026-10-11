---
title: "Structures, enumerations, traits, generics"
---

# Structures, enumerations, traits, generics

## Exercise 1

Complete Rectangle.area() and Rectangle.perimeter().

```qlang-exercise
struct Rectangle
  public w: int
  public h: int
end
impl Rectangle
  public fun area(self) -> int
    0   -- TODO
  end
  public fun perimeter(self) -> int
    0   -- TODO
  end
end
```

```qlang-tests
let r = Rectangle { w: 3, h: 4 }
assert(r.area() == 12, "area")
assert(r.perimeter() == 14, "perimeter")
print("exercise 1 OK")
```

```qlang-solution
struct Rectangle
  public w: int
  public h: int
end
impl Rectangle
  public fun area(self) -> int
    self.w * self.h
  end
  public fun perimeter(self) -> int
    2 * (self.w + self.h)
  end
end
```

```qlang-hint
In a method, fields are read with `self`: `self.w`, `self.h`.

The area is `w * h`, the perimeter `2 * (w + h)`.
```

## Exercise 2

Overload + for Fraction (a/b) without simplifying: 1/2 + 1/3 = 5/6.

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
print("exercise 2 OK")
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
a/b + c/d = (a·d + c·b) / (b·d). Create a new `Fraction` with this result.

`Fraction { n: self.n * o.d + o.n * self.d, d: self.d * o.d }`
```

## Exercise 3

Complete the stack: push, pop (returns T?).

```qlang-exercise
struct Stack<T>
  private items: array<T>
end
impl<T> Stack<T>
  public fun create() -> Stack<T>
    Stack { items: [] }
  end
  public fun push(self, v: T)
    -- TODO
  end
  public fun pop(self) -> T?
    none   -- TODO
  end
end
```

```qlang-tests
let p = Stack<int>.create()
p.push(1)
p.push(2)
assert(p.pop() == 2, "2")
assert(p.pop() == 1, "1")
assert(p.pop() == none, "empty")
print("exercise 3 OK")
```

```qlang-solution
struct Stack<T>
  private items: array<T>
end
impl<T> Stack<T>
  public fun create() -> Stack<T>
    Stack { items: [] }
  end
  public fun push(self, v: T)
    self.items[] = v
  end
  public fun pop(self) -> T?
    self.items.pop()
  end
end
```

```qlang-hint
The elements are stored in the array `self.items`: the stack is handled from its end.

Push: `self.items[] = v`. Pop: the `pop()` method of an array already returns a `T?` (`none` if empty).
```

## Exercise 4

Write a generic function smallest<T: Ord> that returns the minimum of a non-empty array.

```qlang-exercise
fun smallest<T: Ord>(xs: array<T>) -> T
  xs[0]   -- TODO
end
```

```qlang-tests
assert(smallest([3, 1, 2]) == 1, "ints")
assert(smallest(["b", "a"]) == "a", "strings")
print("exercise 4 OK")
```

```qlang-solution
fun smallest<T: Ord>(xs: array<T>) -> T
  let m = xs[0]
  for x in xs do
    if x < m then m = x end
  end
  m
end
```

```qlang-hint
The type `T: Ord` guarantees that two elements can be compared with `<`.

Keep the smallest seen so far: `let m = xs[0]`, then `if x < m then m = x end` in a loop.
```
