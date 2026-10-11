---
title: "Inheritance"
---

# Inheritance

A `struct` can extend another one with `extends`: it gets its fields and methods, and can
redefine some with `override`. Only one parent is possible.

```qlang
struct Animal
  public name: string
  protected energy: int = 10      -- visible in Animal and its children
end

impl Animal
  public fun speak(self) -> string
    "{self.name} makes a noise"
  end

  public fun eat(self)
    self.energy += 5
  end

  public fun current_energy(self) -> int
    self.energy
  end
end

struct Dog extends Animal
  public breed: string
end

impl Dog
  public fun create(name: string, breed: string) -> Dog
    Dog { ..Animal { name }, breed }     -- we take the fields of an Animal
  end

  -- override: same signature as the parent's method
  public override fun speak(self) -> string
    "{self.name} barks (and {super.speak()})"
  end

  public fun run(self)
    self.energy -= 3                 -- protected: reachable here
  end
end

struct Cat extends Animal
end
impl Cat
  public override fun speak(self) -> string
    "{self.name} meows"
  end
end

let rex = Dog.create("Rex", "shepherd")
rex.eat()
rex.run()
print(rex.speak())
print(rex.current_energy())    -- 10 + 5 - 3 = 12
```

## Polymorphism

A `Dog` **is** an `Animal`: you can use it wherever an `Animal` is expected, and the right
version of `speak()` is called. Here is a shorter version of the structs:

```qlang
struct Animal
  public name: string
end
impl Animal
  public fun speak(self) -> string
    "{self.name} makes a noise"
  end
end

struct Dog extends Animal
end
impl Dog
  public override fun speak(self) -> string
    "{self.name} barks"
  end
end

struct Cat extends Animal
end
impl Cat
  public override fun speak(self) -> string
    "{self.name} meows"
  end
end

let animals: array<Animal> = [
  Animal { name: "Critter" },
  Dog { name: "Rex" },
  Cat { name: "Felix" }
]
for a in animals do
  print(a.speak())
end

fun make_speak(a: Animal)
  print(">> {a.speak()}")
end
make_speak(Cat { name: "Tom" })
```

## Remember

- `struct B extends A`: `B` inherits from `A`.
- `override` is **mandatory** to redefine; `super.method()` calls the parent.
- `protected`: visible in the struct and its children.
- Polymorphism: same call, behavior depending on the real type.
- Advice: prefer traits (lesson 15) to inheritance when you hesitate.
