---
title: "Match"
---

# Match

`match` compares a value with several **patterns**. It is a more readable `if` / `elseif` when
you test the same value. It is also an expression: it has a value.

```qlang
fun day(n: int) -> string
  match n
    case 1 then "Monday"
    case 2 then "Tuesday"
    case 3 then "Wednesday"
    case 4 then "Thursday"
    case 5 then "Friday"
    case 6 then "Saturday"
    case 7 then "Sunday"
    else "unknown"
  end
end
print(day(3))
print(day(9))
```

## Ranges

```qlang
fun mention(grade: int) -> string
  match grade
    case 0..10 then "failed"           -- 0 to 9
    case 10..12 then "pass"            -- 10 and 11
    case 12..14 then "fairly good"
    case 14..16 then "good"
    case 16..=20 then "very good"      -- 16 to 20 included
    else "invalid grade"
  end
end
print(mention(8))
print(mention(13))
print(mention(18))
print(mention(25))
```

## Guards

`case x if condition`: `x` is the tested value.

```qlang
fun classify(n: int) -> string
  match n
    case 0 then "zero"
    case x if x < 0 then "negative ({x})"
    case x if x mod 2 == 0 then "even ({x})"
    else "odd"
  end
end
print(classify(0))
print(classify(-4))
print(classify(10))
print(classify(7))
```

## On strings

```qlang
fun answer(s: string) -> bool
  match s
    case "yes" then true
    case "y" then true
    else false
  end
end
print(answer("yes"))
print(answer("maybe"))
```

## On a nullable

`case none` handles the "nothing" case.

```qlang
fun describe(x: int?) -> string
  match x
    case none then "nothing"
    case 0 then "zero"
    case n then "a number: {n}"
  end
end
print(describe(none))
print(describe(0))
print(describe(9))
```

## With an enumeration

The compiler checks that all the cases are covered.

```qlang
enum Light
  Red
  Orange
  Green
end
fun action(l: Light) -> string
  match l
    case Light.Red then "stop"
    case Light.Orange then "slow down"
    case Light.Green then "go"
  end
end
print(action(Light.Orange))
```

## The `_` pattern

`_` accepts anything without giving it a name.

```qlang
fun is_special(n: int) -> bool
  match n
    case 42 then true
    case _ then false
  end
end
print(is_special(42))
```

## `match` as a statement

You do not have to use its value.

```qlang
let n = 3
match n
  case 3 then print("it is three")
  else print("something else")
end
```

## Remember

- The `case`s are tried in order; the first one that matches wins.
- Ranges (`a..b`, `a..=b`), guards (`if`), `none` and enumerations are patterns.
- There is no `case 1, 2, 3`: one `case` per value (or a guard).
- For a `match` to be used as a value, it must be exhaustive (`else`, or a complete enumeration).
