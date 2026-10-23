---
title: "SPEC v1"
description: "The normative packstruct spec, version 1: directory contract, frozen manifest fields, entry profiles, lifecycle norms, nameable errors, versioning, and conformance tooling."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-23
nav_order: 2
layout: default
version: 0.9.0
permalink: /spec
---

# The packstruct spec - version 1

The normative document lives in the repo at
[spec/SPEC.md](https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md) -
this page mirrors its frame:

1. Directory contract: `packs/public/<name>/` = `pack.json` + entry file
2. Manifest fields (frozen for v1) - exactly crashtest's production reality
3. Entry profiles: `scenario` (crashtest) / `check` (poststruct), declared by the host
4. Lifecycle norms: explicit loads, slug-namespaced ids, self-audit fixtures
5. Errors: instant, nameable, never a deep stack trace
6. Versioning: additive-first; removals are major bumps with migration notes
7. Conformance tooling: `packstruct lint` now, the audit-conformance harness in M2

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/' | relative_url }}">home</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
