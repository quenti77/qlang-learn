---
title: "Variables, conditions, loops, functions"
---

# Variables, conditions, loops, functions

## Exercise 1

Return the square of a number.

```qlang-exercise
fun square(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(square(4) == 16, "square(4)")
assert(square(-3) == 9, "square(-3)")
print("exercise 1 OK")
```

```qlang-solution
fun square(n: int) -> int
  n * n
end
```

```qlang-hint
The square of a number is that number multiplied by itself.

The last expression of a function is its return value: `n * n` is enough.
```

## Exercise 2

Return true if n is even.

```qlang-exercise
fun is_even(n: int) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(is_even(4), "4")
assert(not is_even(7), "7")
print("exercise 2 OK")
```

```qlang-solution
fun is_even(n: int) -> bool
  n mod 2 == 0
end
```

```qlang-hint
A number is even if the remainder of its division by 2 is 0.

The `mod` operator gives the remainder: `n mod 2`. Compare it to `0` with `==`.
```

## Exercise 3

Return the largest of three integers (without using max).

```qlang-exercise
fun max3(a: int, b: int, c: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(max3(1, 5, 3) == 5, "middle")
assert(max3(9, 5, 3) == 9, "first")
assert(max3(-1, -5, -3) == -1, "negatives")
print("exercise 3 OK")
```

```qlang-solution
fun max3(a: int, b: int, c: int) -> int
  let m = a
  if b > m then m = b end
  if c > m then m = c end
  m
end
```

```qlang-hint
Keep the largest value seen so far in a variable, and compare it with the other numbers one by one.

Start with `let m = a`, then `if b > m then m = b end`, then do the same with `c`.
```

## Exercise 4

Return the sum of the integers from 1 to n, using a loop.

```qlang-exercise
fun sum_up_to(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(sum_up_to(10) == 55, "10")
assert(sum_up_to(0) == 0, "0")
print("exercise 4 OK")
```

```qlang-solution
fun sum_up_to(n: int) -> int
  let s = 0
  for i in 1..=n do s += i end
  s
end
```

```qlang-hint
You need a total that grows at each turn of the loop.

`let s = 0`, then `for i in 1..=n do s += i end` (`..=` includes the bound `n`), then return `s`.
```

## Exercise 5

Return "Fizz" if n is a multiple of 3, "Buzz" if of 5, "FizzBuzz" if of both, otherwise n as text.

```qlang-exercise
fun fizzbuzz(n: int) -> string
  ""   -- TODO
end
```

```qlang-tests
assert(fizzbuzz(15) == "FizzBuzz", "15")
assert(fizzbuzz(9) == "Fizz", "9")
assert(fizzbuzz(10) == "Buzz", "10")
assert(fizzbuzz(7) == "7", "7")
print("exercise 5 OK")
```

```qlang-solution
fun fizzbuzz(n: int) -> string
  if n mod 15 == 0 then return "FizzBuzz" end
  if n mod 3 == 0 then return "Fizz" end
  if n mod 5 == 0 then return "Buzz" end
  n as string
end
```

```qlang-hint
Test the case "multiple of 3 and of 5" first, otherwise `FizzBuzz` will never be returned.

A number is a multiple of 15 when `n mod 15 == 0`. Use `return` in each `if`, and finish with `n as string`.
```

## Exercise 6

Return n! (factorial), recursively.

```qlang-exercise
fun fact(n: int) -> int
  0   -- TODO
end
```

```qlang-tests
assert(fact(0) == 1, "0")
assert(fact(5) == 120, "5")
print("exercise 6 OK")
```

```qlang-solution
fun fact(n: int) -> int
  if n <= 1 then return 1 end
  n * fact(n - 1)
end
```

```qlang-hint
A recursive function calls itself on a smaller problem, and has a stopping case.

The stopping case: `fact(0)` and `fact(1)` are 1. Otherwise, `n * fact(n - 1)`.
```
