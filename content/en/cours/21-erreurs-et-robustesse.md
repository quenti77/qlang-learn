---
title: "Errors, assert and robustness"
---

# Errors, `assert` and robustness

There are three families of errors:

1. **At reading time** (compilation): badly written code, incompatible types. qlang refuses
   to start and tells you where. The codes start with `L`, `P` or `T`.
2. **At run time**: division by zero, index out of range, `panic`. The program stops with the
   call stack. The codes start with `R`.
3. **Logic errors**: the program runs but gives a wrong result. They are the sneakiest! We
   hunt them with tests (`assert`).

qlang has no `try` / `catch`: you prevent errors with nullable types and checks.

## `assert`: testing

`assert(condition, message)` stops the program if the condition is false. It is a testing
tool: "I am sure that this is true".

```qlang
assert(1 + 1 == 2, "maths works")
assert(10 mod 3 == 1)

fun add(a: int, b: int) -> int
  a + b
end
assert(add(2, 3) == 5, "2 + 3 = 5")
assert(add(-1, 1) == 0, "edge case")
```

Writing small tests gives confidence in your code:

```qlang
fun reverse_text(s: string) -> string
  let r = ""
  for c in s do
    r = c + r
  end
  r
end
assert(reverse_text("abc") == "cba")
assert(reverse_text("") == "")
assert(reverse_text("a") == "a")
print("all the tests pass")
```

And when an `assert` fails? Change `"cba"` to `"abc"` above: the message shows the line of
the test that failed.

## `panic`: stopping on purpose

`panic(message)` stops the program when the state is impossible.

```qlang
fun integer_root(n: int) -> int
  if n < 0 then
    panic("root of a negative number!")
  end
  n.sqrt() as int
end
print(integer_root(49))
```

## Better than panicking: a nullable

You return `none` and let the caller decide.

```qlang
fun divide(a: int, b: int) -> float?
  if b == 0 then return none end
  a / b
end
let r = divide(10, 0)
if r == none then
  print("division impossible")
else
  print(r)
end
```

## Validating before acting

```qlang
fun read_index(xs: array<int>, i: int) -> int?
  if i < 0 or i >= xs.len() then return none end
  xs[i]
end
print(read_index([5, 6, 7], 1))
print(read_index([5, 6, 7], 9))
```

## Seeing runtime errors

Run each example to see the message.

<!-- expect-error -->
```qlang
print(1 div 0)                 -- division by zero
```

<!-- expect-error -->
```qlang
print([1, 2, 3][5])            -- index out of range
```

<!-- expect-error -->
```qlang
panic("boom")                  -- stopping on purpose
```

<!-- expect-error -->
```qlang
print(int.MAX + 1)             -- integer overflow
```

Two other runtime errors come from qlang's limits: `R900` (too many steps: an infinite loop?)
and `R901` (too many nested calls: infinite recursion?).

In a terminal, the program exits with code 0 on success, 1 for a compile error and 2 for a
runtime error. This is useful in shell scripts.

## Remember

- Type errors are caught **before** running: it is a gift.
- `assert` for testing; `panic` for the impossible; a nullable for normal failure.
- Always read the whole error message: line, column, excerpt.
