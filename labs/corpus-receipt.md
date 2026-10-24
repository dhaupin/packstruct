# Reciprocal corpus receipt (dhaupin/packstruct#3)

House law: the receipt and the lane land in the same commit - the receipt
proves the lane, the lane keeps the receipt true.

## The run

- Command: `node bin/cli.mjs lint <crashtest-checkout>/packs`
- Corpus: `dhaupin/crashtest` all 8 shipped packs under `packs/public/`
  (`crashtest-site`, `cve-feed`, `wp-money-shapes`, `next-middleware-shapes`,
  `vite-dev-shapes`, `qs-shapes`, `wp-roles`, `wp-stock-smoke`)
- Corpus tree pinned: `fc93ca6e2c213ee296c65ed95c19d929148ff665`
  (the `src/packs/loader.js` revision the SPEC receipts cite)
- Output: `packstruct lint: 8 pack(s) checked in .../packs` - exit 0,
  zero violations
- Local run date: 2026-10-24
- Context receipts: crashtest#19 audit (8/8 schemaVersion 1, name == dir,
  entry exists, 44 ids, zero collisions) - unchanged, this run re-confirms
  the manifest side through the packstruct linter itself.

## Reading

The issue predicted the gate "lands green on day one and only guards the
future." That is exactly what happened: the #19-conforming corpus passes
the packstruct#-as-shipped linter with no corpus-side changes. The CI lane
(`.github/workflows/corpus.yml`) re-runs this against the same pinned rev
on every `main` push, so any packstruct linter change that would start
refusing the live corpus becomes visible in lint-CI immediately.

## Deep receipt (packstruct#2 lands on the same lane, 2026-10-24)

- Command: `node bin/cli.mjs lint <crashtest-checkout>/packs --deep --json`
- Output: `{mode: deep, packsChecked: 8, modulesProbed: 8, idsCensused: 44, violations: []}` - exit 0.
- Reading: 44 ids censused, zero collisions - the crashtest#19 id-space
  census independently reproduced through packstruct's own linter (the
  corpus modules are probed in-process; their relative imports resolve
  inside the pinned tree, which is why the lane pins the full repo).
- CI: the corpus lane runs this as its second step.

## --against receipt (packstruct#2's host-library census, 2026-10-24)

- Command: `node bin/cli.mjs lint <crashtest-checkout>/packs --deep --against <crashtest-checkout>/src/scenarios/library`
- Output: exit 0 - `8 pack(s) checked - 8 module(s) probed, 44 id(s) censused, 63 library id(s) seeded`, zero violations.
- Reading: the 44 pack ids vs the 14-module built-in library: **zero
  collisions**, still - the second crashtest#19 head-claim reproduced
  end-to-end through the CLI. Census-floor note, documented so nobody
  re-litigates it later: 63 library ids are seeded because the probe
  counts module names + attack names + step names; #19's "49" counts
  attacks only. A taxonomic difference, not a contradiction - and the
  collision CHECK is identical (id vs id).
- CI: the corpus lane runs this as its third step.

## Boundaries (one truth per concern)

- Zero runtime dependencies: the lane clones pin first (`actions/checkout`
  with `repository:`/`ref:`), runs the zero-dep CLI, and keeps no import
  from the crashtest codebase.
- The refusal matrix (which side refuses which hostile shape, in one golden
  fixture set) is the larger half of #3 and stays open; this lane is the
  non-hostile half landing first.
