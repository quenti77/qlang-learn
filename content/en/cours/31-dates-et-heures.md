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

## Durations

A `Duration` groups years, months, days, hours, minutes, seconds and milliseconds. Add it to a date with `+` or `-`
(years and months first: 31 January + 1 month lands on the last day of February). `a.until(b)` gives the duration
between two dates, and `diff_in_months` and its neighbours count whole units.

```qlang
let debut = datetime.of(2026, 1, 31, 10, 0, 0)
print(debut + Duration.of(months: 1))            -- 31 January + 1 month: end of February
print(debut + Duration.of(days: 2, hours: 3))
print(debut.until(datetime.of(2027, 3, 4)).to_iso())
print(debut.diff_in_months(datetime.of(2026, 2, 28)))
print(debut.is_before(datetime.of(2026, 2, 1)))
```

For the bounds of a period: `start_of_month()`, `end_of_week()`, `start_of_year()`…; for text,
`format("dddd D MMMM YYYY")` writes the names (in English), `format_in(pattern, "fr")` in French.

```qlang
let d = datetime.of(2026, 11, 3, 14, 30, 0)
print(d.format("dddd D MMMM YYYY"))
print(d.start_of_month())
print(d.end_of_month().format("D MMMM YYYY"))
```

## A day, a time, a zone

A birthday is not an instant: it is a day of the calendar, the same everywhere. `Date` is that day (no time, no zone), `Time` a
time of day (no date), and `Zoned` an instant seen from a time zone. `Date.of` and `Time.of` give `none` for what does not exist.

```qlang
let day = Date.of(2026, 1, 31) ?? Date.of(2000, 1, 1) ?? datetime.at(0).date()
print(day.plus_months(1).to_iso())               -- 2026-02-28
print(Date.of(2026, 2, 30))                      -- none
let opening = Time.of(23, 30) ?? Time.of_datetime(datetime.at(0))
print(opening.plus_minutes(45).to_iso())         -- 00:15:00, around midnight
```

To read a text that is not in ISO format, `datetime.parse_with(text, pattern)` uses the same tokens as `format` (and `ZZ` for an
offset such as `+02:00`); `datetime.from_unix(seconds)` starts from a Unix timestamp; `Duration.parse("P1DT2H")` reads an ISO
duration; `d.each(Duration.of(days: 7), until: end)` walks a period in a `for`.

```qlang
let t = datetime.parse_with("11/10/2026 14:30", "DD/MM/YYYY HH:mm") ?? datetime.at(0)
print(t.to_iso())
print(datetime.from_unix(0).to_iso())
for monday in datetime.of(2026, 3, 2).each(Duration.of(days: 7), until: datetime.of(2026, 3, 23)) do
  print(monday.format_in("dddd D MMMM", "fr"))
end
```

`format_in` and `humanize` know seven languages (`en`, `fr`, `es`, `de`, `it`, `pt`, `nl`).

## Remember

- `datetime.of(y, m, d)` creates a date; `datetime.now()` gives the present moment.
- `year()`, `month()`, `day()`… read the parts; `add_days(n)`… compute another date.
- `b - a` gives milliseconds; `a.days_until(b)` gives days.
- `format` and `parse` go from a date to text and back.
- Everything is in UTC.
