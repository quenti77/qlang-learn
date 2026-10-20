## Installation

No need for Rust: you download a program that is already compiled (Linux and macOS).

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh
```

The `qlang` program is installed in `~/.local/bin`, and the script tells you if it has to be
added to the `PATH`. Each download is checked against the checksum (`SHA256SUMS`) published
with the version.

**Windows**: there is no precompiled program for now. You have to build it: install Rust
([rustup.rs](https://rustup.rs), version 1.88 or newer), then

```powershell
cargo install --git https://github.com/quenti77/qlang qlang-cli
```

(`--force` to update). The VS Code extension (`qlang.vsix`, on the
[Releases](https://github.com/quenti77/qlang/releases) page) is installed with
`code --install-extension qlang.vsix`.

**Updating**: run the same command again. It says `Updated: qlang 0.1.0 -> qlang 0.2.0`, or
`Already up to date`.

**Options**:

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh -s -- --version 0.1.0
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh -s -- --vscode
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh -s -- --vscode --profile Rust
```

`--vscode` also installs the VS Code extension (the `code` command is needed); `--dir`
chooses the installation folder.

**Uninstalling**: delete the `qlang` file (and the extension in VS Code).

**Without the script**: the programs, `SHA256SUMS` and the extension (`qlang.vsix`) are also
on the [Releases](https://github.com/quenti77/qlang/releases) page of the repository.

**From the sources** (Rust 1.88 or newer, `rustup update`):

```sh
cargo install --git https://github.com/quenti77/qlang qlang-cli          # install or update with --force
```

## Usage

```sh
cargo build --release            # produces target/release/qlang (from the sources)

qlang run examples/tour.q        # runs a program
qlang check examples/tour.q      # checks without running
qlang run prog.q --max-steps 1000000
```

Errors are shown with their position and an excerpt of the code:

```
error[T002]: expected `string`, found `int`
  --> main.q:2:17
  |
2 | let b: string = a
  |                 ^
```

Exit code: `0` success, `1` compile error, `2` run-time error. An `import` can go up in the
folders (`import f from "../lib/f.q"`, like `require` in Node) but only reads `.q` files, and
never an absolute path. `--root folder` limits imports to that folder:

```sh
qlang run app/main.q --root .      # imports stay in the current folder
```

### Packages

A project lists its dependencies in its `qlang.toml` and imports them with `@name`:

```toml
[dependencies]
text = { git = "https://github.com/x/text", tag = "v1.2.0" }
utils = { path = "../utils" }
```

```sh
qlang add mail --git https://github.com/x/mail --tag v1.0.0   # adds and installs
qlang install        # fetches the git packages into .qlang/packages (commits of qlang.lock)
qlang update         # moves tags/branches forward, rewrites qlang.lock
qlang remove mail
```

```
import "@text" as t                  -- the main file of the package
import send from "@mail/send.q"      -- one of its files
```

Put `.qlang/` in the `.gitignore` and commit `qlang.lock`. See "Packages" in
[docs/language.md](docs/language.md) for the details.

### Providing `extern fun`s

An `extern fun` is implemented by a **provider**: any program that speaks JSON, one line per
message, on its standard input and output. It is started once for the whole run. You declare it
in a `qlang.toml` placed next to the program (or in a parent folder), or with `--extern`:

```toml
[externs]
mail = "python3 mail.py"     # started from the folder of the qlang.toml, without a shell
```

```sh
qlang run app.q --extern "python3 mail.py"
```

The provider answers two messages:

```
→ {"op":"list"}                                    ← {"externs":["mail_send"]}
→ {"op":"call","name":"mail_send","args":[…]}      ← {"ok":<value>}  or  {"error":"message"}
```

Values are JSON: a struct or a map is an object (`int` or `bool` keys are written as text), an
enumeration the name of its variant, a `Json` its value. A name already provided by `qlang`
(`sql_*`) or by another provider is refused. Starting the commands of a `qlang.toml` amounts to
running that file, so `qlang` asks first (like `direnv`): in a terminal it shows the commands
and asks `[y/N]`, then remembers the answer for that file, that name and that command
(`trusted-externs` in `~/.config/qlang`, or `$QLANG_CONFIG_DIR`); a modified command asks
again. Without a terminal (server, CI), nothing starts unless you add `--trust-externs`. The
commands given with `--extern` are yours and ask nothing. The `--json` modes (editors,
protocol) do not read a `qlang.toml` and start no provider: a check alone (`check --json`, or
`"mode": "check"`) therefore assumes all `extern fun`s are provided, as it assumes a keyboard
and a clock, whereas `run --json` refuses them (`T263`); `qlang serve app.q` starts one per
worker.

## Architecture

The language is separate from any interface: the core never reads, writes or touches the disk
itself.

```
crates/
├── qlang-core/   the language: lexer, parser, type checker, interpreter
│                 (no I/O, a single dependency: serde for the diagnostics)
└── qlang-cli/    the `qlang` program: terminal, JSON protocol, HTTP server
```

Everything that leaves the core goes through a `Host` that the caller provides:

```rust
pub trait Host {
    fn print(&mut self, text: &str);                        // output
    fn read_line(&mut self) -> Result<Option<String>, HostError>;   // input (optional)
    fn load_module(&mut self, path: &str) -> Result<String, String>; // import
    fn now_ms(&mut self) -> Result<i64, HostError>;         // clock (optional)
    fn random_u64(&mut self) -> Result<u64, HostError>;     // randomness (optional)
    fn capabilities(&self) -> Capabilities;                 // what the host can do
}
```

- The terminal plugs in `stdout`, `stdin` and the disk; a web server plugs in a buffer,
  pre-supplied inputs and in-memory files; the tests use `MemoryHost`.
- `read()`, `time.now()` and randomness (`random`, `uuid.v4()`, `ulid.new()`…) are
  **optional**: if the host does not offer them (`capabilities().read`, `.time`, `.random`
  are false), a program that calls them is refused **before** it runs. This keeps the core
  deterministic: `MemoryHost` provides a fixed clock and seed for the tests.
- Errors are **data** (`Diagnostic`: code, message, position, notes), never text that is
  already displayed. They serialise to JSON.
- Execution is bounded by `Limits` (steps, call depth, output size, size of arrays and
  strings).

Using the core from Rust:

```rust
use qlang_core::{check::compile, host::{Limits, MemoryHost}};

let mut host = MemoryHost::new();
let program = compile("main.q", "print(1 + 2)", &mut host).map_err(|e| e.render())?;
let result = program.run(&mut host, Limits::default());
assert_eq!(host.output, "3\n");
assert!(result.error.is_none());
```

`compile` analyses without running (useful to underline errors in an editor); `run` can be
called several times on the same program.

The interpreter is recursive: run it in a thread with a large stack (the CLI uses 1 GB of
virtual stack; 256 MB are enough for the default limits in release mode).

## JSON protocol

For PHP, Python or any other language: a JSON request in, a JSON response out. The files are
provided **in the request**: nothing is read from the disk.

```sh
qlang run --json < request.json          # one request, one response
qlang serve --port 8080                  # the same protocol over HTTP: POST /run
```

Request:

```json
{
  "entry": "main.q",
  "files": {
    "main.q": "import add from \"math.q\"\nprint(add(1, 2))\nlet n = read()\nprint(n)",
    "math.q": "fun add(a: int, b: int) -> int\n  a + b\nend\nexport add"
  },
  "input": ["hello"],
  "now": 1791725184727,
  "seed": 42,
  "limits": { "max_steps": 1000000, "max_depth": 200, "max_output": 100000, "max_alloc": 100000 }
}
```

- `entry`: the main file (optional if there is a single file, otherwise `main.q`).
- `input`: lines for `read()`. **If it is absent, `read` is not available** and a program
  that calls it is refused at compile time.
- `now`: the time in milliseconds since 1970, for `time.now()` and for `uuid.v7()` /
  `ulid.new()`. **If absent, there is no clock.**
- `seed`: the seed of the random generator (`random`, `uuid.v4()`, `ulid.…`): the same seed
  gives the same numbers. **If absent, there is no randomness**: a server decides itself what
  to provide (a seed drawn at random for each request, for example).
- `limits`: optional; the server applies its own ceilings anyway.

Response:

```json
{
  "ok": true,
  "phase": "run",
  "output": "3\nhello\n",
  "diagnostics": [],
  "steps": 15
}
```

- `phase`: `"request"` (invalid request), `"compile"` (errors before running) or `"run"` (the
  program was run; `ok` says whether it succeeded).
- `diagnostics`: list of errors (and warnings):

```json
{
  "severity": "error",
  "code": "T002",
  "message": "expected `int`, found `string`",
  "location": { "file": "main.q", "line": 1, "col": 14, "end_line": 1, "end_col": 17 },
  "notes": []
}
```

### From Python

```python
import json, subprocess

def run_qlang(files, input=None):
    request = {"files": files}
    if input is not None:
        request["input"] = input
    done = subprocess.run(["qlang", "run", "--json"], input=json.dumps(request),
                          capture_output=True, text=True, timeout=30)
    return json.loads(done.stdout)

result = run_qlang({"main.q": 'print("hello")'})
print(result["output"], result["ok"])
```

### From PHP

```php
$request = json_encode(["files" => ["main.q" => 'print("hello")']]);
$proc = proc_open(["qlang", "run", "--json"], [0 => ["pipe", "r"], 1 => ["pipe", "w"]], $pipes);
fwrite($pipes[0], $request);
fclose($pipes[0]);
$result = json_decode(stream_get_contents($pipes[1]), true);
echo $result["output"];
```

Or, with the HTTP server: `POST http://127.0.0.1:8080/run` with the same request.

### Security

The JSON protocol does not access the disk (a `../x.q` there is only a file name of the
request) and bounds the computing time (steps, including the work of built-in methods),
recursion, output, the size of arrays and strings, and the number of errors returned (100 at
most). An internal bug of the compiler or of the interpreter is returned as an `X999` error
instead of stopping the process; in the HTTP server, the worker concerned answers 500 and its
connection slot is released. It does not limit the total memory of a process nor the real
time: for code from strangers, run `qlang` in a container or with the limits of the system
(`ulimit`, cgroups) and a timeout. The HTTP server (`qlang serve`) is minimal: no TLS, no
persistent connections, at most 16 simultaneous connections. Put it behind a reverse proxy
and do not expose it directly to the Internet.

## Browser: WebAssembly

`crates/qlang-wasm` compiles `qlang-core` to WebAssembly (`qlang.wasm`, about 700 kB,
published with every release along with its JavaScript wrapper `qlang.mjs`). Same JSON
protocol as `run --json`, without a server: enough to run qlang in a web page, in a Web
Worker. See [`crates/qlang-wasm`](crates/qlang-wasm/README.md).

## Development

```sh
cargo test                       # unit tests, end-to-end tests, fuzzing
cargo test --release             # same, faster
```

- `crates/qlang-core/tests/run.rs`: complete programs and their expected output.
- `crates/qlang-core/tests/check_errors.rs`: errors that the compiler must report.
- `crates/qlang-core/tests/fuzz.rs`: randomly mutated programs; neither the compiler nor the
  interpreter must ever panic.

Organisation of the core (`crates/qlang-core/src`):

| File                 | Role                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `lexer.rs`           | text to tokens                                                        |
| `parser.rs`          | tokens to syntax tree (`ast.rs`), with error recovery                 |
| `check/`             | modules, declarations, type checking (`types.rs`)                     |
| `interp.rs`          | execution (`value.rs` for the values)                                 |
| `diag.rs`, `span.rs` | errors and positions                                                  |
| `host.rs`            | the interface with the outside, the limits                            |
