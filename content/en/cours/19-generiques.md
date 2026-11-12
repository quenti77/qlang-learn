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

## A method without `self`: `T.zero()`

A trait can declare a method **without `self`** (`fun zero() -> Self`). In a generic function, a type parameter is
then used as a call prefix: `T.zero()` calls the method of the type `T` stands for. The prelude provides `Zero` (the
neutral element of the addition) and `One` for `int` and `float`.

```qlang
fun total<T: Add + Zero>(xs: array<T>) -> T
  let t = T.zero()
  for x in xs do
    t = t + x
  end
  t
end

print(total([1, 2, 3]))
print(total<float>([]))
```

## Walking through your own type: `Iterator<T>`

`for` goes through an array, a string, a range or a dictionary. To make it go through **your** type, implement
`Iterator<T>`: a `next` method that returns `Step.Item(value)` while there are elements, then `Step.End`. (It is not a
`T?`: an element may be `none` without stopping the loop.)

```qlang
struct Counter
  public n: int
  public max: int
end

impl Iterator<int> for Counter
  public fun next(self) -> Step<int>
    if self.n >= self.max then
      return Step<int>.End
    end
    self.n += 1
    Step<int>.Item(self.n)
  end
end

for x in Counter { n: 0, max: 3 } do
  print(x)
end
```

An iterator also has **lazy** methods: `map`, `filter`, `take` and `skip` compute nothing until the result is walked,
and `collect()` turns it into an array.

```qlang
struct Counter
  public n: int
  public max: int
end

impl Iterator<int> for Counter
  public fun next(self) -> Step<int>
    if self.n >= self.max then
      return Step<int>.End
    end
    self.n += 1
    Step<int>.Item(self.n)
  end
end

let evens = Counter { n: 0, max: 1000000000 }.filter(fun(x: int) -> bool x % 2 == 0 end)
print(evens.map(fun(x: int) -> int x * x end).take(3).collect())
print([1, 2, 3].iter().map(fun(x: int) -> int x + 1 end).collect())
```

## Remember

- `fun f<T>(…)`, `struct S<T>`, `impl<T> S<T>`.
- Without a bound, you can hardly do anything with a `T`: add `T: Ord`, `T: Add`…
- qlang guesses `T` from the arguments, otherwise you specify it: `f<int>(…)`.
- A struct that implements `Iterator<T>` can be walked through by `for`.
