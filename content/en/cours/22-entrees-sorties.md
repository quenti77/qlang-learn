---
title: "Input / output"
---

# Input / output

`read()` reads a line typed on the keyboard and returns a `string`.

On this site, the program has no keyboard: write what the user would "type" in the **Input**
field under the code, **one line per line**. In a terminal, `qlang run file.q` waits for your
input; you can also give the answers through a pipe: `printf 'Ada\n36\n' | qlang run file.q`.

Try it with two lines, `Ada` then `36`:

```qlang
write("What is your name? ")
let name = read()
print("Nice to meet you, {name}!")

write("How old are you? ")
let text = read()
let age = int.parse(text)
if age == none then
  print("'{text}' is not a number.")
else
  print("In 10 years you will be {age + 10}.")
end
```

If `read()` has no more lines to read, the program stops with an error. In an environment with
no keyboard (such as a web server), `read` does not exist: this is detected at compile time.

## Remember

- `read()` always returns a `string`: convert it with `int.parse` or `to_int()`.
- Think about the case where the input is not a number: the result is an `int?`.
