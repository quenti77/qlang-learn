---
title: "Fonctions avancées — fermetures (closures)"
---

# Fonctions avancées — fermetures (closures)

Une fonction anonyme se SOUVIENT des variables autour d'elle, même après que
la fonction qui l'a créée soit terminée.

```qlang
fun creer_compteur() -> fun() -> int
  let n = 0                 -- cette variable survit dans la fermeture
  fun() -> int
    n += 1
    n
  end
end

let c1 = creer_compteur()
let c2 = creer_compteur()      -- compteur indépendant
c1()
c1()
print(c1())    -- 3
print(c2())    -- 1
```

Une usine à fonctions

```qlang
fun additionneur(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end
let plus5 = additionneur(5)
let plus100 = additionneur(100)
print(plus5(1))
print(plus100(1))
```

Composer deux fonctions : (f ∘ g)(x) = f(g(x))

```qlang
-- (défini plus haut dans ce chapitre)
fun additionneur(k: int) -> fun(int) -> int
  fun(x: int) -> int
    x + k
  end
end

let plus5 = additionneur(5)

fun composer(f: fun(int) -> int, g: fun(int) -> int) -> fun(int) -> int
  fun(x: int) -> int
    f(g(x))
  end
end
let double_puis_plus5 = composer(plus5, fun(x: int) -> int x * 2 end)
print(double_puis_plus5(10))     -- 25
```

Tableau de fonctions

```qlang
let operations: array<fun(int, int) -> int> = [
  fun(a: int, b: int) -> int a + b end,
  fun(a: int, b: int) -> int a - b end,
  fun(a: int, b: int) -> int a * b end
]
for op in operations do
  write("{op(6, 3)} ")
end
print("")
```

Dictionnaire de fonctions (une "table de dispatch")

```qlang
let calc: map<string, fun(int, int) -> int> = {
  "+": fun(a: int, b: int) -> int a + b end,
  "*": fun(a: int, b: int) -> int a * b end
}
let f = calc["*"]
if f != none then print(f(7, 6)) end
```

Mémoïsation générique : une fermeture avec un cache

```qlang
fun memoiser(f: fun(int) -> int) -> fun(int) -> int
  let cache: map<int, int> = {}
  fun(x: int) -> int
    let deja = cache[x]
    if deja != none then return deja end
    let r = f(x)
    cache[x] = r
    r
  end
end
let lent = fun(x: int) -> int
  print("  (calcul de {x})")
  x * x
end
let rapide = memoiser(lent)
print(rapide(9))
print(rapide(9))    -- pas de nouveau calcul
```

Fonction d'ordre supérieur : appeler n fois

```qlang
fun repeter(n: int, action: fun(int))
  for i in 0..n do action(i) end
end
let total = 0
repeter(5, fun(i: int) total += i end)    -- modifie la variable extérieure
print(total)
```

## À retenir

- Une fermeture capture ET peut modifier les variables englobantes.
- Utile pour : compteurs, usines de fonctions, caches, callbacks.
