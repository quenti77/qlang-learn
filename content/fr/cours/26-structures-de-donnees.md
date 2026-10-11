---
title: "Structures de données"
---

# Structures de données

Choisir comment ranger les données change tout. Ici on construit les
classiques avec ce que le langage offre : struct, generics, traits.

## Pile (stack) : dernier entré, premier sorti (LIFO) — comme une pile d'assiettes

```qlang
struct Pile<T>
  private items: array<T>
end
impl<T> Pile<T>
  public fun nouvelle() -> Pile<T>
    Pile { items: [] }
  end
  public fun empiler(self, v: T)
    self.items[] = v
  end
  public fun depiler(self) -> T?
    self.items.pop()
  end
  public fun sommet(self) -> T?
    if self.items.is_empty() then return none end
    self.items[self.items.len() - 1]
  end
  public fun taille(self) -> int
    self.items.len()
  end
end
let p = Pile<int>.nouvelle()
p.empiler(1)
p.empiler(2)
p.empiler(3)
print(p.depiler())     -- 3
print(p.sommet())      -- 2
print(p.taille())      -- 2
```

## File (queue) : premier entré, premier sorti (FIFO) — comme une file d'attente

```qlang
struct File<T>
  private items: array<T>
end
impl<T> File<T>
  public fun nouvelle() -> File<T>
    File { items: [] }
  end
  public fun enfiler(self, v: T)
    self.items[] = v
  end
  public fun defiler(self) -> T?
    if self.items.is_empty() then return none end
    self.items.remove(0)
  end
  public fun est_vide(self) -> bool
    self.items.is_empty()
  end
end
let f = File<string>.nouvelle()
f.enfiler("Ada")
f.enfiler("Linus")
print(f.defiler())     -- Ada
print(f.defiler())     -- Linus
print(f.defiler())     -- none
```

## Liste chaînée : chaque nœud pointe vers le suivant (next, nullable !)

```qlang
struct Noeud
  public valeur: int
  public suivant: Noeud?
end

fun ajouter_devant(tete: Noeud?, v: int) -> Noeud
  Noeud { valeur: v, suivant: tete }
end
fun afficher_liste(tete: Noeud?)
  let cur = tete
  while cur != none do
    write("{cur.valeur} -> ")
    cur = cur.suivant
  end
  print("fin")
end
fun longueur(tete: Noeud?) -> int
  let n = 0
  let cur = tete
  while cur != none do
    n += 1
    cur = cur.suivant
  end
  n
end
fun inverser_liste(tete: Noeud?) -> Noeud?
  let prec: Noeud? = none
  let cur = tete
  while cur != none do
    let suiv = cur.suivant
    cur.suivant = prec
    prec = cur
    cur = suiv
  end
  prec
end
let liste = ajouter_devant(ajouter_devant(ajouter_devant(none, 3), 2), 1)
afficher_liste(liste)
print(longueur(liste))
afficher_liste(inverser_liste(liste))
```

Arbre binaire de recherche : à gauche plus petit, à droite plus grand
Recherche et insertion en O(log n) si l'arbre est équilibré.

```qlang
struct Arbre
  public valeur: int
  public gauche: Arbre?
  public droite: Arbre?
end

fun inserer(a: Arbre?, v: int) -> Arbre
  if a == none then
    return Arbre { valeur: v, gauche: none, droite: none }
  end
  if v < a.valeur then
    a.gauche = inserer(a.gauche, v)
  elseif v > a.valeur then
    a.droite = inserer(a.droite, v)
  end
  a
end
fun contient(a: Arbre?, v: int) -> bool
  if a == none then return false end
  if v == a.valeur then return true end
  if v < a.valeur then contient(a.gauche, v) else contient(a.droite, v) end
end
fun hauteur(a: Arbre?) -> int
  if a == none then return 0 end
  1 + hauteur(a.gauche).max(hauteur(a.droite))
end
-- Parcours en ordre : donne les valeurs triées !
fun en_ordre(a: Arbre?, sortie: array<int>)
  if a == none then return end
  en_ordre(a.gauche, sortie)
  sortie[] = a.valeur
  en_ordre(a.droite, sortie)
end

let racine: Arbre? = none
for v in [50, 30, 70, 20, 40, 60, 80, 30] do
  racine = inserer(racine, v)
end
let tri: array<int> = []
en_ordre(racine, tri)
print(tri)                    -- [20, 30, 40, 50, 60, 70, 80]
print(contient(racine, 60))   -- true
print(contient(racine, 65))   -- false
print(hauteur(racine))        -- 3
```

Graphe : dictionnaire "sommet -> voisins"
Parcours en largeur (BFS) = plus court chemin sans poids
Parcours en profondeur (DFS) = explorer à fond d'abord

```qlang
let graphe: map<string, array<string>> = {
  "A": ["B", "C"],
  "B": ["A", "D"],
  "C": ["A", "D", "E"],
  "D": ["B", "C", "F"],
  "E": ["C", "F"],
  "F": ["D", "E"]
}

fun largeur(g: map<string, array<string>>, depart: string) -> array<string>
  let vus: map<string, bool> = {}
  let ordre: array<string> = []
  let file = [depart]
  vus[depart] = true
  while not file.is_empty() do
    let s = file.remove(0)
    ordre[] = s
    for v in g.get(s, []) do
      if not vus.has(v) then
        vus[v] = true
        file[] = v
      end
    end
  end
  ordre
end
print(largeur(graphe, "A"))

fun profondeur(g: map<string, array<string>>, s: string, vus: map<string, bool>, ordre: array<string>)
  vus[s] = true
  ordre[] = s
  for v in g.get(s, []) do
    if not vus.has(v) then profondeur(g, v, vus, ordre) end
  end
end
let ordre_dfs: array<string> = []
let vus_dfs: map<string, bool> = {}
profondeur(graphe, "A", vus_dfs, ordre_dfs)
print(ordre_dfs)
```

Plus court chemin (nombre d'arêtes) avec mémoire du parent

```qlang
-- (défini plus haut dans ce chapitre)
let graphe: map<string, array<string>> = {
  "A": ["B", "C"],
  "B": ["A", "D"],
  "C": ["A", "D", "E"],
  "D": ["B", "C", "F"],
  "E": ["C", "F"],
  "F": ["D", "E"]
}

fun chemin(g: map<string, array<string>>, depart: string, arrivee: string) -> array<string>
  let parent: map<string, string> = {}
  let vus: map<string, bool> = { depart: true }
  let file = [depart]
  while not file.is_empty() do
    let s = file.remove(0)
    if s == arrivee then break end
    for v in g.get(s, []) do
      if not vus.has(v) then
        vus[v] = true
        parent[v] = s
        file[] = v
      end
    end
  end
  let res = [arrivee]
  let cur = arrivee
  while cur != depart do
    let p = parent[cur]
    if p == none then return [] end      -- pas de chemin
    res[] = p
    cur = p
  end
  res.reverse()
  res
end
print(chemin(graphe, "A", "F"))
```

## À retenir

- Pile (LIFO), file (FIFO), liste chaînée, arbre, graphe : les 5 piliers.
- Un type nullable (Noeud?) exprime naturellement "il n'y a pas de suivant".
- Le choix de la structure détermine la complexité de l'algorithme.
