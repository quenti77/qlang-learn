---
title: "Algorithms — searching and sorting"
---

# Algorithms — searching and sorting

An algorithm is a precise method for solving a problem. We compare algorithms by their
**cost**: how many steps for `n` elements?

| Cost | Name | Example |
| --- | --- | --- |
| O(1) | constant | accessing `xs[i]` |
| O(log n) | logarithmic | binary search |
| O(n) | linear | going through an array |
| O(n log n) | | good sorts |
| O(n²) | | two nested loops (simple sorts) |

## Linear search: O(n)

```qlang
fun linear_search(xs: array<int>, target: int) -> int?
  for i, x in xs do
    if x == target then return i end
  end
  none
end
print(linear_search([4, 8, 15, 16, 23, 42], 16))   -- 3
print(linear_search([4, 8], 99))                   -- none
```

## Binary search: O(log n)

It needs a **sorted** array. The search space is cut in half at each step.

```qlang
fun binary_search(xs: array<int>, target: int) -> int?
  let low = 0
  let high = xs.len() - 1
  while low <= high do
    let middle = (low + high) div 2
    if xs[middle] == target then
      return middle
    elseif xs[middle] < target then
      low = middle + 1
    else
      high = middle - 1
    end
  end
  none
end
let sorted = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(sorted, 11))   -- 5
print(binary_search(sorted, 4))    -- none
```

## Bubble sort: O(n²)

Simple but slow: we swap neighbors that are in the wrong order.

```qlang
fun bubble_sort(xs: array<int>)
  let n = xs.len()
  for i in 0..n do
    for j in 0..(n - i - 1) do
      if xs[j] > xs[j + 1] then
        let tmp = xs[j]
        xs[j] = xs[j + 1]
        xs[j + 1] = tmp
      end
    end
  end
end
let a = [5, 2, 9, 1, 7, 3]
bubble_sort(a)
print(a)
```

## Selection sort: O(n²)

We look for the minimum and put it at the front.

```qlang
fun selection_sort(xs: array<int>)
  let n = xs.len()
  for i in 0..n do
    let imin = i
    for j in (i + 1)..n do
      if xs[j] < xs[imin] then imin = j end
    end
    let tmp = xs[i]
    xs[i] = xs[imin]
    xs[imin] = tmp
  end
end
let b = [29, 3, 17, 8, 1]
selection_sort(b)
print(b)
```

## Insertion sort: O(n²)

Fast on almost sorted data. It is like sorting cards in your hand.

```qlang
fun insertion_sort(xs: array<int>)
  for i in 1..xs.len() do
    let key = xs[i]
    let j = i - 1
    while j >= 0 and xs[j] > key do
      xs[j + 1] = xs[j]
      j -= 1
    end
    xs[j + 1] = key
  end
end
let c = [9, 4, 6, 2, 8]
insertion_sort(c)
print(c)
```

## Merge sort: O(n log n)

This is "divide and conquer": we cut in two, sort each half (recursively), then merge.

```qlang
fun merge(l: array<int>, r: array<int>) -> array<int>
  let res: array<int> = []
  let i = 0
  let j = 0
  while i < l.len() and j < r.len() do
    if l[i] <= r[j] then
      res[] = l[i]
      i += 1
    else
      res[] = r[j]
      j += 1
    end
  end
  while i < l.len() do
    res[] = l[i]
    i += 1
  end
  while j < r.len() do
    res[] = r[j]
    j += 1
  end
  res
end

fun merge_sort(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let m = xs.len() div 2
  merge(merge_sort(xs.slice(0, m)), merge_sort(xs.slice(m, xs.len())))
end
print(merge_sort([38, 27, 43, 3, 9, 82, 10]))
```

## Quick sort: O(n log n) on average

We choose a pivot, separate the smaller ones from the bigger ones, then start again.

```qlang
fun quick_sort(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let pivot = xs[0]
  let smaller: array<int> = []
  let bigger: array<int> = []
  for i in 1..xs.len() do
    if xs[i] < pivot then smaller[] = xs[i] else bigger[] = xs[i] end
  end
  let res = quick_sort(smaller)
  res[] = pivot
  for b in quick_sort(bigger) do res[] = b end
  res
end
print(quick_sort([38, 27, 43, 3, 9, 82, 10]))
```

## Comparing them with the built-in sort

A good habit: check that your sort gives the same result as `sort`.

```qlang
fun quick_sort(xs: array<int>) -> array<int>
  if xs.len() <= 1 then return xs end
  let pivot = xs[0]
  let smaller: array<int> = []
  let bigger: array<int> = []
  for i in 1..xs.len() do
    if xs[i] < pivot then smaller[] = xs[i] else bigger[] = xs[i] end
  end
  let res = quick_sort(smaller)
  res[] = pivot
  for b in quick_sort(bigger) do res[] = b end
  res
end

let original = [8, 3, 5, 1, 9, 2, 7]
let builtin = original.slice(0, original.len())
builtin.sort()
assert(quick_sort(original) == builtin, "quick sort == built-in sort")
print("quick sort agrees with sort")
```

## Remember

- Binary search needs a sorted array and halves the work at each turn.
- Simple sorts are O(n²); merge sort and quick sort are O(n log n).
- In practice we use `xs.sort()`, but understanding sorts is instructive.
