---
title: "The linter"
description: "packstruct lint validates every pack under packs/public/ against SPEC v1 - schemaVersion, name/dir match, entry existence - with exit codes and JSON output for CI."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-24
nav_order: 3
layout: default
version: 1.0.0
permalink: /linter
---

# packstruct lint

Validates every pack under `packs/public/` against SPEC v1's manifest and
directory contract: schemaVersion 1, kebab-case name matching its directory,
dotted versions, non-empty description, relative entry paths, and that the
entry file physically exists - the crashtest#16 class, killed at author time.

```bash
npx packstruct lint packs/          # human, exit 0/1/2
npx packstruct lint packs/ --json   # { schema, packsChecked, localChecked, violations }

npx packstruct lint packs/ --deep   # + entry import + id census, exit 0/1/2
npx packstruct lint packs/ --deep --json
                                    # { schema, mode, packsChecked, localChecked, modulesProbed, idsCensused, libraryIds, violations }

npx packstruct lint packs/ --deep --against lib/   # + host-library id census

npx packstruct lint packs/ --local  # + the gitignored local/ WIP lane
```

## Exit codes (the contract CI pins)

- **exit 0** - zero violations, clean authoring surface;
- **exit 1** - at least one `VIOLATION` row (the CI gate red). One line per
  violation, `VIOLATION <unit> [<norm>]: <message>` shape stable, grep-able
  and diff-able in CI logs;
- **exit 2** - usage error: a missing directory argument, a typo'd flag
  (packstruct#18), or `--against` without `--deep`. The runs lane stays
  0/1-only.

The `--json` shape is a stable contract too: additive-only evolving (new
keys may appear, existing keys are never repurposed), matching the
MIGRATION-NOTE convention.

## Wrong-argument hints (packstruct#13, #17)

The packs ROOT is the argument, but the natural first gestures - the
`public/` dir itself, one pack dir, the repo root - used to draw a
doubled-segment `directory-contract` refusal (`packs/public/public/...`)
that blamed the hypothetical packs under the argument instead of naming the
fix. Those shapes now answer a `usage` hint that names the probable intent:

```bash
npx packstruct lint packs/public
# VIOLATION packs/public [usage]: 'packs/public' looks like a public/
#   directory itself - pass the packs ROOT (the parent of public/),
#   for example: packstruct lint packs
```

The hint rides the `usage` norm (never `directory-contract`), so it never
reads as a pack defect. A genuinely empty root still refuses
`directory-contract` - the missing-public-dir row of the refusal matrix.

## --local: the WIP lane (packstruct#16)

The default stays public-only. `--local` also lints the gitignored `local/`
lane every consumer repo keeps - the manifests an author is actively
editing, and the ones a public-only walk leaves invisible. Local violations
carry `lane: "local"` in `--json` (and `[local]` in the human readout) so a
CI consumer can tell the lanes apart; public rows stay byte-identical, and
the JSON gains a `localChecked` count alongside `packsChecked`.

## --deep: load-level parity (probe only)

The manifest pass stops at file existence. `--deep` goes as far as the
linter can go without becoming a host:

1. **Probe** each declared entry in a disposable child process (its
   top-level code runs there, never inside the linter - a crashing entry
   cannot take the CLI's exit code with it, and a stalls-at-startup entry
   is killed at the 5s probe timeout instead of hanging the CLI), and name
   the failure the host's loader would have hit (`entry "..." failed to
   import`, or an honest `entry-import` refusal when the entry terminates
   or stalls the probe itself).
2. **Check** the default export exists (SPEC section 3: entry is an ES
   module with a default export).
3. **Census ids** - module names and attack/step names (scenario shape) or
   check names (check shape) - and refuse the same shapes the host's order
   does: within-pack duplicates and cross-pack id collisions. The engine's
   shared-`seen` refusal (crashtest `loader.js:389-391`) now happens at
   author time.

## --against: the host-library census

Packs collide not only with each other but with the host's own built-in
library. `--against <path>` seeds the census with the library's ids before
the pack walk, so a pack id that claims a library id refuses at author
time (`id-library-collision`) - no host load needed:

- `<path>` is a file (.json parses; ESM imports) or a directory of modules;
- ids are probed generically (module/attack/step/check names), never
  shape-judged - the library's internals stay the host's business;
- a library that fails to load names the failure (`library-ref`) but still
  lets the pack census run.

Boundaries, spelled out: deep is a PROBE. Host module-shape norms stay
host-owned (SPEC section 3) - deep censes ids, it does not police the
host's contract shapes. Importing runs the entry's top-level code; data
modules are inert, and hostile modules are the host's isolation domain,
not the linter's.

Receipt: lints crashtest's 8 shipped packs deep-clean on the pinned corpus
lane - 44 pack ids `--against` the 63 seeded library ids, zero collisions
(see labs/corpus-receipt.md).

Runs in both fleet repos' CI the day it works (dogfooding rule: replace
hand-rolled manifest checks, don't fork the contract).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/' | relative_url }}">home</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/conformance' | relative_url }}">conformance harness</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
