---
title: "Performance: measuring and tuning"
group: "Guides"
---

# Performance: measuring and tuning

qlang is an interpreter: it walks the tree of the program, and the functions and loops that only compute with `int`,
`float` and `bool` are compiled on the fly into instructions on typed registers. This page says how to **measure** a
program and the server, what the numbers show and how to **tune** a deployment. The interpreter's details (the
batches of optimisations, the register machine) are in
[`docs/performance.md`](https://github.com/quenti77/qlang/blob/main/docs/performance.md) of the repository.

## Measuring a program

The programs of `benches/` in the repository cover the usual cases (recursive calls, loops, arrays, structures,
strings, dictionaries). To compare two binaries, keeping the best of 5 runs:

```sh
python3 benches/compare.py path/to/qlang-reference ./target/release/qlang
```

To know *where* the time goes, `perf` samples the process:

```sh
CARGO_PROFILE_RELEASE_DEBUG=true cargo build --release -p qlang-cli
perf record -e cpu-clock:u -F 2000 -o perf.data target/release/qlang run benches/fib.q
perf report -i perf.data --no-children --stdio --percent-limit 2
```

Always compare with a binary built the same way: the published archives are built with `musl`, whose allocator is
slower than the one of `glibc`.

## Writing a fast computation

- Loops and functions that only use `int`, `float` and `bool` (calling nothing but functions of the same kind) are
  compiled: a numeric computation goes much faster than processing that mostly handles structures.
- Strings are also handled by the register machine for the common operations (literals, `+`, comparisons,
  interpolation, `print`, usual methods), and it can create arrays inside a loop: a text-processing loop stays fast.
- A database or the network almost always dominates: measure before optimising a computation.

## Measuring the server

The load bench is `benches/http_load.py`. It starts the server on `benches/http/app.q`, opens persistent connections
from several client processes, and counts requests per second, latency (p50, p95, p99, maximum), errors and the
server's memory, read every second.

```sh
cargo build --release -p qlang-cli
python3 benches/http_load.py --workers 4 --connections 32 --duration 10
python3 benches/http_load.py --duration 300 --scenario json,echo --json bench.json   # endurance
```

Four scenarios: `hello` (a text, the cost of the server alone), `json`, `compute` (`fib(18)` on every request: pure
computation) and `echo` (a 512-byte `POST` sent back as is). The last column (`MB/min`) is the memory growth: a leak
would make it climb.

Measured on a 12-core desktop machine, with a Python client on the same machine (**an order of magnitude, not a
promise**):

| Scenario | 1 worker | 4 workers | p99 (4 workers) |
| --- | --- | --- | --- |
| `hello` | 87,000 req/s | 92,000 req/s | 0.8 ms |
| `json` | 35,000 req/s | 82,000 req/s | 1.1 ms |
| `compute` (`fib(18)`) | 3,000 req/s | 8,800 req/s | 4.9 ms |
| `echo` (512 bytes) | 69,000 req/s | 89,000 req/s | 0.9 ms |

Endurance: 90 seconds of `json` then of `echo` with 4 workers (about 7 million requests each) leave the server's
memory at 22 MB from start to end, with no error.

## What these numbers say

- For `hello` and `echo`, the Python **client** is the limiting factor: the server goes at least that fast.
- **A worker runs one request at a time.** `compute` (3 ms of computation) tops out at about `1 / 3 ms` per worker and
  rises with `--workers`. A heavy request delays the ones waiting for the same worker: that is the p99.
- **Outside** the bench: TLS (done by the proxy), the database, WebSockets, requests of several megabytes.

## Tuning a deployment

- **`--workers N`**: about one per core; more if the requests mostly wait for the database or the network.
- **`--db-pool N`**: with PostgreSQL or MySQL, shares at most N connections between the workers instead of opening one
  per worker (SQLite is not concerned).
- **`--no-access-log`**: the line per request has a cost. In production, `--log-format json` and the `logging()`
  middleware give the same information in a structured way.
- **`--compress`**: gzip for text responses of 1 KB or more, at the price of a little computation.
- **The limits**: `--max-body`, `--max-headers`, `--read-timeout`, `--idle-timeout` and `--max-connections`, so that a
  slow or large client does not block the others. `--max-steps` and `--max-memory` protect against a runaway program.
- **`--request-timeout S`** (30 by default) and **`--max-queue N`**: the first stops a request that lasts too long (error
  `R905`), the second answers `503` at once when more than N requests are waiting for a worker, instead of letting the
  queue grow.
- **Work in parallel**: `Worker.spawn(file, input)` runs a file in a separate interpreter, which you wait for with
  `wait(ms)` and can cancel (`cancel()`). `Shared` provides atomic integer counters that every worker sees, without
  going through Redis. See the [language reference](../23-bibliotheque-standard/).
- **Slow work outside the request**: put it in the job queue (`@std/queue.q`) to answer at once.
- **Large files**: `Response.file(path)` lets the server read them piece by piece, without loading them in memory or
  occupying the worker.

See also [Deploying an application](../46-deployer/).
