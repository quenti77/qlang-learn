---
title: "None and nullable types"
---

# None and nullable types

Sometimes a value may not exist: we look for an element that is not there, we read a number
from invalid text… qlang expresses it in the **type**: `int?` means "an `int`, **or** `none`".
The compiler forces you to handle the "nothing" case: you cannot forget it!

```qlang
let a: int = 5
-- let b: int = none     -- ERROR: an int cannot be none
let c: int? = none       -- OK
let d: int? = 7          -- OK too
print(c)
print(d)
```

`print(d + 1)` is refused until we have checked: `d` may be `none`.

## After a test

After a test, the compiler **knows** that the value is present.

```qlang
-- (defined earlier in this chapter)
let d: int? = 7          -- OK too

if d != none then
  print(d + 1)           -- here d is an int
end
```

## Leaving early

After the `if`, the value is necessarily present.

```qlang
fun double_or_zero(x: int?) -> int
  if x == none then
    return 0
  end
  x * 2                  -- x is an int here
end
print(double_or_zero(21))
print(double_or_zero(none))
```

## With `and`

On the right of `and`, the check is known.

```qlang
let age: int? = 30
print(age != none and age > 18)
```

## Where do we meet nullables?

```qlang
print(int.parse("12"))          -- int?
print([1, 2, 3].index_of(9))    -- int?
let empty: array<int> = []
print(empty.pop())              -- none
print(empty.max())              -- none
let m = { "a": 1 }
print(m["z"])                   -- none
```

## A useful example: safe input

```qlang
fun read_age(text: string) -> string
  let n = text.to_int()
  if n == none then return "'{text}' is not a number" end
  if n < 0 then return "negative age" end
  "valid age: {n}"
end
print(read_age("42"))
print(read_age("abc"))
print(read_age("-3"))
```

## A limit

The test works on **variables**, not on `obj.field` or on a call. We first copy into a
variable:

```qlang
let result = int.parse("5")
if result != none then
  print(result * 2)
end
```

Calling a method or reading a field on a nullable value is a compile error: with
`let s: string? = "abc"`, `print(s.len())` is refused. Check `s != none` first.

## Remember

- `T?` = `T` or `none`. The compiler forces you to test before using.
- `if x == none then return … end`, then `x` can be used.
- Many operations that can fail return a nullable.
