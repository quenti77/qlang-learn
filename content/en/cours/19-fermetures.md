---
title: "Advanced functions — closures"
---

# Advanced functions — closures

An anonymous function **remembers** the variables around it, even after the function that
created it has finished. This is called a *closure*.

## A counter

```qlang
fun create_counter() -> fun() -> int
  let n = 0                 -- this variable survives inside the closure
  fun() -> int
    n += 1
    n
  end
end

let c1 = create_counter()
let c2 = create_counter()      -- independent counter
c1()
c1()
print(c1())    -- 3
print(c2())    -- 1
```

## A function factory

```qlang
fun adder(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end
let plus5 = adder(5)
let plus100 = adder(100)
print(plus5(1))
print(plus100(1))
```

## Composing two functions

`(f ∘ g)(x) = f(g(x))`

```qlang
-- (defined earlier in this chapter)
fun adder(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end

let plus5 = adder(5)

fun compose(f: fun(int) -> int, g: fun(int) -> int) -> fun(int) -> int
  fun(x: int) -> int
    f(g(x))
  end
end
let double_then_plus5 = compose(plus5, fun(x: int) -> int x * 2 end)
print(double_then_plus5(10))     -- 25
```

## An array of functions

```qlang
let operations: array<fun(int, int) -> int> = [
  fun(a: int, b: int) -> int a + b end,
  fun(a: int, b: int) -> int a - b end,
  fun(a: int, b: int) -> int a * b end
]
for op in operations do
  write("{op(6, 3)} ")
end
print("")
```

## A dictionary of functions

It is called a "dispatch table".

```qlang
let calc: map<string, fun(int, int) -> int> = {
  "+": fun(a: int, b: int) -> int a + b end,
  "*": fun(a: int, b: int) -> int a * b end
}
let f = calc["*"]
if f != none then print(f(7, 6)) end
```

## Memoization: a closure with a cache

```qlang
fun memoize(f: fun(int) -> int) -> fun(int) -> int
  let cache: map<int, int> = {}
  fun(x: int) -> int
    let already = cache[x]
    if already != none then return already end
    let r = f(x)
    cache[x] = r
    r
  end
end
let slow = fun(x: int) -> int
  print("  (computing {x})")
  x * x
end
let fast = memoize(slow)
print(fast(9))
print(fast(9))    -- no new computation
```

## A higher-order function

Calling an action `n` times:

```qlang
fun repeat_times(n: int, action: fun(int))
  for i in 0..n do action(i) end
end
let total = 0
repeat_times(5, fun(i: int) total += i end)    -- modifies the outer variable
print(total)
```

## Remember

- A closure captures the surrounding variables **and** can modify them.
- Useful for: counters, function factories, caches, callbacks.
