---
title: "Projet final : gestionnaire de tâches"
---

# Projet final : gestionnaire de tâches

On assemble tout ce qu'on a vu : `struct`, `enum`, trait, `map`, tri, `match`, surcharge
d'opérateurs, fermetures et tests.

Le programme ci-dessous gère une liste de tâches :

- un `enum` `Priorite`, avec une méthode `poids` ;
- une `struct` `Tache`, qui se convertit en texte (`As<string>`) et se compare (`Ord`) ;
- une `struct` `Liste`, avec des champs privés et des méthodes pour ajouter, trouver,
  terminer et filtrer (avec une fonction passée en paramètre) ;
- un dictionnaire pour les statistiques, et des `assert` pour tester.

Lis-le, exécute-le, puis modifie-le.

```qlang
enum Priorite
  Basse
  Normale
  Haute
end

impl Priorite
  public fun poids(self) -> int
    match self
      case Priorite.Basse then 1
      case Priorite.Normale then 2
      case Priorite.Haute then 3
    end
  end
end

struct Tache
  public id: int
  public titre: string
  public priorite: Priorite
  public faite: bool
end

impl As<string> for Tache
  public fun convert(self) -> string
    let marque = if self.faite then "[x]" else "[ ]" end
    "{marque} #{self.id} {self.titre} ({self.priorite})"
  end
end

impl Ord for Tache      -- plus prioritaire = "plus petit" => en premier après tri
  public fun cmp(self, o: Tache) -> int
    o.priorite.poids() - self.priorite.poids()
  end
end

struct Liste
  private taches: array<Tache>
  private prochain_id: int
end

impl Liste
  public fun nouvelle() -> Liste
    Liste { taches: [], prochain_id: 1 }
  end

  public fun ajouter(self, titre: string, p: Priorite) -> Tache
    let t = Tache { id: self.prochain_id, titre, priorite: p, faite: false }
    self.prochain_id += 1
    self.taches[] = t
    t
  end

  public fun trouver(self, id: int) -> Tache?
    for t in self.taches do
      if t.id == id then return t end
    end
    none
  end

  public fun terminer(self, id: int) -> bool
    let t = self.trouver(id)
    if t == none then return false end
    t.faite = true
    true
  end

  public fun filtrer(self, garder: fun(Tache) -> bool) -> array<Tache>
    let res: array<Tache> = []
    for t in self.taches do
      if garder(t) then res[] = t end
    end
    res
  end

  public fun tout(self) -> array<Tache>
    self.taches.slice(0, self.taches.len())
  end
end

fun afficher(titre: string, ts: array<Tache>)
  print("--- {titre} ({ts.len()}) ---")
  for t in ts do print(t) end
end

let liste = Liste.nouvelle()
liste.ajouter("Apprendre qlang", Priorite.Haute)
liste.ajouter("Faire les courses", Priorite.Basse)
liste.ajouter("Écrire un projet", Priorite.Normale)
liste.ajouter("Ranger le bureau", Priorite.Basse)

liste.terminer(1)
print(liste.terminer(99))          -- false

afficher("Toutes", liste.tout())

let triees = liste.tout()
triees.sort()                      -- grâce à Ord
afficher("Par priorité", triees)

afficher("À faire", liste.filtrer(fun(t: Tache) -> bool not t.faite end))
afficher("Hautes", liste.filtrer(fun(t: Tache) -> bool t.priorite == Priorite.Haute end))

-- Statistiques avec un dictionnaire
let par_priorite: map<Priorite, int> = {}
for t in liste.tout() do
  par_priorite[t.priorite] = par_priorite.get(t.priorite, 0) + 1
end
print(par_priorite)

-- Tests
assert(liste.tout().len() == 4, "4 tâches")
assert(liste.filtrer(fun(t: Tache) -> bool t.faite end).len() == 1, "1 faite")
let t1 = liste.trouver(1)
assert(t1 != none and t1.faite, "tâche 1 terminée")
print("projet OK")
```

## Prolongements

À toi de jouer :

- Ajouter une méthode `supprimer(id)`.
- Ajouter une date d'échéance et trier dessus.
- Lire des commandes avec `read()` dans une boucle : `add titre`, `done 3`, `list`.
- Sauvegarder l'état en texte et le recharger avec `split()`.
