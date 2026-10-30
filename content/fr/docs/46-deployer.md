---
title: "Déployer une application"
group: "Guides"
---

# Déployer une application

Une application qlang en production, ce sont jusqu'à trois processus qui lisent la même configuration : le **web**
(`qlang serve`), un **worker** de tâches (`qlang run`) et un **planificateur** (`qlang run`). Un proxy inverse
garde le certificat HTTPS devant. Tout l'exemple de cette page est dans
[`qlang-std/examples/deploy`](https://github.com/quenti77/qlang-std/tree/main/examples/deploy) (une image,
un `docker-compose.yml`, un `Caddyfile`, trois unités systemd).

## Ce que `qlang serve` fait pour toi

```sh
qlang serve main.q --bind 127.0.0.1 --port 8080 --workers 2 --compress --log-format json
```

- Les **workers** sont des copies indépendantes du programme (rien n'est partagé : une base, Redis ou un fichier
  pour ce qui doit être commun). Compte à peu près un par cœur.
- `SIGTERM` arrête d'accepter et **finit les requêtes en cours** : un redéploiement ne coupe rien.
- `--max-body`, `--max-connections`, `--read-timeout`… bornent ce qu'un client peut faire ; `--max-steps` et
  `--max-memory` bornent un programme qui s'emballe.
- `--db-pool N` partage au plus N connexions PostgreSQL/MySQL entre tous les workers (par défaut : une par worker).
- Les journaux vont sur la sortie d'erreur, un objet JSON par ligne avec `--log-format json`.

## La configuration vient de l'environnement

```qlang-ref
let database_url = env.get("DATABASE_URL") ?? "sqlite://app.db"
let redis_url = env.get("REDIS_URL")
let secret = env.get("APP_SECRET") ?? panic("APP_SECRET est obligatoire")
```

Pas de secret dans le code ni dans l'image : `EnvironmentFile=/etc/app.env` avec systemd, `environment:` ou des
secrets avec Docker. Changer `APP_SECRET` déconnecte tout le monde.

## Les pages d'état, pour la plateforme

```qlang-ref
let health = hl.Health.new()
health.check("database", hl.db_check(db))
health.mount(app, "/health")
```

`/health/live` répond toujours `200` (si elle se tait, redémarre) ; `/health/ready` répond `503` quand une dépendance
ne va pas (si elle échoue, n'envoie plus de requêtes, ne redémarre pas). `Metrics` expose `/metrics` pour Prometheus,
à protéger par un jeton.

## HTTPS : un proxy devant

`qlang serve` parle HTTP en clair, c'est un choix. Démarre-le sur `127.0.0.1` derrière Caddy (qui obtient et renouvelle
le certificat tout seul) :

```
app.exemple.fr {
	encode zstd gzip
	reverse_proxy 127.0.0.1:8080 {
		health_uri /health/ready
		flush_interval -1
	}
}
```

Le proxy doit **remplacer** `X-Forwarded-For` et `X-Forwarded-Proto`. Côté programme, `@std/web/proxy.q` lit
`is_https(req)` et `client_ip(req)`, et le cookie de session prend `secure: true`.

## Docker

L'image officielle `ghcr.io/quenti77/qlang` ne contient que `qlang`, en utilisateur non root. Une image
d'application la prend comme base :

```
FROM ghcr.io/quenti77/qlang:latest
WORKDIR /app
COPY . /app
EXPOSE 8080
CMD ["serve", "main.q", "--bind", "0.0.0.0", "--port", "8080", "--workers", "2", "--compress"]
```

(`ENTRYPOINT` est `qlang`, donc `CMD` ne porte que les arguments.) Le même image lance les trois processus avec
une autre commande : `["run", "worker.q"]`, `["run", "scheduler.q"]`. Donne `stop_grace_period: 30s` au web et plus
au worker, qui finit sa tâche en cours après `SIGTERM`.

## systemd

```
[Unit]
Description=App web
After=network.target
[Service]
User=app
WorkingDirectory=/srv/app
EnvironmentFile=/etc/app.env
ExecStart=/usr/local/bin/qlang serve main.q --port 8080 --workers 2 --compress
KillSignal=SIGTERM
TimeoutStopSec=30
Restart=always
NoNewPrivileges=true
[Install]
WantedBy=multi-user.target
```

Une unité semblable pour le worker (`TimeoutStopSec=120`) et le planificateur.

## Le jour du déploiement

1. `qlang self-update --version X.Y.Z` (ou l'image étiquetée) sur la machine ; `qlang = "X.Y"` dans le
   `[package]` de `qlang.toml` empêche de démarrer avec un `qlang` plus ancien que le projet.
2. `qlang install` récupère les paquets aux commits de `qlang.lock`.
3. **Les migrations une seule fois**, pas au démarrage de chaque worker : `qlang run console.q -- db:migrate`.
4. Redémarre le web (`SIGTERM` finit les requêtes en cours), puis le worker.
5. Regarde `/health/ready` et les journaux.

## Ce qu'il reste à ta charge

Les sauvegardes de la base, la rotation des secrets, la supervision (alertes sur `/metrics` et les journaux) et
la mise à jour de `qlang` lui-même : voir le [guide de sécurité](https://github.com/quenti77/qlang/blob/main/docs/security.md)
et la politique de [versions](https://github.com/quenti77/qlang/blob/main/docs/release.md).
