---
title: "Announcing packstruct v0.9.0"
description: "The packstruct v0.9.0 release post - the shared /packs SPEC plus a zero-dependency conformance CLI (lint --deep --against, audit-conformance), first on npm."
author: "Creadev.org"
lang: "en"
date: 2026-10-24
last_modified_at: 2026-10-24
nav_order: 8
layout: default
version: "0.9.0"
permalink: /discussions/announcing-v0.9.0
---

# packstruct v0.9.0

packstruct is the shared `/packs` spec: one manifest, entry, and lifecycle contract so an author who writes one pack knows how packs work everywhere. v0.9.0 is the first release, and it is on npm now:

```bash
npx packstruct lint packs/
# or install:
npm i -g packstruct
```

Tarball facts, all verified against the published bytes: 27 files, no runtime dependencies, `bin` links the CLI. The repo is [github.com/dhaupin/packstruct](https://github.com/dhaupin/packstruct), the spec text is [spec/SPEC.md](https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md).

## What ships in the CLI

`packstruct lint <packs-dir>` validates every pack under `packs/public/` against the SPEC v1 manifest table: `schemaVersion` 1, kebab-case name matching its directory, dotted `MAJOR.MINOR[.PATCH]` version, non-empty description, and an `entry` path that physically exists - the declar-a-file-that-does-not-ship class, killed at author time instead of surfacing as a loader stack trace. Exit ladder: 0 clean / 1 violations / 2 usage error; `--json` for CI.

`--deep` probes what the manifest pass cannot see: each declared entry is imported once in a disposable child process (pack code runs nowhere near the linter's own process or exit code), the default export is checked, and ids are censused across the corpus for within-pack duplicates and cross-pack collisions. With `--against <library-path>`, the census seeds the host library's ids first, so a pack id claiming a library id refuses at author time.

`packstruct audit-conformance . --loader "<cmd> {packs}"` is the harness half: eight bundled verdict-claiming fixture packs (one clean bundle, one per refusal norm, a name-collision pair) are materialized into scratch roots, and the HOST's own loader command runs over each. A conforming loader exits 0 on clean and exits non-zero naming the pack on every violation - which makes an `implements: packstruct@1` pin verifiable instead of honorary.

## Why the manifest is frozen at v1

The v1 field set is drawn from what crashtest's eight production packs already ship, verified pack-by-pack (8/8 conform, 44 ids, zero collisions against the engine's own library). So v1 is not an invention: crashtest hosts it with zero runtime changes, and poststruct (the check-profile host) adopts it fresh. Extra manifest keys stay minimum-spec - the spec never refuses its hosts' own surface.

## Versioning note, stated plainly

0.9.x is the manual publish ladder. The 1.0.0 tag flips on CI publishing with provenance: the workflow refuses 0.x versions, verifies that the tag matches the package version, and skips versions already on npm. This post describes the released 0.9.0 tarball only.

## Surfaces

- Landing: [packstruct.creadev.org](https://packstruct.creadev.org/)
- Docs: [docs.creadev.org/packstruct](https://docs.creadev.org/packstruct)
- npm: [npmjs.com/package/packstruct](https://www.npmjs.com/package/packstruct)
- Source: [github.com/dhaupin/packstruct](https://github.com/dhaupin/packstruct)

packstruct is made by [Creadev.org](https://creadev.org).

