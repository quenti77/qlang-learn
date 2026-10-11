---
title: "Héritage"
---

# Héritage

Une `struct` peut en étendre une autre avec `extends` : elle récupère ses champs et ses
méthodes, et peut en redéfinir avec `override`. Une seule parente est possible.

```qlang
struct Animal
  public nom: string
  protected energie: int = 10      -- visible dans Animal et ses enfants
end

impl Animal
  public fun parler(self) -> string
    "{self.nom} fait un bruit"
  end

  public fun manger(self)
    self.energie += 5
  end

  public fun energie_actuelle(self) -> int
    self.energie
  end
end

struct Chien extends Animal
  public race: string
end

impl Chien
  public fun creer(nom: string, race: string) -> Chien
    Chien { ..Animal { nom }, race }     -- on reprend les champs d'un Animal
  end

  -- override : même signature que la méthode du parent
  public override fun parler(self) -> string
    "{self.nom} aboie (et {super.parler()})"
  end

  public fun courir(self)
    self.energie -= 3                 -- protected : accessible ici
  end
end

struct Chat extends Animal
end
impl Chat
  public override fun parler(self) -> string
    "{self.nom} miaule"
  end
end

let rex = Chien.creer("Rex", "berger")
rex.manger()
rex.courir()
print(rex.parler())
print(rex.energie_actuelle())    -- 10 + 5 - 3 = 12
```

## Le polymorphisme

Un `Chien` **est** un `Animal` : on peut l'utiliser partout où un `Animal` est attendu, et la
bonne version de `parler()` est appelée. Voici une version plus courte des structs :

```qlang
struct Animal
  public nom: string
end
impl Animal
  public fun parler(self) -> string
    "{self.nom} fait un bruit"
  end
end

struct Chien extends Animal
end
impl Chien
  public override fun parler(self) -> string
    "{self.nom} aboie"
  end
end

struct Chat extends Animal
end
impl Chat
  public override fun parler(self) -> string
    "{self.nom} miaule"
  end
end

let animaux: array<Animal> = [
  Animal { nom: "Bestiole" },
  Chien { nom: "Rex" },
  Chat { nom: "Felix" }
]
for a in animaux do
  print(a.parler())
end

fun faire_parler(a: Animal)
  print(">> {a.parler()}")
end
faire_parler(Chat { nom: "Tom" })
```

## À retenir

- `struct B extends A` : `B` hérite de `A`.
- `override` est **obligatoire** pour redéfinir ; `super.methode()` appelle le parent.
- `protected` : visible dans la struct et ses enfants.
- Polymorphisme : même appel, comportement selon le vrai type.
- Conseil : préfère les traits (chapitre 15) à l'héritage quand tu hésites.
