---
title: "Dates et heures"
---

# Dates et heures

Pour travailler avec des dates (une échéance, un anniversaire, une durée), qlang a un type
`datetime`. C'est un **instant** : une date et une heure, toujours en **UTC** (pas de fuseau
horaire, donc les mêmes résultats partout).

## Créer une date

`datetime.of(année, mois, jour)` donne une date à minuit. On peut ajouter l'heure :
`datetime.of(année, mois, jour, heure, minute, seconde)`.

```qlang
let rendu = datetime.of(2026, 10, 11)
print(rendu)

let rdv = datetime.of(2026, 10, 11, 14, 30, 0)
print(rdv)
```

Une date s'affiche au format ISO : `2026-10-11T14:30:00Z`. Une date qui n'existe pas est une
erreur :

<!-- expect-error -->
```qlang
print(datetime.of(2026, 2, 29))
```

`datetime.now()` donne l'instant présent (voir le chapitre précédent pour `time.now()`).

## Lire les morceaux

```qlang
let d = datetime.of(2026, 10, 11, 14, 30, 5)
print(d.year())
print(d.month())
print(d.day())
print(d.hour())
print(d.minute())
print(d.second())
print(d.weekday())
```

`weekday()` renvoie 1 pour lundi, jusqu'à 7 pour dimanche. Le 11 octobre 2026 est un
dimanche : `7`.

## Ajouter et retrancher

Les méthodes `add_days`, `add_months`, `add_years`, `add_hours`, `add_minutes` et
`add_seconds` renvoient un **nouveau** `datetime` (l'ancien ne change pas). Un nombre
négatif remonte dans le temps.

```qlang
let d = datetime.of(2026, 1, 31, 10, 0, 0)
print(d.add_days(1))
print(d.add_hours(15))
print(d.add_days(-31))
print(d.add_months(1))
```

Remarque : `31 janvier + 1 mois` donne le **28 février** (le dernier jour du mois), car le
31 février n'existe pas.

## Comparer et mesurer

Les dates se comparent, se trient, et la soustraction donne un nombre de **millisecondes**.

```qlang
let debut = datetime.of(2026, 3, 1)
let fin = datetime.of(2026, 3, 8)
print(debut < fin)
print(fin - debut)
print((fin - debut) div 86_400_000)
print(debut.days_until(fin))
```

`a.days_until(b)` compte directement les jours entre le jour de `a` et celui de `b`.

## Écrire et lire du texte

`format` écrit une date selon un modèle : `YYYY` (année), `MM` (mois), `DD` (jour), `HH`
(heure), `mm` (minute), `ss` (seconde). Les autres caractères sont gardés.

```qlang
let d = datetime.of(2026, 10, 11, 14, 30, 0)
print(d.format("DD/MM/YYYY"))
print(d.format("YYYY-MM-DD à HH:mm"))
```

`datetime.parse(texte)` fait l'inverse. Comme le texte peut être invalide, le résultat est un
`datetime?` :

```qlang
let ok = datetime.parse("2026-10-11 14:30")
if ok != none then
  print(ok.hour())
end
print(datetime.parse("11/10/2026") == none)
```

## À retenir

- `datetime.of(a, m, j)` crée une date ; `datetime.now()` donne l'instant présent.
- `year()`, `month()`, `day()`… lisent les morceaux ; `add_days(n)`… calculent une autre date.
- `b - a` donne des millisecondes ; `a.days_until(b)` donne des jours.
- `format` et `parse` passent du texte à la date et inversement.
- Tout est en UTC.
