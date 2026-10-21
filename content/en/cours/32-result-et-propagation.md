---
title: "Result and the ? operator"
---

# `Result` and the `?` operator

A nullable says « there is no value », but not **why**. When the caller must know what went
wrong, return a `Result`.

## `Ok` or `Err`

`Result<T, E>` is an enum with two variants, available without `import`: `Ok(value)` when all
is well, `Err(error)` otherwise. `Error` is a prelude struct with a `message` field.

```qlang
fun divide(a: int, b: int) -> Result<int, Error>
  if b == 0 then
    return Err(Error { message: "division by zero" })
  end
  Ok(a div b)
end

match divide(10, 2)
  case Ok(v) then print("result: {v}")
  case Err(e) then print("error: {e.message}")
end

match divide(1, 0)
  case Ok(v) then print("result: {v}")
  case Err(e) then print("error: {e.message}")
end
```

The compiler checks that `match` handles `Ok` **and** `Err`: you cannot read the value without
having looked at whether the operation succeeded.

## Simple questions

`is_ok()` and `is_err()` tell which side you are on. `unwrap()` gives the value but stops the
program if it is an error: keep it for tests and « impossible » cases.

```qlang
let r: Result<int, Error> = Ok(5)
print(r.is_ok())
print(r.unwrap())

let e: Result<int, Error> = Err(Error { message: "failed" })
print(e.is_err())
print(e.unwrap_err().message)
```

## Propagating with `?`

When several steps can fail, checking each result makes the code heavy. In a function that
itself returns a `Result`, `expr?` gives the value of an `Ok`, and **leaves the function with
the error** if it is an `Err`.

```qlang
fun read_age(text: string) -> Result<int, Error>
  let n = int.parse(text)
  if n == none then
    return Err(Error { message: "not a number: {text}" })
  end
  if n < 0 then
    return Err(Error { message: "negative age" })
  end
  Ok(n)
end

fun total_ages(a: string, b: string) -> Result<int, Error>
  let x = read_age(a)?
  let y = read_age(b)?
  Ok(x + y)
end

match total_ages("30", "12")
  case Ok(v) then print("total: {v}")
  case Err(e) then print(e.message)
end
match total_ages("30", "abc")
  case Ok(v) then print("total: {v}")
  case Err(e) then print(e.message)
end
```

The error type must be the same on both sides (here `Error`): there is no automatic
conversion. `?` only makes sense inside a function (otherwise, a compile error).

<!-- expect-error -->
```qlang
let x = Result<int, Error>.Ok(1)?
print(x)
```

## `?` on a nullable

`?` also works on a nullable: it gives the value, or leaves the function with `none`. The
function must then return a nullable.

```qlang
fun first_word(s: string) -> string?
  let words = s.split(" ")
  if words.len() == 0 then return none end
  words[0]
end

fun capital_of_first(s: string) -> string?
  let w = first_word(s)?
  w.upper()
end

print(capital_of_first("hello big world"))
print(capital_of_first(""))
```

## Choosing: nullable, `Result` or `panic`

- **Nullable**: « no value » is enough (a search, reading a number).
- **`Result`**: the caller needs to know why, or you chain steps with `?`.
- **`panic`**: the state is impossible, it is a bug in the program.

## Remember

- `Result<T, E>`: `Ok(value)` or `Err(error)`; `match` must handle both.
- `expr?`: the value, or leave the function with the error (or `none` for a nullable).
- `is_ok`, `is_err`, `unwrap`, `unwrap_err` for simple cases.
