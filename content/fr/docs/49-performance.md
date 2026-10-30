---
title: "Performance : mesurer et régler"
group: "Guides"
---

# Performance : mesurer et régler

qlang est un interpréteur : il parcourt l'arbre du programme, et les fonctions et boucles qui ne calculent qu'avec des
`int`, des `float` et des `bool` sont compilées à la volée en instructions sur des registres typés. Cette page dit
comment **mesurer** un programme et le serveur, ce que les chiffres montrent et comment **régler** un déploiement.
Les détails de l'interpréteur (les lots d'optimisations, la machine à registres) sont dans
[`docs/performance.md`](https://github.com/quenti77/qlang/blob/main/docs/performance.md) du dépôt.

## Mesurer un programme

Les programmes de `benches/` du dépôt couvrent les cas courants (appels récursifs, boucles, tableaux, structures,
chaînes, dictionnaires). Pour comparer deux binaires, en gardant le meilleur de 5 passages :

```sh
python3 benches/compare.py chemin/vers/qlang-reference ./target/release/qlang
```

Pour savoir *où* part le temps, `perf` échantillonne le processus :

```sh
CARGO_PROFILE_RELEASE_DEBUG=true cargo build --release -p qlang-cli
perf record -e cpu-clock:u -F 2000 -o perf.data target/release/qlang run benches/fib.q
perf report -i perf.data --no-children --stdio --percent-limit 2
```

Comparez toujours avec un binaire construit de la même façon : les archives publiées sont compilées en `musl`, dont
l'allocateur est plus lent que celui de `glibc`.

## Écrire un calcul rapide

- Les boucles et fonctions qui n'utilisent que des `int`, des `float` et des `bool` (sans appeler autre chose que des
  fonctions de même nature) sont compilées : un calcul numérique va bien plus vite qu'un traitement qui manipule
  surtout des structures.
- Les textes sont aussi pris en charge par la machine à registres pour les opérations courantes (littéraux, `+`,
  comparaisons, interpolation, `print`, méthodes usuelles), et elle sait créer des tableaux dans une boucle : une
  boucle de traitement de texte reste rapide.
- Une base de données ou le réseau dominent presque toujours : mesurez avant d'optimiser du calcul.

## Mesurer le serveur

Le banc de charge est `benches/http_load.py`. Il lance le serveur sur `benches/http/app.q`, ouvre des connexions
persistantes depuis plusieurs processus clients, et compte les requêtes par seconde, la latence (p50, p95, p99,
maximum), les erreurs et la mémoire du serveur, relevée chaque seconde.

```sh
cargo build --release -p qlang-cli
python3 benches/http_load.py --workers 4 --connections 32 --duration 10
python3 benches/http_load.py --duration 300 --scenario json,echo --json bench.json   # tenue dans la durée
```

Quatre scénarios : `hello` (un texte, le coût du serveur seul), `json`, `compute` (`fib(18)` à chaque requête : du
calcul pur) et `echo` (un `POST` de 512 octets rendu tel quel). La dernière colonne (`MB/min`) est la croissance de la
mémoire : une fuite la ferait monter.

Mesuré sur une machine de bureau à 12 cœurs, client Python sur la même machine (**un ordre de grandeur, pas une
promesse**) :

| Scénario | 1 worker | 4 workers | p99 (4 workers) |
| --- | --- | --- | --- |
| `hello` | 87 000 req/s | 92 000 req/s | 0,8 ms |
| `json` | 35 000 req/s | 82 000 req/s | 1,1 ms |
| `compute` (`fib(18)`) | 3 000 req/s | 8 800 req/s | 4,9 ms |
| `echo` (512 octets) | 69 000 req/s | 89 000 req/s | 0,9 ms |

Tenue dans la durée : 90 secondes de `json` puis de `echo` avec 4 workers (environ 7 millions de requêtes chacun)
laissent la mémoire du serveur à 22 Mo du début à la fin, sans erreur.

## Ce que ces chiffres disent

- Pour `hello` et `echo`, le **client** Python est le facteur limitant : le serveur va au moins à ce débit.
- **Un worker exécute une requête à la fois.** `compute` (3 ms de calcul) plafonne à environ `1 / 3 ms` par worker et
  monte avec `--workers`. Une requête lourde retarde celles qui attendent le même worker : c'est le p99.
- Sont **hors** du banc : TLS (fait par le proxy), la base de données, les WebSockets, les requêtes de plusieurs
  mégaoctets.

## Régler un déploiement

- **`--workers N`** : environ un par cœur ; plus si les requêtes attendent surtout la base ou le réseau.
- **`--db-pool N`** : avec PostgreSQL ou MySQL, partage au plus N connexions entre les workers au lieu d'en ouvrir une
  par worker (SQLite n'est pas concerné).
- **`--no-access-log`** : la ligne par requête coûte. En production, `--log-format json` et le middleware `logging()`
  donnent la même information en structuré.
- **`--compress`** : gzip des réponses texte de 1 Ko ou plus, au prix d'un peu de calcul.
- **Les bornes** : `--max-body`, `--max-headers`, `--read-timeout`, `--idle-timeout` et `--max-connections`, pour qu'un
  client lent ou volumineux ne bloque pas les autres. `--max-steps` et `--max-memory` protègent d'un programme qui
  s'emballe.
- **Du travail lent hors de la requête** : mettez-le dans la file de tâches (`@std/queue.q`) pour répondre tout de suite.
- **Des fichiers volumineux** : `Response.file(chemin)` laisse le serveur les lire par morceaux, sans les charger en
  mémoire ni occuper le worker.

Voir aussi [Déployer une application](../46-deployer/).
