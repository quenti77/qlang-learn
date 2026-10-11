---
title: "Premiers pas"
---

# Premiers pas

Un programme est une liste d'instructions exécutées de haut en bas, comme une recette de
cuisine. L'ordinateur fait exactement ce qu'on lui écrit, ni plus, ni moins.

> Ne te contente pas de lire : **modifie** le code ci-dessous et clique sur *Exécuter*. Casser
> volontairement un programme est la meilleure façon d'apprendre.

## Afficher du texte

`print` affiche quelque chose à l'écran, puis passe à la ligne. Le texte s'écrit entre
guillemets doubles. Un commentaire commence par deux tirets : l'ordinateur l'ignore, il est là
pour les humains.

```qlang
-- Ceci est un commentaire
print("Bonjour le monde !")
print("Je m'appelle qlang.")
```

## Des nombres et des calculs

```qlang
print(42)
print(3.14)
print(1 + 2)
print(6 * 7)
```

`print()` sans rien affiche une ligne vide, et `write` affiche **sans** passer à la ligne :

```qlang
write("Un ")
write("deux ")
write("trois")
print()
print("Ligne 1\nLigne 2")
```

## Quand ça ne marche pas

Les erreurs de qlang indiquent la ligne et la colonne du problème. Essaie d'exécuter ceci, où le
guillemet fermant est oublié :

<!-- expect-error -->
```qlang
print("Bonjour)
```

## Aller plus loin : poser une question

`read()` lit une ligne tapée par l'utilisateur. Ici, écris ton prénom dans le champ « Entrée »
sous le code, puis exécute.

```qlang
write("Comment t'appelles-tu ? ")
let prenom = read()
print("Bonjour " + prenom + " !")
```

## À retenir

- Un programme = des instructions lues de haut en bas.
- `print(...)` affiche, `write(...)` affiche sans retour à la ligne.
- Le texte va entre guillemets, les nombres non.
- `--` commence un commentaire.

## À essayer

1. Fais afficher ton prénom.
2. Fais afficher le résultat de `123 * 456`.
3. Oublie volontairement un guillemet fermant et lis le message d'erreur.
