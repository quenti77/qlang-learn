---
title: "Generics"
---

# Generics

Generics let you write **one** function or **one** type that works for several types,
instead of copy-pasting one version per type. `T` is a type "to be filled in".

Without generics, we would need `first_int`, `first_string`, `first_float`…

## Generic functions

```qlang
fun first<T>(xs: array<T>) -> T?
  if xs.is_empty() then return none end
  xs[0]
end
print(first([10, 20]))
print(first(["a", "b"]))
let nothing: array<float> = []
print(first(nothing))

fun swap<T>(xs: array<T>, i: int, j: int)
  let tmp = xs[i]
  xs[i] = xs[j]
  xs[j] = tmp
end
let nums = [1, 2, 3]
swap(nums, 0, 2)
print(nums)
let letters = ["a", "b"]
swap(letters, 0, 1)
print(letters)
```

## Bounds

`T` must follow a contract (a trait) for us to be able to use it.

```qlang
fun bigger<T: Ord>(a: T, b: T) -> T
  if a > b then a else b end
end
print(bigger(3, 8))
print(bigger("apple", "pear"))
print(bigger(2.5, 1.5))

fun add_up<T: Add>(a: T, b: T) -> T
  a + b
end
print(add_up(1, 2))
print(add_up("ab", "cd"))

fun maximum<T: Ord>(xs: array<T>) -> T?
  if xs.is_empty() then return none end
  let m = xs[0]
  for x in xs do
    if x > m then m = x end
  end
  m
end
print(maximum([3, 9, 2]))
print(maximum(["b", "z", "a"]))
```

Several bounds are combined with `+`:

```qlang
fun are_equal_and_ordered<T: Eq + Ord>(a: T, b: T) -> bool
  a == b and not (a < b)
end
print(are_equal_and_ordered(4, 4))
```

## Generic structures

```qlang
struct Pair<A, B>
  public first: A
  public second: B
end

impl<A, B> Pair<A, B>
  public fun swap(self) -> Pair<B, A>
    Pair { first: self.second, second: self.first }
  end
end

let p = Pair { first: 1, second: "one" }
print(p)
print(p.swap())
```

A generic container: a box.

```qlang
struct Box<T>
  public content: T
end
impl<T> Box<T>
  public fun create(c: T) -> Box<T>
    Box { content: c }
  end
  public fun read(self) -> T
    self.content
  end
end
let b = Box<int>.create(5)
print(b.read() + 1)
let bs = Box<string>.create("hey")
print(bs.read())
```

## Specifying the type

When the type cannot be guessed, you write it between angle brackets.

```qlang
fun add_up<T: Add>(a: T, b: T) -> T
  a + b
end

struct Box<T>
  public content: T
end

let empty: array<Box<int>> = []
print(empty.len())
print(add_up<float>(1.5, 2.5))
```

## Remember

- `fun f<T>(…)`, `struct S<T>`, `impl<T> S<T>`.
- Without a bound, you can hardly do anything with a `T`: add `T: Ord`, `T: Add`…
- qlang guesses `T` from the arguments, otherwise you specify it: `f<int>(…)`.
