---
title: "Modules"
---

# Modules

Un projet grandit : on découpe le code en plusieurs fichiers. Un fichier **exporte** ce
qu'il offre avec `export`, un autre l'**importe** avec `import`.

## Le fichier qui offre

Voici `lib/maths.q`. À la fin, `export` liste ce que les autres fichiers ont le droit
d'utiliser.

```qlang-module
-- file: lib/maths.q
-- Petit module de démonstration (importé par le chapitre 20)
const SECRET = 42

fun additionner(a: int, b: int) -> int
  a + b
end

fun pgcd(a: int, b: int) -> int
  if b == 0 then return a end
  pgcd(b, a mod b)
end

struct Compteur
  public valeur: int
end

impl Compteur
  public fun nouveau() -> Compteur
    Compteur { valeur: 0 }
  end
  public fun incrementer(self)
    self.valeur += 1
  end
end

-- Ce print s'exécute UNE seule fois, au premier import
print("[maths.q chargé]")

export additionner, pgcd, Compteur, SECRET
```

## Importer

Les chemins sont relatifs au fichier qui importe, toujours écrits avec `/`.

```qlang
import additionner, pgcd from "lib/maths.q"
print(additionner(2, 3))
print(pgcd(48, 18))

-- Importer avec un alias
import additionner as add from "lib/maths.q"
print(add(10, 20))

-- Importer tout le module sous un nom
import "lib/maths.q" as m
print(m.additionner(1, 1))
print(m.SECRET)
let c = m.Compteur.nouveau()     -- un type exporté se note m.Type
c.incrementer()
c.incrementer()
print(c.valeur)
```

Le module n'est chargé qu'**une seule fois** : le `print("[maths.q chargé]")` du module
apparaît une seule fois, tout en haut, avant même la première ligne du fichier qui l'importe.

## À retenir

- `export a, b, c` à la fin du fichier qui offre.
- `import a, b from "chemin.q"` ou `import "chemin.q" as nom`.
- Les chemins sont relatifs au fichier, séparés par `/`, jamais absolus.
- Les imports circulaires sont interdits.
