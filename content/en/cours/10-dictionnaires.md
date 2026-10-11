---
title: "Dictionaries"
---

# Dictionaries

A dictionary (`map<K, V>`) associates a **key** with a **value**, like a directory: you look
things up by name, not by position. Keys can be `int`, `string`, `bool` or `enum`. The
insertion order is kept.

## Creating, reading, changing

```qlang
let ages = { "ana": 31, "bob": 27 }
print(ages)

ages["cleo"] = 45            -- add
ages["bob"] = 28             -- replace
print(ages["ana"])           -- 31
```

## A missing key

Reading a **missing** key gives `none`: the type of `ages["ana"]` is therefore `int?`.

```qlang
let ages = { "ana": 31, "bob": 27 }
print(ages["zed"])           -- none

-- You must check before using it
let v = ages["ana"]
if v != none then
  print("ana + 1 = {v + 1}")
end

-- Or give a default value with get
print(ages.get("zed", 0))    -- 0
```

## Questions and cleaning up

```qlang
let ages = { "ana": 31, "bob": 27 }
print(ages.has("ana"))
print(ages.len())
print(ages.remove("ana"))    -- returns the old value
print(ages.has("ana"))
print(ages.keys())
print(ages.values())
```

## Going through it: key and value

```qlang
let ages = { "ana": 31, "bob": 27 }
for name, age in ages do
  print("{name} is {age} years old")
end
```

## An empty dictionary

Its type must be written.

```qlang
let stock: map<string, int> = {}
stock["apples"] = 10
stock["pears"] = 4
stock["apples"] += 5          -- ok because the key exists
print(stock)
```

## Use case 1: counting occurrences

```qlang
let text = "the cat and the dog and the cat"
let count: map<string, int> = {}
for word in text.words() do
  count[word] = count.get(word, 0) + 1
end
print(count)
```

## Use case 2: grouping

```qlang
let by_length: map<int, array<string>> = {}
for word in ["a", "bb", "cc", "d", "eee"] do
  let k = word.len()
  let group = by_length.get(k, [])
  group[] = word
  by_length[k] = group
end
print(by_length)
```

## Use case 3: memoization

Remembering a result that was already computed.

```qlang
let memo: map<int, int> = {}
fun fib(n: int) -> int
  if n < 2 then return n end
  let known = memo[n]
  if known != none then return known end
  let r = fib(n - 1) + fib(n - 2)
  memo[n] = r
  r
end
print(fib(80))     -- instant thanks to the cache
```

## Nested dictionaries

```qlang
let directory: map<string, map<string, string>> = {
  "ada": { "city": "London", "phone": "123" },
  "linus": { "city": "Helsinki", "phone": "456" }
}
let ada = directory["ada"]
if ada != none then
  print(ada["city"])
end
```

## Equality

It does not depend on the order.

```qlang
print({ "a": 1, "b": 2 } == { "b": 2, "a": 1 })
```

## Remember

- `d[key]` returns `V?` (`none` if the key is missing); `d.get(key, default)` returns `V`.
- `for k, v in d` goes through it in insertion order.
- Perfect for counting, grouping, indexing, caching.
