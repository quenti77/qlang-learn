---
title: "Structures (struct)"
---

# Structures (`struct`)

A `struct` groups several related values under one name: it is **your own type**. An `impl`
block adds behaviors to it, the methods.

## Declaring and creating

You create a value by naming the fields.

```qlang
struct Point
  public x: int
  public y: int
end

let p = Point { x: 3, y: 4 }
print(p.x)
print(p.y)
p.x = 10
print(p)                  -- Point { x: 10, y: 4 }
```

## Shortcuts

If a variable has the name of the field, you can write it just once. `..other` takes the
fields of an existing value, with the changes you specify.

```qlang
struct Point
  public x: int
  public y: int
end

let x = 1
let y = 2
let q = Point { x, y }         -- shortcut: the variable has the name of the field
print(q)

let r = Point { ..q, y: 99 }   -- copy with a change
print(r)
```

## Structs are references

They are **shared**, not copied.

```qlang
struct Point
  public x: int
  public y: int
end

let p = Point { x: 3, y: 4 }
let s = p
s.x = 0
print(p.x)                -- 0 !
```

## Methods: the `impl` block

```qlang
struct Point
  public x: int
  public y: int
end

impl Point
  -- static method (no self): called on the type
  public fun new(x: int, y: int) -> Point
    Point { x, y }
  end

  public fun origin() -> Point
    Point.new(0, 0)
  end

  -- instance method (first parameter `self`)
  public fun squared_distance(self, other: Point) -> int
    let dx = self.x - other.x
    let dy = self.y - other.y
    dx * dx + dy * dy
  end

  public fun move_by(self, dx: int, dy: int)
    self.x += dx
    self.y += dy
  end

  public fun clone(self) -> Point
    Point { x: self.x, y: self.y }
  end
end

let a = Point.new(0, 0)
let b = Point.new(3, 4)
print(a.squared_distance(b))     -- 25
b.move_by(1, 1)
print(b)
let c = b.clone()
c.x = 1000
print(b.x)                       -- unchanged: c is a real copy
```

## Private fields, default values, static fields

```qlang
struct Account
  public owner: string
  private balance: int = 0                -- default: it can be left out
  private static count: int = 0           -- belongs to the type, not to the instance
end

impl Account
  public fun open(owner: string) -> Account
    Account.count += 1
    Account { owner }
  end

  public fun deposit(self, amount: int)
    assert(amount > 0, "the amount must be positive")
    self.balance += amount
  end

  public fun withdraw(self, amount: int) -> bool
    if amount > self.balance then return false end
    self.balance -= amount
    true
  end

  public fun balance(self) -> int
    self.balance
  end

  public fun total() -> int
    Account.count
  end
end

let account = Account.open("Ada")
account.deposit(100)
print(account.withdraw(30))     -- true
print(account.withdraw(500))    -- false
print(account.balance())        -- 70
Account.open("Linus")
print(Account.total())          -- 2
-- print(account.balance)       -- ERROR: private field (encapsulation)
```

## A struct can contain others

```qlang
struct Point
  public x: int
  public y: int
end

struct Rectangle
  public corner: Point
  public width: int
  public height: int
end

let rect = Rectangle { corner: Point { x: 1, y: 1 }, width: 4, height: 3 }
print(rect.corner.x + rect.width)    -- 5
```

## Remember

- `struct` = the data; `impl` = the behaviors.
- `self` as the first parameter = instance method; otherwise, the method is static.
- `private` (the default), `protected` and `public` control who can reach what: hiding the
  details is called **encapsulation**.
- There is no magic constructor: you write `new` yourself.
