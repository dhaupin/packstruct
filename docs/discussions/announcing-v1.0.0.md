---
title: "Announcing packstruct v1.0.0"
description: "The packstruct v1.0.0 release post - the SPEC frozen at schemaVersion 1, a hardened zero-dependency conformance CLI (probe isolation, loader caps), the refusal matrix fully closed, and the first governed-ladder publish with provenance."
author: "Creadev.org"
lang: "en"
date: 2026-10-25
last_modified_at: 2026-10-25
nav_order: 9
layout: default
version: "1.0.0"
permalink: /discussions/announcing-v1.0.0
---

# packstruct v1.0.0

packstruct is the shared `/packs` spec: one manifest, entry, and lifecycle contract so an author who writes one pack knows how packs work everywhere. v1.0.0 is the governed-ladder release: the same frozen spec and two-verb CLI as 0.9.0, hardened by a vulnerability pass, with the manifest contract closed against the engine end-to-end - and the first version to publish through CI instead of by hand.

```bash
npx packstruct lint packs/ --deep --against lib/
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}"
# or install:
npm i -g packstruct
```

## What 1.0.0 changes

**Pack code can no longer drive the linter.** `lint --deep` used to import each declared entry in-process, so a manifest whose entry carried top-level code could hijack the CLI's exit code or hang it forever. Probes now run in a disposable child with a 5s SIGKILL timeout; both crash classes surface as honest `entry-import` refusals naming the entry, and the wire exit code stays the CLI's own (0/1/2, never the pack's).

**Loader chaos is capped, not trusted.** `audit-conformance` hands a shell to a HOST loader - arbitrary code by definition - but a refusal must be instant regardless. A loader that hangs is killed at the 120s audit timeout (neither accept nor refuse), and output above the 1MB spawn buffer counts as no-verdict; both arrive as audit violations naming the case. A loader can no longer surprise the harness with a hang or an output flood.

**The refusal matrix is closed.** The golden fold over crashtest's observed columns finished at **12 agree / 6 documented divergences / 0 pending**: every remaining divergence is a packstruct author-time strictness the engine does not share, annotated row-by-row; nothing is unexplained. Cross-repo receipts stand both ways - crashtest's fixture backfill (8 packs, 36 attacks, CI teeth, crashtest#28) and our independent pass of their head-of-tree through this repo's linter (8/8 packs clean, 8 modules, 44 ids, exit 0).

**The npm surface is the same everywhere.** Consumer examples speak `npx packstruct` across README, site, and docs; the package is linked from the landing, docs nav, and footer; the docs pages and site identity carry the 1.0.0 number.

## The publish lane

The publish lane is the family's, verbatim: no publish secret is stored in the repo. 0.9.0 was the manual `npm publish` that seeded the package (the bootstrap OIDC cannot perform, npm/cli#8544); 1.0.0 publishes via npm Trusted Publishing - tag v1.0.0 and `publish.yml` runs with `id-token: write`, the npmjs.com publisher mapping proves the workflow, the registry attests provenance automatically, the workflow refuses 0.x, verifies the tag matches the version, and skips versions already on npm. After the publish, the same workflow cuts the GitHub Release for the tag with the npm tarball as its asset.

## Tarball facts, stated honestly

Tarball shaping grows from the verified 0.9.0 bytes by exactly one file: same `files` field - the 28-file contract of `bin/`, `src/`, `spec/`, `profiles/`, `conformance/`, LICENSE, no runtime dependencies, the CLI linked by `bin` - where the added `src/run-capped.mjs` is imported by both shipped surfaces (the QC probe/ caps hardening). The receipts stand on the published bytes: `npm view packstruct@1.0.0 dist.integrity` sha512-verified against a fresh pull, the GitHub Release asset sha256-identical to the npm tarball, both CLI verbs exercised from the extracted archive, and the provenance attestation live at the registry.

## Surfaces

- Landing: [packstruct.creadev.org](https://packstruct.creadev.org/)
- Docs: [docs.creadev.org/packstruct](https://docs.creadev.org/packstruct)
- npm: [npmjs.com/package/packstruct](https://www.npmjs.com/package/packstruct)
- Source: [github.com/dhaupin/packstruct](https://github.com/dhaupin/packstruct)

packstruct is made by [Creadev.org](https://creadev.org).
