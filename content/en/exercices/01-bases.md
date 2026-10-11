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
