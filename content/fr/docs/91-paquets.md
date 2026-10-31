---
title: "Paquets : utiliser et publier"
group: "Guides"
---

# Paquets : utiliser et publier

qlang n'a pas de serveur de paquets : un paquet est un **dépôt git** avec un `qlang.toml` et **une étiquette par version**
(`v1.2.3`). Un petit **index** (`packages.json` dans le dépôt de qlang) dit quel dépôt porte quel nom, pour que
`qlang search`, `qlang info` et `qlang add nom` fonctionnent. L'index ne contient aucun code : le paquet est récupéré
par git, figé dans `qlang.lock` et vérifié.

## Utiliser un paquet

```sh
qlang search json     # les paquets de l'index (nom, description, licence, dépôt)
qlang info std        # licence, mots-clés, versions disponibles, comment l'ajouter
qlang add std         # l'ajoute avec la version compatible la plus récente
qlang install         # récupère exactement les commits de qlang.lock
qlang update          # avance dans les intervalles demandés
qlang verify          # les paquets installés sont-ils ceux de qlang.lock, sans fichier modifié ?
```

### Contraintes de version

```toml
[dependencies]
std    = { git = "https://github.com/quenti77/qlang-std", version = "^0.19" }
text   = { git = "https://github.com/x/text", version = ">=1.2, <2" }
pinned = { git = "https://github.com/x/pinned", tag = "v1.0.0" }
local  = { path = "../local" }
```

Une contrainte choisit la plus haute étiquette `vX.Y.Z` qui la satisfait. `^1.2` : `>=1.2.0, <2.0.0` ; `^0.2.3` :
`>=0.2.3, <0.3.0` ; `~1.2.3` : `>=1.2.3, <1.3.0` ; `1.2` seul vaut `^1.2` ; `>=`, `>`, `<=`, `<`, `=` et `*` existent,
séparés par des virgules. Une pré-version (`v1.3.0-rc.1`) n'est choisie que si la contrainte en nomme une.
`qlang.lock` garde la contrainte et le commit : `qlang install` ne bouge pas, `qlang update` choisit de nouveau.

Si le projet et un de ses paquets demandent le même dépôt avec des intervalles différents, qlang cherche une étiquette
qui satisfait les deux, et s'arrête en disant qui demande quoi s'il n'y en a pas.

### Intégrité, signatures, paquets privés

- `qlang.lock` fixe chaque paquet à un **commit**, dont l'identifiant est l'empreinte du contenu. `qlang verify`
  contrôle en plus que le dossier installé est à ce commit et qu'aucun fichier n'a été modifié.
- `signed = true` exige une **signature que git sait vérifier** avec les clés auxquelles tu fais confiance (`gpg`, ou
  `gpg.ssh.allowedSignersFile`).
- Un dépôt privé se récupère par ssh ou avec un assistant d'identifiants de git. Pour un dépôt **https** protégé par
  un jeton : `private = { git = "https://…", version = "^1", token_env = "PRIVE_TOKEN" }` ; le jeton n'est donné à git que
  pour cette dépendance, en https seulement, et n'est écrit nulle part.

## Publier un paquet

1. Un dépôt git public avec, dans `[package]` de son `qlang.toml` : `name`, `version`, `description`, `license`
   (un nom SPDX) et éventuellement `keywords` et `main` ; un `README.md` ; un fichier principal qui compile.
2. Une étiquette `vX.Y.Z` sur le commit de la version (`git tag v1.2.3 && git push --tags`).
3. `qlang publish` vérifie tout cela et écrit l'entrée à proposer.
4. Une pull request sur [`packages.json`](https://github.com/quenti77/qlang/blob/main/packages.json) avec cette entrée.

## Ce que l'index promet

N'importe qui peut référencer un paquet par une pull request (nom libre, dépôt public en https, description et licence
dites, `qlang publish` qui passe). L'index **ne relit pas le code** : un paquet est du code qui s'exécute chez toi, donc
fixe une version et utilise `signed = true` quand l'auteur signe. Pour un problème, une entrée peut porter
`"yanked": ["v1.2.0"]` (une nouvelle résolution ne choisit plus cette version, les `qlang.lock` existants continuent de
marcher) ou `"removed": "raison"` (le paquet disparaît de la recherche et `qlang add` le refuse). Le détail est dans
[`docs/registry.md`](https://github.com/quenti77/qlang/blob/main/docs/registry.md).
