---
title: "Entrées / sorties"
---

# Entrées / sorties

`read()` lit une ligne tapée au clavier et renvoie une string.

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

Si read() n'a plus de ligne à lire, le programme s'arrête avec une erreur.
Dans un environnement sans clavier (serveur web), read n'existe pas :
c'est détecté à la compilation.
