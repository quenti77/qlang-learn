---
title: "First steps"
---

# First steps

A program is a list of instructions run from top to bottom, like a cooking recipe. The computer
does exactly what you write, no more, no less.

> Don't just read: **change** the code below and click *Run*. Breaking a program on purpose is
> the best way to learn.

## Showing text

`print` shows something on the screen, then goes to the next line. Text is written between
double quotes. A comment starts with two dashes: the computer ignores it, it is there for humans.

```qlang
-- This is a comment
print("Hello world!")
print("My name is qlang.")
```

## Numbers and calculations

```qlang
print(42)
print(3.14)
print(1 + 2)
print(6 * 7)
```

`print()` with nothing inside shows an empty line, and `write` shows text **without** going to
the next line:

```qlang
write("One ")
write("two ")
write("three")
print()
print("Line 1\nLine 2")
```

## When it does not work

qlang errors tell you the line and column of the problem. Run this one, where the closing quote
is missing:

<!-- expect-error -->
```qlang
print("Hello)
```

## Going further: asking a question

`read()` reads a line typed by the user. Here, write your first name in the "Input" field under
the code, then run.

```qlang
write("What is your name? ")
let name = read()
print("Hello " + name + "!")
```

## Remember

- A program = instructions read from top to bottom.
- `print(...)` shows, `write(...)` shows without a new line.
- Text goes between quotes, numbers don't.
- `--` starts a comment.

## Try it

1. Show your first name.
2. Show the result of `123 * 456`.
3. Forget a closing quote on purpose and read the error message.
