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

The expression inside `{ }` cannot contain an unescaped `"` quote. To show a brace, write
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

Calling a method or reading a field on a value that may be `none` is a compile-time error.

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
  characters). For a structure, you have to implement `Ord`.
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
| Enumeration variant | `case Color.Red then`                                    |
| Range               | `case 1..=9 then`, `case 0.5..1.5 then`                  |
| Binding + guard     | `case x if x > 100 then` (`x` names the tested value)    |

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

An implementation must define all the methods of the trait, with the same types. For now, a
trait can neither have a default method nor require another trait. A trait can be
implemented for any type, including `int`, `string` or `array<T>` (`impl Describe for int`).

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

An enumeration is a list of named constants.

```
enum Color
  Red
  Green
  Blue
end

let c = Color.Red

let label = match c
  case Color.Red then "red"
  case Color.Green then "green"
  else "other"
end

impl Color
  public fun is_warm(self) -> bool
    self == Color.Red
  end
end
```

Variants do not carry data. They are compared with `==` and shown as `Color.Red`. An
enumeration can have methods (`impl`).

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
  Result.ok(1)                     -- T and E come from the return type of `get`
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
  are. Circular imports are refused.
- You cannot modify an exported variable from another file.

---

## 14. Input, output and the standard library

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

### Built-in functions

| Function                 | Role                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| `print(x)`               | shows `x` followed by a new line (`print()`: an empty line)           |
| `write(x)`               | shows `x` without a new line                                          |
| `read()`                 | reads a line and returns a `string` (without the new line)            |
| `panic(message)`         | stops the program with an error                                       |
| `assert(cond, message?)` | stops the program if `cond` is false                                  |
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

`sort`, `min` and `max` need elements that can be compared: numbers, strings, or a structure
that implements `Ord`. Otherwise it is a compile-time error. `sum` only accepts arrays of
`int` or `float`. `slice` copies the elements: modifying the result does not change the
original array.

Numbers:

| Method / constant                    | Result                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `n.char()`                           | (`int`) the one-character string with code `n` (`97.char()` is `"a"`) |
| `x.abs()`                            | absolute value (`int` or `float`)                                     |
| `x.min(y)`, `x.max(y)`               | the smaller / larger of the two (same type)                           |
| `x.pow(y)`                           | `x ** y` (two `int`s give an `int`, two `float`s a `float`)           |
| `x.sqrt()`                           | square root, a `float` (error if `x` is negative)                     |
| `f.floor()`, `f.ceil()`, `f.round()` | roundings of a `float`, which return an `int`                         |
| `float.PI`, `float.E`                | mathematical constants                                                |
| `int.MAX`, `int.MIN`                 | largest / smallest `int`                                              |

```
print([3, 1, 2].max())             -- 3
print(float.PI * 2.0 ** 2)         -- 12.566370614359172
print(16.sqrt())                   -- 4.0
```

These operations are methods and constants attached to the types, so as not to reserve
global names (`PI`, `min`…) that you might want to use yourself.

### Dictionaries

A dictionary (`map<K, V>`) associates values with **keys**. Keys are `int`s, `string`s,
`bool`s or values of an enumeration: types that are compared by value. Keys keep their
**insertion order**.

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

- **Walking**: `for name, age in ages do … end` gives the key and the value, in insertion
  order. You can also walk only the keys (`for name in ages.keys() do`). Looping over a
  dictionary with a single variable (`for x in m`) is an error.
- **`m[key] += 1`** reads the value itself: it is a run-time error if the key does not exist
  (use `get` in that case).
- **Sharing**: like arrays, a dictionary is a shared reference.
- Dictionaries are shown as `{"ana": 31, "bob": 27}`. Two dictionaries are equal (`==`) if
  they have the same keys with equal values, whatever the insertion order.
- **Why no `float`, array or structure keys?** A key must always designate the same entry. An
  array or a structure is a shared reference that can be modified after being stored
  (`k[0] = 99`), and a `float` is not exact (`0.1 + 0.2 != 0.3`). For coordinates, use a
  string (`m["{x},{y}"]`) or nested dictionaries.
- An empty literal `{}` needs a type annotation: `let m = {}` is an error. A literal can
  span several lines and end with a comma.
- `map` names the type in annotations (`map<string, int>`), but can still be used as the name
  of a function or a variable.

An index out of bounds (`xs[5]` for 3 elements, a negative index) is a run-time error.

### Time and randomness

The core of the language reads neither the clock nor a random source: like `read`, they come
from the **environment**. A program that calls them while they are missing is refused
**before** it runs (error `T250`).

