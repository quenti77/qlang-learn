---
title: "Extension VS Code"
group: "Outils"
---

# Extension VS Code

Pour écrire du qlang sur ton ordinateur, l'extension **qlang** pour VS Code (fichiers `.q`) apporte
la coloration, les erreurs soulignées pendant la frappe, les infobulles et l'autocomplétion. Elle
s'appuie sur le vrai compilateur : tu vois les mêmes erreurs que dans le terminal.

## Ce qu'elle fait

- **Coloration syntaxique** : mots-clés, types, nombres (`0xFF_FF`, `0b0101`, `1_000`), chaînes avec
  `{interpolation}` et les trois formes de commentaires (`--`, `--( … --)`, `--" … --"`).
- **Erreurs pendant la frappe** : soulignées dans l'éditeur et listées dans le panneau Problèmes, y
  compris celles des modules importés.
- **Infobulles** : survole un nom pour voir son type (`noms: array<string>`), la signature d'une
  fonction ou d'une méthode, et le commentaire `--" … --"` placé au-dessus de sa déclaration. Les
  méthodes prédéfinies (`len`, `push`, `split`…) sont expliquées.
- **Autocomplétion** : après un `.`, les champs et méthodes du type de la valeur (les membres
  publics, et tous ceux de `self`) ; après `Type.`, les variantes d'une énumération et les fonctions
  statiques ; sinon, les variables visibles, les noms du fichier, les fonctions prédéfinies, les
  mots-clés et les types. Dans un `import "..."`, les paquets (`@std/`), les fichiers et dossiers
  d'un paquet, ou ceux à côté du fichier. Un projet situé dans un sous-dossier du dossier ouvert est
  trouvé par son `qlang.toml` le plus proche.
- **Mettre en forme** : « Mettre en forme le document » (ou `qlang fmt` dans le terminal) remet l'indentation à deux espaces par niveau sans toucher aux jetons ni aux commentaires.
- **Fonctions complétées avec leurs parenthèses** : `validate()`, `new(items)` (Tab passe d'un paramètre au suivant). La complétion marche aussi après `not x.` ou `a + b.`, à travers un module (`web.App.`) et à la place d'un type (`fun f() -> web.`).
- **Aide aux paramètres** : en tapant `(` ou `,` dans un appel, la signature s'affiche avec le
  paramètre courant en gras.
- **Exécuter** : le bouton ▶ de la barre de titre (ou la commande **qlang: Run File**) enregistre le
  fichier et le lance dans un terminal, où `read()` fonctionne avec ton clavier.
- **Extraits de code** : `fun`, `if`, `for`, `foreach`, `while`, `match`, `struct`, `impl`, `trait`,
  `enum`, `import`… (tape le préfixe, puis Tab).
- Commentaires par raccourci, parenthèses et guillemets fermés automatiquement, indentation
  automatique autour de `then … end`, `do … end` et `fun … end`.

## Installer

L'extension appelle le programme `qlang`. Le script d'installation du projet installe les deux (et
les met à jour : relance simplement la même commande) :

```sh
curl -fsSL https://raw.githubusercontent.com/quenti77/qlang/main/install.sh | sh -s -- --vscode
```

Pour un profil VS Code précis, ajoute `--profile NomDuProfil`. Sans le script, télécharge le
programme de ta machine et `qlang.vsix` sur la
[page des versions](https://github.com/quenti77/qlang/releases/latest), puis :

```sh
code --install-extension qlang.vsix
```

**Windows** : il n'y a pas encore de programme précompilé. Installe Rust, puis
`cargo install --git https://github.com/quenti77/qlang qlang-cli` ; l'extension (`qlang.vsix`) se
télécharge sur la page des versions.

Si `qlang` n'est pas dans ton `PATH`, indique son chemin complet dans le réglage **qlang.path**.
Ce réglage n'est lu que dans tes réglages utilisateur, jamais dans le `.vscode/settings.json` d'un
projet : un projet téléchargé ne peut pas choisir le programme que l'extension lance.

## Réglages

| Réglage                     | Défaut  | Rôle                                           |
| --------------------------- | ------- | ---------------------------------------------- |
| `qlang.path`                | `qlang` | Le programme à lancer                          |
| `qlang.diagnostics.enabled` | `true`  | Vérifier les fichiers pendant la frappe        |
| `qlang.diagnostics.delay`   | `400`   | Millisecondes d'attente après la dernière frappe |

## Limites

Les infobulles et la complétion demandent un fichier que le compilateur sait lire : avec une erreur de
syntaxe ailleurs dans le fichier, l'extension réutilise la dernière réponse. Après un `.`, elle
interroge le compilateur sur le code sans le `.nom` en cours de frappe, pour que celui-ci compile
encore. Les textes de ces infobulles sont en anglais, comme les messages d'erreur.
