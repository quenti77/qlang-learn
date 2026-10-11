---
title: "Functions"
---

# Functions

A function is a **named** piece of code that you can reuse. It receives parameters (the
inputs) and can return a result (the output).

## A function without a result

```qlang
fun say_hello(name: string)
  print("Hello {name}!")
end
say_hello("Ada")
say_hello("Linus")
```

## A function with a result

You write `-> type` after the parameters. The **last** expression of the body is the value
that is returned.

```qlang
fun square(x: int) -> int
  x * x
end
print(square(7))
print(square(square(2)))     -- they can be nested
```

## Several parameters

```qlang
fun rectangle_area(w: float, h: float) -> float
  w * h
end
print(rectangle_area(3.0, 4.5))
```

## `return`: leaving early

```qlang
fun sign(n: int) -> string
  if n > 0 then return "positive" end
  if n < 0 then return "negative" end
  "zero"
end
print(sign(5))
print(sign(-5))
print(sign(0))
```

## A predicate

A function that returns a `bool` is called a *predicate*.

```qlang
fun is_even(n: int) -> bool
  n mod 2 == 0
end
print(is_even(10))
```

## Modifying an array

Arrays are shared: the function modifies the caller's array.

```qlang
fun double_all(xs: array<int>)
  for i in 0..xs.len() do
    xs[i] = xs[i] * 2
  end
end
let t = [1, 2, 3]
double_all(t)
print(t)
```

## Maybe nothing: the nullable type

```qlang
fun first_even(xs: array<int>) -> int?
  for x in xs do
    if x mod 2 == 0 then return x end
  end
  none
end
print(first_even([1, 3, 6, 8]))   -- 6
print(first_even([1, 3]))         -- none
```

## Recursion

A function can call itself. There must **always** be a base case that stops the recursion.

```qlang
fun factorial(n: int) -> int
  if n <= 1 then return 1 end         -- base case
  n * factorial(n - 1)                -- recursive case
end
print(factorial(5))    -- 120
print(factorial(10))   -- 3628800

fun fibonacci(n: int) -> int
  if n < 2 then return n end
  fibonacci(n - 1) + fibonacci(n - 2)
end
for i in 0..10 do write("{fibonacci(i)} ") end
print("")
```

A recursive countdown:

```qlang
fun countdown(n: int)
  if n == 0 then
    print("Liftoff!")
    return
  end
  print(n)
  countdown(n - 1)
end
countdown(3)
```

## Functions are values

You can store them in a variable, pass them as a parameter, return them.

```qlang
-- (defined earlier in this chapter)
fun square(x: int) -> int
  x * x
end

fun apply(f: fun(int) -> int, x: int) -> int
  f(x)
end
print(apply(square, 6))
```

## Anonymous functions

A function without a name:

```qlang
-- (defined earlier in this chapter)
fun apply(f: fun(int) -> int, x: int) -> int
  f(x)
end

let triple = fun(x: int) -> int
  x * 3
end
print(triple(5))
print(apply(fun(x: int) -> int x + 100 end, 1))
```

## Applying a function to every element

This is the famous "map".

```qlang
-- (defined earlier in this chapter)
fun square(x: int) -> int
  x * x
end

let triple = fun(x: int) -> int
  x * 3
end

fun transform(xs: array<int>, f: fun(int) -> int) -> array<int>
  let res: array<int> = []
  for x in xs do
    res[] = f(x)            -- `res[] = v` adds at the end
  end
  res
end
print(transform([1, 2, 3], square))
print(transform([1, 2, 3], triple))
```

## Filtering

```qlang
-- (defined earlier in this chapter)
fun is_even(n: int) -> bool
  n mod 2 == 0
end

fun keep_if(xs: array<int>, keep: fun(int) -> bool) -> array<int>
  let res: array<int> = []
  for x in xs do
    if keep(x) then res[] = x end
  end
  res
end
print(keep_if([1, 2, 3, 4, 5, 6], is_even))
```

## Reducing

```qlang
fun reduce(xs: array<int>, start: int, f: fun(int, int) -> int) -> int
  let acc = start
  for x in xs do
    acc = f(acc, x)
  end
  acc
end
print(reduce([1, 2, 3, 4], 0, fun(a: int, b: int) -> int a + b end))   -- 10
print(reduce([1, 2, 3, 4], 1, fun(a: int, b: int) -> int a * b end))   -- 24
```

## Remember

- `fun name(param: type) -> return_type … end`
- Last expression = returned value; `return` to leave earlier.
- Recursion = base case + recursive case.
- A function is a value: `map` / `filter` / `reduce` follow from it.
- Depth limit: 1000 nested calls (error `R901`); 250 on this site, where the browser has less room.