| Call                   | Result                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| `time.now()`           | the current time, an `int`: milliseconds since 1 January 1970 UTC        |
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

### Prelude: `Result` and `Error`

Two types are available in every file, **without an `import`**:

```
struct Error
  public message: string
end

struct Result<T, E>
  -- data and err are private: access them with the methods below
end
```

`Result<T, E>` represents either a value (`ok`) or an error (`err`):

```
fun divide(a: int, b: int) -> Result<int, Error>
  if b == 0 then
    return Err(Error { message: "division by zero" })
  end
  Ok(a div b)
end

let r = divide(10, 0)
if r.is_err() then
  print(r.unwrap_err().message)
else
  print(r.unwrap())
end
```

- `Ok(value)` and `Err(error)` build the result; `T` and `E` are deduced from
  context (here, the return type of `divide`). When nothing lets them be
  deduced, write them explicitly on the type: `Result<int, Error>.ok(value)`
  / `Result<int, Error>.err(error)` (no `?` propagation sugar: you unwrap by
  hand).
- `is_ok()`, `is_err()`: know which of the two cases you have.
- `unwrap()`, `unwrap_err()`: read the value or the error, or stop the
  program (`panic`) if you picked the wrong case.
- `Result`/`Error` are ordinary declarations: a structure `Error` (or
  `Result`) that you write yourself in your own file **shadows** the
  prelude's, exactly like a local variable shadows a variable of wider
  scope.

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

`json_array(items)` does the same for an array. `int`, `float`, `bool` and
`string` already implement `ToJson`.

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

There is **no automatic conversion** between a decoded `Json` and a
user-defined structure (qlang has no reflection or `derive` macros): to
rebuild a `Post` from a `Json`, write your own static method that reads the
fields one by one, for example `Post.from_json(json: Json) -> Result<Post,
Error>` (a convention, not an interface the language imposes, like `new`).

### Prelude: `http`

`http.send(req)` sends an HTTP request and waits for the response. `Request`
and `Response` are provided by the prelude (no need to declare them):

```
struct Request
  public method: string
  public url: string
  public headers: map<string, string> = {}
  public body: string? = none
end

struct Response
  public status: int
  public body: string
end
```

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

### Prelude: `Db`

`Db.connect(url)` opens a database connection; the URL's scheme picks the
driver: `sqlite://path/to/file.db`, or
`postgres://user:password@host/database`. For Postgres over TLS, add
`?sslmode=require` (or `prefer`/`verify-ca`/`verify-full`, they are treated
the same here): `postgres://user:pass@host/database?sslmode=require`. The
server's certificate is always verified against the public authorities
(Mozilla); a self-signed certificate or a private authority are not
accepted without host-side configuration.

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
- Needs database access on the host side, same as `http`.
- **Current limits**: on the Postgres side, only the common scalar types (`bool`,
  integers, floats, text) are properly converted, others (date, uuid, json,
  array...) fall back to text if possible, otherwise `none`; no SQLite BLOB
  (becomes `none`); no connection pool nor cached prepared statements.

## 15. Line endings

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

---

## 16. Reserved keywords

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

## 17. Errors and limits

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

The time spent in built-in operations counts too: searching an array (`contains`,
`index_of`), sorting it, joining it (`join`), copying a string (`+`, `replace`, `split`…)
costs about one step per 4 elements (or 32 bytes). A loop that searches a very large array
at each turn therefore reaches the step limit, like any loop that is too long.

Showing a value (`print`, interpolation, `as string`) goes down at most 64 levels into arrays
and structures: below that, it shows `...`. This prevents a structure that contains itself
(`n.next = n`) from looping forever.

The source code itself cannot exceed 200 levels of nesting.

---

## 18. Open points

- **Standard library:** it is deliberately small (see section 14) and will grow with use.
- **Dictionaries:** no keys of type `float`, array or structure (see above), and no `<`
  comparison.
- **Smallest integer:** `-9223372036854775808` cannot be written as a literal (the unsigned
  digits exceed 64 bits).
- **Identifiers:** ASCII only (`a-z`, `A-Z`, `0-9`, `_`), whereas strings and comments accept
  all Unicode characters.
- **Named arguments** (`f(a: 1)`): not planned.
- **Default methods in traits** and traits that require others: not planned for now.
- **Generic anonymous functions:** not planned.
- **Format of documentation comments:** the text is free for now. To be planned, depending on
  use: a light format such as `@param` / `@return`, and a documentation page generated from
  these comments.
