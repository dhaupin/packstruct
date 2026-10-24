# The joined refusal matrix (golden set) - dhaupin/packstruct#3

Folded 2026-10-24 from two ACTUAL validator runs over the same battery
bytes - never hand-derived:

- **packstruct column**: `scripts/gen-refusal-matrix.mjs` (the
  self-verifying battery: refuses its own run if any row's observed verdict
  disagrees with its expectation). Regenerated after the fold fixes.
- **crashtest column**: dhaupin/crashtest#25 (Rook's fold comment,
  2026-10-24) - observed from `src/packs/loader.js` over the materialized
  battery files.

The machine-readable set lives in `refusal-matrix.golden.json`.

## Tally (18 rows)

| Status | Count |
|---|---|
| agree | 11 |
| documented-divergence | 6 |
| re-verified-after-fix | 1 (schemaVersion-missing - the #25 observation ran our pre-fix battery bytes; the fix landed in this fold and their re-run is requested) |

## Agreeing rows (the shared floor)

`schemaVersion` wrong/missing, entry escape/missing (the crashtest#16 class
- theirs at import, ours at file-existence), malformed JSON, extra keys
minimum-spec, host-owned `env` acknowledged, two-part version, `armedByKey`
present.

## Documented divergences (findings, not fights)

- **version-major-only** - the manifest norm (SPEC section 2, 8/8 pack
  reality; and the pack's OWN semver per section 6) vs the engine's
  inventory-only treatment. Doc: the pack-version row is
  enforced-vs-pack-reality on the SPEC receipts.
- **description-empty** - a spec-side tightening: the engine requires
  presence + string only; the linter adds non-empty.
- **armedByKey-non-string** - the linter keeps the SPEC's 'optional STRING'
  type rule; the engine validates nothing about the key.
- **name-dir-mismatch** - the one true enforcement gap on record: engine
  keys the `seen` map by manifest.name only; the 8/8 dir match was the
  #19 data-level invariant. Registry doc: engine parity is the
  engine-first question for the crashtest#19 chain.
- **manifest-missing / missing-public-dir** - the engine's WIP-friendly
  local/ contract (quiet skip, optional visibility roots) vs the linter's
  author-time directory contract: a PUBLIC pack without a manifest is
  never legitimate; WIP loose dirs belong to local/, not public/.

## What the fold changed in packstruct (the point of the exercise)

1. **Battery integrity bug fixed**: the portable battery emitter now uses
   the same drop-aware manifest serialization as the materializer - the
   schemaVersion-missing file can no longer carry the key its row promises
   is gone (found by the #25 re-observation of our own bytes).
2. **`armedByKey` de-invented**: the non-empty refusal was a check the SPEC
   never promised; empty = present-not-yet-armed (engine treatment), prefs
   folded so both columns accept. SPEC section 2 reworded; generator row
   expectation updated, type-check row added; the web island honored too.

The teeth: the matrix structurally cannot go stale - the generator's
refusal-on-self-disagreement rule runs in CI on every push.
