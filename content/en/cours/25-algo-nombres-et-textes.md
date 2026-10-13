---
title: "Algorithms: numbers and texts"
---

# Algorithms: numbers and texts

## Prime numbers

```qlang
fun is_prime(n: int) -> bool
  if n < 2 then return false end
  let d = 2
  while d * d <= n do
    if n mod d == 0 then return false end
    d += 1
  end
  true
end
for n in 1..30 do
  if is_prime(n) then write("{n} ") end
end
print("")
```

## The sieve of Eratosthenes

All the prime numbers up to `n`, very efficiently.

```qlang
fun sieve(n: int) -> array<int>
  let prime: array<bool> = []
  for i in 0..=n do prime[] = true end
  let res: array<int> = []
  for i in 2..=n do
    if prime[i] then
      res[] = i
      let k = i * i
      while k <= n do
        prime[k] = false
        k += i
      end
    end
  end
  res
end
print(sieve(60))
```

## Prime factorization

```qlang
fun factors(n: int) -> array<int>
  let res: array<int> = []
  let d = 2
  while n > 1 do
    while n mod d == 0 do
      res[] = d
      n = n div d
    end
    d += 1
  end
  res
end
print(factors(360))     -- [2, 2, 2, 3, 3, 5]
```

## Conversion to binary

Or to any base up to 10.

```qlang
fun to_base(n: int, base: int) -> string
  if n == 0 then return "0" end
  let s = ""
  while n > 0 do
    s = (n mod base) as string + s
    n = n div base
  end
  s
end
print(to_base(42, 2))     -- 101010
print(to_base(255, 8))    -- 377
```

## Perfect numbers

A classic exercise (like Armstrong numbers…).

```qlang
fun is_perfect(n: int) -> bool
  let s = 0
  for d in 1..n do
    if n mod d == 0 then s += d end
  end
  s == n and n > 1
end
for n in 1..500 do
  if is_perfect(n) then write("{n} ") end
end
print("")
```

## Texts

### Counting vowels

```qlang
fun vowels(s: string) -> int
  let n = 0
  for c in s.lower() do
    if "aeiouy".contains(c) then n += 1 end
  end
  n
end
print(vowels("Programming"))
```

### Anagrams

Two words are anagrams if they have the same letters once sorted.

```qlang
fun sort_letters(s: string) -> string
  let cs = s.chars()
  cs.sort()
  cs.join("")
end
fun anagrams(a: string, b: string) -> bool
  sort_letters(a) == sort_letters(b)
end
print(anagrams("listen", "silent"))
print(anagrams("listen", "cat"))
```

### The Caesar cipher

```qlang
fun caesar(s: string, shift: int) -> string
  let res = ""
  for c in s do
    let code = c.code()
    if code >= 97 and code <= 122 then
      res += ((code - 97 + shift) mod 26 + 97).char()
    else
      res += c
    end
  end
  res
end
let secret = caesar("hello world", 3)
print(secret)
print(caesar(secret, 23))     -- 26 - 3: we get the message back
```

### The most frequent word

```qlang
fun most_frequent(text: string) -> string?
  let count: map<string, int> = {}
  for w in text.lower().words() do
    count[w] = count.get(w, 0) + 1
  end
  let best: string? = none
  let n = 0
  for w, c in count do
    if c > n then
      n = c
      best = w
    end
  end
  best
end
print(most_frequent("the cat sees the dog and the rat"))
```

### Balanced parentheses

We use a stack.

```qlang
fun balanced(s: string) -> bool
  let stack: array<string> = []
  for c in s do
    if "([\{".contains(c) then
      stack[] = c
    elseif ")]\}".contains(c) then
      let top = stack.pop()
      if top == none then return false end
      let expected = match c
        case ")" then "("
        case "]" then "["
        else "\{"
      end
      if top != expected then return false end
    end
  end
  stack.is_empty()
end
print(balanced("(a[b]\{c\})"))
print(balanced("(a[b)]"))
```

### Levenshtein distance

It is the number of changes needed to turn one word into another (dynamic programming).

```qlang
fun levenshtein(a: string, b: string) -> int
  let prev: array<int> = []
  for j in 0..=b.len() do prev[] = j end
  for i in 1..=a.len() do
    let cur = [i]
    for j in 1..=b.len() do
      let cost = if a[i - 1] == b[j - 1] then 0 else 1 end
      cur[] = (prev[j] + 1).min((cur[j - 1] + 1).min(prev[j - 1] + cost))
    end
    prev = cur
  end
  prev[b.len()]
end
print(levenshtein("kitten", "sitting"))   -- 3
```

## Remember

- Strings can be gone through like read-only arrays of characters: `for` loop, indexes,
  `code()` / `char()`.
- A stack (an array with `push` / `pop`) is used for parentheses, undoing, evaluating an
  expression.
- Dynamic programming: remembering sub-results.
