---
title: "Modules"
---

# Modules

A project grows: you split the code into several files. A file **exports** what it offers
with `export`, another one **imports** it with `import`.

## The file that offers

Here is `lib/maths.q`. At the end, `export` lists what the other files are allowed to use.

```qlang-module
-- file: lib/maths.q
-- Small demonstration module (imported by lesson 20)
const SECRET = 42

fun add(a: int, b: int) -> int
  a + b
end

fun gcd(a: int, b: int) -> int
  if b == 0 then return a end
  gcd(b, a mod b)
end

struct Counter
  public value: int
end

impl Counter
  public fun create() -> Counter
    Counter { value: 0 }
  end
  public fun increment(self)
    self.value += 1
  end
end

-- This print runs ONCE, at the first import
print("[maths.q loaded]")

export add, gcd, Counter, SECRET
```

## Importing

Paths are relative to the importing file, always written with `/`.

```qlang
import add, gcd from "lib/maths.q"
print(add(2, 3))
print(gcd(48, 18))

-- Importing with an alias
import add as plus from "lib/maths.q"
print(plus(10, 20))

-- Importing the whole module under a name
import "lib/maths.q" as m
print(m.add(1, 1))
print(m.SECRET)
let c = m.Counter.create()     -- an exported type is written m.Type
c.increment()
c.increment()
print(c.value)
```

The module is loaded **only once**: the module's `print("[maths.q loaded]")` appears a single
time, at the very top, even before the first line of the file that imports it.

## Remember

- `export a, b, c` at the end of the file that offers.
- `import a, b from "path.q"` or `import "path.q" as name`.
- Paths are relative to the file, separated by `/`, never absolute.
- Two files can import each other only if just one of them runs top-level code; otherwise it is an error.
