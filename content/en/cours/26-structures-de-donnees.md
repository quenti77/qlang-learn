---
title: "Data structures"
---

# Data structures

Choosing how to store data changes everything. Here we build the classic structures with what
the language offers: `struct`, generics, traits.

## The stack

Last in, first out (LIFO): like a pile of plates.

```qlang
struct Stack<T>
  private items: array<T>
end
impl<T> Stack<T>
  public fun create() -> Stack<T>
    Stack { items: [] }
  end
  public fun push(self, v: T)
    self.items[] = v
  end
  public fun pop(self) -> T?
    self.items.pop()
  end
  public fun top(self) -> T?
    if self.items.is_empty() then return none end
    self.items[self.items.len() - 1]
  end
  public fun size(self) -> int
    self.items.len()
  end
end
let s = Stack<int>.create()
s.push(1)
s.push(2)
s.push(3)
print(s.pop())     -- 3
print(s.top())     -- 2
print(s.size())    -- 2
```

## The queue

First in, first out (FIFO): like a waiting line.

```qlang
struct Queue<T>
  private items: array<T>
end
impl<T> Queue<T>
  public fun create() -> Queue<T>
    Queue { items: [] }
  end
  public fun enqueue(self, v: T)
    self.items[] = v
  end
  public fun dequeue(self) -> T?
    if self.items.is_empty() then return none end
    self.items.remove(0)
  end
  public fun is_empty(self) -> bool
    self.items.is_empty()
  end
end
let q = Queue<string>.create()
q.enqueue("Ada")
q.enqueue("Linus")
print(q.dequeue())     -- Ada
print(q.dequeue())     -- Linus
print(q.dequeue())     -- none
```

## The linked list

Each node points to the next one. The link is **nullable**: the last node has no next one.

```qlang
struct Node
  public value: int
  public next: Node?
end

fun add_front(head: Node?, v: int) -> Node
  Node { value: v, next: head }
end
fun show_list(head: Node?)
  let cur = head
  while cur != none do
    write("{cur.value} -> ")
    cur = cur.next
  end
  print("end")
end
fun length(head: Node?) -> int
  let n = 0
  let cur = head
  while cur != none do
    n += 1
    cur = cur.next
  end
  n
end
fun reverse_list(head: Node?) -> Node?
  let prev: Node? = none
  let cur = head
  while cur != none do
    let following = cur.next
    cur.next = prev
    prev = cur
    cur = following
  end
  prev
end
let list = add_front(add_front(add_front(none, 3), 2), 1)
show_list(list)
print(length(list))
show_list(reverse_list(list))
```

## The binary search tree

Smaller on the left, bigger on the right. Searching and inserting are O(log n) if the tree is
balanced.

```qlang
struct Tree
  public value: int
  public left: Tree?
  public right: Tree?
end

fun insert(t: Tree?, v: int) -> Tree
  if t == none then
    return Tree { value: v, left: none, right: none }
  end
  if v < t.value then
    t.left = insert(t.left, v)
  elseif v > t.value then
    t.right = insert(t.right, v)
  end
  t
end
fun contains(t: Tree?, v: int) -> bool
  if t == none then return false end
  if v == t.value then return true end
  if v < t.value then contains(t.left, v) else contains(t.right, v) end
end
fun height(t: Tree?) -> int
  if t == none then return 0 end
  1 + height(t.left).max(height(t.right))
end
-- In-order traversal: gives the values sorted!
fun in_order(t: Tree?, out: array<int>)
  if t == none then return end
  in_order(t.left, out)
  out[] = t.value
  in_order(t.right, out)
end

let root: Tree? = none
for v in [50, 30, 70, 20, 40, 60, 80, 30] do
  root = insert(root, v)
end
let sorted: array<int> = []
in_order(root, sorted)
print(sorted)                  -- [20, 30, 40, 50, 60, 70, 80]
print(contains(root, 60))      -- true
print(contains(root, 65))      -- false
print(height(root))            -- 3
```

## The graph

A graph is represented by a dictionary "vertex → neighbors".

- **Breadth-first** traversal (BFS) finds the shortest path without weights.
- **Depth-first** traversal (DFS) explores as deep as possible first.

```qlang
let graph: map<string, array<string>> = {
  "A": ["B", "C"],
  "B": ["A", "D"],
  "C": ["A", "D", "E"],
  "D": ["B", "C", "F"],
  "E": ["C", "F"],
  "F": ["D", "E"]
}

fun breadth(g: map<string, array<string>>, start: string) -> array<string>
  let seen: map<string, bool> = {}
  let order: array<string> = []
  let queue = [start]
  seen[start] = true
  while not queue.is_empty() do
    let s = queue.remove(0)
    order[] = s
    for v in g.get(s, []) do
      if not seen.has(v) then
        seen[v] = true
        queue[] = v
      end
    end
  end
  order
end
print(breadth(graph, "A"))

fun depth(g: map<string, array<string>>, s: string, seen: map<string, bool>, order: array<string>)
  seen[s] = true
  order[] = s
  for v in g.get(s, []) do
    if not seen.has(v) then depth(g, v, seen, order) end
  end
end
let dfs_order: array<string> = []
let dfs_seen: map<string, bool> = {}
depth(graph, "A", dfs_seen, dfs_order)
print(dfs_order)
```

### The shortest path

It is found by remembering the parent of each vertex.

```qlang
-- (defined earlier in this chapter)
let graph: map<string, array<string>> = {
  "A": ["B", "C"],
  "B": ["A", "D"],
  "C": ["A", "D", "E"],
  "D": ["B", "C", "F"],
  "E": ["C", "F"],
  "F": ["D", "E"]
}

fun path(g: map<string, array<string>>, start: string, goal: string) -> array<string>
  let parent: map<string, string> = {}
  let seen: map<string, bool> = { start: true }
  let queue = [start]
  while not queue.is_empty() do
    let s = queue.remove(0)
    if s == goal then break end
    for v in g.get(s, []) do
      if not seen.has(v) then
        seen[v] = true
        parent[v] = s
        queue[] = v
      end
    end
  end
  let res = [goal]
  let cur = goal
  while cur != start do
    let p = parent[cur]
    if p == none then return [] end      -- no path
    res[] = p
    cur = p
  end
  res.reverse()
  res
end
print(path(graph, "A", "F"))
```

## Remember

- Stack (LIFO), queue (FIFO), linked list, tree, graph: the five pillars.
- A nullable type (`Node?`) naturally expresses "there is no next one".
- The choice of the structure determines the complexity of the algorithm.
