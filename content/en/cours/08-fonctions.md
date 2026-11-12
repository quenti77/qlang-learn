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

## Remember

- `fun name(param: type) -> return_type … end`
- Last expression = returned value; `return` to leave earlier.
- Recursion = base case + recursive case.
- A function is a value: you can store it in a variable or hand it to another function.
- Depth limit: 1000 nested calls (error `R901`); 250 on this site, where the browser has less room.
