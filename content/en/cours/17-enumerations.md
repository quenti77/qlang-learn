---
title: "Enumerations (enum)"
---

# Enumerations (`enum`)

An `enum` is a **closed** list of possible choices. It is better than magic numbers
(0 = Monday?) or than texts that are prone to typos.

```qlang
enum Direction
  North
  East
  South
  West
end

let d = Direction.East
print(d)                          -- Direction.East
print(d == Direction.East)        -- true
print(d == Direction.North)       -- false
```

## `match` checks that no case is forgotten

```qlang
enum Direction
  North
  East
  South
  West
end

fun turn_right(d: Direction) -> Direction
  match d
    case Direction.North then Direction.East
    case Direction.East then Direction.South
    case Direction.South then Direction.West
    case Direction.West then Direction.North
  end
end
let heading = Direction.North
for i in 0..5 do
  write("{heading} ")
  heading = turn_right(heading)
end
print("")
```

## An enum can have methods, and be used as a key

```qlang
enum Direction
  North
  East
  South
  West
end

impl Direction
  public fun dx(self) -> int
    match self
      case Direction.East then 1
      case Direction.West then -1
      else 0
    end
  end
  public fun dy(self) -> int
    match self
      case Direction.North then -1
      case Direction.South then 1
      else 0
    end
  end
end

let x = 5
let y = 5
for d in [Direction.North, Direction.North, Direction.East, Direction.South] do
  x += d.dx()
  y += d.dy()
end
print("final position: {x},{y}")

-- an enum can be a dictionary key
let visits: map<Direction, int> = {}
visits[Direction.North] = 2
visits[Direction.South] = 1
print(visits[Direction.North])
```

## The states of a system

A state machine:

```qlang
enum State
  Waiting
  Running
  Done
end
fun next(s: State) -> State
  match s
    case State.Waiting then State.Running
    case State.Running then State.Done
    case State.Done then State.Done
  end
end
let s = State.Waiting
while s != State.Done do
  print(s)
  s = next(s)
end
print(s)
```

## Remember

- Variants carry no data, but you can add methods to them with `impl`.
- They are compared with `==` and used in `match` and as `map` keys.
