---
title: "Security: what is checked"
group: "Guides"
---

# Security: what is checked

This page keeps the result of the security reviews (see also
[`SECURITY.md`](https://github.com/quenti77/qlang/blob/main/SECURITY.md) to report a vulnerability). It says what was
looked at, what was fixed and what is left to whoever writes the program.

## Cryptographic primitives (`Crypto`, JWT)

Review of `crates/qlang-cli/src/signature.rs`, the `Crypto` of the prelude and `jwt.q` of `qlang-std`.

- **Nothing is written by hand**: the signatures (RSA PKCS#1 and PSS, ECDSA P-256 and P-384, Ed25519) and HMAC come
  from `ring`, which compares HMAC signatures in constant time. RSA keys under 2048 bits are refused by `ring`.
- **The code that reads keys** (PEM, JWK, DER) only does bounded reading: an inconsistent length gives an error, not
  an out-of-bounds access (tested, and covered by the sweeps of `mutation_fuzz`). A wrong key format is a clear error,
  a wrong signature is `false`.
- **`Crypto.equal` and `Crypto.equal_bytes`** look at every byte whatever the first difference is (only the length can
  be told from the time).
- **Fixed**: `Crypto.verify` with an **empty** HMAC secret returned `true` for a signature made with an empty secret,
  whereas `sign` refused it. A secret read from a missing environment variable (`""`) would have let anybody forge a
  valid token. `verify` now returns an error, like `sign`.
- **JWT (`qlang-std`)**: the algorithm is the one of the keys you give, never the one the token asks for (`none` is
  refused, a public key is never taken for an HMAC secret: the classic algorithm confusion attack); `exp` is required
  by default; an HMAC secret must be at least as long as its hash.
- **Left to you**: choosing a long random secret (`Crypto.token`), keeping it out of the code, rotating keys (`kid`).

## HTTPS (TLS)

`qlang serve` speaks plain HTTP, on purpose: the certificate, its renewal and the TLS settings are the job of a
reverse proxy (Caddy, nginx, Traefik, your host's load balancer), which talks to qlang on the machine. Start qlang on
the local address (`--bind 127.0.0.1`) so that only the proxy reaches it, and have the proxy itself replace
`X-Forwarded-For` / `X-Forwarded-Proto` (Caddy's `reverse_proxy` does; nginx: `proxy_set_header X-Forwarded-For
$remote_addr;` `proxy_set_header X-Forwarded-Proto $scheme;`). In the program, `qlang-std` has `web/proxy.q`
(`is_https`, `client_ip`, `redirect_to_https()`) and the session cookies take `Secure`. TLS built into `qlang serve`
is not done.

## Permissions

A qlang program can only do what its host lets it:

| Capability | Who grants it | Checked |
| --- | --- | --- |
| Read and write files (`fs`), `import` | `qlang run` and `serve`: the whole readable disk; `--root DIR`: that folder | test `fs_stays_inside_the_root`: `..`, absolute paths and symbolic links to the outside are refused |
| Start a program (`Process.run`) | `--allow-process` only (`qlang run`, `test`, `serve`); never the JSON protocol, the browser or `qlang.toml` | compile error `T250` without the permission |
| `extern` commands of a `qlang.toml` | asked once at the terminal and remembered by file, name and command (a changed command asks again); without a terminal, `--trust-externs` | `--extern CMD` on the command line is the user's own choice |
| Time and memory | `--max-steps`, `--max-memory` | stop with `R904` |
| Network, database, environment variables | granted to the program as soon as it runs with the `qlang` command; absent from the JSON protocol and the browser | |

Worth knowing:

- `--root` does **not** confine a program started with `--allow-process`: a command it starts sees the whole disk and
  has no step or memory limit (one minute at most). Granting `--allow-process` is granting access to the machine.
- `--root` does not limit packages (`qlang.toml`): the project chooses them.
- The server has no TLS or authentication of its own: see [Deploying](../46-deployer/) for putting a proxy in front.
