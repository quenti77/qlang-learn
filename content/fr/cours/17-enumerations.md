---
title: "Les énumérations (enum)"
---

# Les énumérations (enum)

Un enum est une liste FERMÉE de choix possibles. Mieux que des nombres
magiques (0 = lundi ?) ou des textes sujets aux fautes de frappe.

```qlang
enum Direction
  Nord
  Est
  Sud
  Ouest
end

let d = Direction.Est
print(d)                          -- Direction.Est
print(d == Direction.Est)         -- true
print(d == Direction.Nord)        -- false
```

match vérifie qu'aucun cas n'est oublié

```qlang
-- (défini plus haut dans ce chapitre)
enum Direction
  Nord
  Est
  Sud
  Ouest
end

fun tourner_droite(d: Direction) -> Direction
  match d
    case Direction.Nord then Direction.Est
    case Direction.Est then Direction.Sud
    case Direction.Sud then Direction.Ouest
    case Direction.Ouest then Direction.Nord
  end
end
let cap = Direction.Nord
for i in 0..5 do
  write("{cap} ")
  cap = tourner_droite(cap)
end
print("")
```

Un enum peut avoir des méthodes

```qlang
-- (défini plus haut dans ce chapitre)
enum Direction
  Nord
  Est
  Sud
  Ouest
end

impl Direction
  public fun dx(self) -> int
    match self
      case Direction.Est then 1
      case Direction.Ouest then -1
      else 0
    end
  end
  public fun dy(self) -> int
    match self
      case Direction.Nord then -1
      case Direction.Sud then 1
      else 0
    end
  end
end

let x = 5
let y = 5
for d in [Direction.Nord, Direction.Nord, Direction.Est, Direction.Sud] do
  x += d.dx()
  y += d.dy()
end
print("position finale : {x},{y}")
```

Un enum peut être une clé de dictionnaire

```qlang
-- (défini plus haut dans ce chapitre)
enum Direction
  Nord
  Est
  Sud
  Ouest
end

let visites: map<Direction, int> = {}
visites[Direction.Nord] = 2
visites[Direction.Sud] = 1
print(visites[Direction.Nord])
```

États d'un système (machine à états)

```qlang
enum Etat
  Attente
  EnCours
  Termine
end
fun suivant(e: Etat) -> Etat
  match e
    case Etat.Attente then Etat.EnCours
    case Etat.EnCours then Etat.Termine
    case Etat.Termine then Etat.Termine
  end
end
let e = Etat.Attente
while e != Etat.Termine do
  print(e)
  e = suivant(e)
end
print(e)
```

## À retenir

- Les variantes ne portent pas de données, mais on peut leur ajouter des
  méthodes avec `impl`.
- Elles se comparent avec == et s'utilisent dans match et comme clés de map.
