---
title: "Deploying an application"
group: "Guides"
---

# Deploying an application

A qlang application in production is up to three processes that read the same configuration: the **web** process
(`qlang serve`), a task **worker** (`qlang run`) and a **scheduler** (`qlang run`). A reverse proxy holds the HTTPS
certificate in front. The whole example of this page is in
[`qlang-std/examples/deploy`](https://github.com/quenti77/qlang-std/tree/main/examples/deploy) (one image, a
`docker-compose.yml`, a `Caddyfile`, three systemd units).

## What `qlang serve` does for you

```sh
qlang serve main.q --bind 127.0.0.1 --port 8080 --workers 2 --compress --log-format json
```

- The **workers** are independent copies of the program (nothing is shared: use a database, Redis or a file for
  what must be common). About one per core.
- `SIGTERM` stops accepting and **finishes the requests in progress**: a redeployment cuts nothing.
- `--max-body`, `--max-connections`, `--read-timeout`... bound what a client can do; `--max-steps` and
  `--max-memory` bound a runaway program.
- `--db-pool N` shares at most N PostgreSQL/MySQL connections between all the workers (default: one per worker).
- Logs go to the error output, one JSON object per line with `--log-format json`.

## Configuration comes from the environment

```qlang-ref
let database_url = env.get("DATABASE_URL") ?? "sqlite://app.db"
let redis_url = env.get("REDIS_URL")
let secret = env.get("APP_SECRET") ?? panic("APP_SECRET is required")
```

No secret in the code or the image: `EnvironmentFile=/etc/app.env` with systemd, `environment:` or secrets with
Docker. Changing `APP_SECRET` signs everybody out.

## Status pages, for the platform

```qlang-ref
let health = hl.Health.new()
health.check("database", hl.db_check(db))
health.mount(app, "/health")
```

`/health/live` always answers `200` (if it is silent, restart); `/health/ready` answers `503` when a dependency is
down (if it fails, stop sending requests, do not restart). `Metrics` exposes `/metrics` for Prometheus, to be
protected by a token.

## HTTPS: a proxy in front

`qlang serve` speaks plain HTTP, on purpose. Start it on `127.0.0.1` behind Caddy (which gets and renews the
certificate by itself):

```
app.example.org {
	encode zstd gzip
	reverse_proxy 127.0.0.1:8080 {
		health_uri /health/ready
		flush_interval -1
	}
}
```

The proxy must **replace** `X-Forwarded-For` and `X-Forwarded-Proto`. In the program, `@std/web/proxy.q` reads
`is_https(req)` and `client_ip(req)`, and the session cookie takes `secure: true`.

## Docker

The official image `ghcr.io/quenti77/qlang` only holds `qlang`, as an unprivileged user. An application image takes
it as its base:

```
FROM ghcr.io/quenti77/qlang:latest
WORKDIR /app
COPY . /app
EXPOSE 8080
CMD ["serve", "main.q", "--bind", "0.0.0.0", "--port", "8080", "--workers", "2", "--compress"]
```

(`ENTRYPOINT` is `qlang`, so `CMD` only holds the arguments.) The same image runs the three processes with another
command: `["run", "worker.q"]`, `["run", "scheduler.q"]`. Give the web process `stop_grace_period: 30s` and the worker
more, since it finishes the task it is doing after `SIGTERM`.

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

A similar unit for the worker (`TimeoutStopSec=120`) and the scheduler.

## Deployment day

1. `qlang self-update --version X.Y.Z` (or the tagged image) on the machine; `qlang = "X.Y"` in the `[package]`
   of `qlang.toml` refuses to start with a `qlang` older than the project.
2. `qlang install` fetches the packages at the commits of `qlang.lock`.
3. **Migrations once**, not when each worker starts: `qlang run console.q -- db:migrate`.
4. Restart the web process (`SIGTERM` finishes the requests in progress), then the worker.
5. Look at `/health/ready` and the logs.

## What is left to you

Database backups, secret rotation, monitoring (alerts on `/metrics` and the logs) and updating `qlang` itself: see
the [security guide](https://github.com/quenti77/qlang/blob/main/docs/security.md) and the
[release policy](https://github.com/quenti77/qlang/blob/main/docs/release.md).
