---
title: "Strings"
---

# Strings

A `string` is text. It is **immutable**: you never change it in place, operations create a
new one.

## Length, indexes and slices

```qlang
let s = "Hello, world"

print(s.len())              -- 12 : number of characters
print(s[0])                 -- "H" : the first character has index 0!
print(s[7])                 -- "w"
print(s.substring(0, 5))    -- "Hello" (start included, end excluded)
```

## Concatenating (gluing)

```qlang
print("Hel" + "lo")
let name = "Ada"
print("Hi " + name + "!")
print("Hi {name}!")           -- more convenient
```

## Transformations

They return a new string.

```qlang
-- (defined earlier in this chapter)
let s = "Hello, world"

print(s.upper())
print(s.lower())
print("  spaces  ".trim() + "|")
print("  spaces  ".trim_start() + "|")
print("  spaces  ".trim_end() + "|")
print("python".capitalize())
print("abc".reverse())
print("ha".repeat(3))
print(s.replace("o", "0"))
```

## Questions

They return a `bool`.

```qlang
-- (defined earlier in this chapter)
let s = "Hello, world"

print(s.contains("llo"))
print(s.starts_with("Hel"))
print(s.ends_with("world"))
print("".is_empty())
print("12345".is_digit())
print("abc".is_alpha())
print("   ".is_blank())
```

## Searching

You get the index of the first occurrence, or `none`.

```qlang
-- (defined earlier in this chapter)
let s = "Hello, world"

print(s.index_of("o"))       -- 4
print(s.last_index_of("o"))  -- 8
print(s.index_of("z"))       -- none
print(s.count("o"))          -- 2
```

## Splitting and joining

```qlang
let words = "apple,pear,plum".split(",")
print(words)
print(words.len())
print(words.join(" + "))
print("one two  three".words())
print("l1\nl2\nl3".lines())
print("abc".chars())
```

## Aligning text

Handy for making tables.

```qlang
print("7".pad_left(3, "0"))     -- 007
print("ab".pad_right(5, ".") + "|")
```

## Going through the characters

```qlang
for c in "abc" do
  write("[{c}] ")
end
print("")
```

## Unicode codes

Every character has a number.

```qlang
print("A".code())      -- 65
print(66.char())       -- "B"
print("é".code())      -- 233
-- Tip: shifting a letter (Caesar cipher)
print(("a".code() + 3).char())   -- "d"
```

## Comparing

```qlang
print("abc" == "abc")
print("abc" < "abd")
print("Z" < "a")       -- capital letters come before lowercase ones
```

## Converting to a number

```qlang
print("42".to_int())
print("4.5".to_float())
print("x".to_int())    -- none
```

## On several lines

A string can span several lines.

```qlang
let poem = "Roses are red
Violets are blue"
print(poem)
```

## Remember

- Indexes start at 0.
- A string never changes: you get a new string.
- `split`, `join`, `replace`, `contains`, `index_of` cover 90% of the needs.
