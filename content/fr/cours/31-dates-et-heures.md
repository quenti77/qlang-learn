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

## Les durées

Une `Duration` regroupe des années, des mois, des jours, des heures, des minutes, des secondes et des millisecondes.
On l'ajoute à une date avec `+` ou `-` (les années et les mois d'abord : le 31 janvier + 1 mois tombe sur le dernier
jour de février). `a.until(b)` donne la durée entre deux dates, `diff_in_months` et ses voisines comptent des unités
entières.

```qlang
let debut = datetime.of(2026, 1, 31, 10, 0, 0)
print(debut + Duration.of(months: 1))            -- le 31 janvier + 1 mois : fin février
print(debut + Duration.of(days: 2, hours: 3))
print(debut.until(datetime.of(2027, 3, 4)).to_iso())
print(debut.diff_in_months(datetime.of(2026, 2, 28)))
print(debut.is_before(datetime.of(2026, 2, 1)))
```

Pour les bornes d'une période : `start_of_month()`, `end_of_week()`, `start_of_year()`… ; pour le texte,
`format("dddd D MMMM YYYY")` écrit les noms (en anglais), `format_in(motif, "fr")` en français.

```qlang
let d = datetime.of(2026, 11, 3, 14, 30, 0)
print(d.format_in("dddd D MMMM YYYY", "fr"))
print(d.start_of_month())
print(d.end_of_month().format("D MMMM YYYY"))
```

## Un jour, une heure, un fuseau

Un anniversaire n'est pas un instant : c'est un jour du calendrier, le même partout. `Date` est ce jour (sans heure ni
fuseau), `Time` une heure du jour (sans date), et `Zoned` un instant vu depuis un fuseau. `Date.of` et `Time.of` rendent `none`
pour ce qui n'existe pas.

```qlang
let jour = Date.of(2026, 1, 31) ?? Date.of(2000, 1, 1) ?? datetime.at(0).date()
print(jour.plus_months(1).to_iso())              -- 2026-02-28
print(Date.of(2026, 2, 30))                      -- none
let ouverture = Time.of(23, 30) ?? Time.of_datetime(datetime.at(0))
print(ouverture.plus_minutes(45).to_iso())       -- 00:15:00, autour de minuit
```

Pour lire un texte qui n'est pas au format ISO, `datetime.parse_with(texte, motif)` utilise les mêmes jetons que `format`
(et `ZZ` pour un décalage comme `+02:00`) ; `datetime.from_unix(secondes)` part d'un horodatage Unix ; `Duration.parse("P1DT2H")` lit
une durée ISO ; `d.each(Duration.of(days: 7), until: fin)` parcourt une période dans un `for`.

```qlang
let t = datetime.parse_with("11/10/2026 14:30", "DD/MM/YYYY HH:mm") ?? datetime.at(0)
print(t.to_iso())
print(datetime.from_unix(0).to_iso())
for lundi in datetime.of(2026, 3, 2).each(Duration.of(days: 7), until: datetime.of(2026, 3, 23)) do
  print(lundi.format_in("dddd D MMMM", "fr"))
end
```

`format_in` et `humanize` connaissent sept langues (`en`, `fr`, `es`, `de`, `it`, `pt`, `nl`).

## À retenir

- `datetime.of(a, m, j)` crée une date ; `datetime.now()` donne l'instant présent.
- `year()`, `month()`, `day()`… lisent les morceaux ; `add_days(n)`… calculent une autre date.
- `b - a` donne des millisecondes ; `a.days_until(b)` donne des jours.
- `format` et `parse` passent du texte à la date et inversement.
- Tout est en UTC.
