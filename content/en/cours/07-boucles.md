---
title: "Loops"
---

# Loops

A loop repeats an action without having to write it 100 times.

## `while`: repeats as long as the condition is true

```qlang
let n = 1
while n <= 5 do
  write("{n} ")
  n += 1            -- without this: infinite loop!
end
print("")
```

## `for` with a range: a known number of turns

```qlang
for i in 0..5 do        -- 0,1,2,3,4 (5 excluded)
  write("{i} ")
end
print("")

for i in 1..=5 do       -- 1,2,3,4,5 (5 included)
  write("{i} ")
end
print("")

for i in 0..=10 step 2 do      -- by 2
  write("{i} ")
end
print("")

for i in 10..0 step -3 do      -- backwards: 10, 7, 4, 1
  write("{i} ")
end
print("")
```

## `for` over an array or a string

```qlang
let fruits = ["apple", "pear", "plum"]
for f in fruits do
  print("I like the {f}")
end

for i, f in fruits do            -- with the index
  print("{i} -> {f}")
end

for letter in "abc" do
  write(letter.upper())
end
print("")
```

## `break` and `continue`

`continue` goes to the next turn, `break` leaves the loop.

```qlang
for i in 1..=10 do
  if i mod 2 == 0 then continue end   -- skips even numbers
  if i > 7 then break end             -- stops everything
  write("{i} ")
end
print("")
```

There is no `loop`: we write `while true`.

```qlang
let tries = 0
while true do
  tries += 1
  if tries * tries > 50 then break end
end
print("first try whose square is above 50: {tries}")
```

## Nested loops

A loop can contain another loop.

```qlang
for row in 1..=3 do
  for col in 1..=4 do
    let cell = (row * col) as string
    write(cell.pad_left(3, " "))
  end
  print("")
end
```

A triangle:

```qlang
for i in 1..=5 do
  print("*".repeat(i))
end
```

## Classic patterns

### Accumulating (a sum)

```qlang
let total = 0
for i in 1..=100 do
  total += i
end
print("1+2+...+100 = {total}")      -- 5050
```

### Counting

```qlang
let evens = 0
for i in 1..=20 do
  if i mod 2 == 0 then evens += 1 end
end
print("even numbers between 1 and 20: {evens}")
```

### Finding a maximum

```qlang
let values = [4, 17, 9, 23, 8]
let max = values[0]
for v in values do
  if v > max then max = v end
end
print("max = {max}")
```

### FizzBuzz

The classic of job interviews.

```qlang
for i in 1..=15 do
  if i mod 15 == 0 then write("FizzBuzz ")
  elseif i mod 3 == 0 then write("Fizz ")
  elseif i mod 5 == 0 then write("Buzz ")
  else write("{i} ")
  end
end
print("")
```

## Remember

- `while` = as long as; `for` = for each.
- `a..b` excludes `b`, `a..=b` includes it. `step` sets the step.
- `break` leaves the loop, `continue` goes to the next turn.
- Infinite loop? qlang stops by itself after a limited number of steps (error `R900`).
