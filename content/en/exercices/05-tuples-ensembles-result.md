---
title: "Tuples, sets, Result"
---

# Tuples, sets, Result

## Exercise 1

Write `bounds(xs)`: it returns the smallest and the largest element of a (non-empty) array as a tuple `(min, max)`.

```qlang-exercise
fun bounds(xs: array<int>) -> (int, int)
  (0, 0)   -- TODO
end
```

```qlang-tests
assert(bounds([3, 1, 2]) == (1, 3), "bounds of [3, 1, 2]")
assert(bounds([5]) == (5, 5), "a single element")
let (lo, hi) = bounds([-4, 9, 0])
assert(lo == -4 and hi == 9, "destructuring")
print("exercise 1 OK")
```

```qlang-solution
fun bounds(xs: array<int>) -> (int, int)
  let lo = xs[0]
  let hi = xs[0]
  for x in xs do
    if x < lo then lo = x end
    if x > hi then hi = x end
  end
  (lo, hi)
end
```

```qlang-hint
Start with the first element for both `lo` and `hi`, then walk through the array.

A tuple is built with parentheses: `(lo, hi)` is the last expression of the function.
```

## Exercise 2

Write `fibonacci(n)` with a tuple assignment `(a, b) = (b, a + b)`: `fibonacci(0)` is 0, `fibonacci(1)` is 1, `fibonacci(10)` is 55.

```qlang-exercise
fun fibonacci(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fibonacci(0) == 0, "fibonacci(0)")
assert(fibonacci(1) == 1, "fibonacci(1)")
assert(fibonacci(10) == 55, "fibonacci(10)")
assert(fibonacci(50) == 12586269025, "fibonacci(50)")
print("exercise 2 OK")
```

```qlang-solution
fun fibonacci(n: int) -> int
  let a = 0
  let b = 1
  for _ in 0..n do
    (a, b) = (b, a + b)
  end
  a
end
```

```qlang-hint
Keep two variables: `a` (the current term, 0 at the start) and `b` (the next one, 1 at the start).

On each turn, `(a, b) = (b, a + b)` moves one step on. After `n` turns, `a` is the result.
```

## Exercise 3

Write `quadrant(x, y)` with a `match` on the tuple `(x, y)`: `"origin"` for `(0, 0)`, `"x axis"` if only `y` is 0, `"y axis"` if only `x` is 0, otherwise `"up"` or `"down"` depending on whether `y` is positive or negative.

```qlang-exercise
fun quadrant(x: int, y: int) -> string
  "?"   -- TODO
end
```

```qlang-tests
assert(quadrant(0, 0) == "origin", "origin")
assert(quadrant(5, 0) == "x axis", "x axis")
assert(quadrant(0, -3) == "y axis", "y axis")
assert(quadrant(2, 7) == "up", "up")
assert(quadrant(-2, -7) == "down", "down")
print("exercise 3 OK")
```

```qlang-solution
fun quadrant(x: int, y: int) -> string
  match (x, y)
    case (0, 0) then "origin"
    case (_, 0) then "x axis"
    case (0, _) then "y axis"
    case (_, b) if b > 0 then "up"
    else "down"
  end
end
```

```qlang-hint
The cases are tried in order: put `(0, 0)` first.

`_` accepts any value, and an `if` guard can test a bound value: `case (_, b) if b > 0`.
```

## Exercise 4

Write `first_duplicate(xs)`: it returns the first element that shows up for the second time, or `none` if there is none. Use a `Set`.

```qlang-exercise
fun first_duplicate(xs: array<int>) -> int?
  none   -- TODO
end
```

```qlang-tests
assert(first_duplicate([4, 8, 15, 8, 16, 4]) == 8, "the first duplicate is 8")
assert(first_duplicate([1, 2, 3]) == none, "no duplicate")
assert(first_duplicate([]) == none, "empty array")
print("exercise 4 OK")
```

```qlang-solution
fun first_duplicate(xs: array<int>) -> int?
  let seen = Set<int>.new()
  for x in xs do
    if not seen.add(x) then return x end
  end
  none
end
```

```qlang-hint
`seen.add(x)` adds `x` to the set and returns `true` if the value was new, `false` if it was already there.

If `add` returns `false`, it is a duplicate: return `x`.
```

## Exercise 5

Write `common(a, b)`: the number of values found in both arrays (each value counted once). Use `Set.of` and `intersect`.

```qlang-exercise
fun common(a: array<int>, b: array<int>) -> int
  0   -- TODO
end
```

```qlang-tests
assert(common([1, 2, 3], [2, 3, 4]) == 2, "2 et 3")
assert(common([1, 1, 2], [1, 1, 1]) == 1, "duplicates counted once")
assert(common([1], [2]) == 0, "nothing in common")
print("exercise 5 OK")
```

```qlang-solution
fun common(a: array<int>, b: array<int>) -> int
  Set.of(a).intersect(Set.of(b)).len()
end
```

```qlang-hint
`Set.of(array)` creates a set without duplicates.

`set1.intersect(set2)` gives a new set; `len()` gives its size.
```

## Exercise 6

Write `read_age(text)` which returns `Ok(age)` if the text is an integer between 0 and 150, otherwise an `Err` with a message (`"not a number"` or `"invalid age"`). Then write `total_ages(a, b)` which adds two ages using `?`.

```qlang-exercise
fun read_age(text: string) -> Result<int, Error>
  Err(Error { message: "TODO" })
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  Err(Error { message: "TODO" })
end
```

```qlang-tests
assert_eq(assert_ok(read_age("42")), 42)
assert_eq(assert_err(read_age("abc")).message, "not a number")
assert_eq(assert_err(read_age("200")).message, "invalid age")
assert_eq(assert_err(read_age("-1")).message, "invalid age")
assert_eq(assert_ok(total_ages("30", "12")), 42)
assert_eq(assert_err(total_ages("30", "x")).message, "not a number")
assert_eq(assert_err(total_ages("999", "12")).message, "invalid age")
print("exercise 6 OK")
```

```qlang-solution
fun read_age(text: string) -> Result<int, Error>
  let n = int.parse(text)
  if n == none then
    return Err(Error { message: "not a number" })
  end
  if n < 0 or n > 150 then
    return Err(Error { message: "invalid age" })
  end
  Ok(n)
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  let x = read_age(a)?
  let y = read_age(b)?
  Ok(x + y)
end
```

```qlang-hint
`int.parse(text)` renvoie un `int?` : `none` si le text n'est not a number.

In `total_ages`, `read_age(a)?` gives the value of the `Ok`, or leaves the function with the error.
```
