---
title: "Tuples and sets"
---

# Tuples and sets

Two tools for small data: the **tuple** groups a few values without declaring a struct, and the
**set** (`Set`) keeps values without duplicates.

## Tuples

A tuple groups a fixed number of values, possibly of different types. Its type is written
`(int, string)`, its value `(1, "a")`. You read an element by its position, starting at 0.

```qlang
fun bounds(xs: array<int>) -> (int, int)
  (xs[0], xs[xs.len() - 1])
end

let b = bounds([3, 1, 2])
print(b)               -- (3, 2)
print(b.0)             -- 3
print(b.1)             -- 2
```

A tuple does not change: `b.0 = 5` is refused, you build a new one. Two tuples are equal when
all their elements are equal.

<!-- expect-error -->
```qlang
let t = (1, "a")
t.0 = 5
```

## Destructuring

`let (a, b) = t` takes a tuple apart. `_` ignores an element.

```qlang
fun bounds(xs: array<int>) -> (int, int)
  (xs[0], xs[xs.len() - 1])
end

let (lo, hi) = bounds([3, 1, 2])
print("from {lo} to {hi}")

let people: array<(string, int)> = [("ana", 31), ("bob", 27)]
for (name, age) in people do
  print("{name} is {age}")
end
for i, (name, _) in people do
  print("{i}: {name}")
end
```

You can also assign several variables at once. The right-hand side is computed completely
before the first target changes, so a swap fits on one line:

```qlang
let a = 1
let b = 2
(a, b) = (b, a)
print("{a} {b}")

let xs = [10, 20, 30]
(xs[0], xs[2]) = (xs[2], xs[0])
print(xs)

let cur = 0
let next = 1
for _ in 0..10 do
  (cur, next) = (next, cur + next)
end
print(cur)
```

## Tuples and `match`

A `match` can take a tuple apart, which is handy to look at two values at once.

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

## Sets

A `Set<T>` is a collection of values **without duplicates**, which keeps insertion order. It is
available without `import`. Create one with `Set.of(array)` or, empty, with `Set<T>.new()`.

```qlang
let a = Set.of([1, 2, 2, 3])
print(a)                        -- Set(1, 2, 3)
print(a.len())

let seen = Set<string>.new()
print(seen.add("x"))            -- true: new value
print(seen.add("x"))            -- false: already there
print(seen.contains("x"))
seen.remove("x")
print(seen.is_empty())
```

Set operations give a **new** set:

```qlang
let a = Set.of([1, 2, 3])
let b = Set.of([2, 3, 4])
print(a.union(b))               -- Set(1, 2, 3, 4)
print(a.intersect(b))           -- Set(2, 3)
print(a.difference(b))          -- Set(1)
print(Set.of([2, 3]).is_subset(a))
for v in a do
  print(v)
end
```

A classic use: remove duplicates from an array, or know whether a value was already seen.

```qlang
fun first_duplicate(xs: array<int>) -> int?
  let seen = Set<int>.new()
  for x in xs do
    if not seen.add(x) then return x end
  end
  none
end

print(first_duplicate([4, 8, 15, 8, 16]))
print(Set.of([3, 1, 3, 2, 1]).to_array())
```

A tuple can be a set value (or a dictionary key): handy for coordinates.

```qlang
let visited = Set<(int, int)>.new()
visited.add((0, 0))
visited.add((1, 2))
visited.add((0, 0))
print(visited.len())
print(visited.contains((1, 2)))
```

## Remember

- A tuple groups values of different types; read it with `t.0`, `t.1`, take it apart with
  `let (a, b) = t`, and `(a, b) = (b, a)` swaps two variables.
- `match` accepts tuple patterns: `case (0, _) then …`.
- `Set<T>`: no duplicates, insertion order kept; `add` tells whether the value was new.
- Set values follow the dictionary key rule (no arrays).
