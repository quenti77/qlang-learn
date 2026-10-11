---
title: "Conditions"
---

# Conditions

A program must be able to **choose**: do this *if* something is true, otherwise do that.

In the examples of this chapter, we use a temperature:

```qlang
let temperature = 25
```

## `if` … `then` … `end`

```qlang
-- (defined earlier in this chapter)
let temperature = 25

if temperature > 20 then
  print("It is warm")
end
```

## `else`: otherwise

```qlang
-- (defined earlier in this chapter)
let temperature = 25

if temperature > 30 then
  print("heat wave")
else
  print("no heat wave")
end
```

## `elseif`: several cases

The first one that is true wins.

```qlang
-- (defined earlier in this chapter)
let temperature = 25

if temperature < 0 then
  print("freezing")
elseif temperature < 15 then
  print("cool")
elseif temperature < 25 then
  print("mild")
else
  print("hot")
end
```

## On a single line

Everything can fit on one line.

```qlang
-- (defined earlier in this chapter)
let temperature = 25

if temperature == 25 then print("exactly 25") end
```

The condition **must** be a `bool`. There is no "implicit true/false": `if 1 then` or
`if "text" then` are errors. This is on purpose: fewer traps.

## Combining conditions

```qlang
let age = 17
let accompanied = true
if age >= 18 or (age >= 12 and accompanied) then
  print("Entry allowed")
end

if not (age >= 18) then
  print("Minor")
end
```

## `if` as an expression

`if` produces a value (the `else` is then mandatory).

```qlang
-- (defined earlier in this chapter)
let age = 17

let status = if age >= 18 then "adult" else "minor" end
print(status)
```

It is handy for a maximum, an absolute value…

```qlang
let a = 8
let b = 12
let biggest = if a > b then a else b end
print("max = {biggest}")
```

## Nested conditions

```qlang
let grade = 14
if grade >= 10 then
  if grade >= 16 then
    print("Very good")
  else
    print("Passed")
  end
else
  print("Failed")
end
```

## A classic example: the leap year

```qlang
fun is_leap_year(year: int) -> bool
  (year mod 4 == 0 and year mod 100 != 0) or year mod 400 == 0
end
print(is_leap_year(2024))   -- true
print(is_leap_year(1900))   -- false
print(is_leap_year(2000))   -- true
```

## Comparing strings

```qlang
let password = "secret"
if password == "secret" then
  print("access granted")
end
```

## Remember

- `if` / `elseif` / `else` / `end`: a single `end` for the whole chain.
- The condition is always a `bool`.
- `if` can be used as a value: `let x = if c then 1 else 2 end`.
