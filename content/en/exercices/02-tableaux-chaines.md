---
title: "Arrays, strings, dictionaries"
---

# Arrays, strings, dictionaries

## Exercise 1

Return the average of a non-empty array (float).

```qlang-exercise
fun average(xs: array<int>) -> float
  0.0   -- TODO
end
```

```qlang-tests
assert(average([2, 4, 6]) == 4.0, "average")
print("exercise 1 OK")
```

```qlang-solution
fun average(xs: array<int>) -> float
  xs.sum() / xs.len()
end
```

## Exercise 2

Return a new array without the duplicates (order kept).

```qlang-exercise
fun without_duplicates(xs: array<int>) -> array<int>
  []   -- TODO
end
```

```qlang-tests
assert(without_duplicates([1, 2, 1, 3, 2]) == [1, 2, 3], "duplicates")
print("exercise 2 OK")
```

```qlang-solution
fun without_duplicates(xs: array<int>) -> array<int>
  let res: array<int> = []
  for x in xs do
    if not res.contains(x) then res[] = x end
  end
  res
end
```

## Exercise 3

Return true if the string is a palindrome (ignore the case).

```qlang-exercise
fun is_palindrome(s: string) -> bool
  false   -- TODO
end
```

```qlang-tests
assert(is_palindrome("Kayak"), "kayak")
assert(not is_palindrome("abc"), "abc")
print("exercise 3 OK")
```

```qlang-solution
fun is_palindrome(s: string) -> bool
  let m = s.lower()
  m == m.reverse()
end
```

## Exercise 4

Return the number of words in a sentence.

```qlang-exercise
fun word_count(s: string) -> int
  0   -- TODO
end
```

```qlang-tests
assert(word_count("the cat sleeps") == 3, "3")
assert(word_count("") == 0, "empty")
print("exercise 4 OK")
```

```qlang-solution
fun word_count(s: string) -> int
  s.words().len()
end
```

## Exercise 5

Return a dictionary letter -> number of occurrences.

```qlang-exercise
fun frequencies(s: string) -> map<string, int>
  let m: map<string, int> = {}
  m   -- TODO
end
```

```qlang-tests
let f = frequencies("banana")
assert(f.get("a", 0) == 3, "a")
assert(f.get("n", 0) == 2, "n")
assert(f.get("z", 0) == 0, "z")
print("exercise 5 OK")
```

```qlang-solution
fun frequencies(s: string) -> map<string, int>
  let m: map<string, int> = {}
  for c in s do
    m[c] = m.get(c, 0) + 1
  end
  m
end
```

## Exercise 6

Rotate an array one step to the left: [1,2,3] -> [2,3,1] (new array).

```qlang-exercise
fun rotate(xs: array<int>) -> array<int>
  xs   -- TODO
end
```

```qlang-tests
assert(rotate([1, 2, 3]) == [2, 3, 1], "rotation")
print("exercise 6 OK")
```

```qlang-solution
fun rotate(xs: array<int>) -> array<int>
  if xs.is_empty() then return [] end
  let res = xs.slice(1, xs.len())
  res[] = xs[0]
  res
end
```
