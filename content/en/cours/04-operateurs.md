---
title: "Operators"
---

# Operators

## Arithmetic

```qlang
print(7 + 2)       -- 9
print(7 - 2)       -- 5
print(7 * 2)       -- 14
print(7 / 2)       -- 3.5  : `/` ALWAYS gives a float
print(7 div 2)     -- 3    : integer division (the remainder is dropped)
print(7 mod 2)     -- 1    : the remainder of the division (also written %)
print(7 % 2)       -- 1
print(2 ** 10)     -- 1024 : power
print(-7 div 2)    -- -3   (truncated towards zero)
print(5.5 mod 2)   -- 1.5
```

## Mixing `int` and `float`

```qlang
print(1 + 2.5)     -- 3.5
print(1 == 1.0)    -- true
```

## Precedence

As in maths, `*` comes before `+`. Parentheses force the order.

```qlang
print(2 + 3 * 4)   -- 14
print((2 + 3) * 4) -- 20
print(2 ** 3 ** 2) -- 512 (2 ** 9): power is evaluated from right to left
print(-2 ** 2)     -- -4 : it is -(2 ** 2)
```

Tip: `mod` is used to test even/odd, multiples, and so on.

```qlang
print(10 mod 2 == 0)    -- true : 10 is even
print(15 mod 5 == 0)    -- true : 15 is a multiple of 5
```

## Comparisons

They give a `bool`.

```qlang
print(3 < 5)
print(3 <= 3)
print(3 > 5)
print(3 >= 4)
print(3 == 3)
print(3 != 4)
print("a" < "b")        -- alphabetical order
print("abc" == "abc")
```

## Logic: `and`, `or`, `not`

```qlang
print(true and false)   -- false
print(true or false)    -- true
print(not true)         -- false
let age = 20
print(age >= 18 and age < 65)   -- true
```

`and` and `or` are "lazy": if the left side is enough, the right side is never computed. Here
`1 div 0` would be an error, but it is not evaluated:

```qlang
print(false and (1 div 0 == 0))   -- false, no error
```

## Ranges

`a..b` excludes `b` and `a..=b` includes it. They are mostly used with `for`.

```qlang
for i in 0..3 do write("{i} ") end
print("")
for i in 0..=3 do write("{i} ") end
print("")
```

## Numeric functions

```qlang
print(10.abs())          -- 10
print((-10).abs())       -- 10
print(3.min(8))          -- 3
print(3.max(8))          -- 8
print(2.pow(8))          -- 256
print(16.sqrt())         -- 4.0
print(3.7.floor())       -- 3
print(3.2.ceil())        -- 4
print(3.5.round())       -- 4
print(float.PI)
print(int.MAX)
```

## Beware of floats

Computers are inexact with decimals.

```qlang
print(0.1 + 0.2)         -- 0.30000000000000004 ! (this is not a qlang bug)
```

## Overflow

An `int` does not go beyond 64 bits: going past it is a runtime error. Try
`print(int.MAX + 1)` in the previous example.

## Remember

- `/` gives a float, `div` an integer, `mod` the remainder.
- `and`, `or`, `not` combine booleans.
- Comparisons cannot be chained: `a < b < c` is forbidden, write `a < b and b < c`.
