---
title: "Arrays"
---

# Arrays

An array stores several values **of the same type**, in order. Its type is written
`array<int>`, `array<string>`, `array<array<int>>`…

## Reading and changing

```qlang
let grades = [12, 15, 9, 18]
print(grades)
print(grades.len())        -- 4
print(grades[0])           -- 12 : the first one is at index 0
print(grades[3])           -- 18 : the last one is at len - 1
grades[1] = 16             -- change an element
print(grades)
```

An empty array must have a written type:

```qlang
let empty: array<string> = []
print(empty.is_empty())
```

## Adding and removing

```qlang
let grades = [12, 16, 9, 18]
grades.push(20)            -- adds at the end
grades[] = 7               -- same (another way to write it)
print(grades)
print(grades.pop())        -- removes and returns the last one: 7
grades.insert(0, 1)        -- inserts 1 at index 0
print(grades)
print(grades.remove(0))    -- removes the element at index 0 and returns it
print(grades)
```

## Questions and statistics

```qlang
let grades = [12, 16, 9, 18, 20]
print(grades.contains(18))
print(grades.index_of(18)) -- the index, or none
print(grades.min())
print(grades.max())
print(grades.sum())
let average = grades.sum() / grades.len()   -- int / int gives a float
print("average = {average}")
```

## Sorting and reversing

These operations are done **in place**: the array itself is modified.

```qlang
let shuffled = [5, 2, 9, 1, 7]
shuffled.sort()
print(shuffled)
shuffled.reverse()
print(shuffled)
let words = ["pear", "pineapple", "kiwi"]
words.sort()
print(words)
```

## `slice(start, end)`: a copy of a part

```qlang
let all = [10, 20, 30, 40, 50]
print(all.slice(1, 4))   -- [20, 30, 40]
let copy = all.slice(0, all.len())   -- full copy
copy[0] = 0
print(all)               -- unchanged
```

## Shared, not copied

When you put an array into another variable, the array is not copied: both variables refer to the **same** array.
Changing one changes the other.

```qlang
let t1 = [1, 2, 3]
let t2 = t1          -- t2 refers to the SAME array
t2[0] = 99
print(t1)            -- [99, 2, 3]  surprise!
```

Numbers, booleans and texts, on the other hand, are copied (see lesson 3). To get a real copy, use `slice`.

A `const` fixes the **name**, not the content of an array.

```qlang
const list = [1]
list[0] = 2
print(list)
```

## Passing an array to a function

Arrays are shared: the function modifies the caller's array.

```qlang
fun double_all(xs: array<int>)
  for i in 0..xs.len() do
    xs[i] = xs[i] * 2
  end
end
let t = [1, 2, 3]
double_all(t)
print(t)
```

## Going through an array

```qlang
let all = [10, 20, 30, 40, 50]

for x in all do write("{x} ") end
print("")
for i in 0..all.len() do
  write("{i}:{all[i]} ")
end
print("")
for i, x in all do write("{i}={x} ") end
print("")
```

## A classic: finding a maximum

```qlang
let values = [4, 17, 9, 23, 8]
let max = values[0]
for v in values do
  if v > max then max = v end
end
print("max = {max}")
```

## Text and arrays

```qlang
print(["a", "b", "c"].join("-"))
print("a-b-c".split("-"))
```

## Arrays of arrays: a grid

```qlang
let grid: array<array<int>> = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]
print(grid[1][2])       -- row 1, column 2 -> 6
for row in grid do
  for v in row do write("{v} ") end
  print("")
end
-- Sum of the diagonal
let diag = 0
for i in 0..3 do diag += grid[i][i] end
print("diagonal: {diag}")
```

A grid filled with zeros:

```qlang
let n = 3
let zeros: array<array<int>> = []
for i in 0..n do
  let row: array<int> = []
  for j in 0..n do row[] = 0 end
  zeros[] = row
end
zeros[1][1] = 5
print(zeros)
```

## The trap: out-of-range indexes

An index outside the limits is a runtime error. Try:

<!-- expect-error -->
```qlang
let all = [10, 20, 30]
print(all[10])
```

Always check first: `if i >= 0 and i < xs.len() then …`.

## Equality

Two arrays are equal if all their elements are.

```qlang
print([1, 2] == [1, 2])
print([1, 2] == [2, 1])
```

## Any number of arguments

The **last** parameter can collect all the remaining arguments: put `...` before its name. Its type is the type of
**one element**; inside the function it is an array.

```qlang
fun total(...numbers: int) -> int
  let sum = 0
  for n in numbers do
    sum += n
  end
  sum
end
print(total())          -- 0
print(total(1, 2, 3))   -- 6
```

And `...` before a value does the opposite: it **unrolls** an array into arguments, or into another array.

```qlang
fun total(...numbers: int) -> int
  let sum = 0
  for n in numbers do
    sum += n
  end
  sum
end
let xs = [1, 2, 3]
print(total(...xs))            -- 6
print(total(10, ...xs, 20))    -- 36
print([...xs, 4, ...xs])       -- [1, 2, 3, 4, 1, 2, 3]
```

## Remember

- Indexes go from 0 to `len() - 1`.
- `push`, `pop`, `insert`, `remove`, `sort`, `reverse` change the array **in place**;
  `slice` copies.
- An array is a reference: two variables can share it, and a function that receives it can change it.
- `...numbers: int` collects the remaining arguments in an array; `...list` unrolls an array.
