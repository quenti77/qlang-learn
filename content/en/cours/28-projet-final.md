---
title: "Final project: a task manager"
---

# Final project: a task manager

We put together everything we have seen: `struct`, `enum`, traits, `map`, sorting, `match`,
operator overloading, closures and tests.

The program below manages a list of tasks:

- an `enum` `Priority`, with a `weight` method;
- a `struct` `Task`, which converts to text (`As<string>`) and can be compared (`Ord`);
- a `struct` `TaskList`, with private fields and methods to add, find, complete and filter
  (with a function passed as a parameter);
- a dictionary for statistics, and `assert`s for testing.

Read it, run it, then modify it.

```qlang
enum Priority
  Low
  Normal
  High
end

impl Priority
  public fun weight(self) -> int
    match self
      case Priority.Low then 1
      case Priority.Normal then 2
      case Priority.High then 3
    end
  end
end

struct Task
  public id: int
  public title: string
  public priority: Priority
  public done: bool
end

impl As<string> for Task
  public fun convert(self) -> string
    let mark = if self.done then "[x]" else "[ ]" end
    "{mark} #{self.id} {self.title} ({self.priority})"
  end
end

impl Ord for Task      -- higher priority = "smaller" => first after sorting
  public fun cmp(self, o: Task) -> int
    o.priority.weight() - self.priority.weight()
  end
end

struct TaskList
  private tasks: array<Task>
  private next_id: int
end

impl TaskList
  public fun create() -> TaskList
    TaskList { tasks: [], next_id: 1 }
  end

  public fun add(self, title: string, p: Priority) -> Task
    let t = Task { id: self.next_id, title, priority: p, done: false }
    self.next_id += 1
    self.tasks[] = t
    t
  end

  public fun find(self, id: int) -> Task?
    for t in self.tasks do
      if t.id == id then return t end
    end
    none
  end

  public fun complete(self, id: int) -> bool
    let t = self.find(id)
    if t == none then return false end
    t.done = true
    true
  end

  public fun filter(self, keep: fun(Task) -> bool) -> array<Task>
    let res: array<Task> = []
    for t in self.tasks do
      if keep(t) then res[] = t end
    end
    res
  end

  public fun all(self) -> array<Task>
    self.tasks.slice(0, self.tasks.len())
  end
end

fun show(title: string, ts: array<Task>)
  print("--- {title} ({ts.len()}) ---")
  for t in ts do print(t) end
end

let list = TaskList.create()
list.add("Learn qlang", Priority.High)
list.add("Do the shopping", Priority.Low)
list.add("Write a project", Priority.Normal)
list.add("Tidy the desk", Priority.Low)

list.complete(1)
print(list.complete(99))           -- false

show("All", list.all())

let sorted = list.all()
sorted.sort()                      -- thanks to Ord
show("By priority", sorted)

show("To do", list.filter(fun(t: Task) -> bool not t.done end))
show("High", list.filter(fun(t: Task) -> bool t.priority == Priority.High end))

-- Statistics with a dictionary
let by_priority: map<Priority, int> = {}
for t in list.all() do
  by_priority[t.priority] = by_priority.get(t.priority, 0) + 1
end
print(by_priority)

-- Tests
assert(list.all().len() == 4, "4 tasks")
assert(list.filter(fun(t: Task) -> bool t.done end).len() == 1, "1 done")
let t1 = list.find(1)
assert(t1 != none and t1.done, "task 1 completed")
print("project OK")
```

## Going further

Your turn:

- Add a `remove(id)` method.
- Add a due date and sort on it.
- Read commands with `read()` in a loop: `add title`, `done 3`, `list`.
- Save the state as text and reload it with `split()`.
