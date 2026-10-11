---
title: "Algorithms"
---

# Algorithms

## Exercise 1

Return the n-th Fibonacci number, iteratively (fib(0)=0, fib(1)=1).

```qlang-exercise
fun fib(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fib(10) == 55, "10")
assert(fib(50) == 12586269025, "50")
print("exercise 1 OK")
```

```qlang-solution
fun fib(n: int) -> int
  let a = 0
  let b = 1
  for i in 0..n do
    let t = a + b
    a = b
    b = t
  end
  a
end
```

## Exercise 2

Return the GCD of two integers (Euclid).

```qlang-exercise
fun gcd(a: int, b: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(gcd(48, 18) == 6, "48,18")
assert(gcd(7, 13) == 1, "coprime")
print("exercise 2 OK")
```

```qlang-solution
fun gcd(a: int, b: int) -> int
  if b == 0 then a else gcd(b, a mod b) end
end
```

## Exercise 3

Binary search: return the index of target in a sorted array, or none.

```qlang-exercise
fun search(xs: array<int>, target: int) -> int?
  none   -- TODO
end
```

```qlang-tests
assert(search([1, 3, 5, 7], 5) == 2, "found")
assert(search([1, 3, 5, 7], 4) == none, "missing")
print("exercise 3 OK")
```

```qlang-solution
fun search(xs: array<int>, target: int) -> int?
  let low = 0
  let high = xs.len() - 1
  while low <= high do
    let m = (low + high) div 2
    if xs[m] == target then return m end
    if xs[m] < target then low = m + 1 else high = m - 1 end
  end
  none
end
```

## Exercise 4

Insertion sort, in place.

```qlang-exercise
fun sort_in_place(xs: array<int>)
  -- TODO
end
```

```qlang-tests
let t = [5, 2, 9, 1]
sort_in_place(t)
assert(t == [1, 2, 5, 9], "sort")
print("exercise 4 OK")
```

```qlang-solution
fun sort_in_place(xs: array<int>)
  for i in 1..xs.len() do
    let key = xs[i]
    let j = i - 1
    while j >= 0 and xs[j] > key do
      xs[j + 1] = xs[j]
      j -= 1
    end
    xs[j + 1] = key
  end
end
```

## Exercise 5

Return true if the parentheses "(" and ")" of a string are balanced.

```qlang-exercise
fun balanced(s: string) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(balanced("(()())"), "ok")
assert(not balanced("(()"), "missing )")
assert(not balanced(")("), "order")
print("exercise 5 OK")
```

```qlang-solution
fun balanced(s: string) -> bool
  let n = 0
  for c in s do
    if c == "(" then n += 1 end
    if c == ")" then
      n -= 1
      if n < 0 then return false end
    end
  end
  n == 0
end
```
