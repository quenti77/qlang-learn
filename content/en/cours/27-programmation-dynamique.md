---
title: "Dynamic programming and greedy algorithms"
---

# Dynamic programming and greedy algorithms

The idea: a big problem is made of small problems that repeat. We store each answer (in an
array or a dictionary) to compute it only once.

## The stairs

In how many ways can we climb `n` steps, by steps of 1 or 2?

```qlang
fun stairs(n: int) -> int
  let t: array<int> = [1, 1]
  for i in 2..=n do
    t[] = t[i - 1] + t[i - 2]
  end
  t[n]
end
print(stairs(10))   -- 89
```

## Making change

The fewest coins to reach an amount.

```qlang
fun change(coins: array<int>, amount: int) -> int?
  let t: array<int?> = [0]
  for s in 1..=amount do
    let best: int? = none
    for c in coins do
      if c <= s then
        let prev = t[s - c]
        if prev != none then
          if best == none or prev + 1 < best then best = prev + 1 end
        end
      end
    end
    t[] = best
  end
  t[amount]
end
print(change([1, 5, 10, 25], 63))   -- 6
print(change([4, 6], 7))            -- none: impossible
```

## Greedy algorithms

At each step, we take the best local choice. It is fast, but not always optimal: here is a
counter-example.

```qlang
-- (defined earlier in this chapter)
fun change(coins: array<int>, amount: int) -> int?
  let t: array<int?> = [0]
  for s in 1..=amount do
    let best: int? = none
    for c in coins do
      if c <= s then
        let prev = t[s - c]
        if prev != none then
          if best == none or prev + 1 < best then best = prev + 1 end
        end
      end
    end
    t[] = best
  end
  t[amount]
end

fun greedy_change(coins: array<int>, amount: int) -> int
  let p = coins.slice(0, coins.len())
  p.sort()
  p.reverse()
  let n = 0
  for coin in p do
    while amount >= coin do
      amount -= coin
      n += 1
    end
  end
  n
end
print(greedy_change([1, 5, 10, 25], 63))   -- 6: optimal
print(greedy_change([1, 3, 4], 6))         -- 3 (4+1+1) whereas 3+3 = 2 coins!
print(change([1, 3, 4], 6))                -- 2
```

## The longest common subsequence (LCS)

```qlang
fun lcs(a: string, b: string) -> int
  let t: array<array<int>> = []
  for i in 0..=a.len() do
    let row: array<int> = []
    for j in 0..=b.len() do row[] = 0 end
    t[] = row
  end
  for i in 1..=a.len() do
    for j in 1..=b.len() do
      if a[i - 1] == b[j - 1] then
        t[i][j] = t[i - 1][j - 1] + 1
      else
        t[i][j] = t[i - 1][j].max(t[i][j - 1])
      end
    end
  end
  t[a.len()][b.len()]
end
print(lcs("ABCBDAB", "BDCABA"))   -- 4
```

## The 0/1 knapsack

Maximizing the value without exceeding the capacity.

```qlang
fun knapsack(weights: array<int>, values: array<int>, capacity: int) -> int
  let best: array<int> = []
  for c in 0..=capacity do best[] = 0 end
  for i in 0..weights.len() do
    let c = capacity
    while c >= weights[i] do
      best[c] = best[c].max(best[c - weights[i]] + values[i])
      c -= 1
    end
  end
  best[capacity]
end
print(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7))   -- 9
```

## The maximum-sum subarray

Kadane's algorithm finds it in a single pass, in O(n).

```qlang
fun kadane(xs: array<int>) -> int
  let current = xs[0]
  let best = xs[0]
  for i in 1..xs.len() do
    current = xs[i].max(current + xs[i])
    best = best.max(current)
  end
  best
end
print(kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4]))   -- 6
```

## Remember

- Dynamic programming: overlapping sub-problems, plus a memory.
- Greedy: fast, but must be proven (it can be wrong).
