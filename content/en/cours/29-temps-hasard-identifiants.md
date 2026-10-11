---
title: "Time, randomness and identifiers"
---

# Time, randomness and identifiers

A program sometimes needs **the time** or **randomness**: rolling a die, shuffling, giving an
order a unique identifier. The core of qlang reads neither the clock nor a random source: they
come from the **environment** (here the web page; in a terminal, the system).

## The time: `time.now()`

`time.now()` returns the current time as an `int`: the number of **milliseconds** since
1 January 1970 (UTC).

```qlang
let start = time.now()
let stop = time.now()
print(stop >= start)
print(stop - start < 1000)
```

To measure a duration, subtract two times.

## Randomness: `random`

`random.int(min, max)` gives an integer from `min` to `max`, **both included**.
`random.float()` gives a number in `[0, 1[`.

```qlang
let die = random.int(1, 6)
print(die >= 1 and die <= 6)

let x = random.float()
print(x >= 0.0 and x < 1.0)
```

Each run gives other values. `random.int(3, 1)` is an error: `min` must be less than or equal
to `max`.

## `uuid`: a 128-bit identifier

A `uuid` is made of 128 bits, written `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. It is a type of
its own, not a `string`.

```qlang
let id = uuid.v4()
print(id.version())
print((id as string).len())

print(uuid.NIL)
```

- `uuid.v4()`: a random identifier.
- `uuid.v7()`: the time, then randomness: sortable by creation date.
- `uuid.parse(text)`: returns a `uuid?`, `none` if the text is invalid.

```qlang
let u = uuid.parse("550e8400-e29b-41d4-a716-446655440000")
if u != none then
  print(u.version())
end
print(uuid.parse("not a uuid") == none)
```

## `ulid`: a sortable identifier

A `ulid` is also 128 bits, but it starts with the **creation time** (48 bits, in milliseconds)
followed by **80 random bits**. It is written with 26 characters.

```qlang
let a = ulid.at(1000)
let b = ulid.at(2000)
print(a < b)
print(a.time())
print((a as string).len())
```

`ulid.new()` uses the present time. `ulid.at(ms)` sets the time: handy to understand and to
test. Two `ulid`s created one after the other are **always** in that order, even within the
same millisecond.

```qlang
let ids: array<ulid> = []
for i in 0..5 do
  ids.push(ulid.new())
end
let sorted = ids.slice(0, 5)
sorted.sort()
print(sorted == ids)
```

`uuid`s and `ulid`s can be compared, sorted, and used as dictionary keys:

```qlang
let orders: map<ulid, string> = {}
let first = ulid.at(1000)
orders[first] = "coffee"
print(orders[first])
```

## Remember

- `time.now()`: milliseconds since 1970. `random.int(min, max)` includes both ends.
- `uuid` and `ulid` are types of their own, comparable and usable as keys.
- A `ulid` holds the time: sort it by date, and read the time with `.time()`.
- The randomness is **not** meant for security (passwords, tokens).
