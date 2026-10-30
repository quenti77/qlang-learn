---
title: "Writing tests with qlang-test"
group: "Tools"
---

# Writing tests with qlang-test

`qlang test` already runs the `fun test_...()` of the `*_test.q` files, with the language's `assert_*`. The
[`qlang-test`](https://github.com/quenti77/qlang-test) package adds what makes tests pleasant to write and to read:
groups, sentences, chained checks, datasets, spies, snapshots, and reports for a CI. It is written in qlang and
installs on its own (it needs `qlang` 0.68 or newer, for `Panic.guard`):

```sh
qlang add test
```

## A first file

```qlang-ref
import total from "cart.q"
import describe, it, expect, finish from "@test"

describe("Cart", fun()
  it("adds up the prices", fun()
    expect(total([5, 7])).to_be(12)
  end)

  describe("with a discount", fun()
    it("never goes below zero", fun()
      expect(total([5]) - 20).to_be_less_than(1)
    end)
  end)
end)

fun test_suite()
  finish()
end
```

`qlang test` runs `test_suite`, which runs the cases and **fails** if one of them failed. The report shows the groups
as a tree, the duration of each case, what was expected and what came, and **the line of your test** (not a line of
the library):

```
Cart
  ok    adds up the prices (1 ms)
  with a discount
    FAIL  never goes below zero (0 ms)
          expected -15 to be greater than -1
          at cart_test.q:11

Cases: 1 passed, 1 failed (2 ms)
```

A failing case does not stop the others: each one runs inside a `Panic.guard`, so a failed check, a `panic`, an
`unwrap` of an error or an index out of range is reported against **that** case. Without `qlang test`, end the file
with `main()` and run it with `qlang run` (exit code 1 on a failure).

## Cases and groups

| | |
| --- | --- |
| `test(name, f)`, `it(name, f)` | a case |
| `describe(name, f)` | a group (they nest) |
| `skip(name, f)`, `only(name, f)`, `todo(name)` | do not run / run only these / to write later |
| `group("slow", f)` | tags the cases of `f`; `QLANG_TEST_GROUP=slow` runs only those, `QLANG_TEST_SKIP_GROUP=slow` leaves them out |
| `before_all`, `after_all`, `before_each`, `after_each` | set up and tidy, in a `describe` or at the top of the file |
| `it_with("accepts %s", ["a@b.fr", "x@y.com"], fun(m: string) ... end)` | a dataset: one case per element, named after it |

If a `before_each` fails, the case fails and the next ones still run; the `after_each` hooks always run.

## Checks

`expect(value)` then a verb, which you can chain:

```qlang-ref
expect(n).to_be_greater_than(1).to_be_less_than(10)
expect(n).never().to_be(3)                     -- never() turns the next ones around
expect(items).to_contain(2).to_have_length(3)
expect("hello world").to_start_with("hel").to_match("w.rld")
expect(result).to_be_ok()
expect(fun() panic("boom") end).to_throw_with("boom")
```

`to_be`, `to_equal`, `to_be_greater_than`, `to_be_less_than`, `to_be_at_least`, `to_be_at_most`, `to_be_true`,
`to_be_false`, `to_be_close_to`, `to_be_within`, `to_contain`, `to_have_length`, `to_be_empty`, `to_contain_text`,
`to_start_with`, `to_end_with`, `to_match` (regular expression), `to_be_none`, `to_be_some`, `to_be_ok`, `to_be_err`,
`to_throw`, `to_throw_with`, `to_match_snapshot`, `to_have_been_called`... Each verb only exists for the types where
it makes sense: `to_contain` for an array, `to_be_ok` for a `Result`, and so on.

## Spies and snapshots

```qlang-ref
let s = spy()
let add = fake2(s, fun(a: int, b: int) -> int a + b end)
add(4, 5)
expect(s).to_have_been_called_times(1).to_have_been_called_with("4, 5")
```

`fake0`, `fake1` and `fake2` wrap a function: it does the same thing and records its calls.

`expect(value).to_match_snapshot()` writes the value in `__snapshots__/snapshots.snap` the first time, then
compares. `QLANG_UPDATE_SNAPSHOTS=1` replaces the snapshots; with the variable `CI` set, a missing snapshot fails the
test (so that a forgotten one is noticed).

## Reports for a CI

`QLANG_TEST_JUNIT=report.xml` writes a JUnit XML file, `QLANG_TEST_TAP=report.tap` a TAP report.

## What is not there

- **Code coverage**: it needs the interpreter to count lines.
- **Automatic doubles for traits**: only functions can be replaced (`fake0/1/2`).
- The `fun test_...` functions keep working, side by side.
