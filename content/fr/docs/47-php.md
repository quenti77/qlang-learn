---
title: "qlang pour les développeurs PHP"
group: "Guides"
---

# qlang pour les développeurs PHP

Si tu écris du PHP (Laravel, Symfony), la plupart de ce que tu fais a un équivalent. Cette page donne les
correspondances et, surtout, les endroits où l'habitude de PHP te piège.

## Les équivalences

| PHP | qlang |
| --- | --- |
| `echo`, `print_r` | `print(x)` (affiche aussi les tableaux et structures) |
| `$x = 1;` | `let x = 1` (typé : `let x: int = 1`) |
| `array(...)` (liste ou dictionnaire) | deux types : `array<T>` pour une liste, `map<K, V>` pour un dictionnaire |
| `$a ?? $b` | `a ?? b` (identique) |
| `null` | `none`, mais seulement dans un type nullable : `string?` |
| exceptions, `try`/`catch` | des valeurs : `Result<T, Error>` et l'opérateur `?` |
| `json_encode`, `json_decode` | `Json.of(x).to_text()`, `Json.parse(texte)` |
| `preg_match` | `regex.matches`, `regex.find`, `regex.find_all` |
| `DateTime`, `Carbon` | `datetime` (UTC) et `Zone` pour les fuseaux |
| `password_hash` | `Password.hash`, `Password.verify` |
| `PDO` | `Db.connect("sqlite://…" / "postgres://…" / "mysql://…")` |
| Eloquent, Doctrine | `@std/web/query.q` et `relations.q` (constructeur de requêtes, pas d'ORM complet) |
| Composer, `composer.json` | `qlang.toml`, `qlang add`, `qlang install`, `qlang.lock` |
| `php artisan make:…` | `kit make controller|model|migration…` (voir [kit](../43-kit/)) |
| `php artisan serve`, PHP-FPM | `qlang serve main.q --workers N` |
| `php artisan migrate` | `db:migrate` de `@std/web/commands.q` |
| files d'attente, `schedule:run` | `@std/queue.q`, `@std/schedule.q` |
| PHPUnit, Pest | `qlang test` et [`qlang-test`](../44-tests/) |
| sessions, CSRF, middleware | `@std/web/session.q`, `csrf_protect`, `app.use(...)` |
| `Log::info` (PSR-3) | `Log.info`, `Log.error`, avec un contexte JSON |

## Les pièges

- **Tout est typé, rien n'est converti en silence.** `"5" + 1` est une erreur, pas `6`. Convertis à la main :
  `int.parse("5")` rend un `int?` (`none` si ce n'est pas un nombre).
- **`/` est la division décimale.** `7 / 2` fait `3.5` ; pour la division entière, `7 div 2` (et `%` pour le reste).
- **Pas d'exceptions.** Une fonction qui peut échouer rend un `Result`. Le `?` renvoie l'erreur au
  appelant ; `unwrap()` arrête le programme si c'est une erreur (comme une exception non attrapée).
- **`none` n'est pas partout.** Une variable `string` ne peut jamais être `none` ; il faut `string?` et le
  compilateur t'oblige à tester avant d'utiliser.
- **Les tableaux et les dictionnaires sont distincts.** `[1, 2]` n'est pas `{"a": 1}`. Un dictionnaire rend
  un `T?` quand tu lis une clé : `d["a"] ?? 0`.
- **`{` et `}` dans une chaîne interpolent.** `"valeur : {x}"` ; pour des accolades littérales, `\{` et `\}`.
- **Les workers ne partagent rien.** Une variable globale n'est pas commune à toutes les requêtes comme un
  tableau statique de PHP-FPM le serait… ni même entre deux requêtes de **workers différents**. Pour ce qui doit
  durer : une base, Redis, ou un cache partagé (`Cache.redis`).
- **Les entiers font 64 bits et débordent en erreur**, ils ne deviennent pas des flottants.
- **Des mots sont réservés** (`step`, `from`, `then`, `end`, `public`…) : un champ ne peut pas s'appeler
  `end`.
- **Un fichier n'est importé que s'il exporte** : `export total` à la fin de `cart.q`.
- **Pas de globales magiques** : pas de `$_GET` ; la requête est l'argument `req` de ta fonction.

## Par où commencer

1. Le [guide web](../36-web-demarrer/) fait une API complète, des routes aux tests.
2. [Recettes](../45-cookbook/) pour les petites choses du quotidien.
3. [Déployer](../46-deployer/) pour la production.
