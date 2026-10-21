---
title: "Les outils du terminal"
---

# Les outils du terminal

Jusqu'ici, tout s'exécutait dans la page. Cette leçon se **lit seulement** : les commandes
ci-dessous s'utilisent dans un terminal, avec le programme `qlang` installé sur ta machine
(voir la page d'installation de la documentation). Elles transforment un fichier isolé en
vrai projet : organisé, testé, documenté, avec des dépendances.

## Démarrer un projet

```sh
qlang init mon-app      # qlang.toml, main.q et .gitignore
cd mon-app
qlang run               # lance le fichier `entry` du qlang.toml
qlang check             # vérifie sans lancer
```

`qlang.toml` décrit le projet : son nom, son fichier de départ (`entry`) et ses dépendances.
`qlang check` est pratique dans un éditeur ou une automatisation : il signale les erreurs de
types sans rien exécuter.

## Tester avec `qlang test`

Un fichier de test se nomme `*_test.q` ou `test_*.q`. Chaque fonction `fun test_...()` sans
paramètre y est un test, qui réussit si elle ne s'arrête pas sur une erreur. Les `assert_*` sont
là pour ça.

```
import double from "math.q"

fun test_double()
  assert_eq(double(21), 42)
end

fun test_negatifs()
  assert_lt(double(-1), 0)
  assert_ne(double(1), 3)
end

fun test_ages()
  assert_len([1, 2, 3], 3)
  assert_contains([1, 2, 3], 2)
  assert_close(0.1 + 0.2, 0.3)
end
```

```sh
qlang test                       # tous les tests du projet
qlang test math_test.q           # un fichier (ou un dossier)
qlang test --filter double       # les tests dont le nom contient « double »
```

Une assertion qui échoue montre les deux valeurs et la ligne **de ton test**. Le code de sortie
est `0` si tout passe, `1` sinon : un script ou une intégration continue peut s'en servir.

Les assertions disponibles : `assert_eq`, `assert_ne`, `assert_lt`, `assert_le`, `assert_gt`,
`assert_ge`, `assert_ok`, `assert_err`, `assert_some`, `assert_none`, `assert_len`,
`assert_empty`, `assert_contains`, `assert_not_contains`, `assert_contains_text`,
`assert_starts_with`, `assert_ends_with`, `assert_close` et `assert_within`.

## Documenter avec `qlang doc`

Un commentaire `--" … --"` placé juste au-dessus d'une déclaration devient sa documentation :

```
--" Double un nombre. --"
public fun double(n: int) -> int
  n * 2
end
```

```sh
qlang doc                  # Markdown de tout le projet, sur la sortie standard
qlang doc lib.q -o API.md  # un fichier, écrit dans API.md
```

On obtient une page Markdown avec les noms exportés, leurs signatures, et les champs, méthodes et
variantes publics des types. Les fichiers de test sont ignorés.

## Les paquets

Un projet peut dépendre du code d'autres projets. On les liste dans `qlang.toml` :

```toml
[dependencies]
std = { git = "https://github.com/quenti77/qlang-std", tag = "v0.1.0" }
utils = { path = "../utils" }
```

```sh
qlang add std --git https://github.com/quenti77/qlang-std --tag v0.1.0
qlang install        # récupère les paquets dans .qlang/packages (versions de qlang.lock)
qlang update         # avance les tags et branches
qlang remove std
```

Un paquet s'importe avec `@` : `import "@std/csv.q" as csv`. `qlang-std` est une bibliothèque en
qlang pur (lecture de CSV, gabarits de texte, TOML). Mets `.qlang/` dans le `.gitignore` et
versionne `qlang.lock`, qui retient les versions exactes.

## Lancer un autre programme

`Process.run("git", ["status"])` démarre un programme de la machine (sans passer par un shell) et
renvoie un `Result` : le code de sortie et ce que le programme a écrit. C'est **refusé par
défaut** : il faut le demander au lancement.

```sh
qlang run --allow-process outil.q
```

C'est le même principe que pour les fichiers et le réseau : le langage ne fait rien d'extérieur
sans que l'environnement le permette. La page web ne l'autorise jamais, ce qui est une raison de
plus pour que cette leçon reste de la lecture.

## À retenir

- `qlang init` crée un projet ; `qlang run` et `qlang check` s'en servent sans nom de fichier.
- `qlang test` exécute les `fun test_...()` des fichiers `*_test.q`, avec les `assert_*`.
- `qlang doc` génère une page Markdown à partir des commentaires `--" … --"`.
- `qlang add` / `install` / `update` gèrent les dépendances ; on les importe avec `@nom`.
- `Process.run` demande `--allow-process`.
