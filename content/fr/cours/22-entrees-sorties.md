---
title: "Entrées / sorties"
---

# Entrées / sorties

`read()` lit une ligne tapée au clavier et renvoie une `string`.

Sur ce site, il n'y a pas de clavier pour le programme : écris ce que l'utilisateur
« taperait » dans le champ **Entrée** sous le code, **une ligne par ligne**. Dans un
terminal, `qlang run fichier.q` attend ta saisie ; on peut aussi donner les réponses par un
tube : `printf 'Ada\n36\n' | qlang run fichier.q`.

Essaie avec deux lignes, `Ada` puis `36` :

```qlang
write("Comment t'appelles-tu ? ")
let nom = read()
print("Enchanté, {nom} !")

write("Quel âge as-tu ? ")
let texte = read()
let age = int.parse(texte)
if age == none then
  print("'{texte}' n'est pas un nombre.")
else
  print("Dans 10 ans tu auras {age + 10} ans.")
end
```

Si `read()` n'a plus de ligne à lire, le programme s'arrête avec une erreur. Dans un
environnement sans clavier (comme un serveur web), `read` n'existe pas : c'est détecté à la
compilation.

## Deux sorties : `print` et `eprint`

Un programme a deux sorties. `print` et `write` vont sur la **sortie** : c'est ce que le programme
*produit*, et ce qu'on peut rediriger ou passer à un autre programme. `eprint` et `ewrite` vont sur
la **sortie d'erreur** : tout ce qui parle *du* programme (avertissements, progression, journal).

Malgré son nom, la sortie d'erreur n'est pas réservée aux erreurs. Un message informatif y a sa
place, justement parce qu'il ne doit pas se mélanger aux résultats. Dans un terminal :

```sh
qlang run rapport.q > rapport.txt     # les eprint restent à l'écran
qlang run rapport.q 2> rapport.log    # les eprint vont dans un fichier
```

Le journal `Log.info(...)`, `Log.error(...)` (étudié dans la documentation web) écrit lui aussi
sur la sortie d'erreur, pour la même raison. Sur ce site, la page ne montre que la sortie.

## À retenir

- `read()` renvoie toujours une `string` : convertis-la avec `int.parse` ou `to_int()`.
- Pense au cas où la saisie n'est pas un nombre : le résultat est un `int?`.
- `print` écrit les résultats, `eprint` écrit le reste (journal, avertissements) : la sortie d'erreur n'est pas que pour les erreurs.
