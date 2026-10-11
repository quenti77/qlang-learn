---
title: "Values and types"
---

# Values and types

Every value has a **type**: what it is (a whole number, some text…). qlang checks the types
**before** running the program. If you mix incompatible things, it tells you right away, with
the exact line.

## Whole numbers: `int`

An `int` is a whole number (64 bits).

```qlang
print(42)
print(-7)
print(1_000_000)      -- the _ makes big numbers easier to read
print(0xFF)           -- hexadecimal (base 16)  -> 255
print(0b1010)         -- binary (base 2)        -> 10
```

## Decimal numbers: `float`

A `float` is a number with a decimal part: you write a dot, not a comma.

```qlang
print(3.14)
print(2.5e3)          -- scientific notation: 2.5 x 10^3 = 2500.0
print(1.0)            -- 1.0 is a float, 1 is an int: they are two different types!
```

## Booleans: `bool`

A `bool` is `true` or `false`, and nothing else.

```qlang
print(true)
print(false)
```

## Text: `string`

A `string` is a piece of text.

```qlang
print("hello")
print("")             -- the empty string exists too
```

## Nothing at all: `none`

`none` means "no value" (we come back to it in lesson 11).

```qlang
print(none)
```

## Interpolation: putting values in text with { }

```qlang
print("1 + 2 = {1 + 2}")
print("The double of 21 is {21 * 2}")
-- To show a real brace: \{ and \}
print("A brace: \{ opened")
```

## Conversions: changing type with `as`

There is no automatic conversion from `int` to `float`: you ask for it explicitly.

```qlang
print(7 as float)         -- 7.0
print(3.99 as int)        -- 3  (the decimal part is cut off, not rounded)
print(42 as string)       -- "42" (text, no longer a number)
print(true as string)     -- "true"
```

Converting text to a number can **fail** (`"abc"` is not a number). The result is therefore
"an `int` **or** `none`", which we write `int?`.

```qlang
print(int.parse("123"))   -- 123
print(int.parse("abc"))   -- none
print(float.parse("2.5")) -- 2.5
```

## Arrays and dictionaries

They are detailed in lessons 9 and 10.

```qlang
print([1, 2, 3])
print({ "a": 1, "b": 2 })
```

## Remember

- Basic types: `int`, `float`, `bool`, `string`.
- `1` (`int`) and `1.0` (`float`) are different types.
- `"{...}"` inserts a value into a text.
- `x as type` converts when the conversion always succeeds.
- `int.parse(text)` returns `none` if it fails.

## Try it

- Run `print(10 as string + "!")`, then `print(10 + "!")` and read the error.
- Run `print(int.parse("12"))`, then try with `"12.5"`.
