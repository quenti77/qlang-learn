---
title: "Recipes: everyday qlang"
group: "Guides"
---

# Recipes: everyday qlang

Small complete programs to copy and adapt. The ones on this page that have a run button work in your browser;
the recipes that need the disk, the network or `qlang-std` are to be copied into a file and run with `qlang`.

## Total a column of a CSV

```qlang
let csv = "name,price,quantity\napple,1.5,4\npear,2.0,3\nfig,4.25,2"
let lines = csv.split("\n")
let total = 0.0
for i in 1..lines.len() do
  let fields = lines[i].split(",")
  total += (float.parse(fields[1]) ?? 0.0) * (int.parse(fields[2]) ?? 0) as float
end
print("total: {total}")
```

For a real file with quotes and commas inside the fields, use `@std/csv.q`: `csv.parse(text)` reads the full
format. For the disk: `fs.read("sales.csv")` gives a `Result<string, Error>`.

## Count the words

```qlang
let text = "the cat and the dog and the fish"
let counts: map<string, int> = {}
for word in text.split(" ") do
  counts[word] = (counts[word] ?? 0) + 1
end
let words = counts.keys()
words.sort()
for word in words do
  print("{word}: {counts[word] ?? 0}")
end
```

`counts[word]` gives an `int?` (`none` when the key is missing): `?? 0` is the default.

## Group by first letter

```qlang
let names = ["Ada", "Alan", "Grace", "Linus", "Barbara", "Gerald"]
let groups: map<string, array<string>> = {}
for n in names do
  let letter = n.substring(0, 1)
  let list = groups[letter] ?? []
  list.push(n)
  groups[letter] = list
end
let letters = groups.keys()
letters.sort()
for l in letters do
  print("{l}: {groups[l] ?? []}")
end
```

Arrays are references: `list.push(n)` changes the array that is already in the map.

## Compute with dates

```qlang
let start = datetime.of(2026, 10, 11, 14, 30, 0)
print(start.add_days(30).format("DD/MM/YYYY"))
print(start.days_until(datetime.of(2026, 12, 25)))
```

A `datetime` is an instant in UTC. For the time in a given place, `Zone.of("Europe/Paris")` (see
[Time zones](../24-time-identifiers-and-regular-expressions/)).

## Extract with a regular expression

```qlang
print(regex.find_all("contact: ada@example.fr, alan@example.org", "[a-z]+@[a-z.]+"))
```

## An API in a few lines

Copy into `main.q` and run with `qlang serve main.q` (after `qlang add std`):

```qlang-ref
import "@std/web/app.q" as web

let app = web.App.new([])
app.get("/hello/:name", fun(req: Request) -> Response
  Response.text("Hello {req.params["name"] ?? "?"}")
end)
app.post("/echo", fun(req: Request) -> Response
  Response.json(req.body ?? "{}")
end)

fun handle(req: Request) -> Response
  app.handle(req)
end
```

Each worker has its own memory: for data that must last, use a database (`Db.connect`). The
[web guide](../36-web-demarrer/) builds a real API step by step, with validation, accounts and tests.

## A scheduled task

```qlang-ref
import "@std/schedule.q" as sch
import "@std/web/cache.q" as cc

let plan = sch.Schedule.new(cc.Cache.memory())
plan.cron("nightly report", "0 3 * * *", fun() -> string?
  Log.info("the report goes out")
  none
end)
plan.every_minutes("heartbeat", 5, fun() -> string?
  Log.info("still here")
  none
end)
plan.work()
```

A task gives `none` when all went well, or a text that says why not. `qlang run schedule.q` starts it; with several
machines, give it a shared Redis cache (`cc.Cache.redis(...)`) so a task runs once per minute overall (see
[Deploying](../46-deployer/)).

## Send an email

```qlang-ref
import "@std/mail.q" as mail

let mailer: mail.Mailer = mail.ResendMailer.new(env.get("RESEND_KEY") ?? "")
let sent = mailer.send(mail.Mail {
  sender: "Blog <blog@example.org>",
  to: ["ada@example.org"],
  subject: "Welcome",
  text: "Hello Ada",
})
```

`mail.q` goes through the HTTP API of a service (Resend, Postmark, SendGrid, Mailgun), not SMTP. In tests,
`MemoryMailer` keeps what was sent. From a route, put the sending in the job queue so a slow service never slows
an answer. The details are on the page of [`mail.q`](../54-std-mail/).
