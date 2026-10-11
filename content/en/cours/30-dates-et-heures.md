---
title: "Dates and times"
---

# Dates and times

To work with dates (a deadline, a birthday, a duration), qlang has a `datetime` type. It is an
**instant**: a date and a time, always in **UTC** (no time zones, so the same results
everywhere).

## Creating a date

`datetime.of(year, month, day)` gives a date at midnight. You can add the time:
`datetime.of(year, month, day, hour, minute, second)`.

```qlang
let due = datetime.of(2026, 10, 11)
print(due)

let meeting = datetime.of(2026, 10, 11, 14, 30, 0)
print(meeting)
```

A date is shown in ISO format: `2026-10-11T14:30:00Z`. A date that does not exist is an error:

<!-- expect-error -->
```qlang
print(datetime.of(2026, 2, 29))
```

`datetime.now()` gives the present moment (see the previous chapter for `time.now()`).

## Reading the parts

```qlang
let d = datetime.of(2026, 10, 11, 14, 30, 5)
print(d.year())
print(d.month())
print(d.day())
print(d.hour())
print(d.minute())
print(d.second())
print(d.weekday())
```

`weekday()` returns 1 for Monday, up to 7 for Sunday. 11 October 2026 is a Sunday: `7`.

## Adding and subtracting

The methods `add_days`, `add_months`, `add_years`, `add_hours`, `add_minutes` and
`add_seconds` return a **new** `datetime` (the old one does not change). A negative number
goes back in time.

```qlang
let d = datetime.of(2026, 1, 31, 10, 0, 0)
print(d.add_days(1))
print(d.add_hours(15))
print(d.add_days(-31))
print(d.add_months(1))
```

Note: `31 January + 1 month` gives **28 February** (the last day of the month), because 31
February does not exist.

## Comparing and measuring

Dates can be compared and sorted, and subtracting gives a number of **milliseconds**.

```qlang
let first = datetime.of(2026, 3, 1)
let last = datetime.of(2026, 3, 8)
print(first < last)
print(last - first)
print((last - first) div 86_400_000)
print(first.days_until(last))
```

`a.days_until(b)` directly counts the days between the day of `a` and the day of `b`.

## Writing and reading text

`format` writes a date following a pattern: `YYYY` (year), `MM` (month), `DD` (day), `HH`
(hour), `mm` (minute), `ss` (second). Other characters are kept.

```qlang
let d = datetime.of(2026, 10, 11, 14, 30, 0)
print(d.format("DD/MM/YYYY"))
print(d.format("YYYY-MM-DD at HH:mm"))
```

`datetime.parse(text)` does the reverse. Since the text can be invalid, the result is a
`datetime?`:

```qlang
let ok = datetime.parse("2026-10-11 14:30")
if ok != none then
  print(ok.hour())
end
print(datetime.parse("11/10/2026") == none)
```

## Remember

- `datetime.of(y, m, d)` creates a date; `datetime.now()` gives the present moment.
- `year()`, `month()`, `day()`… read the parts; `add_days(n)`… compute another date.
- `b - a` gives milliseconds; `a.days_until(b)` gives days.
- `format` and `parse` go from a date to text and back.
- Everything is in UTC.
