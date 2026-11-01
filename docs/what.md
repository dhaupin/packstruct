---
title: "What packstruct is"
description: "One normative spec plus a zero-dependency lint CLI: the pack.json v1 manifest, the scenario and check entry profiles, and a conformance harness that proves a loader honors every case."
author: "Creadev.org"
lang: "en"
date: 2026-10-29
last_modified_at: 2026-10-29
nav_order: 8
layout: default
version: 1.0.0
permalink: /what
---

# What packstruct is

packstruct is two artifacts: the normative SPEC that defines a `/packs`
directory, and a zero-dependency CLI that checks a manifest against it.

## The manifest (pack.json, v1)

A pack is a directory under `packs/public/<name>/` carrying a frozen
`pack.json`: `schemaVersion: 1`, a kebab-case `name` matching its directory, a
dotted `version`, a one-line `description`, a relative `entry` that must exist,
and an optional `armedByKey`. Every field is checked, and every refusal names
the field it refused.

## The profiles

A pack declares what it is for through a profile. The **scenario** profile is
what crashtest loads: a module that returns attack verdicts. The **check**
profile is what poststruct loads: a module that returns pass/fail findings. One
grammar, two declared shapes, so a host knows what a pack will do before it
runs it.

## The CLI and the conformance harness

The linter walks a `/packs` directory and refuses a malformed manifest with a
field-named message. The conformance harness goes further: it proves a loader
honors every case in the spec, so a host cannot claim conformance it does not
have.

```bash
# lint a /packs dir against SPEC v1
npx packstruct lint packs --deep

# prove a host loader honors every spec case
npx packstruct audit-conformance . --loader "node loader.mjs {packs}"
```

<div class="crosslinks">
<p><strong>Next:</strong>
<a href="{{ '/about' | relative_url }}">about the project</a> ·
<a href="{{ '/conformance' | relative_url }}">the conformance harness</a></p>
</div>
