---
title: "Algorithms: recursion and divide and conquer"
---

# Algorithms: recursion and divide and conquer

Recursion solves a problem by reducing it to a smaller problem, down to a base case.

## Fast exponentiation

`x^n` in O(log n), by squaring.

```qlang
fun power(x: int, n: int) -> int
  if n == 0 then return 1 end
  let half = power(x, n div 2)
  if n mod 2 == 0 then half * half else half * half * x end
end
print(power(2, 30))
```

## The GCD: Euclid's algorithm

It is 2,300 years old and still the best.

```qlang
fun gcd(a: int, b: int) -> int
  if b == 0 then a else gcd(b, a mod b) end
end
print(gcd(1071, 462))     -- 21
```

## Sum of digits

```qlang
fun digit_sum(n: int) -> int
  if n < 10 then n else n mod 10 + digit_sum(n div 10) end
end
print(digit_sum(12345))   -- 15
```

## Palindrome

```qlang
fun palindrome(s: string) -> bool
  if s.len() < 2 then return true end
  if s[0] != s[s.len() - 1] then return false end
  palindrome(s.substring(1, s.len() - 1))
end
print(palindrome("kayak"))
print(palindrome("hello"))
```

## The towers of Hanoi

Moving `n` disks from A to C through B.

```qlang
let moves = 0
fun hanoi(n: int, source: string, target: string, via: string)
  if n == 0 then return end
  hanoi(n - 1, source, via, target)
  moves += 1
  if n == 3 then print("disk {n}: {source} -> {target}") end
  hanoi(n - 1, via, target, source)
end
hanoi(4, "A", "C", "B")
print("{moves} moves (2^4 - 1 = 15)")
```

## All the permutations of an array

This is *backtracking*.

```qlang
fun permutations(xs: array<int>) -> array<array<int>>
  if xs.len() <= 1 then return [xs] end
  let res: array<array<int>> = []
  for i in 0..xs.len() do
    let rest: array<int> = []
    for j in 0..xs.len() do
      if j != i then rest[] = xs[j] end
    end
    for p in permutations(rest) do
      let fresh = [xs[i]]
      for v in p do fresh[] = v end
      res[] = fresh
    end
  end
  res
end
let perms = permutations([1, 2, 3])
print(perms.len())
for p in perms do print(p) end
```

## All the subsets

The power set.

```qlang
fun subsets(xs: array<int>, i: int) -> array<array<int>>
  if i == xs.len() then return [[]] end
  let without = subsets(xs, i + 1)
  let res: array<array<int>> = []
  for s in without do res[] = s end
  for s in without do
    let with = [xs[i]]
    for v in s do with[] = v end
    res[] = with
  end
  res
end
print(subsets([1, 2, 3], 0))
```

## The N queens problem

Placing N queens on a chessboard so that they do not threaten each other.

```qlang
fun queens(n: int, row: int, cols: array<int>) -> int
  if row == n then return 1 end
  let total = 0
  for c in 0..n do
    let ok = true
    for r in 0..row do
      let d = cols[r] - c
      if d == 0 or d.abs() == row - r then ok = false end
    end
    if ok then
      cols[row] = c
      total += queens(n, row + 1, cols)
    end
  end
  total
end
let cols: array<int> = []
for i in 0..6 do cols[] = 0 end
print("solutions for 6 queens: {queens(6, 0, cols)}")   -- 4
```

## Fibonacci: recursive or iterative?

The naive recursive version is exponential; the iterative version is linear.

```qlang
fun fib_iterative(n: int) -> int
  let a = 0
  let b = 1
  for i in 0..n do
    let t = a + b
    a = b
    b = t
  end
  a
end
print(fib_iterative(80))
```

## Remember

- Every recursion = a base case + a call on a smaller problem.
- Divide and conquer: fast exponentiation, merge sort, binary search.
- Backtracking: try, check, undo (queens, permutations).
- The maximum depth is limited (1000 calls, 250 on this site): for big data, prefer a loop.
