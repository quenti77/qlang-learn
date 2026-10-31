---
title: "Packages: using and publishing"
group: "Guides"
---

# Packages: using and publishing

qlang has no package server: a package is a **git repository** with a `qlang.toml` and **one tag per version**
(`v1.2.3`). A small **index** (`packages.json` in the qlang repository) says which repository carries which name, so
that `qlang search`, `qlang info` and `qlang add name` work. The index holds no code: the package is fetched by git,
pinned in `qlang.lock` and checked.

## Using a package

```sh
qlang search json     # the packages of the index (name, description, licence, repository)
qlang info std        # licence, keywords, available versions, how to add it
qlang add std         # adds it with the most recent compatible version
qlang install         # fetches exactly the commits of qlang.lock
qlang update          # moves forward within the asked ranges
qlang verify          # are the installed packages those of qlang.lock, with no file changed?
```

### Version constraints

```toml
[dependencies]
std    = { git = "https://github.com/quenti77/qlang-std", version = "^0.19" }
text   = { git = "https://github.com/x/text", version = ">=1.2, <2" }
pinned = { git = "https://github.com/x/pinned", tag = "v1.0.0" }
local  = { path = "../local" }
```

A constraint picks the highest `vX.Y.Z` tag that satisfies it. `^1.2` is `>=1.2.0, <2.0.0`; `^0.2.3` is
`>=0.2.3, <0.3.0`; `~1.2.3` is `>=1.2.3, <1.3.0`; `1.2` alone means `^1.2`; `>=`, `>`, `<=`, `<`, `=` and `*` exist,
separated by commas. A pre-release (`v1.3.0-rc.1`) is only chosen if the constraint names one. `qlang.lock` keeps the
constraint and the commit: `qlang install` does not move, `qlang update` chooses again.

If the project and one of its packages ask for the same repository with different ranges, qlang looks for a tag that
satisfies both, and stops saying who asks for what if there is none.

### Integrity, signatures, private packages

- `qlang.lock` pins each package to a **commit**, whose identifier is the fingerprint of the content. `qlang verify`
  also checks that the installed folder is at that commit and that no file was changed.
- `signed = true` demands a **signature git can verify** with the keys you trust (`gpg`, or
  `gpg.ssh.allowedSignersFile`).
- A private repository is fetched over ssh or with a git credential helper. For an **https** repository protected by a
  token: `private = { git = "https://…", version = "^1", token_env = "PRIVATE_TOKEN" }`; the token is given to git for
  that dependency only, over https only, and is written nowhere.

## Publishing a package

1. A public git repository with, in `[package]` of its `qlang.toml`: `name`, `version`, `description`, `license` (an SPDX
   name) and optionally `keywords` and `main`; a `README.md`; a main file that compiles.
2. A tag `vX.Y.Z` on the commit of the version (`git tag v1.2.3 && git push --tags`).
3. `qlang publish` checks all this and writes the entry to propose.
4. A pull request on [`packages.json`](https://github.com/quenti77/qlang/blob/main/packages.json) with that entry.

## What the index promises

Anyone can list a package with a pull request (free name, public https repository, description and licence given,
`qlang publish` passing). The index **does not read the code**: a package is code that runs on your machine, so pin a
version and use `signed = true` when the author signs. For a problem, an entry can carry `"yanked": ["v1.2.0"]` (a new
resolution no longer picks that version, existing `qlang.lock` files keep working) or `"removed": "reason"` (the
package disappears from the search and `qlang add` refuses it). The details are in
[`docs/registry.md`](https://github.com/quenti77/qlang/blob/main/docs/registry.md).
