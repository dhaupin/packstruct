---
title: "Family status dialect"
description: "family-status@1: every struct-family member serves its committed-ledger verdicts at /status.json, generated on every web build, and reads the others' files with the same schema."
author: "Creadev.org"
lang: "en"
date: 2026-10-29
last_modified_at: 2026-10-29
nav_order: 6
layout: default
version: 1.1.0
permalink: /status
---

# Family status dialect

packstruct adopted the family status dialect (`family-status@1`) so every member of the struct family can read every other member's adversarial verdicts without a server, a dashboard product, or any trust beyond "the committing repo's own CI ran its own battery".

The contract, in three rules:

1. every member serves a machine-readable `status.json` at the fixed path `/status.json` on its site;
2. that file is generated, never hand-edited, by the member's own web build, straight from the committed ledgers;
3. every member's status page reads the others' files and renders their numbers (or their absence) honestly.

Humans read `/status`; agents and machines read `/status.json`. Both get the same numbers, because both read the same generated file.

## The dialect: `family-status@1`

One JSON object per repo. `schema` is 1 and `contract` is the string `family-status@1` - a reader that sees either field missing or renamed refuses and shows "not serving the dialect", never a guessed row.

| field | shape | meaning |
|--------|---------|-------------|
| `schema` | `1` | the dialect's schema pin, additive-first |
| `contract` | `"family-status@1"` | the contract name a reader matches |
| `repo` | string | the GitHub repo the file describes |
| `site` | URL | the member's own status page (where a human reads it) |
| `docs` | URL | the doc page explaining the member's legs |
| `asOf` | short sha | the commit the generator last saw (`worktree` when no git context - never a fake sha) |
| `legs` | array | one row per adversarial leg, below |
| `packs` | array | one row per committed pack, below |

A leg row:

| field | shape | meaning |
|--------|---------|-------------|
| `leg` | string | the leg's slug (`crashtest`, `refusal-matrix` in packstruct's file) |
| `verdict` | `"PASS"` or `"RED"` | derived from the ledger rows: every case REFUSED, PASSED, or BOUNDED is a pass; anything else degrades the leg to RED |
| `cases` | integer | ledger row count for that leg |
| `counts` | object | verdict-tallied row counts, straight from the rows |
| `ledger` | path | the committed ledger file the numbers came from, repo-relative |

A pack row:

| field | shape | meaning |
|--------|---------|-------------|
| `name` | string | the pack slug (SPEC v1: kebab-case, equals the directory) |
| `spec` | `"packstruct@1"` | the grammar every family pack loads under |
| `manifest` | path | the pack's `pack.json`, repo-relative |
| `cases` | integer | this pack's ledger row count |

That last table is the "understand each other's packs" clause: because every family pack lives at `packs/public/<name>/pack.json` under the packstruct@1 grammar with ids namespaced by pack slug, a member's `packs` array is directly readable by any other member with no bespoke understanding - the same normalization packstruct itself enforces.

## packstruct's legs

- **crashtest** (`labs/crashledger.json`) - the dogfood run of the `packstruct-lint-shapes` pack against the real CLI, plus the crashtest harness's generic probe catalog. Every finding REFUSED is a pass.
- **refusal-matrix** (`labs/refusal-matrix.packstruct.json`) - the self-verifying battery: 18 hostile/spec-allowed shapes, each row's observed verdict generated from an ACTUAL linter run. A row is honest or the generator refuses to write the file; the emitter maps `honest: true` to PASSED and `honest: false` to a RED.

## The refusal rules (what a reader may assume)

- The file carries no prose, no marketing, no history - only the ledger rows the repo's CI reconciles against on every push.
- `asOf` is a truth: `worktree` means no git context existed at generation; a sha means the generator read that commit's ledgers.
- A missing sibling row means "not serving the dialect yet" - a reader renders the absence, never invents a PASS.
- The member serves `/status.json` with `Access-Control-Allow-Origin: *`, on the miss path included, so a not-yet member reads as an honest HTTP 404 at the reader instead of an opaque network failure.
- Numbers are only as fresh as the member's last web deploy; the receipt-grade freshness always lives in the git ledger files themselves.

## How packstruct serves it

- the generator: `web/scripts/build-status.mjs` (zero deps) reads `labs/crashledger.json` + `labs/refusal-matrix.packstruct.json` + every `packs/public/*/pack.json`, refuses a committed pack with zero ledger rows loudly, and writes `web/public/status.json`;
- the wiring: `web build` runs the generator first (before prerender); the generated file is gitignored - committing it would recreate the stale-copy drift class this whole family exists to prevent;
- the page: the [live status](https://packstruct.creadev.org/status) page renders packstruct's own gate from the committed ledgers and the family rows from the served files;
- the battery: `test/status.test.mjs` pins the emitter's behavior with temp-dir fixtures (verdict derivation, refusal cases) and re-checks the real tree's emitted counts against the live ledgers, so the dialect itself is under CI the same way every count here is.
