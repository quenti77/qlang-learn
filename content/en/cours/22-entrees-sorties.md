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

## Two outputs: `print` and `eprint`

A program has two outputs. `print` and `write` go to the **output**: what the program
*produces*, which can be redirected or piped to another program. `eprint` and `ewrite` go to the
**error output**: everything that speaks *about* the program (warnings, progress, logs).

Despite its name, the error output is not reserved for errors. An informational message belongs
there precisely because it must not be mixed with the results. In a terminal:

```sh
qlang run report.q > report.txt     # the eprint lines stay on screen
qlang run report.q 2> report.log    # the eprint lines go to a file
```

The log `Log.info(...)`, `Log.error(...)` (covered in the web documentation) also writes to the
error output, for the same reason. On this site, the page only shows the output.

## Remember

- `read()` always returns a `string`: convert it with `int.parse` or `to_int()`.
- Think about the case where the input is not a number: the result is an `int?`.
- `print` writes the results, `eprint` writes the rest (logs, warnings): the error output is not only for errors.
