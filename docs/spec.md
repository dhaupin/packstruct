---
title: "SPEC v1"
description: "The normative packstruct spec, version 1: directory contract, frozen manifest fields, entry profiles, lifecycle norms, nameable errors, versioning, and conformance tooling."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-24
nav_order: 2
layout: default
version: 1.0.0
permalink: /spec
---

# The packstruct spec - version 1

The normative document lives in the repo at [spec/SPEC.md](https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md) - this page mirrors its frame:

1. Directory contract: `packs/public/<name>/` = `pack.json` + entry file. The contract ROOT the lint takes as its argument is the packs root (`<dir>/`, with its `public/` and `local/` children), never `packs/public/` itself - the canonical statement is SPEC section 1, and host CLI pages mirror it rather than restating it
2. Manifest fields (frozen for v1) - crashtest's production reality, plus the five host-owned acknowledged keys (`env`, `plugins`, `package`, `implements`, `requires`)
3. Entry profiles: `scenario` (crashtest) / `check` (poststruct), declared by the host
4. Lifecycle norms: explicit loads, slug-namespaced ids, self-audit fixtures, relevance (`requires`/`provides` skip-before-import)
5. Errors: instant, nameable, never a deep stack trace
6. Versioning: additive-first; removals are major bumps with migration notes
7. Conformance tooling: `packstruct lint` + the `audit-conformance` harness (bundled verdict-claiming cases verify a HOST loader honors the spec - see [the harness page](https://docs.creadev.org/packstruct/conformance))

**v1.1.0 (additive, 2026-10-29)** - five engine-receipted rows, no `schemaVersion` move: the `implements` key, the formalized `--loader` template contract, ESM-default entries stated plainly, interop routes as a lifecycle norm, and companion-pin receipts. Plus the walk-exit (promotion) rule, the new-host onboarding shape, and the MIGRATION-NOTE convention. Sections 8-11 of the normative document.

**v1.3.0 (additive, 2026-11-03)** - one engine-receipted row, no `schemaVersion` move: the `requires` relevance key (host-owned capability tokens a pack needs) plus the skip-before-import lifecycle norm it gives meaning to. The honest inverse of a `.packignore` deny-list: a pack whose `requires` a run root's `provides` does not cover is skipped before import, so it fails CLOSED and travels WITH the pack. A run root declaring neither `provides` nor `ignore` is unchanged. Sections 2, 4, 8 (row 9), and 10 of the normative document.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/' | relative_url }}">home</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
