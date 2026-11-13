---
title: "Announcing packstruct v1.1.1"
description: "The packstruct v1.1.1 release post - the requires relevance key and the skip-before-import norm land as SPEC v1.3.0, two memstruct-bound profiles land as SPEC v1.2.0, and the release ladder's verify job stops racing release."
author: "Creadev.org"
lang: "en"
date: 2026-11-12
last_modified_at: 2026-11-12
nav_order: 11
layout: default
version: "1.1.1"
permalink: /discussions/announcing-v1.1.1
---

# packstruct v1.1.1

packstruct is the pack contract for the struct family: one `/packs` system, a spec, a linter, and a conformance harness that many hosts load. v1.1.1 is a patch on the 1.1.0 line - no `schemaVersion` move, and a host that declares nothing is byte-identical to before. This cut lands the `requires` relevance key, fixes the release ladder's verify race, and gives the site a plain-language front door. This post ships with the v1.1.1 tag: npm has the tarball by the time you read it.

```bash
npm i -g packstruct
```

## What landed

**The `requires` relevance key and the skip-before-import norm (SPEC v1.3.0).** One additive manifest key - `requires`, an array of kebab-case capability tokens a pack needs from its run root (for example `"requires": ["wordpress"]`) - plus the lifecycle norm that gives it meaning. A conforming loader whose run root declares a non-empty `provides` MUST skip, before import, any pack whose `requires` is not a subset of `provides` (and any pack named in an explicit `ignore` deny-list, which wins). The skip is reportable, and a run root that declares neither is unchanged. The mechanism is the honest inverse of a `.packignore` deny-list: it fails CLOSED (a newly shipped pack naming an unmet capability skips itself, with no per-run-root upkeep) and it travels WITH the pack (a manifest field, so lint sees it). The vocabulary is host-owned and free-form - the spec never forks a shared capability list. `packstruct lint` shape-checks the tokens and assigns them no meaning. The `audit-conformance` bundle is now 10 cases (3 accept); five new refusal-matrix rows pin the shape rules both ways, and packstruct and crashtest agree on all five.

**Two memstruct-bound profiles: `memory` and `sync` (SPEC v1.2.0).** packstruct now declares four profiles, not two. `memory` (default export `{ records: [Record] }`) is a durable store; `sync` (default export `{ merge(local, remote) }`) is a pure reconciliation. Both bind the host-owned memstruct standard - the record grammar and the four-property merge contract - by linking to it, the same one-address rule the `scenario` profile applies to crashtest's contract. A sync pack is graded by `memstruct audit-merge`, not by any packstruct lane.

**The release ladder's `verify` job no longer races `release`.** `verify` now declares `needs: [publish, release]`, so it waits for the GitHub release object and its attached tarball before judging them. A bare `needs: publish` ran `verify` concurrently with `release`: on a fresh cut the registry read replicas had not settled and the asset was not yet attached, so a publish that in fact succeeded failed red and needed a manual re-run. The propagation poll budgets also widened (release-attach 120s -> 300s, registry 120s -> 360s).

**`--deep` now censuses a memory-profile pack's record ids.** The id census walked `attacks[]`, `checks[]`, and `scenarios[]` but never `records[]`, so a duplicate record id within a pack and a cross-pack record collision both passed `--deep` as a vacuous green. Both enumeration sites now read one shared `ID_BEARING_KEYS` list, and two fixtures pin it - reverting the key list fails `test/run.mjs` by name.

## Also in this round

The site gains three audience tiers (`/start` for the absolute beginner, `/extend` for builders, `/enterprise` for fleets), prefilled GitHub issue forms built in the browser (nothing is POSTed from the site), and a reworked pack catalog that lists all nine hosts with their real pack counts. The site's SEO surface is now warning-clean: the prestruct audit went from 22 warnings to 0, and prerender covers 14/14 routes. The `.gitignore` docs block carries the in-tree Jekyll and pagefind products, and `.github/workflows/staging-ff-sync.yml` keeps `main == staging` after every promote.

## Links

- Repo and docs: https://github.com/dhaupin/packstruct / https://docs.creadev.org/packstruct
- Release posts: https://docs.creadev.org/packstruct/discussions
- Changelog: https://github.com/dhaupin/packstruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/packstruct/issues
