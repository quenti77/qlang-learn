---
title: "Variables"
---

# Variables

A variable is a **labelled box** that keeps a value for later.

## Creating a variable

`let` creates a variable. It is **always** initialized.

```qlang
let age = 30
print(age)
```

## Changing its value

You can change its value: this is called reassignment.

```qlang
-- (defined earlier in this chapter)
let age = 30

age = 31
print(age)
```

## The type

The type is guessed (we say *inferred*): here `age` is an `int`. You can also write it
explicitly after the colon.

```qlang
let height: float = 1.75
let name: string = "Ada"
print("{name} is {height} m tall")
```

A variable keeps its type: `age = "thirty"` would be an **error**. Try it in the example above.

## Constants

With `const`, the name can no longer be reassigned.

```qlang
const PI_APPROX = 3.14
print(PI_APPROX)
-- PI_APPROX = 3     -- error!
```

## Computing with variables

You can compute a variable from others.

```qlang
let width = 4
let length = 5
let area = width * length
print("area = {area}")
```

## Shortcuts

`x += 1` means `x = x + 1`. There are also `-=`, `*=`…

```qlang
let counter = 0
counter += 1
counter += 1
counter *= 10
counter -= 5
print(counter)   -- 15
```

## Swapping two values

We use a temporary variable.

```qlang
let a = 1
let b = 2
let tmp = a
a = b
b = tmp
print("a={a} b={b}")
```

## Scope: a variable created in a block only exists in that block

```qlang
let x = 1
if true then
  let x = 100           -- ANOTHER variable x, which hides the first one
  print("inside: {x}")
end
print("outside: {x}")  -- 1
```

## References: arrays and structures are shared, not copied

```qlang
let t1 = [1, 2, 3]
let t2 = t1          -- t2 refers to the SAME array
t2[0] = 99
print(t1)            -- [99, 2, 3]  surprise!
```

Numbers, booleans and texts, on the other hand, are copied.

```qlang
let n1 = 5
let n2 = n1
n2 = 6
print(n1)            -- 5
```

A `const` fixes the **name**, not the content of an array.

```qlang
const list = [1]
list[0] = 2
print(list)
```

## Remember

- `let` = changeable variable, `const` = fixed name.
- The type of a variable never changes.
- Arrays are shared (references), numbers are copied.
- `x += 1`, `x -= 1`, `x *= 2` are shortcuts.
