# The qlang language

qlang is a simple, readable, statically typed language. It is designed for learning to
program without being stuck in pseudo-code: its syntax is in English and looks like real
languages (Rust, TypeScript, Lua) while staying sober.

This document describes the language as it is implemented. The grammar
[`qlang.g4`](../qlang.g4) gives an indicative overview of the syntax, and the
[README](../README.md) explains how to use it (terminal, JSON, HTTP).

## Contents

- [The qlang language](#the-qlang-language)

---

## 1. First program

```
let name = "world"
print("Hello {name}!")

for i in 0..3 do
  print("i = {i}")
end
```

A program is a sequence of statements, executed from top to bottom. There is no `main`
function.

---

## 2. Comments

Comments start with `--`, a character that is easy to type on both an AZERTY and a QWERTY
keyboard.

```
-- single-line comment
let x = 1 -- or at the end of a line

--(
  comment over
  several lines
--)

--"
  documentation comment
--"
```

- Comments do not nest.
- `--` followed by `(` or `"` always opens a block or documentation comment, never a line
  comment.
- Careful: `a --b` is a comment. To subtract a negative number, write `a - -b`.

### Documentation comments

A `--" … --"` comment placed **right above** a declaration (with no blank line between the
two) **documents** it. The program runs as with any comment, but the compiler keeps the text
and attaches it to the declaration: editors show it on hover and in autocompletion.

```
--" Straight-line distance between two points. --"
fun distance(a: Point, b: Point) -> float
  ...
end

--"
  A point on the plane.

  The coordinates are integers.
--"
struct Point
  --" Horizontal position. --"
  public x: int
  public y: int
end
```

You can document: a function (or a method, a `trait` signature), a `struct`, a field, an
`enum` and each of its variants, a `trait`, and a top-level variable or constant. A comment
only documents the declaration that follows it; with a blank line between the two, it
documents nothing. The text is free (Markdown is possible): the indentation common to all
lines and the blank lines at the start and at the end are removed. `qlang check --json` with
`"info": true` returns these texts (`doc` field).

`qlang doc` turns them into a Markdown page: for each file, its exported names (all of them if
it has no `export`) with their signature and comment, then the `public` fields, methods and
variants of their types. `qlang doc` alone documents the project (without the test files nor the `examples` folder);
`qlang doc lib.q` one file; `-o API.md` writes to a file.

---

## 3. Values and types

qlang is **statically typed**: every value has a type known before execution, and all type
errors are reported before the program starts. Most of the time the type is **inferred** and
does not need to be written.

| Type        | Examples                                | Note             |
| ----------- | --------------------------------------- | ---------------- |
| `int`       | `42`, `1_000`, `0xFF_FF`, `0b0101_0101` | 64-bit integer   |
| `float`     | `3.14`, `2.5e3`, `1_000.5`              | decimal number   |
| `bool`      | `true`, `false`                         |                  |
| `string`    | `"text"`                                | cannot be modified |
| `T?`        | `int?`, `string?`                       | `T` or `none`    |
| `array<T>`  | `[1, 2, 3]`                             | array of `T`     |
| `map<K, V>` | `{ "a": 1, "b": 2 }`                    | dictionary       |

The basic types are written in lower case. Dictionaries are described in
[section 14](#dictionaries). The types you define (`struct`, `trait`, `enum`) start with a
capital letter by convention.

### Numbers

- `int` and `float` are two distinct types: `1` is an `int`, `1.0` is a `float`.
- Numbers in base 2 (`0b…`) and base 16 (`0x…`) are accepted.
- The `_` character can separate digits for readability: `1_000`, `0xFF_FF`,
  `0b0101_0101`. It must be **between two digits**.
- A `float` always has a digit after the point: `0..10` is the range from 0 to 10, not a
  number.
- An `int` does not exceed 64 bits: a computation that goes out of this range is an error
  ("integer overflow"), never a silently wrong result.

### Strings

A string is written between double quotes and can span several lines.

```
let a = "Hello"
let b = "line 1\nline 2"
```

Escapes: `\n` `\t` `\r` `\0` `\\` `\"` `\{` `\}`.

**Interpolation.** An expression between braces is evaluated and inserted into the string.
It is a convenience: concatenation with `+` works too.

```
let x = 2
let y = 3
print("{x} + {y} = {x + y}")
```

The expression inside `{ }` can contain strings of its own (`"{names.join(", ")}"`); a brace in
such a string is also written `\{`. To show a brace, write
`\{`. Any value can be interpolated: it is converted with `as string` (see
[Conversions](#conversions)).

Strings are compared with `==` and `<`, concatenated with `+`, and indexed by character:
`"héllo"[1]` is `"é"`. `len()` counts characters, not bytes.

### `none` and nullable types

A variable can only be `none` if its type ends with `?`.

```
let a: int = none    -- error
let b: int? = none   -- ok
```

A nullable value cannot be used as if it were never `none`. You have to check it first:
after a test, the compiler knows the value is present.

```
let age: int? = int.parse("12")

if age != none then
  print(age + 1)      -- here age is an int
end

if age == none then
  return              -- we leave: after this if, age is an int
end
print(age + 1)

print(age != none and age > 10)   -- to the right of `and`, age is an int
```

This narrowing works for variables (local, parameters, file variables) with `==`/`!=`
against `none`, combined with `and`, `or` and `not`. An assignment updates it: after
`x = 5`, `x` is present; after `x = none` or `x = other_nullable`, it has to be checked
again. It does not apply to fields (`obj.field`) nor to call results: copy the value into a
variable first, then test the variable. Comparing to `none` is always allowed.

A variable that a **function or an anonymous function assigns** (`x = ...` in its body,
without having declared it there) is never narrowed: a call between the test and the use
could set it back to `none`. Copy its value into a local variable before testing it.

Calling a method or reading a field on a value that may be `none` is a compile-time error.

**`a ?? b`** gives `a` if it is not `none`, otherwise `b`. `a` must be nullable (`T?`); `b` has type
`T` (the result is then a `T`) or `T?` (the result stays nullable). `b` is only evaluated when `a` is
`none`, and `0` or `""` are not `none`:

```
let port = env.get("PORT") ?? "8080"
let d = a ?? b ?? 9      -- reads a ?? (b ?? 9)
```

It is the loosest of the calculation operators (just above `..`): `x ?? 1 + 2` is `x ?? (1 + 2)`. A
left side that is not nullable is the error `T010`.

### Tuples

A **tuple** groups a fixed number of values, of different types, without declaring a struct.
Its type is written `(int, string)`, its value `(1, "a")`: at least two elements. You read an
element by its **position**, starting at 0:

```
fun bounds(xs: array<int>) -> (int, int)
  (xs[0], xs[xs.len() - 1])
end

let b = bounds([3, 1, 2])
print(b)             -- (3, 2)
print(b.0)           -- 3
print(b.1)           -- 2
let nested = (1, (2.5, true))
print(nested.1.0)    -- 2.5
```

- A tuple **does not change**: `t.0 = 5` is refused; you build a new one.
- `==` and `!=` compare the elements one by one; it is shown as `(1, "a")`. `<`, `<=`, `>`,
  `>=`, `sort`, `min` and `max` compare them too, element by element starting with the first
  (`(1, 9) < (2, 0)`), as long as each element can be ordered (not `bool`, not nullables):
  `[(2, "b"), (1, "z")].sort()` gives `[(1, "z"), (2, "b")]`.
- A tuple can be a dictionary key and a set value when its elements can:
  `{ (0, 0): "origin" }`, `Set.of([(0, 0), (1, 2)])`.
- A tuple type accepts a wider element: `let t: (int?, string) = (5, "a")`.
- A position that does not exist (`(1, 2).2`) is a compile-time error (`T286`), like `.0` on
  something that is not a tuple (`T287`). A single element is not a tuple: `(1)` is just `1`
  and `(1,)` is refused.

**Destructuring.** `let (a, b) = t` takes a tuple apart, and `for (a, b) in …` does the same for
each element:

```
let (lo, hi) = bounds([3, 1, 2])          -- lo = 3, hi = 2
let (name, (x, y)) = ("p", (1, 2))        -- nested patterns
let (_, hi2) = bounds([1, 2])             -- _ ignores an element
const (k, v): (string, int) = ("a", 1)    -- const, and the type is optional

let people: array<(string, int)> = [("ana", 31), ("bob", 27)]
for (name, age) in people do
  print("{name} is {age}")
end
for i, (name, _) in people do             -- the index, then the destructured element
  print("{i}: {name}")
end
```

**Assigning.** On the left of an `=`, a tuple of targets receives the elements of a tuple; the
value is computed entirely before the first target changes, so `(a, b) = (b, a)` swaps:

```
(a, b) = (b, a)                      -- swap without a temporary variable
(xs[0], xs[2]) = (xs[2], xs[0])      -- also with array elements
(p.x, p.y) = (p.y, p.x + p.y)        -- and fields
(cur, next) = (next, cur + next)     -- Fibonacci in one line
((q, _), r) = ((5, 6), 7)            -- nested patterns, `_` ignores an element
```

Each target must be assignable (a constant is refused, `T210`); `+=` and the other operators do
not apply to a tuple.

The pattern must have as many names as the tuple has elements (`T288`) and only applies to a
tuple (`T289`). The resulting variables are ordinary variables (`const` freezes them); at the
top level of a file they are exported like the others.

### Conversions

There is no implicit conversion between `int` and `float` for assignment or parameters. You
convert explicitly with `as`:

```
let n = 7
let f = n as float
let i = (f * 2.5) as int   -- the decimal part is lost: 17
let s = n as string
```

`as` works for any type thanks to the `As<T>` trait: `x as T` is sugar for calling the
`convert` method of the `As<T>` implementation of the type of `x`. The language provides:

- `int` to `float`, and `float` to `int` (truncation; error if the number is infinite or too
  large);
- any type to `string` (numbers, booleans, `none`, arrays, enums; a structure is shown as
  `Point { x: 1, y: 2 }` unless it implements `As<string>`);
- a type to itself or to a parent type.

You can add more for your own types, see [section 10](#overloading-a-conversion).

`as` is reserved for conversions that **always succeed**. A conversion that can fail (such
as reading a number from a text) returns a nullable type: `int.parse(s)` gives an `int?`.

---

## 4. Variables

A variable is always **initialised** at its declaration.

```
let count = 0            -- modifiable, inferred type (int)
let ratio: float = 0.5   -- written type
const PI = 3.14          -- cannot be reassigned
let name: string? = none -- "empty" variable: it needs a nullable type
```

- `let` declares a modifiable variable.
- `const` declares a name that cannot be reassigned. Its value can be computed at run time
  (`const size = 2 * 10`). Only the **name** is fixed: the content of an array or of a
  structure stays modifiable.
- There is no uninitialised variable: to represent the absence of a value, use a nullable
  type and `none`.
- Declaring the same name twice in the same scope is an error. In an inner block, however,
  you can reuse a name (it hides the other one).

```
const t = [0]
t[0] = 2        -- ok: we modify the content
t = [1]         -- error: we reassign the name

const p = Point { x: 1, y: 2 }
p.x = 5         -- ok
p = Point { x: 0, y: 0 }  -- error
```

### Values and references

Arrays and structures are **references**: assigning or passing as an argument does not copy,
it **shares** the same object.

```
let a = [1, 2, 3]
let b = a
b[0] = 99
print(a[0])   -- 99: a and b designate the same array

fun reset(xs: array<int>)
  xs[0] = 0   -- modifies the caller's array
end
```

`int`, `float`, `bool` and `none` are plain values, copied at each assignment. A `string` is
not modified in place: an operation that "changes" it produces a new string.

### Assignment

`=` and the compound operators `+=` `-=` `*=` `/=` `div=` `mod=` `%=` modify a variable, a
field (`a.b = 1`) or an element (`a[i] = 1`). Assignment is an expression: `a = b = 0` is
valid. `x op= y` means `x = x op y`, and the type of the result must fit `x`.

```
count += 1
a[0] = 42
```

Careful: `/` always gives a `float`. Writing `n /= 2` for an `int` is therefore an error; write
`n div= 2` (or `n = n div 2`). `div=` is written together, with no space between `div` and
`=` (same for `mod=`).

---

## 5. Operators

### Precedence

From the weakest to the strongest:

| Operators                                  | Note                                                         |
| ------------------------------------------ | ------------------------------------------------------------ |
| `=` `+=` `-=` `*=` `/=` `div=` `mod=` `%=` | assignment, right-associative                                |
| `??`                                       | default value of a nullable, right-associative               |
| `..` `..=`                                 | range, non-associative                                       |
| `or`                                       |                                                              |
| `and`                                      |                                                              |
| `not`                                      | prefix                                                       |
| `==` `!=` `<` `<=` `>` `>=`                | non-associative: `a < b < c` is forbidden                    |
| `+` `-`                                    |                                                              |
| `*` `/` `div` `mod` `%`                    | `%` is a synonym of `mod`                                    |
| `as`                                       | type conversion                                              |
| `-x`                                       | negation (prefix)                                            |
| `**`                                       | power, right-associative: `-2 ** 2` is `-(2 ** 2)`           |
| `f()` `a[i]` `a.b`                         | call, index, access                                          |

### Computing with numbers

| Expression   | Result   | Note                                                |
| ------------ | -------- | --------------------------------------------------- |
| `7 / 2`      | `3.5`    | `/` always gives a `float`                          |
| `7 div 2`    | `3`      | integer division (towards zero): `-7 div 2` is `-3` |
| `7 mod 2`    | `1`      | remainder: has the sign of the first number         |
| `2 ** 10`    | `1024`   | two `int`s give an `int`                            |
| `2.0 ** 0.5` | `1.414…` | otherwise, a `float`                                |

- `div` only applies to two `int`s. `mod` also applies to `float`s (`5.5 mod 2` is `1.5`).
- Dividing by zero (`/`, `div`, `mod`) is a run-time error.
- A negative exponent with two `int`s is an error (`2 ** -1`): write `2.0 ** -1.0`.
- **`int` and `float` mix** for computing and comparing: `1 + 2.5` is `3.5` (a `float`).
  This comes from trait implementations provided by the language (`impl Add<float> for int`,
  etc.), and you can define your own.

### Comparisons and logic

- `==` and `!=` work on numbers (`1 == 1.0` is true), booleans, strings, enumerations,
  arrays (element by element) and nullable values (`x == none`). To compare two structures,
  you have to implement the `Eq` trait.
- `<`, `<=`, `>`, `>=` work on numbers and strings (alphabetical order of Unicode
  characters). For a structure, you have to implement `Ord`; tuples compare element by element.
- A condition (`if`, `elseif`, `while`, `match` guard) must be of type `bool`. There is no
  implicit "truthy" or "falsy": `if 1 then` and `if name then` are errors.
- `and` and `or` only evaluate their right side if necessary.

### Ranges

```
0..10     -- 0 to 9 (the end bound is excluded)
0..=10    -- 0 to 10 (the end bound is included)
```

A range is a value (type `range`) made of two `int`s. It is mostly used with `for`.

### Operators are methods

Operators are defined by **traits**. `a + b` is sugar for `a.add(b)`, including for `int`
and `string`: `"a" + "b"` is `"a".add("b")`.

| Operator                               | Trait             | Method                                             |
| -------------------------------------- | ----------------- | -------------------------------------------------- |
| `+` `-` `*`                            | `Add` `Sub` `Mul` | `add` `sub` `mul`                                  |
| `/`                                    | `Div`             | `divide`                                           |
| `div`                                  | `IntDiv`          | `int_div`                                          |
| `mod` `%`                              | `Mod`             | `modulo`                                           |
| `**`                                   | `Pow`             | `pow`                                              |
| `-x`                                   | `Neg`             | `neg`                                              |
| `==` `!=`                              | `Eq`              | `eq`                                               |
| `<` `<=` `>` `>=`                      | `Ord`             | `cmp` (returns an `int`: negative, zero or positive) |
| `+=` `-=` `*=` `/=` `div=` `mod=` `%=` | the same traits   | `a += b` means `a = a + b`                         |
| `a[i]`                                 | `Index<I>`        | `index`                                            |
| `a[i] = v`                             | `IndexSet<I, V>`  | `set_index`                                        |
| `a[] = v`                              | `Push<T>`         | `push`                                             |
| `x as T`                               | `As<T>`           | `convert`                                          |

The traits of binary operators have a parameter for the right operand, which is the type
itself by default: `impl Add for Point` is `impl Add<Point> for Point`. A type can implement
a trait for several operands (`impl Mul<int> for Point` and `impl Mul<float> for Point`).

See [section 10](#10-traits-and-operator-overloading) to redefine them on your own types.

---

## 6. Conditions

### `if`

```
if x > 0 then
  print("positive")
elseif x < 0 then
  print("negative")
else
  print("zero")
end
```

A single `end` closes the whole `if` / `elseif` / `else` chain. Everything can fit on one
line if needed: `if ok then print("ok") end`.

### `if` as an expression

There is no ternary operator: `if` is an expression. The value is the one of the last
expression of the chosen branch. In this case `else` is mandatory, and the branches must
have the same type (or a common type: `1` and `none` give `int?`).

```
let sign = if x >= 0 then 1 else -1 end
```

An `if` without `else` has no value.

### `match`

```
let label = match n
  case 0 then "zero"
  case 1..=9 then "small"
  case x if x > 100 then "huge"
  else "other"
end
```

Possible patterns in a `case`:

| Pattern             | Example                                                  |
| ------------------- | -------------------------------------------------------- |
| Literal value       | `case 42 then`, `case "a" then`, `case true then`        |
| `none`              | `case none then` (for a nullable value)                  |
| Enumeration variant | `case Color.Red then`, `case Red then`                   |
| Variant with data   | `case Circle(r) then`, `case Shape.Rect(w, _) then`      |
| Tuple               | `case (0, y) then`, `case ("get", 200..=299) then`, `case (a, b) then` |
| Range               | `case 1..=9 then`, `case 0.5..1.5 then`                  |
| Binding + guard     | `case x if x > 100 then` (`x` names the tested value)    |

A variant can be written with or without the name of the enumeration when the tested value
tells which one it is (`case Red`, `case Circle(r)`); a name that is a variant of that type is
the variant, otherwise it is a binding. For a variant that carries data, name each value in
parentheses (`_` to ignore it): the number of patterns must be that of the values.

Patterns **nest**: a tuple pattern has one sub-pattern per element, a variant with data one
sub-pattern per carried value, and each sub-pattern is itself a pattern (a value, a range,
`none`, a name, `_`, a tuple, a variant). The names are bound in the guard and in the body.

```
match (shape, color)
  case (Circle(r), Red) then print("red circle of radius {r}")
  case (Rect(w, _), _) then print("rectangle of width {w}")
  else print("other")
end

match result
  case Ok((n, name)) then print("{n} {name}")
  case Ok(0) then print("zero")      -- a literal inside a variant
  case Err(e) then print(e.message)
end
```

The compiler checks that the `case`s **cover** every value, counting variants, `true`/`false`
and `none` down into nested patterns: `(Red, Red)`, `(Red, Green)` and `(Green, _)` are enough
for two colors. Literal values and ranges never cover a type (you then need an `else` or a
name), and a `case` with a guard is not counted. Inside a tuple, a name does not remove the
`none` of a nullable element (only a `case none` at the first level does).

The `case`s are tried in order. A lone name (`case x then`) accepts any value and names it;
`_` accepts any value without naming it. After a `case none`, a bound name can no longer be
`none`.

Like `if`, `match` is an expression. To use its value, it has to be **exhaustive**: either an
`else`, or a `case` that accepts everything, or all the variants of an enumeration (or
`true` and `false`), without a guard. Otherwise it has no value. You need one `case` per
value: you cannot write `case 1, 2, 3`.

---

## 7. Loops

```
while count < 10 do
  count += 1
end

for i in 0..10 do         -- 0 to 9
  print(i)
end

for i in 0..=10 step 2 do -- 0, 2, 4, 6, 8, 10
  print(i)
end

for i in 10..0 step -3 do -- 10, 7, 4, 1
  print(i)
end

for item in items do      -- walk through an array
  print(item)
end

for c in "abc" do         -- walk through a string, character by character
  print(c)
end

for i, item in items do   -- with the index: 0, 1, 2…
  print("{i}: {item}")
end

for key, value in ages do -- walk through a dictionary: key and value
  print("{key} is {value} years old")
end
```

- `break` leaves the loop, `continue` moves on to the next iteration.
- There is no `loop`: write `while true do … end`.
- `break` and `continue` have no label: they apply to the closest loop.
- **Two variables**: on an array or a string, `for i, x in …` gives the index (an `int`,
  starting at 0) then the element; on a dictionary, `for k, v in m` gives the key then the
  value, in insertion order. A range has no second variable. Looping over a dictionary with
  a single variable is an error (keys or values?): write `for k, v in m` or
  `for k in m.keys()`. The loop over a dictionary works on a copy of its entries: you can
  modify it in the body.
- `step` is only used with a range. A positive step advances while the value is below the
  end, a negative step while it is above. The step cannot be 0. Without `step`, the step is
  1: `5..1` does not loop at all.
- The array being walked can be modified during the loop; the loop sees the added elements.

---

## 8. Functions

```
fun add(a: int, b: int) -> int
  a + b
end

print(add(1, 2))
```

- Parameters are typed. `-> type` gives the return type; without it, the function returns no
  value.
- **The return value is the last expression of the body**, as for `if`.
- `return` is optional and is used for early exits:

```
fun first_positive(xs: array<int>) -> int?
  for x in xs do
    if x > 0 then return x end
  end
  none
end
```

### Named arguments

A call can name its arguments with `name: value`, in any order:

```
fun greet(greeting: string, name: string) -> string
  greeting + " " + name
end

print(greet(name: "ana", greeting: "hi"))   -- hi ana
print(greet("hi", name: "ana"))             -- mixing positional and named
```

Positional arguments must come before named ones, each parameter can only be
filled once, and every parameter must be given. Named arguments only work for
calling a function or method declared in qlang code (not native built-ins
such as `print` or `.sort()`).

### Anonymous functions

```
let double = fun(x: int) -> int
  x * 2
end
```

An anonymous function is a **closure**: it keeps access to the variables of the function
around it, and can modify them.

```
fun counter() -> fun() -> int
  let n = 0
  fun() -> int
    n += 1
    n
  end
end

let next = counter()
next()
print(next())   -- 2
```

An anonymous function cannot be generic.

### The type of a function

The type of a function is written like its declaration:

```
fun apply(f: fun(int) -> int, x: int) -> int
  f(x)
end

print(apply(double, 21))
```

`fun(int) -> int?` is a function that returns an `int?`. For a function that is itself
nullable, use parentheses: `(fun(int) -> int)?`.

### Type aliases

`type Name = type` gives a name to a type. The alias and the type are **the same type**:
nothing is converted, one can be passed where the other is expected.

```
type Handler = fun(Request) -> Response
type Middleware = fun(Request, Handler) -> Response
type Names = array<string>

fun wrap(m: Middleware, h: Handler) -> Handler
  fun(req: Request) -> Response
    m(req, h)
  end
end
```

- `type` is not a reserved word: `let type = 3` is still valid. It only starts an alias in the
  form `type Name =`, at the top level of a file.
- An alias is declared in a file, exported (`export Handler`) and imported like a structure. It
  has no type parameter (`T121` if you give one).
- It only serves to **write a type**: you cannot build a value by its name (`Names { ... }` does
  not exist: write the name of the real type).
- An alias that refers to itself, directly or through another, is an error (`T122`), and the
  type of an alias is checked even if nothing uses it.

### Types at run time

Types are erased at run time, except for a generic function that **names them**: if its body uses
`Reflect.type_name<T>()`, `a.as<T>()`, `Any.of(x)`, `Json.to<T>(j)` or `Reflect.construct<T>(...)`
with its own type parameter `T`, every call passes it the chosen type.

```
fun decode<T>(text: string) -> Result<T, Error>
  Json.to<T>(Json.parse(text)?)
end

let input = decode<CreateUser>("\{\"name\": \"Ann\"\}")
```

- This also holds for a function that calls another one passing its `T` (`name_of<array<T>>()`)
  and for the type parameters of a **method** (`bag.get<int>()`).
- The type parameters of a generic **structure** (`Stack<T>`) are not known: in its methods, `T`
  keeps its name.
- Only a direct call provides the types: a function passed as a value and then called does not
  receive them.

### Local declarations

Named `fun` declarations only exist at file level. In a block, a local function is written
`let f = fun(…) … end`. The same goes for `struct`, `impl`, `trait`, `enum`, `import` and
`export`.

---

## 9. Structures, methods and inheritance

### Declaring a structure

```
struct Point
  public x: int
  public y: int
  private label: string = "point"
  private static count: int = 0
end
```

Each field is written `visibility? static? name: type (= default)?`.

- `static` marks a field that belongs to the type and not to each instance. A `static` field
  must have an initial value. It is used with the name of the type: `Point.count`.
- A field with a default value can be left out at creation.

### Creating a value

A structure literal names all the fields that have no default value:

```
let p = Point { x: 1, y: 2 }

let x = 5
let q = Point { x, y: 3 }        -- shortcut: x is the same as x: x
let r = Point { ..p, y: 9 }      -- takes the fields of p, except y
```

`..value` takes the fields of a value of the same type (or of a parent type). It is a
shallow copy: the arrays and structures it contains are shared.

### Methods with `impl`

Methods are written in an `impl` block.

```
impl Point
  public fun new(x: int, y: int) -> Point
    Point { x: x, y: y }
  end

  public fun origin() -> Point
    Point.new(0, 0)
  end

  public fun length_squared(self) -> int
    self.x * self.x + self.y * self.y
  end
end

let p = Point.new(3, 4)
print(p.length_squared())  -- 25
```

- A method whose **first parameter is `self`** is an instance method: `p.length_squared()`.
- Without `self`, it is a **static** method, called on the type: `Point.origin()`.
- There is no special constructor: `new` is a static method like any other.
- Several `impl` blocks can coexist for the same type, as long as the method names are
  distinct.
- A field that holds a function is called like a method: `obj.callback(3)`.

### Visibility

| Visibility  | Accessible from                                              |
| ----------- | ------------------------------------------------------------ |
| `public`    | everywhere                                                   |
| `protected` | the `impl`s of the structure and of its sub-structures       |
| `private`   | the `impl`s of the structure itself (default value)          |

This applies to fields, `static` fields and methods. In particular, a `private` field cannot
be given in a structure literal outside the `impl`s of that type: go through a method such
as `new`.

### Inheritance

A structure can inherit from **a single** other structure.

```
struct Account
  protected balance: int = 0
end

struct Savings extends Account
  public rate: float = 0.02
end

impl Account
  public fun describe(self) -> string
    "balance: {self.balance}"
  end
end

impl Savings
  public fun open(rate: float) -> Savings
    Savings { ..Account { }, rate }
  end

  public override fun describe(self) -> string
    super.describe() + " (savings)"
  end
end
```

- A `Savings` can be used wherever an `Account` is expected; the overridden methods then
  apply (dynamic dispatch).
- Overriding an instance method of the parent needs the **`override`** keyword, with the same
  parameter list. Forgetting it, or writing it with no method to override, is an error.
  Static methods cannot be overridden.
- `super.method(…)` calls the parent's version.
- A field cannot take the name of a field of the parent.

### Copying a value

There is no built-in `copy()` or `clone()`: like `new`, it is up to you to write it if you
need it.

```
impl Point
  public fun clone(self) -> Point
    Point { x: self.x, y: self.y }
  end
end
```

### The name of the type: `.class`

`Point.class` gives the name of a structure or an enumeration, as text, at
compile time:

```
print(Point.class) --> "Point"
```

`value.class()` gives the same name, but at run time, from a concrete
value. It is especially useful when the static type of `value` does not
tell the whole story: a generic parameter bound by a trait (`T: Nameable`),
or a variable typed by a trait, can hide different concrete types depending
on the call:

```
trait Nameable
  fun name(self) -> string
end

struct Dog
  public n: string
end

impl Nameable for Dog
  public fun name(self) -> string
    self.n
  end
end

struct Holder<T: Nameable>
  public item: T
end

impl<T: Nameable> Holder<T>
  public fun describe(self) -> string
    "{self.item.class()}: {self.item.name()}"
  end
end

print(Holder<Dog> { item: Dog { n: "Rex" } }.describe()) --> "Dog: Rex"
```

If a type defines its own `class` method, that one is called instead:
`.class()` is a default behavior, not a reserved word.

### Annotations

An **annotation** is a note put on a declaration, between `#[` and `]`. The program does not
change: it describes something (a route, a validation rule, a label) for code that will read it.

An annotation is a structure declared with `#[annotation]`. Its fields are its arguments:

```
#[annotation]
struct Route
  path: string
  method: string = "GET"
end

#[annotation]
struct Min
  value: int
end

#[Route("/users", method: "POST")]
fun create_user() -> int
  1
end

struct Form
  #[Min(0)]
  age: int
end
```

- You can annotate a `fun`, a method (in an `impl` or a `trait`), a `struct` and its fields, an
  `enum` and its variants, a `trait`, a parameter: `fun f(#[Min(1)] n: int)`.
- Several annotations: one under the other, or separated by a comma (`#[Min(0), Tags(["id"])]`).
  A documentation comment stays above the first one.
- For a `float` field, a whole number is enough: `#[Min(1)]` (read as `1.0`).
- Arguments are given like those of a call, in the order of the fields or by name; a field with a
  default value is optional. They are **literals** (number, text without `{}`, `true`, `false`,
  `none`, array of literals): everything is known at compile time.
- The checker verifies the name (`T001`, `T290` if it is not an annotation), the arguments
  (`T292` unknown name, too many or given twice; `T293` missing argument; `T294` not a literal;
  `T002` wrong type), and that `#[annotation]` is on a structure with no type parameter, no parent
  and no `static` field (`T291`, `T295`). An annotation on a statement is an error (`P051`).

### Reflection

`Reflect` describes, at run time, what the checker knows: a structure, an enumeration, the
functions of the file, with their annotations. Types stay static: you read descriptions
(`StructInfo`, `EnumInfo`, `FunctionInfo`...), which are ordinary values.

| Call | Result |
| --- | --- |
| `Reflect.struct_info<Form>()` | `StructInfo`: `name`, `fields` (`FieldInfo`: `name`, `type_name`, `annotations`), `annotations` |
| `Reflect.enum_info<Color>()` | `EnumInfo`: `name`, `variants` (`VariantInfo`: `name`, `fields`, `annotations`), `annotations` |
| `Reflect.functions()` | `array<FunctionInfo>` of the functions declared in **this file**: `name`, `params` (`ParamInfo`: `name`, `type_name`, `annotations`), `return_type`, `annotations` |
| `Reflect.find<fun(Request) -> Response>("home")` | the function `home` of this file if its type is exactly that one, otherwise `none` |
| `Reflect.methods<Users>()` | `array<FunctionInfo>` of the methods of the `impl`s of `Users` (`has_self` tells whether it takes `self`) |
| `Reflect.find_method<Users, fun(Request) -> Response>(value, "list")` | the method `list` of `value`, already bound to it, if its type (without `self`) is that one, otherwise `none` |
| `Reflect.type_info<T>()` | the shape of a type, as a `TypeInfo`: `kind` (`int`, `string`, `array`, `map`, `struct`, `enum`...), `name`, `nullable`, `item` (element of an array, value of a map), `fields` (the fields `Json.of` writes: `FieldType` with the JSON `name`, `field`, `info`, `annotations`), `variants`, `recursive`; enough to write a schema. `ParamInfo.type_info()` and `Callable.return_info()` give that of a parameter and of the result |
| `Reflect.bound_callables<Users>(value)` | the public methods of `Users` (with `self`, without type parameters), already bound to `value`, as an `array<Callable>`: this is what makes controllers as classes possible |

An annotation that is read is an `AnnotationInfo`: `name` (its structure's) and `args`, the
arguments by field name, as `Json` (default values are filled in; numbers are floats). Every
description has `annotation("Route")`, which gives the annotation of that name or `none`.

```
#[Route("/hello", method: "POST")]
fun hello(req: Request) -> Response
  Response.text("hi")
end

for info in Reflect.functions() do
  let route = info.annotation("Route")
  if route != none then
    let path = route.args["path"]
    if path != none then
      print("{info.name} serves {path.as_string()}")   --> hello serves /hello
    end
  end
end
```

`Reflect.find` gives a real function value you can call: together with `Reflect.functions()`, it
lets you route requests from annotations (see `examples/routes.q`). For functions, only top-level ones of the
file without type parameters are concerned; for methods, use `Reflect.methods` and
`Reflect.find_method` (for example a controller: a structure whose methods carry `#[Route(...)]`).
Reflection ignores visibility: a private method can be found and called. Shape errors: `T300` (wrong number of
arguments or types), `T301` (the type is not the expected kind), `T302` (unknown name: `struct_info`,
`enum_info`, `functions`, `find`, `methods` and `find_method` exist).

#### More reflection

| Call | Result |
| --- | --- |
| `Reflect.functions(m)` | the functions of the module `m` (`import "x.q" as m`) instead of those of the file |
| `Reflect.structs()` / `Reflect.structs(m)` | `array<StructInfo>` of the structures (without type parameter or annotation) of the file or of `m` |
| `Reflect.callable("name")` / `Reflect.callable(m, "name")` | a `Callable?`: the function of that name, to call with `Any` values |
| `Reflect.callables()` / `Reflect.callables(m)` | `array<Callable>`: every function (without type parameter) of the file or of `m` |
| `Reflect.get(value, "field")` | the field of a structure, as an `Any?` (`none` if it does not exist); visibility is ignored |
| `Reflect.construct<T>(fields)` | `Result<T, Error>`: a `T` built from a `map<string, Any>` (default values respected) |
| `Reflect.type_name<T>()` | the name of the type `T` (`"array<User>"`) |
| `Reflect.parts(a)` | an `EnumParts?`: the name of the enumeration, of the variant and the data (each as an `Any`) of an enumeration value held by the `Any` `a`; `none` for anything else. It opens a `Result` given by `Callable.call` |
| `Reflect.info_of(a)` | the `StructInfo?` of the structure held by the `Any` `a` (to walk its fields with `Reflect.get`) |
| `Reflect.items(a)` | the elements, as `Any`, of the array held by the `Any` `a` (`array<Any>?`) |

`Callable` has the fields of `FunctionInfo` (`name`, `params`, `return_type`, `annotations`) and
`call(args: array<Any>) -> Result<Any, Error>`: `err` when the number of arguments or one of their
types does not fit (`argument 1: expected int, found string`). Generic functions cannot be found.
`Reflect.construct` only fills fields with a value of the right type
(``field `id`: expected int, found string``), and reports a missing field (``missing field `name` ``)
or an unknown one.

A module is not a value: `Reflect.functions(m)`, `structs(m)`, `callable(m, ...)` and
`callables(m)` are written with the name of the module, not with a variable holding it. For a
library to work on the functions of an application, it is the application that calls
`Reflect.callables(providers)` and passes the array.

**Reading the types of a signature.** A `ParamInfo` (a parameter of a `Callable`, a
`FunctionInfo` or a variant) knows how to read a value of its type:
- `p.parse("42")` reads a text (path segment, query parameter) as `int`, `float`, `bool`,
  `string`, `uuid`, `ulid`, `datetime`, or one of them followed by `?` (empty text: `none`);
  gives a `Result<Any, Error>` (``` `x` is not a valid int ```);
- `p.decode(json)` reads a `Json` as that type, as `Json.to<T>` does (see below);
- with `p.annotation("Path")`, `p.type_name` and `Callable.call`, that is what it takes to fill
  the parameters of a request handler: `show(#[Path] id: int, repo: Repo) -> string`.

An `AnnotationInfo` reads its arguments with `get_string("path")`, `get_int`, `get_float` and
`get_bool` (`none` if the argument does not exist or has another type).

### `Any`

An `Any` is a value **with its type**, to keep together values of different types (a service
container, a list of arguments) without losing typing: you only get a value out by saying which
type you expect.

```
let a = Any.of(42)
print(a.as<int>())       -- 42
print(a.as<string>())    -- none
print(a.type_name())     -- int

let user = User { id: 1, name: "Ada" }
let services: map<string, Any> = { "user": Any.of(user) }
```

- `Any.of(value)` has no implicit conversion back: `x as int` does not work on an `Any`, you need
  `a.as<T>()`, which gives a `T?` (`none` if the type does not fit).
- `as<T>` succeeds if the remembered type is exactly `T`, if the value is a child structure of
  `T`, or if it implements the trait `T`: an `Animal` that holds a `Dog` can be read as a `Dog`.
  `T` cannot be a nullable type or `Any`.
- The remembered type is the one of the expression: `Any.of([])` is refused (`T303`, give it a
  type: `let xs: array<int> = []`).
- `==` does not exist between `Any` values (`T005`); `print` shows the value inside.
- An `Any` can leave towards the host (field of a structure), as `null`, but cannot come back.

---

## 10. Traits and operator overloading

A **trait** describes methods that a type must offer. It only contains signatures.

```
trait Shape
  fun area(self) -> float
  fun name(self) -> string
end

struct Circle
  public r: float
end

impl Shape for Circle
  public fun area(self) -> float
    3.14 * self.r * self.r
  end

  public fun name(self) -> string
    "circle"
  end
end
```

An implementation must define all the methods of the trait, with the same types — except
those that have a **default method** (see below). A trait can be implemented for any type,
including `int`, `string` or `array<T>` (`impl Describe for int`).

### Default method

A trait signature can have a body: an implementation that doesn't redefine the method then
uses that default body.

```
trait Greeter
  fun name(self) -> string

  fun greet(self) -> string
    "Hello, " + self.name() + "!"
  end
end

struct Dog
end

impl Greeter for Dog
  public fun name(self) -> string
    "Rex"
  end
  -- no `greet`: uses the default behavior
end

print(Dog { }.greet())   -- Hello, Rex!
```

Inside the default body, `self` has the type of the trait itself: it can call the trait's
other methods (abstract or default), but it cannot access fields.

### A trait as a type

A trait can be used as a type: a value of that type is any value that implements it, and the
method called is the one of its real structure.

```
fun show(s: Shape)
  print("{s.name()}: {s.area()}")
end

let shapes: array<Shape> = [Circle { r: 1.0 }, Square { side: 2.0 }]
for s in shapes do
  show(s)
end
```

### Overloading an operator

Each operator corresponds to a built-in trait (see
[section 5](#operators-are-methods)). To redefine it, you implement that trait.

```
impl Add for Point
  public fun add(self, other: Point) -> Point
    Point { x: self.x + other.x, y: self.y + other.y }
  end
end

impl Mul<int> for Point            -- p * 3
  public fun mul(self, k: int) -> Point
    Point { x: self.x * k, y: self.y * k }
  end
end

impl Mul<Point> for int            -- 3 * p
  public fun mul(self, p: Point) -> Point
    p * self
  end
end

impl Eq for Point
  public fun eq(self, other: Point) -> bool
    self.x == other.x and self.y == other.y
  end
end

let p = Point.new(1, 2) + Point.new(3, 4)  -- Point { x: 4, y: 6 }
```

For `Eq` and `Ord`, the method receives a value of the same type. For the other operators,
the return type is free.

### Overloading a conversion

`As<T>` is a generic trait: a type can implement it for several targets.

```
impl As<string> for Point
  public fun convert(self) -> string
    "({self.x}, {self.y})"
  end
end

let s = Point.new(1, 2) as string  -- "(1, 2)"
```

Interpolation and `print` rely on the same conversion: `"{p}"` and `print(p)` use the
`As<string>` of the type of `p`.

### Indexing and appending

```
impl Index<int> for Bag
  public fun index(self, i: int) -> int
    self.items[i]
  end
end

impl IndexSet<int, int> for Bag
  public fun set_index(self, i: int, v: int)
    self.items[i] = v
  end
end

impl Push<int> for Bag
  public fun push(self, v: int)
    self.items[] = v
  end
end

bag[0]        -- Index
bag[0] = 5    -- IndexSet
bag[] = 6     -- Push
```

Arrays already implement these three traits: `xs[] = v` adds `v` at the end (like
`xs.push(v)`).

---

## 11. Enumerations

An enumeration is a list of variants. A variant is a name, alone or with values that it
carries (named fields, like the parameters of a function):

```
enum Color
  Red
  Green
  Blue
end

enum Shape
  Circle(radius: float)
  Rect(w: float, h: float)
  Empty
end

let c = Color.Green
let s = Shape.Circle(2.0)             -- or Shape.Circle(radius: 2.0)

let area = match s
  case Circle(r) then 3.14 * r * r    -- r is the carried value
  case Shape.Rect(w, h) then w * h
  case Empty then 0.0
end

impl Color
  public fun is_warm(self) -> bool
    self == Color.Red
  end
end
```

- A variant without data is written `Color.Red` (no parentheses); a variant with data is
  **built** by a call: `Shape.Circle(2.0)`, by position or by name like any call. Writing
  `Shape.Circle` alone, or `Color.Red()`, is an error.
- In a `match`, the compiler checks that all the variants are handled (see `match`). The
  carried values are bound by position, and each one is a full pattern: `case Circle(0.0)`,
  `case Ok((n, s))`, `case Ok(Some(x))`… (see `match`).
- An enumeration can be **generic**: `enum Maybe<T> Just(value: T) Nothing end` (see generics);
  `impl<T> Maybe<T> ... end` adds methods to it, and a trait is implemented as for a struct.
- Values are shown as `Shape.Circle(2.0)`, `Color.Red`. `==` compares the variant, then the
  carried values one by one.
- Variants carry their values without changing them: an enumeration value cannot be modified
  (an array it contains stays a shared array, though).
- Only enumerations **with no data at all** can be dictionary keys or cross an `extern fun`
  (under the name of their variant).

---

## 12. Generics

Functions, structures, `impl`s and traits can be **generic**: they work with several types,
written between angle brackets.

```
struct Pair<A, B>
  public first: A
  public second: B
end

impl<A, B> Pair<A, B>
  public fun swap(self) -> Pair<B, A>
    Pair { first: self.second, second: self.first }
  end
end

fun first_of<T>(xs: array<T>) -> T?
  if xs.len() == 0 then none else xs[0] end
end
```

### Bounds

A type parameter can be **constrained** by one or more traits:

```
fun sum<T: Add>(a: T, b: T) -> T
  a + b
end

fun same<T: Eq + Ord>(a: T, b: T) -> bool
  a == b
end
```

Without a bound, you cannot use `+` on a `T`. The basic types respect the operator bounds:
`sum(1, 2)` and `sum("a", "b")` work. A bound can be a trait you defined.

### Inference

Types are deduced from the arguments when possible. What is left undetermined after
the arguments is then deduced from the **expected type**: that of an annotated `let`,
or the declared return type of the current function (for a `return` or the last
expression of the body):

```
let a = sum(1, 2)
let b = sum<float>(1.0, 2.0)
let c: array<array<int>> = [[1], [2, 3]]
let d = Box<int>.new(1)

fun empty<T>() -> array<T>
  []
end

let e: array<int> = empty()        -- T comes from the expected type, not an argument

fun get() -> Result<int, Error>
  Result.Ok(1)                     -- T and E come from the return type of `get`
end
```

If nothing lets a type be deduced (neither the arguments nor the context), the
compiler asks for it explicitly: `let xs: array<int> = []`.

---

## 13. Modules

A file can **export** names that other files **import**.

`math.q`:

```
fun add(a: int, b: int) -> int
  a + b
end

fun sub(a: int, b: int) -> int
  a - b
end

export add, sub
```

Another file:

```
import add as addition from "math.q"
import sub from "math.q"
print(addition(1, 2))

import "math.q" as math
print(math.add(1, 2))
```

- `export` names declarations of the file (functions, structures, enumerations, traits,
  variables), on its own line.
- `import a, b as c from "path"` imports chosen names, with an optional alias.
- `import "path" as m` imports the whole module under an alias.
- An exported type is written `math.Point`: `math.Point { x: 1, y: 2 }`.
- The path is relative to the importing file: `"math.q"`, `"lib/math.q"` or
  `"../shared/math.q"` (you can go up in the folders). Always write `/`, even on Windows
  (`\` is refused). Absolute paths (`/x.q`, `C:/x.q`) are refused: a program does not depend
  on where it is stored. Only `.q` files can be imported.
- Who may read what depends on the **execution environment**, not on the language: in a
  terminal, `qlang run` reads any readable `.q` file (like `require` in Node), and
  `--root folder` limits imports to that folder; in the JSON/HTTP protocol there is no disk,
  the modules are the files of the request.
- A file reached through two paths (`a.q`, `../d/a.q`, a symbolic link) is a single module.
- A module is run only once, before the file that imports it, however many imports there
  are.
- Two modules can import each other (a cycle) as long as **only one** module of the cycle
  runs top-level code (`print`, `let`, calls…): modules that only declare functions, structs,
  traits or enumerations do not depend on the order of execution. If several modules of the
  cycle run code, there is no valid order and the program is refused (`T101`).
- You cannot modify an exported variable from another file.

### Packages

A **package** is a folder of `.q` files that you import by name, with an `@`:

```
import send from "@mail/send.q"      -- a file of the package
import "@mail" as m                   -- the main file of the package
```

The packages of a project are declared in its `qlang.toml`, in the `[dependencies]` section:

```toml
[dependencies]
mail  = { path = "../mail" }                                      -- a folder (used in place)
text  = { git = "https://github.com/x/text", tag = "v1.2.0" }     -- a git repository
```

A git repository is designated by `tag`, `rev` (a commit) or `branch` (with none of them: the
default branch). `qlang install` fetches it into `.qlang/packages/<name>` (put it in the
`.gitignore`) at the commit recorded in `qlang.lock`, which it writes if it does not exist and
which you commit: everyone gets the same files. `qlang update [name…]` moves the packages to
what their tag or branch now designates; `qlang add name --git URL --tag T` (or `--path DIR`)
and `qlang remove name` edit `qlang.toml`, then install. A package fetched by git can only
depend on other git packages, not on a local folder.
- The name of a package is made of letters, digits, `_` and `-`. A package has its own
  `qlang.toml`: `[package] main = "src/mail.q"` designates the file that `import "@mail"`
  loads (`lib.q` by default), and its own `[dependencies]` are installed with the project,
  flat: a name designates the same folder everywhere, otherwise it is an error.
- Inside a package, relative imports (`./helper.q`, `../x.q`) stay **inside the package**; it
  can import other packages with `@name/...`. Error messages name the files `@mail/send.q`.
- A file whose name starts with `@` is imported by writing `./@x.q`.
- Packages are not limited by `--root`: it is the project that chooses them.
- The language server (`qlang lsp`, so VS Code) follows `@name` imports (it reads the
  `qlang.toml` files, like `qlang packages`).
- A project without a `qlang.toml` has no packages; environments without a disk (JSON, HTTP,
  browser) see them as files of the request named `@mail/send.q`.

### Functions provided by the environment (`extern`)

The language cannot do everything by itself (database, network, disk…): the **runtime
environment** does it. `extern fun` declares a function that the environment provides, with
its signature but no body:

```
extern fun sqlite_open(path: string) -> Result<int, Error>
extern fun sqlite_close(conn: int) -> Result<bool, Error>

export sqlite_open, sqlite_close
```

An `extern fun` is used and exported like an ordinary `fun`. It calls the environment under
the name it is declared with (`sqlite_open` here); two modules that declare the same name
therefore call the same function.

- **Allowed types** in the signature (arguments and return): `int`, `float`, `bool`,
  `string`, enumerations, `T?`, tuples, `array<T>`, `map<K, V>`, `Json`, and the non-generic,
  parentless, non-recursive structs whose fields are all allowed. Nothing else (functions,
  traits, `uuid`, `ulid`, `datetime`, generics): `T260`, `T261` or `T262`.
- **Values are copied**: the environment never receives a reference to an array or a struct
  of the program, and what it returns is rebuilt from the signature. A struct becomes a table
  of its fields, a tuple an array of its elements (in order), an enumeration the name of its
  variant, `Json` a JSON value.
- **Errors**: if the signature returns `Result<T, Error>`, a failure of the environment
  becomes a `Result::err` (like `http.send` or `Db.connect`). Otherwise it stops the program
  (`R081`).
- **Availability**: the environment decides which names it provides. Calling an `extern fun`
  it does not provide is a compile-time error (`T263`), like `read()` without a keyboard;
  declaring it without calling it costs nothing. A reply that does not match the signature is
  a run-time error (`R083`).
- **The names the standard library uses**: `Db` (`sql_connect`, `sql_query`, `sql_execute`,
  `sql_close`), `fs` (`fs_read(path) -> Result<string, Error>`,
  `fs_write(path, content) -> Result<bool, Error>`), `env` (`env_get(name) -> string?`,
  `env_args() -> array<string>`) and `http` (`http_send(req: Request) -> Result<Response,
  Error>`) are written in qlang in the prelude, on top of these `extern fun`s. An environment
  that implements them (a provider, or `Host::call`) replaces the disk, the network or the
  database of these calls, without the language changing.
- An `extern fun` is only allowed at the top level of a file, not in a block, and cannot be
  generic. The `qlang` program provides those of `Db` (SQLite and Postgres), and others coming
  from external programs declared in a `qlang.toml` or with `--extern` (see the
  [README](../README.md#providing-extern-funs)); a program that embeds the language provides
  some with `Host::call` and `Host::has_extern` (see `host.rs`).

---

## 14. Standard library

### Dependence on the environment

The language does not read or write anything itself: `print`, `read` and `import` go through
the **execution environment** (the terminal, a web server…).

- `print` is always available.
- `time.now()`, `datetime.now()`, `random.…`, `uuid.v4()`, `uuid.v7()`, `ulid.new()` and `ulid.at()` also
  depend on the environment (a clock, a source of randomness): see
  [Time and randomness](#time-and-randomness).
- `read` **depends on the environment**. In a terminal, it reads the keyboard. In an
  environment with no keyboard (for example a web server), it may be missing: calling it is
  then a compile-time error ("`read` is not available in this environment"). An environment
  can also provide in advance a list of lines that `read()` consumes; when it is used up,
  `read()` causes an error.
- `fs.read()`/`fs.write()` (disk) and `env.get()`/`env.args()` (environment variables,
  arguments) also depend on the environment: see
  [Prelude: files and environment](#prelude-files-and-environment).

### Built-in functions

| Function                 | Role                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `print(x)`               | shows `x` followed by a new line (`print()`: an empty line)           |
| `write(x)`               | shows `x` without a new line                                          |
| `eprint(x)`, `ewrite(x)` | like `print` and `write`, on the error output (never mixed with the results; a host with no error output drops them) |
| `read()`                 | reads a line and returns a `string` (without the new line)            |
| `read_all()`             | reads all the remaining lines, joined by new lines (none after the last one) |
| `exit(code?)`            | ends the program right away with this exit code (0 by default); nothing runs after it |
| `panic(message)`         | stops the program with an error                                       |
| `assert(cond, message?)` | stops the program if `cond` is false                                  |
| `assert_eq(a, b)`        | stops the program if `a != b`, showing both values (`assert_ne`: if `a == b`) |
| `assert_lt(a, b)`, `assert_le`, `assert_gt`, `assert_ge` | for a test: `a < b` (`<=`, `>`, `>=`), for any type that can be ordered (numbers, strings, tuples…); shows both values otherwise |
| `assert_len(array, n)`, `assert_empty(array)` | for a test: the array has `n` elements / none |
| `assert_not_contains(array, v)` | for a test: `v` is not in the array |
| `assert_starts_with(text, start)`, `assert_ends_with(text, end)` | for a test: the text starts / ends with... |
| `assert_ok(r)`, `assert_err(r)` | for a test: the value of an `Ok` / the error of an `Err`, or stops the program showing what the result held |
| `assert_some(x)`, `assert_none(x)` | for a test: the value of a nullable that must not be `none` / checks that it is |
| `assert_contains(array, v)`, `assert_contains_text(text, piece)` | for a test: `v` is in the array / `piece` is in the text |
| `assert_close(a, b)`, `assert_within(a, b, tolerance)` | for a test: two `float`s equal within the tolerance (one billionth by default; relative as soon as `b` exceeds 1) |
| `int.parse(s)`           | returns an `int?`: `none` if `s` is not a valid integer               |
| `float.parse(s)`         | returns a `float?`                                                    |

`print` and `write` accept any value (see [Conversions](#conversions)): arrays are shown as
`[1, 2, 3]`, and strings inside an array are in quotes. `read()` always returns a `string`;
for a number: `int.parse(read())`.

### Built-in methods

The library is deliberately small, and will grow with use.

`array<T>`:

| Method                | Result                                                           |
| --------------------- | ---------------------------------------------------------------- |
| `len()`, `is_empty()` | size; `int` and `bool`                                           |
| `push(v)`             | adds at the end (like `xs[] = v`)                                |
| `pop()`               | removes and returns the last element, or `none` if empty (`T?`)  |
| `insert(i, v)`        | inserts `v` at index `i` (0 to `len()`)                          |
| `remove(i)`           | removes and returns the element at index `i`                     |
| `clear()`             | empties the array                                                |
| `contains(v)`         | `bool`                                                           |
| `index_of(v)`         | index of `v`, or `none` (`int?`)                                 |
| `reverse()`           | reverses the array in place                                      |
| `join(sep)`           | joins the elements into a `string`                               |
| `sort()`              | sorts the array in place, stably (see below)                     |
| `min()`, `max()`      | the smallest / largest element, or `none` if empty (`T?`)        |
| `sum()`               | sum of an array of numbers (`0` or `0.0` if empty)               |
| `slice(start, end)`   | new array of the elements from `start` (included) to `end` (excluded) |
| `map(f)`              | new array of `f(element)` for each element                       |
| `filter(f)`           | new array of the elements for which `f(element)` is `true`       |
| `reduce(initial, f)`  | reduces the array to one value, combining `initial` then each element with `f(accumulator, element)` |
| `any(f)`, `all(f)`    | `bool`: at least one element / every element satisfies `f(element)` |
| `find(f)`             | first element for which `f(element)` is `true`, or `none`        |
| `each(f)`             | calls `f(element)` for each element, in order                    |
| `sort_by(f)`          | sorts the array in place with `f(a, b)` as the comparator (negative if `a` comes first, positive otherwise, `0` if equal) |
| `unique()`            | new array keeping only the first occurrence of each value        |
| `flatten()`           | new array that flattens an array of arrays (one level only)      |
| `first()`, `last()`   | first / last element, or `none` if empty (`T?`)                  |
| `concat(other)`       | new array with the elements of this array then those of `other`  |
| `take(n)`, `drop(n)`  | new array of the first `n` elements / without the first `n` elements |
| `swap(i, j)`          | swaps the elements at indexes `i` and `j`, in place              |
| `chunk(size)`         | splits into consecutive groups of `size` elements (the last one may be smaller) |
| `repeat(n)`           | new array with the elements repeated `n` times                   |

```
let names = ["ana", "bob", "cy"]
print(names.map(fun(s: string) -> int s.len() end))        -- [3, 3, 2]
print(names.filter(fun(s: string) -> bool s.len() > 2 end)) -- ["ana", "bob"]

let total = [1, 2, 3, 4].reduce(0, fun(acc: int, x: int) -> int acc + x end)
print(total) -- 10
```

`string`:

| Method                                          | Result                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `len()`, `is_empty()`                           | number of characters; `bool`                                                                                        |
| `upper()`, `lower()`, `trim()`                  | a new `string`                                                                                                      |
| `trim_start()`, `trim_end()`                    | removes the spaces at the start / at the end                                                                        |
| `capitalize()`                                  | first letter in upper case                                                                                          |
| `reverse()`                                     | the characters in reverse order                                                                                     |
| `contains(s)`, `starts_with(s)`, `ends_with(s)` | `bool`                                                                                                              |
| `index_of(s)`, `last_index_of(s)`               | index of the character (first / last occurrence), or `none` (`int?`)                                                |
| `count(s)`                                      | number of non-overlapping occurrences of `s` (`s` not empty)                                                        |
| `replace(a, b)`                                 | replaces every occurrence                                                                                           |
| `split(sep)`                                    | `array<string>` (empty separator: the characters)                                                                   |
| `repeat(n)`                                     | repeats `n` times                                                                                                   |
| `chars()`                                       | `array<string>` of one character each                                                                               |
| `lines()`, `words()`                            | `array<string>`: the lines; the words separated by spaces                                                           |
| `pad_left(width, c)`, `pad_right(width, c)`     | completes up to `width` characters with the character `c` (a single letter)                                        |
| `is_digit()`, `is_alpha()`, `is_blank()`        | `bool`: only digits; only letters; empty or only spaces (`is_digit` and `is_alpha` are false for `""`)              |
| `code()`                                        | Unicode code of a string of **one** character (`"A".code()` is 65)                                                  |
| `to_int()`, `to_float()`                        | like `int.parse` / `float.parse`: `int?` / `float?`                                                                 |
| `substring(start, end)`                         | characters from `start` (included) to `end` (excluded)                                                              |
| `strip_prefix(p)`, `strip_suffix(p)`            | the string without `p` at the start / at the end, or `none` if it does not start / end with `p`                     |
| `snake_case()`, `camel_case()`, `kebab_case()`  | copy in `snake_case`, `camelCase` or `kebab-case`                                                                   |
| `title_case()`                                  | copy with each word capitalised, separated by a space                                                               |
| `eq_ignore_case(other)`                         | `bool`: equality ignoring upper / lower case                                                                        |

`sort`, `min` and `max` need elements that can be compared: numbers, strings, or a structure
that implements `Ord`. Otherwise it is a compile-time error. `sum` only accepts arrays of
`int` or `float`. `slice` copies the elements: modifying the result does not change the
original array. `flatten` needs an array of arrays (`array<array<T>>`); otherwise it is a
compile-time error. `map`, `filter`, `reduce`, `any`, `all`, `find`, `each` and `sort_by` take
an [anonymous function](#anonymous-functions): its return type does not need to be written if
it can be deduced from the context.

Numbers:

| Method / constant                    | Result                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `n.char()`                           | (`int`) the one-character string with code `n` (`97.char()` is `"a"`) |
| `x.abs()`                            | absolute value (`int` or `float`)                                     |
| `x.min(y)`, `x.max(y)`               | the smaller / larger of the two (same type)                           |
| `x.pow(y)`                           | `x ** y` (two `int`s give an `int`, two `float`s a `float`)           |
| `x.sqrt()`                           | square root, a `float` (error if `x` is negative)                     |
| `f.floor()`, `f.ceil()`, `f.round()` | roundings of a `float`, which return an `int`                         |
| `n.to_hex()`, `n.to_oct()`, `n.to_bin()` | (`int`) text in base 16 / 8 / 2 (`255.to_hex()` is `"ff"`)         |
| `f.to_fixed(decimals)`               | (`float`) text with exactly `decimals` digits after the point (0 to 17) |
| `x.sin()`, `x.cos()`, `x.tan()`      | trigonometry, `x` in radians (`int` or `float`), a `float`            |
| `x.asin()`, `x.acos()`, `x.atan()`   | inverse functions, in radians; `asin`/`acos` outside −1 to 1: error   |
| `y.atan2(x)`                         | the angle of the point (`x`, `y`), in radians                         |
| `x.exp()`, `x.ln()`, `x.log10()`, `x.log2()`, `x.log(base)` | exponential and logarithms; a number that is not strictly positive: error (`R016`) |
| `x.to_radians()`, `x.to_degrees()`   | conversion between degrees and radians                                |
| `x.signum()`                         | −1, 0 or 1 depending on the sign (`int` or `float`)                   |
| `x.clamp(min, max)`                  | brings `x` back into the interval (same type; `min` > `max`: error)   |
| `f.trunc()`                          | integer part of a `float` (towards zero), an `int`                    |
| `f.is_nan()`, `f.is_infinite()`      | `bool`                                                                |
| `float.PI`, `float.E`                | mathematical constants                                                |
| `float.INFINITY`, `float.NAN`        | infinity, and "not a number" (`float.NAN == float.NAN` is false: use `is_nan()`) |
| `int.MAX`, `int.MIN`                 | largest / smallest `int`                                              |

```
print([3, 1, 2].max())             -- 3
print(float.PI * 2.0 ** 2)         -- 12.566370614359172
print(16.sqrt())                   -- 4.0
print(3.14159.to_fixed(2))         -- "3.14"
print(255.to_hex())                -- "ff"
```

These operations are methods and constants attached to the types, so as not to reserve
global names (`PI`, `min`…) that you might want to use yourself.

### Dictionaries

A dictionary (`map<K, V>`) associates values with **keys**. Keys are `int`s, `float`s,
`string`s, `bool`s or values of an enumeration: types that are compared by value. Keys keep
their **insertion order**.

```
let ages = { "ana": 31, "bob": 27 }
let empty: map<string, int> = {}      -- the type comes from the annotation

ages["cleo"] = 45                     -- adds or replaces
print(ages["ana"])                    -- 31
print(ages["zed"])                    -- none: the key does not exist
```

**Reading a missing key gives `none`**: `ages["ana"]` has type `int?`, like `pop()` or
`int.parse`. So you have to check before using the value, or provide a default with `get`:

```
let a = ages["ana"]
if a != none then
  print(a + 1)
end

print(ages.get("zed", 0) + 1)         -- 1
```

Counting things becomes simple with `get`:

```
let counts: map<string, int> = {}
for w in words do
  counts[w] = counts.get(w, 0) + 1
end
```

| Method                | Result                                                   |
| --------------------- | -------------------------------------------------------- |
| `len()`, `is_empty()` | number of keys; `bool`                                   |
| `has(key)`            | `bool`                                                   |
| `get(key, default)`   | the value, or `default` if the key is missing (type `V`) |
| `remove(key)`         | removes the key and returns its value, or `none` (`V?`)  |
| `keys()`              | `array<K>` of the keys, in insertion order               |
| `values()`            | `array<V>` of the values, in the same order              |
| `clear()`             | empties the dictionary                                   |
| `merge(other)`        | new dictionary with the entries of both; `other` wins for a common key |
| `filter(f)`           | new dictionary keeping only the entries where `f(key, value)` is `true` |
| `map_values(f)`       | new dictionary with the same keys, each value replaced by `f(key, value)` |

```
let a = { "x": 1, "y": 2 }
let b = { "y": 20, "z": 3 }
print(a.merge(b))                                      -- {"x": 1, "y": 20, "z": 3}
print(a.filter(fun(k: string, v: int) -> bool v > 1 end)) -- {"y": 2}
```

- **Walking**: `for name, age in ages do … end` gives the key and the value, in insertion
  order. You can also walk only the keys (`for name in ages.keys() do`). Looping over a
  dictionary with a single variable (`for x in m`) is an error.
- **`m[key] += 1`** reads the value itself: it is a run-time error if the key does not exist
  (use `get` in that case).
- **Sharing**: like arrays, a dictionary is a shared reference.
- Dictionaries are shown as `{"ana": 31, "bob": 27}`. Two dictionaries are equal (`==`) if
  they have the same keys with equal values, whatever the insertion order.
- **Why no array or structure keys?** A key must always designate the same entry, but an
  array or a structure is a shared reference that can be modified after being stored
  (`k[0] = 99`). For coordinates, use a string (`m["{x},{y}"]`) or nested dictionaries. A
  `float` is allowed as a key, though: it is compared by its bits (`0.0` and `-0.0` count as
  the same key).
- An empty literal `{}` needs a type annotation: `let m = {}` is an error. A literal can
  span several lines and end with a comma.
- `map` names the type in annotations (`map<string, int>`), but can still be used as the name
  of a function or a variable.

An index out of bounds (`xs[5]` for 3 elements, a negative index) is a run-time error.

### Sets

A `Set<T>` is a set of values **without duplicates**, which keeps the order of insertion. It is
a prelude type (no `import`):

```
let a = Set.of([1, 2, 2, 3])         -- Set(1, 2, 3)
let seen = Set<string>.new()         -- an empty set
seen.add("x")                        -- true: the value was new
seen.add("x")                        -- false
print(seen.contains("x"))            -- true

let b = Set.of([2, 3, 4])
print(a.union(b))                    -- Set(1, 2, 3, 4)
print(a.intersect(b))                -- Set(2, 3)
print(a.difference(b))               -- Set(1)

for v in a do                        -- in insertion order
  print(v)
end
```

| Method | Role |
| --- | --- |
| `Set.of(array)`, `Set<T>.new()` | creates a set |
| `add(v)`, `remove(v)` | adds / removes; `true` if the set changed |
| `contains(v)`, `len()`, `is_empty()`, `clear()` | |
| `to_array()` | the values, in insertion order |
| `union(other)`, `intersect(other)`, `difference(other)` | a **new** set |
| `is_subset(other)`, `equals(other)` | `bool` (`equals` ignores the order) |

The values follow the rule of dictionary keys (`int`, `float`, `string`, `bool`, `uuid`,
`ulid`, `datetime`, enumeration without data): a `Set<array<int>>` is refused (`T270`).
Iterating over a set while modifying it is allowed (the loop sees the set as it was at the
start). It is shown as `Set(1, 2, 3)`.

---

## 15. Time, identifiers and regular expressions

### Time and randomness

The core of the language reads neither the clock nor a random source: like `read`, they come
from the **environment**. A program that calls them while they are missing is refused
**before** it runs (error `T250`).

| Call                   | Result                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| `time.now()`           | the current time, an `int`: milliseconds since 1 January 1970 UTC        |
| `time.sleep(ms)`       | waits `ms` milliseconds (0 to 3,600,000); with a virtual clock (tests, JSON protocol), only moves the clock forward |
| `random.int(min, max)` | a random `int` from `min` to `max`, **both included**                    |
| `random.float()`       | a random `float` in `[0, 1[`                                             |

```
let die = random.int(1, 6)
print("The die gives {die}")
print(time.now())           -- for example 1791725184727
```

`random.int(3, 1)` is an error (`R062`): `min` must be less than or equal to `max`.

In a terminal, `qlang run program.q --seed 42` fixes the seed: the same program then gives
**the same numbers** (handy to reproduce a result). Without `--seed`, the seed comes from the
system. This randomness is **not cryptographic**: do not use it for passwords or security
tokens.

`time` and `random` are predefined names, but a variable or a function with the same name is
still possible: `let time = 5` works, and `time` then designates that variable.

### Identifiers: `uuid` and `ulid`

Two types to identify something uniquely. Both are 128 bits and are distinct from `string`:
you cannot pass one for the other.

| Type   | Form                                      | What it holds                                    |
| ------ | ----------------------------------------- | ------------------------------------------------ |
| `uuid` | `550e8400-e29b-41d4-a716-446655440000`    | 128 bits (version 4: 122 random bits)            |
| `ulid` | `01ARYZ6S41TSV4RRFFQ69G5FAV` (26 letters) | the time (48 bits) then randomness (80 bits)     |

A `ulid` starts with the **creation time** in milliseconds (48 bits): sorting `ulid`s
therefore puts them in creation order. The next 80 bits are random. Two `ulid.new()` in the
same millisecond stay in order (the second is the first plus 1).

| Call                | Result                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| `uuid.v4()`         | a random `uuid` (version 4)                                               |
| `uuid.v7()`         | a version 7 `uuid`: the time then randomness, so sortable by date         |
| `uuid.parse(text)`  | a `uuid?`: `none` if the text is not valid (upper case accepted)          |
| `uuid.NIL`          | the `uuid` made only of zeros                                             |
| `u.version()`       | the version of the `uuid` (an `int`)                                      |
| `ulid.new()`        | a `ulid` for the present moment                                           |
| `ulid.at(ms)`       | a `ulid` for the time `ms` (milliseconds since 1970), with randomness     |
| `ulid.parse(text)`  | a `ulid?`: `none` if the text is not valid                                |
| `id.time()`         | the time stored in the `ulid`, in milliseconds since 1970 (an `int`)      |

```
let id = ulid.new()
print("{id} created at {id.time()}")     -- 01M4NJ99PQPPWW6K8BZY81A0M0 created at 1791725184727

let a = ulid.at(1000)
let b = ulid.at(2000)
print(a < b)                         -- true: we compare, we sort
let orders: map<ulid, string> = {}
orders[a] = "first"                  -- a ulid or a uuid can be a key
```

`uuid`s and `ulid`s are compared with `==`, `<`… and sorted; they are shown and interpolated
in their text form (`id as string` gives that string). For the reverse, `uuid.parse` and
`ulid.parse` check the text.

### Dates and times: `datetime`

A `datetime` is an **instant**: a date and a time, always in **UTC** (no time zones, so the
same results everywhere). It goes from year 1 to year 9999. It is a type of its own, like
`uuid`: it can be compared (`<`, `==`), sorted, and used as a dictionary key.

| Call                                   | Result                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `datetime.now()`                       | the present moment (needs a clock, like `time.now()`)                           |
| `datetime.of(2026, 10, 11)`            | 11 October 2026 at midnight                                                     |
| `datetime.of(2026, 10, 11, 14, 30, 0)` | with the time: hour, minute, second                                             |
| `datetime.parse(text)`                 | a `datetime?`: `none` if the text is invalid (see below)                        |
| `datetime.at(ms)`                      | the moment `ms` milliseconds after 1 January 1970                               |
| `d.year()` `d.month()` `d.day()`       | year, month (1 to 12), day of the month                                         |
| `d.hour()` `d.minute()` `d.second()`   | hour (0 to 23), minute, second                                                  |
| `d.weekday()`                          | day of the week: 1 = Monday, 7 = Sunday                                         |
| `d.ms()`                               | milliseconds since 1970 (an `int`)                                              |
| `d.add_days(n)`                        | `n` days later (`n` can be negative); also `add_years`, `add_months`, `add_hours`, `add_minutes`, `add_seconds` |
| `d.start_of_day()`                     | midnight of the same day                                                        |
| `b - a`                                | the time from `a` to `b`, in **milliseconds** (an `int`)                        |
| `a.days_until(b)`                      | the number of days between the day of `a` and the day of `b`                    |
| `d.format("DD/MM/YYYY")`               | the text following a pattern                                                    |

```
let due = datetime.of(2026, 10, 11, 14, 30, 0)
print(due)                            -- 2026-10-11T14:30:00Z
print(due.add_days(30).format("DD/MM/YYYY"))   -- 10/11/2026
print(due.weekday())                  -- 7 (Sunday)

let christmas = datetime.of(2026, 12, 25)
print(due.days_until(christmas))      -- 75
print((christmas - due) div 3_600_000)      -- the hours left

let d = datetime.parse("2026-10-11 14:30")
if d != none then
  print(d.hour())
end
```

- **Display**: a `datetime` is shown in ISO 8601 format, `2026-10-11T14:30:00Z` (with `.123`
  before the `Z` if there are milliseconds). `"{d}"` and `d as string` give this text.
- **`format`** knows `YYYY` (year), `MM` (month), `DD` (day), `HH` (hour), `mm` (minute), `ss`
  (second) and `SSS` (milliseconds). Other characters are kept as they are:
  `d.format("YYYY-MM-DD at HH:mm")`.
- **`parse`** reads `YYYY-MM-DD`, optionally followed by `T` or a space and then `HH:MM`,
  `HH:MM:SS` or `HH:MM:SS.mmm`, and an optional `Z`. A date alone is midnight.
- **`add_months` and `add_years`**: a day that does not exist in the new month becomes its
  last day (31 January + 1 month = 28 or 29 February).
- **Errors**: `datetime.of(2026, 2, 29)` (a date that does not exist) is an `R064` error;
  going outside the years 1 to 9999 (`add_days`…) is an `R065` error.

### Regular expressions

The `regex` namespace offers the usual regular expression operations, from two
strings (`text`, `pattern`):

```
print(regex.matches("hello world", "wor.d"))          --> true
print(regex.find("hello world", "w\\w+"))             --> "world"
print(regex.find_all("a1 b2 c3", "\\d"))               --> ["1", "2", "3"]
print(regex.replace("a1 b2", "\\d", "#"))              --> "a# b2"
print(regex.replace_all("a1 b2", "\\d", "#"))          --> "a# b#"
print(regex.split("a,b,,c", ","))                     --> ["a", "b", "", "c"]
```

A qlang string only allows the escapes `\n \t \r \0 \\ \" \{ \}`: a `\d` or
`\w` from the regex syntax must be written `\\d`, `\\w`... in the pattern
text (a single literal `\` in the string).

`regex.captures(text, pattern)` gives the groups of the first match
(`array<string?>?`): index 0 is the whole match, 1 and up the `(...)`
groups. `none` if `pattern` does not match at all; a group that did not
participate (inside a `?` or a branch not taken) is `none` too.

```
let caps = regex.captures("2026-10-13", "(\\d+)-(\\d+)-(\\d+)")
if caps != none then
  print(caps[1])  --> "2026"
end
```

An invalid regular expression syntax is an `R070` error: it is a programming
mistake (like a date that does not exist), not a condition to recover from
with `Result`.

### Encodings and hashes

Four namespaces work on text (its UTF-8 bytes); a decoding into text returns `none` if the result
is not valid UTF-8. For arbitrary data, see [`bytes`](#bytes-sequences-of-bytes): each function has
a `*_bytes` variant:

| Function | Role |
| --- | --- |
| `Base64.encode(s)`, `Base64.encode_url(s)` | text in base64 (with `=`), or in "URL" base64 (`-` `_`, no `=`) |
| `Base64.decode(s)` | the text of a base64 string (both alphabets), or `none` |
| `Hex.encode(s)`, `Hex.decode(s)` | lowercase hexadecimal; `none` if it is not hexadecimal |
| `Url.encode(s)`, `Url.decode(s)` | percent-encoding of a piece of URL (`a b&c` gives `a%20b%26c`); `+` decodes to a space; `none` if a `%` is malformed |
| `Hash.sha256(s)`, `Hash.sha1(s)`, `Hash.md5(s)` | the digest in hexadecimal (`sha1` and `md5` are not for security) |
| `Hash.hmac_sha256(key, message)` | the HMAC-SHA-256 in hexadecimal |

```
print(Hash.sha256("abc"))        -- ba7816bf...
print(Base64.decode("TWFu"))     -- Man
```

These names start with a capital letter so that a variable `url` or `hash` does not hide them.

### `bytes`: sequences of bytes

`bytes` is a sequence of bytes that never changes: a file, a request body, a digest. It is not
text (text is valid UTF-8) and not an array of integers.

```
let b = "héllo".to_bytes()
print(b.len())               -- 6: bytes, not characters
print(b.hex())               -- 68c3a96c6c6f
print(b.to_string())         -- héllo (none if it is not valid text)
print(b.slice(0, 3))         -- bytes[68 c3 a9]
print(b.at(1))               -- 195 (none outside the bytes)
```

| Call | Result |
| --- | --- |
| `s.to_bytes()` | the UTF-8 bytes of a text |
| `bytes.empty()` | no bytes at all |
| `bytes.from_array([1, 2, 255])` | the bytes of these integers, or `none` if one is not from 0 to 255 |
| `b.len()`, `b.is_empty()`, `b.at(i)` | size; the `i`-th byte (0 to 255) or `none` |
| `b.slice(start, end)`, `b.concat(other)` | bytes; `slice` stays within the bounds |
| `b.to_string()`, `b.to_array()` | the text (`string?`); an `array<int>` |
| `b.hex()`, `b.base64()` | the hexadecimal text; the base64 text |
| `b.find(x)`, `b.contains(x)`, `b.starts_with(x)`, `b.ends_with(x)` | searching for bytes |
| `Base64.encode_bytes(b)`, `Base64.encode_url_bytes(b)`, `Base64.decode_bytes(s)` | base64; `decode_bytes` gives a `bytes?` |
| `Hex.encode_bytes(b)`, `Hex.decode_bytes(s)`, `Url.encode_bytes(b)`, `Url.decode_bytes(s)` | likewise |
| `Hash.sha256_bytes(b)`, `sha1_bytes`, `md5_bytes`, `hmac_sha256_bytes(key, message)` | the digest in hexadecimal |
| `Hash.sha256_raw(b)`, `Hash.hmac_sha256_raw(key, message)` | the digest as bytes (32) |
| `random.bytes(n)` | `n` random bytes (0 to 1,048,576), from the generator of `random` |
| `fs.read_bytes(path)`, `fs.write_bytes(path, b)` | a file as bytes |

- `==` compares the content; there is no `<` and no index `b[i]` (use `at`).
- `print` shows the first 32 bytes: `bytes[68 c3 a9]`.
- In a `Json`, bytes are base64 text (`Json.of`, `Json.to<bytes>`).
- `bytes` is not a reserved word: `let bytes = 3` is still valid (like `map`).
- An `extern fun` can take and return `bytes`; to an external program (`--extern`,
  `qlang.toml`) they travel as base64.

### Secrets: `Crypto` and `Password`

`random` is a generator you can fix (`--seed`): good for tests, **never** for a secret. `Crypto`
asks the operating system's secure source for bytes.

| Call | Result |
| --- | --- |
| `Crypto.random_bytes(n)` | `Result<bytes, Error>`: `n` unpredictable bytes |
| `Crypto.token(n)` | `Result<string, Error>`: a token (session, reset link, API key) made of `n` bytes in "URL" base64 (32 bytes: 43 characters) |
| `Crypto.equal(a, b)`, `Crypto.equal_bytes(a, b)` | `true` if both are equal, **without revealing where they differ** (constant time): to compare a received token, signature or digest |
| `Crypto.verify(alg, key, message, signature)` | `Result<bool, Error>`: `true` if `signature` (`bytes`) is the signature of `message` (`bytes`) made with the private key that goes with `key`, a public key as a PEM (`BEGIN PUBLIC KEY`, `BEGIN RSA PUBLIC KEY`) or a JWK (JSON text). `alg`: `RS256`, `RS384`, `RS512` (RSA PKCS#1), `PS256`, `PS384`, `PS512` (RSA-PSS), `ES256`, `ES384` (the signature is `r` then `s`, as a JWT writes it), `EdDSA` (Ed25519); with `HS256`, `HS384`, `HS512` the `key` is a shared secret (HMAC, compared in constant time). A wrong signature is `false`; `err` is for a key or an algorithm that cannot be used |
| `Crypto.sign(alg, key, message)` | `Result<bytes, Error>`: the signature of `message` with a private key as a PKCS#8 PEM (`BEGIN PRIVATE KEY`; for RSA also `BEGIN RSA PRIVATE KEY`), or the secret itself for `HS256`, `HS384`, `HS512`. Same algorithms |

`Password` keeps passwords. It makes a text to store in the database (**Argon2id**, with its own
random salt and its settings inside) and never keeps the password itself:

```
let hash = Password.hash("s3cret").unwrap()      -- "$argon2id$v=19$m=19456,t=2,p=1$..."
Password.verify("s3cret", hash).unwrap()         -- true
Password.verify("other", hash).unwrap()          -- false
Password.needs_rehash(hash).unwrap()             -- true if the settings have aged
```

- `verify` gives `err` if the text is not a hash. Computing a hash takes a few tens of
  milliseconds, on purpose.
- After a successful login, `needs_rehash` tells whether to hash again (and store the new one).
- Only the `qlang` command offers `Password` and `Crypto` (another host: error `T250` before
  running; a test host may answer from its seed, never for real secrets).

## 16. Prelude: `Result`, `Error` and JSON

### Prelude: `Result` and `Error`

Two types are available in every file, **without an `import`**:

```
struct Error
  public message: string
end

enum Result<T, E>
  Ok(value: T)
  Err(error: E)
end
```

`Result<T, E>` is an [enumeration](#11-enumerations) with two variants: `Ok(value)` when all
went well, `Err(error)` otherwise:

```
fun divide(a: int, b: int) -> Result<int, Error>
  if b == 0 then
    return Err(Error { message: "division by zero" })
  end
  Ok(a div b)
end

match divide(10, 0)
  case Ok(v) then print(v)
  case Err(e) then print(e.message)
end
```

- `Ok(value)` and `Err(error)` build the result (they are also the variants: `Result.Ok(value)`,
  `Result.Err(error)`); `T` and `E` are deduced from context (here, the return type of
  `divide`). When nothing lets them be deduced, write them explicitly on the type:
  `Result<int, Error>.Ok(value)` / `Result<int, Error>.Err(error)`.
- `match` takes a result apart, and the compiler checks that both `Ok` and `Err` are handled:
  the value can only be read in the `Ok` case.
- `result?` (see below) gives the value, or leaves the function with the error.
- `is_ok()`, `is_err()`: know which of the two cases you have.
- `unwrap()`, `unwrap_err()`: read the value or the error, or stop the
  program (`panic`) if you picked the wrong case.
- `Result`/`Error` are ordinary declarations: a structure `Error` (or an enumeration
  `Result`) that you write yourself in your own file **shadows** the prelude's, exactly like a
  local variable shadows a variable of wider scope.

#### Propagating an error with `?`

In a function that itself returns a `Result`, `expr?` gives the value of an `Ok`, and **leaves
the function with the error** if it is an `Err`:

```
fun load(path: string) -> Result<Json, Error>
  let text = fs.read(path)?          -- the error of fs.read leaves load
  let json = Json.parse(text)?
  Ok(json)
end
```

- The error type must be the same on both sides (`Error` here): otherwise, a compile-time
  error (`T282`); there is no automatic conversion.
- `?` also works on a **nullable** value: `x?` gives the value, or leaves the function with
  `none`, which requires a function that returns a `T?`.
  `fun port(s: string) -> int? ... let rest = s.strip_prefix("port=")?` ...
- It is written after any expression (`a()? + b()?`, `f()?.g()`), but not outside a function
  (`T280`), and it only applies to a `Result` or a nullable (`T281`). In an anonymous function,
  only that function is left.

### Prelude: JSON

**Encoding.** The `ToJson` trait describes a type that knows how to turn
itself into JSON text:

```
trait ToJson
  fun to_json(self) -> string
end
```

A structure implements it by listing the fields it wants to expose with
`json_object` (the values are themselves serialized through their own
`to_json()`: `int`, `float`, `bool`, `string`, or any nested `ToJson`):

```
impl ToJson for Post
  public fun to_json(self) -> string
    json_object({ "title": self.title, "views": self.views })
  end
end

print(Post { title: "Hello", views: 42 }.to_json())  -- {"title":"Hello","views":42}
```

`json_array(items)` does the same for an array. `int`, `float`, `bool`,
`string`, `uuid`, `ulid` and `datetime` already implement `ToJson`; so does
`array<T>`, as soon as `T` does, so an `array<Post>` serializes as it is as
the value of a `json_object`, with no need to call `json_array` by hand:

```
struct Post
  public title: string
  public comments: array<Comment>
end

impl ToJson for Post
  public fun to_json(self) -> string
    json_object({ "title": self.title, "comments": self.comments })
  end
end
```

**Composing with inheritance.** `to_json` returns already-closed text
(`"{...}"`), so a substructure that adds fields does not need to repeat the
parent's: `json_merge` combines two already-serialized JSON objects, and
`super.to_json()` gives the parent's.

```
struct AdminEntity extends UserEntity
  public role: string
end

impl ToJson for AdminEntity
  public fun to_json(self) -> string
    json_merge(super.to_json(), json_object({ "role": self.role }))
  end
end
```

**Decoding.** `Json.parse(text)` returns a `Result<Json, Error>`: a tree of
JSON values (string, number, bool, `null`, array, object), read with
`is_string()`/`as_string()` (and the `number`, `bool`, `array`, `object`
equivalents), `get(key)` (on an object, returns a `Json?`) and `at(index)`
(on an array):

```
let r = Json.parse("\{\"name\": \"Zoe\"\}")
if r.is_err() then
  print(r.unwrap_err().message)
else
  let j = r.unwrap()
  let name = j.get("name")
  if name != none then
    print(name.as_string())
  end
end
```

`j.to_text()` gives the JSON text of a `Json` (`{"a":1,"b":[true,null]}`); a `Json` also
implements `ToJson`, so it can go into a `json_object`.

### Converting: `Json.of` and `Json.to`

No need to write `to_json` and `from_json` by hand for the usual cases: two functions read the
**shape of the type**.

```
struct User
  public id: int
  public name: string
  #[JsonName("e_mail")]
  public email: string = ""
  #[JsonSkip]
  public cache: int = 0
  password_hash: string = ""
end

let j = Json.of(User { id: 1, name: "Ada" })
print(j.to_text())        -- {"id":1,"name":"Ada","e_mail":""}

let r = Json.to<User>(Json.parse("\{\"id\": 7, \"name\": \"Bob\"\}").unwrap())
print(r.unwrap().name)    -- Bob
```

**`Json.of(value)`** gives a `Json`:
- a structure becomes an object of its **`public`** fields only (a private field never leaves),
  in declaration order, parents first;
- `#[JsonName("x")]` renames a field, `#[JsonSkip]` leaves it out;
- `none` becomes `null`, `uuid`/`ulid`/`datetime` a text, an array or a tuple an array, a map an
  object (keys as text);
- an enumeration without data becomes the name of the variant (`"Empty"`), with data an object
  with `type`: `{"type":"Circle","radius":2.5}`;
- a function or a range cannot be converted (`R084`); the depth is limited.
- The shape of the type is what counts: a hand-written `to_json` method is not called by
  `Json.of`.

**`Json.to<T>(json)`** gives a `Result<T, Error>` and says **where** it does not fit:
- only `public` fields are read from the `Json`: a received `{"password_hash": "..."}` fills
  nothing. A missing field takes its default value, or `none` if it is nullable, otherwise the
  error is `address.city: missing`;
- a wrong type gives `id: expected an int, found string`, a number with decimals for an `int` is
  refused, an array element reads `[2]: expected an int, found string`;
- extra members are ignored; generics (`Page<User>`), `T?`, enumerations (name or object with
  `type`), maps, `uuid`, `ulid` and `datetime` are understood;
- a function, an `Any` or a range cannot be the target (`T305`).

## 17. Prelude: network, databases and the system

### Prelude: `http`

`http.send(req)` sends an HTTP request and waits for the response. `Request`
and `Response` are provided by the prelude (no need to declare them):

```
struct Request
  public method: string
  public url: string
  public headers: map<string, string> = {}
  public body: string? = none
  public path: string = ""
  public query: map<string, string> = {}
  public params: map<string, string> = {}
  public query_all: map<string, array<string>> = {}
  public headers_all: map<string, array<string>> = {}
  public cookies: map<string, string> = {}
  public attrs: map<string, Any> = {}
end

struct Response
  public status: int
  public headers: map<string, string> = {}
  public body: string
  public cookies: array<Cookie> = []
end
```

`path`, `query`, `params`, `query_all`, `headers_all`, `cookies` and `attrs` are only used for a **received** request (see
[Answering HTTP requests](#answering-http-requests)); the `headers` of a `Response` give the
headers received (names in lower case).

Needs network access on the host side: a host that does not offer it (a
sandbox, for example) fails the check before the program even runs.

```
let req = Request { method: "GET", url: "https://example.com" }
let r = http.send(req)
if r.is_err() then
  print(r.unwrap_err().message)
else
  print(r.unwrap().status)
end
```

A connection error (DNS, timeout, connection refused...) gives a
`Result::err`, never a program crash: the network is inherently unreliable,
so always recoverable, like `int.parse` or `Json.parse`. `headers` and
`body` have a default value, so a simple `GET` request only needs `method`
and `url`.

```
let res = http.send(Request {
  method: "POST",
  url: "https://example.com/items",
  headers: { "Content-Type": "application/json" },
  body: "\{\"name\": \"Rex\"\}",
})
```

`http.send_all(requests)` sends **several at the same time** (16 at once at most) and gives an
`array<Result<Response, Error>>` in the same order: ten calls to slow services take as long as the slowest. A
request that fails is an `err` and does not stop the others.

```
let answers = http.send_all([
  Request { method: "GET", url: "https://a.example/api" },
  Request { method: "GET", url: "https://b.example/api" },
])
for r in answers do
  print(if r.is_ok() then r.unwrap().status else 0 end)
end
```

### Answering HTTP requests

A program can also **serve** requests: `qlang serve app.q` listens on a port (8080 by default,
on `127.0.0.1`), runs the file **once**, then calls its `handle` function for every request it
receives.

```
let visits = 0

fun handle(req: Request) -> Response
  visits += 1
  match req.path
    case "/hello" then
      let name = req.query.get("name", "you")
      Response.text("Hello {name}!")
    case "/visits" then
      Response.json("\{\"visits\": {visits}\}")
    else
      Response.not_found()
  end
end
```

```
qlang serve app.q --port 8080
curl "http://127.0.0.1:8080/hello?name=Ada"
```

With `--watch`, the server reloads the program when one of its files (the main file or an
imported one) changes: the next request is answered by the new version. A mistake in the new code
is printed and the previous version keeps answering until it is fixed. Module variables (like
`visits` above) start again from their initial value at each reload. This is meant for
development, not for production.

- **The function** is called exactly `handle`, takes a `Request` and returns a `Response`: the
  check controls this before starting.
- **The request**:
  - `method` (`"GET"`, `"POST"`...);
  - `url`, the target as it was received (`/items?id=3`), not decoded;
  - `path`, the **decoded** path (`/items`), and `query`, the **decoded** parameters (`id` is
    `"3"`; if a name is repeated, the last value wins);
  - `headers`, whose names are in **lower case**, and `req.header("User-Agent")`, which looks
    up a header ignoring the case (`string?`);
  - `body`, the body (`none` if there is none);
  - `query_all` keeps **every** value of a repeated parameter (`?t=1&t=2` gives `{"t": ["1",
    "2"]}`) and `headers_all` those of a header sent several times, while `query` and `headers`
    stay as they are (the last value wins); `req.header_all("X-Tag")` gives them as an array;
  - `cookies` is the content of the `Cookie` header, values decoded (`who=Ada%20L` gives
    `"Ada L"`);
  - `req.form()` gives the decoded `application/x-www-form-urlencoded` body
    (`Result<map<string, string>, Error>`, `err` if the request is not a form);
  - `attrs` is a space for the program: a middleware puts, for example, the user it found there
    (`req.attrs["user"] = Any.of(user)`), and the handler reads it back with `as<T>()`. It is
    empty on arrival, belongs to each request, and does not leave the program.
- **The response**: `status` (from 100 to 599), `body`, and optional `headers`. Shortcuts:

  | Call                         | Result                                                      |
  | ---------------------------- | ----------------------------------------------------------- |
  | `Response.text(body)`        | status 200, `text/plain; charset=utf-8`                     |
  | `Response.html(body)`        | status 200, `text/html; charset=utf-8`                      |
  | `Response.json(text)`        | status 200, `application/json` (you provide the JSON text)  |
  | `Response.redirect(url)`     | status 302 to `url`                                         |
  | `Response.not_found()`       | status 404                                                  |
  | `r.with_status(201)`         | the same response with another status                       |
  | `r.with_header("X-Id", "7")` | the same response with one more header                      |
  | `r.with_cookie(Cookie { ... })` | the same response with one more cookie (one `Set-Cookie` header each) |

  A `Cookie` has `name`, `value` (sent percent-encoded), `path` (`"/"`), `domain` (`none`),
  `max_age` in seconds (`none`: a session cookie), `secure` (`false`), `http_only` (`true`) and
  `same_site` (`"Lax"`, `"Strict"` or `"None"`). A name that is not an HTTP token, or an attribute
  that contains `;` or a control character, is a mistake of the program (500).
  `HttpError { status, message }` is an error with a status; `e.to_response()` turns it into a
  text response.

  Without a `Content-Type`, the server adds `text/plain; charset=utf-8`. Headers that contain a
  line break are ignored, and `Content-Length` and `Connection` are handled by the server.
- **State**: the code of the file runs only once, so `visits` remembers its value from one
  request to the next, as in a Node server. With a single interpreter (the default), requests
  are handled **one at a time**: variables never change while `handle` runs.
- **Errors**: a `panic`, a run-time error or a loop that is too long (step limit, `--max-steps`,
  **per request**) give a `500 Internal Server Error` response **with no detail** for the
  client; the detail is written in the server's log (the error output), and the server carries
  on. A request that waits more than 30 seconds gets `504`.
- **Capabilities**: the program runs as with `qlang run`: `print`, files, environment
  variables, `http.send`, `Db`, `import` work (`--root` limits files and imports to a folder).
  `--seed N` fixes the randomness.

#### The router

When there are several pages, a `Router` avoids a big `match` on the path: you declare the
routes, then `handle` hands it the request.

```
let router = Router.new()

router.get("/", fun(req: Request) -> Response
  Response.text("Home")
end)

router.get("/items/:id", fun(req: Request) -> Response
  let id = req.params.get("id", "?")
  Response.text("Item {id}")
end)

router.post("/items", fun(req: Request) -> Response
  Response.text("created").with_status(201)
end)

fun handle(req: Request) -> Response
  router.handle(req)
end
```

- **Declaring**: `router.get(path, function)`, `post`, `put`, `delete`, or
  `router.add("PATCH", path, function)` for another method. Each call returns the router, so
  they can be chained.
- **The path** is a sequence of segments separated by `/`: a word must be identical, `:name`
  accepts any **non-empty** segment and puts it in `req.params` (`req.params.get("id", "")`),
  and a final `*` accepts the rest of the path (`req.params["*"]`). `/items/:id` accepts
  `/items/3`, not `/items/` nor `/items/3/x`. The first route that matches wins.
- **No match**: a known path with another method gives `405` with an `Allow` header
  (`GET, DELETE`); any other path gives `404`, or the function given to
  `router.fallback(function)`.
- **`Router.matches(pattern, path)`** returns the parameters (a `map<string, string>?`) if the
  path matches the pattern, otherwise `none`: handy to check a pattern without a server.

Options of `qlang serve app.q`:

| Option             | Role                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------- |
| `--port N`         | the port (8080 by default)                                                              |
| `--bind ADDRESS`   | the address to listen on (`127.0.0.1` by default: this machine only)                    |
| `--max-steps N`    | the number of evaluation steps **per request**                                          |
| `--static FOLDER`  | serves the files of this folder as they are, **before** calling the program             |
| `--compress`       | gzips text answers for clients that accept it                                           |
| `--dev`            | the detail of an error of the program is in the 500 response (never in production)      |
| `--workers N`      | N interpreters (from 1 to 64) that answer in parallel                                   |
| `--root FOLDER`    | limits `import` and `fs` to this folder                                                 |
| `--seed N`         | fixes the randomness (each worker takes `N` plus its number)                            |

- **Static files** (`--static public`): for `GET` and `HEAD`, if the path designates a file of
  the folder (or `index.html` for a folder), it is served with its type (`.html`, `.css`,
  `.js`, `.json`, `.svg`, `.png`...), without going through the program. A path that leaves the
  folder (`..`, a symbolic link to the outside) is never served. Everything else goes to the
  program.
- **Several workers** (`--workers 4`): each worker runs the file **separately**, with its own
  variables, and takes requests from a shared queue: a slow request no longer blocks the
  others. What must be shared (a counter, data) goes in a database or in files, not in a
  variable.
- **Stopping**: Ctrl-C or a `TERM` signal stops the server cleanly: requests already accepted
  get their answer (5 seconds at most), new ones get `503`.
- **The server** is simple: HTTP/1.1 with no TLS, at most 64 simultaneous connections, body limited
  to 1 MB. Like `qlang serve` for the JSON protocol, **put it behind a reverse proxy** and do not
  expose it directly to the Internet.
  - **Persistent connections**: a connection serves up to 100 requests (5 seconds of silence
    close it; so does `Connection: close`), requests sent all at once included.
  - **Chunked bodies** (`Transfer-Encoding: chunked`) and `Expect: 100-continue` are understood; a
    body announced in two ways at once is refused (`400`).
  - **Bytes**: `req.raw` is the exact body (`bytes?`); `Response.bytes(data, type)` answers with
    bytes; a `Response` whose `raw` is filled sends these bytes instead of `body`.
  - **Forms with files**: `req.multipart()` gives the `Part`s of a `multipart/form-data` body
    (`name`, `filename: string?`, `content_type: string?`, `data: bytes`, `text()`), or `err` if
    it is malformed.
  - **Answers written as they are produced**: `Response.stream(type, next)` calls `next()` again
    and again and sends each text it gets right away (`Transfer-Encoding: chunked`), until
    `none`; `Response.sse(next)` does the same with `SseEvent { data, event?, id?, retry? }`
    (`text/event-stream`). The worker that answers serves only this connection while it lasts
    (give enough `--workers`); if the client leaves, the stream stops at the next piece. Between
    two pieces, `time.sleep` waits.
  - **WebSocket**: `Response.websocket(WebSocketHandler { ... })`, returned to a request that asks for
    `Upgrade: websocket`, turns the connection into a WebSocket (otherwise `426`). The handler has
    `on_message(c: WebSocket, m: WsMessage)` (required), `on_open(c)`, `on_close(c)` and `on_tick(c)`
    called every `tick_ms` milliseconds (1000 by default; 0: never). A `WsMessage` has `text: string?`,
    `data: bytes?` and `binary`. A `WebSocket` has `id` (unique), `request` (the request that opened it,
    with what guards put in `attrs`), `data` (a `map<string, Any>` of yours), `send(text)`,
    `send_bytes(bytes)`, `close()` and `close_with(code, reason)` (1000 to 4999), `is_open()`. **A worker
    serves many connections** between two requests, one callback at a time, each with its own step
    budget: a callback must be short and never wait. A worker does not see the connections of the
    others: to talk to everybody, go through a database (an `on_tick` that reads the new messages).
    Messages are limited to 1 MB (`1009`), unmasked or malformed frames close with `1002`, invalid text
    with `1007`, an error in a callback with `1011` (the detail goes to the log); a `ping` is sent every
    30 s. WebSocket compression is not negotiated. **A browser lets any page open a WebSocket to your
    server with the visitor's cookies**: check the `Origin` header (`req.header("origin")`).
  - **Compression**: with `--compress`, a text, JSON, JavaScript, XML or SVG answer of 1 KB or more
    is sent as gzip to clients that accept it (`Content-Encoding: gzip`, `Vary`), unless the
    program already chose an encoding. Off by default (a proxy does it just as well).

### Prelude: `Db`

`Db.connect(url)` opens a database connection; the URL's scheme picks the
driver: `sqlite://path/to/file.db`,
`postgres://user:password@host/database` or `mysql://user:password@host/database`
(MySQL and MariaDB; `mariadb://` is accepted). For Postgres and MySQL over TLS, add
`?sslmode=require` (or `prefer`/`verify-ca`/`verify-full`, they are treated
the same here): `postgres://user:pass@host/database?sslmode=require`. The
server's certificate is always verified against the public authorities
(Mozilla); a self-signed certificate or a private authority are not
accepted without host-side configuration. A server that is not on this machine (anything but
`localhost`, `127.0.0.1`, `::1` or a socket) **requires** an `sslmode` in the URL: without it, the
connection is refused rather than sending the password in the clear by accident
(`?sslmode=disable` confirms that you want that). With `--root`, the file of a `sqlite://`
database must be inside the folder; the SQL itself is not confined (`ATTACH DATABASE` reaches
any readable file).

```
let c = Db.connect("sqlite://data.db")
if c.is_err() then
  print(c.unwrap_err().message)
else
  let db = c.unwrap()
  let r = db.execute("CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY, name TEXT)", [])
  db.execute("INSERT INTO people (name) VALUES (?)", [Json.string("Rex")])

  let rows = db.query("SELECT id, name FROM people", [])
  if rows.is_ok() then
    for row in rows.unwrap() do
      print(row.get("name", Json.null()).as_string())
    end
  end
  db.close()
end
```

- **`query(sql, params)`** returns `Result<array<map<string, Json>>, Error>`: one row
  per result, each column becoming a `Json` value (so `row.get("col", ...)` or
  `row["col"]`, then `as_string()`/`as_number()`/`as_bool()`).
- **`execute(sql, params)`** (for `INSERT`/`UPDATE`/`DELETE`/DDL) returns
  `Result<int, Error>`: the number of rows affected.
- **`params`** is an `array<Json>` (`Json.string(...)`, `Json.number(...)`...): these
  values replace the `?` in `sql`, in order. The question mark `?` is always the
  syntax to write, whichever engine is used; towards Postgres, qlang rewrites it
  itself into `$1, $2...`.
- **`close()`** closes the connection; `Result<bool, Error>`.
- **`begin()`**, **`commit()`** and **`rollback()`**: a transaction (`Result<bool,
  Error>`). The statements between `begin()` and `commit()`/`rollback()` are grouped;
  `rollback()` undoes everything done since `begin()`.

```
db.begin()
db.execute("UPDATE accounts SET balance = balance - 100 WHERE id = ?", [Json.number(1.0)])
db.execute("UPDATE accounts SET balance = balance + 100 WHERE id = ?", [Json.number(2.0)])
let ok = db.commit()
if ok.is_err() then
  db.rollback()
end
```

- A connection or query error (invalid SQL, missing table...) gives a
  `Result::err`, never a program crash, same as `http.send`.
- Needs database access on the host side, same as `http`. `Db` is written in qlang on top of
  four [`extern fun`s](#functions-provided-by-the-environment-extern) (`sql_connect`,
  `sql_query`, `sql_execute`, `sql_close`) that the host provides: `qlang` provides them for
  SQLite and Postgres, and another environment can plug its own database under the same
  names.
- **MySQL / MariaDB**: columns keep their type (integers, floats, text); a date (`DATE`,
  `DATETIME`, `TIMESTAMP`) becomes a text `2026-10-23` or `2026-10-23 14:05:09`, a time (`TIME`) a
  text, a `BLOB` or invalid text `none`. Queries are prepared on the server (`?`). Transactions
  work as elsewhere. Tested with MySQL 8.0 and 9.5.
- **Current limits**: on the Postgres side, only the common scalar types (`bool`,
  integers, floats, text) are properly converted, others (date, uuid, json,
  array...) fall back to text if possible, otherwise `none`; no SQLite BLOB
  (becomes `none`); no connection pool nor cached prepared statements.

### Prelude: files and environment

`fs.read(path)` reads a file's whole content, `fs.write(path, content)`
replaces it entirely (creating it if needed). Both return a `Result`: a
missing file or a permission error gives a `Result::err`, never a program
crash. `fs.read_bytes(path)` and `fs.write_bytes(path, bytes)` do the same with
[`bytes`](#bytes-sequences-of-bytes) (an image, an archive).

```
let r = fs.read("config.json")
if r.is_err() then
  print(r.unwrap_err().message)
else
  print(r.unwrap())
end

fs.write("output.txt", "content").unwrap()
```

`env.get(name)` returns the value of an environment variable, or `none` if
it is not set (`string?`, not a `Result`: a missing variable is a normal
situation, not an error). `env.args()` returns the program's own arguments
(`array<string>`).

```
let lang = env.get("LANG")
print(lang != none)
print(env.args())
```

Needs disk access (`fs`) or access to the process environment (`env`) on
the host side: a host that does not offer them (a sandbox, for example)
fails the check before it even runs, same as `http`/`Db`. With `qlang-cli`,
the arguments after `--` on the command line are the ones `env.args()`
returns (`qlang run script.q -- a b`), and `fs` honours `--root` the same
way imports do.

### Prelude: `Redis`

`Redis.connect(url)` opens a connection to a Redis server (RESP2 protocol): `redis://[user:password@]host[:port][/database]`, or `rediss://` for TLS (the certificate is checked with Mozilla's roots, as for Postgres). A server that is not on this machine needs `rediss://`, or `?tls=disable` to confirm that you want it in clear. Only the `qlang` command offers it (another host: error `T250`).

| Call | Result |
| --- | --- |
| `r.command(["SET", "k", "v"])` | `Result<Json, Error>`: any command, by its words; the answer is a text, a number, `null` or an array of those; a Redis error is an `err` |
| `r.get(k)`, `r.set(k, v)`, `r.set_ex(k, v, seconds)`, `r.set_if_absent(k, v, seconds)` (a lock), `r.del(k)`, `r.exists(k)`, `r.incr(k)`, `r.expire(k, seconds)` | keys |
| `r.lpush`, `r.rpush`, `r.lpop`, `r.rpop`, `r.llen`, `r.lrange(k, start, stop)`, `r.blpop(keys, seconds)` | lists; `blpop` waits for an element (0: for ever) and gives `(list, element)?` |
| `r.zadd(k, score, member)`, `r.zrem`, `r.zcard`, `r.zrange_by_score(k, min, max, limit)` | sorted sets |
| `r.eval(script, keys, arguments)` | a Lua script, run in one go |
| `r.publish(channel, message)` | publish; gives the number of subscribers |
| `Redis.subscriber(url, channels)` | a connection that **listens** (`Subscription`): `next(ms)` gives the next `RedisMessage?` (`channel`, `payload`, `pattern`), waiting at most `ms` (0: only what already arrived), `subscribe`, `unsubscribe`, `psubscribe` |

A connection does one thing at a time (each command waits for its answer, 30 s at most, except `BLPOP`, which waits as long as it was asked to): take one for the commands and another to listen. A `Subscription` does not run commands. Numbers come back as `float`, like for `Db`.

### Prelude: the `Log` journal

`Log` writes the program's journal: `Log.debug("detail")`, `Log.info("started")`,
`Log.warn("slow")`, `Log.error("failed")`, or `Log.write("info", "message", { "user": "ada" })` with
extra fields (any other level is written as `info`).

```
Log.info("started")
Log.write("error", "payment refused", { "order": "42", "reason": "card expired" })
```

The `qlang` command writes one line per call on the **error output** (not on the output: the
journal does not mix with the results):

```
2026-10-23T18:50:33.145Z INFO  started
2026-10-23T18:50:33.146Z ERROR payment refused order=42 reason="card expired"
```

- `--log-level debug|info|warn|error` (or the variable `QLANG_LOG`) hides the lower levels; `info`
  by default.
- `--log-format json` (or `QLANG_LOG_FORMAT=json`) writes one object per line:
  `{"level":"error","message":"...","order":"42","time":"..."}`.
- Another host keeps or drops the lines; they never make the program fail.

## 18. Line endings

There is no `;`. **A statement ends at the end of the line.** The line continues on the next
one in these cases:

- it ends with an operator or a comma;
- a parenthesis `(`, a bracket `[` or a brace `{` is still open.

```
let total = a +
  b +
  c

let p = Point {
  x: 1,
  y: 2
}
```

A block (body of a function, of an `if`, of a loop…) goes back to its own rules, even inside
parentheses: each statement there fits on its line.

### Prelude: running a program

`Process.run(command, arguments)` runs a program of the machine, waits for it to end and
returns a `Result<ProcessOutput, Error>`; `ProcessOutput` has three public fields: `status` (the
exit code, −1 if a signal stopped it), `stdout` and `stderr` (what it wrote, as text).
`Process.run_with_input(command, arguments, text)` also writes `text` to its standard input.

`Process.stopping()` says whether the program was told to stop (Ctrl-C, `kill`, a service manager). **The first call makes the program take over**: from then on the signal no longer ends it at once, it only makes this return `true`, so that a worker can finish what it is doing and leave; a second signal ends the program (code 130). A program that never calls it stops as before. In a program served by `qlang serve`, it is `true` while the server stops.

```
while not Process.stopping() do
  do_some_work()
end
```

```
let r = Process.run("git", ["rev-parse", "HEAD"])
match r
  case Ok(o) then print(o.stdout.trim())
  case Err(e) then print("no git: {e.message}")
end
```

- **No shell**: the command and each argument are given as they are to the system (no
  wildcard, pipe or variable). A program that ends with a non-zero code is still an `Ok`: it
  is up to you to read `status`. A program that cannot be found is an `Err`.
- **Permission is required**: without it, `Process.run` is a compile-time error (`T250`). In
  the terminal, it is `--allow-process` (on `qlang run`, `qlang test` and `qlang serve`); the
  JSON protocol, the browser and a `qlang.toml` cannot grant it. `qlang check` does not need
  it.
- A program that is run is **not limited** by `--root` nor by qlang's limits (steps, memory);
  it is stopped if it runs for more than a minute, and at most 16 MB of each stream is kept.

---

## 19. Reserved keywords

```
let const fun return
if then elseif else end
while for in step do break continue
match case
struct impl trait enum extends override
public private protected static
import export from as
and or not div mod
true false none self super
```

`int`, `float`, `bool`, `string`, `uuid`, `ulid`, `datetime`, `array` and `range` are **not** keywords:
they are ordinary type names, but you cannot define a type or a function with one of these
names, nor the name of a built-in function (`print`, `write`, `read`, `panic`, `assert`).

---

## 20. Errors and limits

**Errors are data.** Each error has a code, a message, a position (file, line, column) and
sometimes notes. The prefix of the code tells the stage:

| Prefix | Stage                                                            |
| ------ | ---------------------------------------------------------------- |
| `L`    | reading the text (unknown character, unterminated string…)       |
| `P`    | syntax (a missing `end`, an expected expression…)                |
| `T`    | names and types (unknown name, incompatible type, visibility…)   |
| `R`    | execution (division by zero, index out of bounds, `panic`…)      |
| `J`    | invalid JSON request (see the README)                            |
| `X`    | internal error: a bug in qlang (please report it)                |

The compiler reports **several errors at once** when it can, up to 100: beyond that, it says
so (`too many errors`) instead of listing everything. Syntax errors are reported alone; type
errors come after. A run-time error also shows the call stack.

**Execution limits.** So that a program cannot block its environment, execution is bounded:

| Limit                                                                  | Default     | Error                          |
| ---------------------------------------------------------------------- | ----------- | ------------------------------ |
| evaluation steps                                                       | 100,000,000 | `R900` (infinite loop?)        |
| nested calls                                                           | 1,000       | `R901` (infinite recursion?)   |
| output shown                                                           | 10 MB       | `R902`                         |
| size of an array or dictionary (elements) or of a string (bytes)       | 10,000,000  | `R903`                         |
| memory of the process (`qlang` program, `--max-memory`)                | 1 GB        | `R904`                         |

The time spent in built-in operations counts too: searching an array (`contains`,
`index_of`), sorting it, joining it (`join`), copying a string (`+`, `replace`, `split`…)
costs about one step per 4 elements (or 32 bytes). A loop that searches a very large array
at each turn therefore reaches the step limit, like any loop that is too long.

Comparing two values (`==`, `<`) goes down at most 1,000 levels into nested enums, arrays and
tuples: beyond that, `R092` (a program can build linked lists of millions of links; freeing
them has no limit).

Showing a value (`print`, interpolation, `as string`) goes down at most 64 levels into arrays
and structures: below that, it shows `...`. This prevents a structure that contains itself
(`n.next = n`) from looping forever.

The source code itself cannot exceed 200 levels of nesting.

---

## 21. Open points

- **Standard library:** it covers everyday needs (strings, arrays, dictionaries, `Set`, tuples,
  maths, encodings, files, network, processes, tests). The rest lives in packages: see
  `qlang-std` (CSV, templates, TOML); YAML, mail and S3 are not written.
- **Dictionaries:** no keys of type array or structure (see above), and no `<` comparison.
- **Smallest integer:** `-9223372036854775808` cannot be written as a literal (the unsigned
  digits exceed 64 bits).
- **Identifiers:** ASCII only (`a-z`, `A-Z`, `0-9`, `_`), whereas strings and comments accept
  all Unicode characters.
- **Traits that require others** (a trait that assumes another is also implemented): not
  planned for now.
- **Generic anonymous functions:** not planned.
- **Format of documentation comments:** the text stays free (`qlang doc` copies it as is). To be
  planned, depending on use: a light format such as `@param` / `@return`.
