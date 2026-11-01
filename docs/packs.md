---
title: "The pack catalog"
description: "What ships in packs/public/, the two entry profiles, and the family hosts that load the spec - the live companion to the normative SPEC v1."
author: "Creadev.org"
lang: "en"
date: 2026-10-29
last_modified_at: 2026-10-29
nav_order: 3
layout: default
version: 1.0.0
permalink: /packs
---

# The pack catalog

The normative contract lives in [SPEC v1]({{ '/spec' | relative_url }}) and the [Entry profiles]({{ '/profiles' | relative_url }}) page. This page is the live catalog: what ships in `packs/public/`, and which family hosts load the same grammar. The branded version is at [packstruct.creadev.org/packs](https://packstruct.creadev.org/packs).

A pack is a directory under `packs/public/<name>/` carrying a frozen `pack.json` (schemaVersion 1, kebab-case name matching the directory, a relative `entry` that must exist, optional `armedByKey`) plus the entry module it names.

## What ships here

packstruct carries one pack of its own, and it attacks the linter. `packstruct-lint-shapes` holds four attacks, one contract each:

| Attack | Profile | What it proves |
|---|---|---|
| `hostile-manifest-fuzz` | scenario | Every malformed `pack.json` answers in-bounds: parseable verdict JSON, violations carried with `{pack,norm,message}`, exit 0/1, never 5xx, never a deep stack trace. |
| `entry-path-containment` | scenario | Entry values escaping the pack dir (traversal, absolute, file URL, null byte) are flagged by the entry norm, and an outside file that happens to exist never silences the refusal. |
| `over-strict-drift-canary` | scenario | Spec-allowed shapes (extra manifest keys, empty `armedByKey`) are never over-strictly flagged. The linter is strict only against spec norms. |
| `clean-pack-canary` | scenario | The happy path stays clean: a well-formed pack lints exit 0, so a green run is earned, not assumed. |

A new EXPLOITED verdict, or a regression of any recorded row, fails CI.

## The family hosts

One manifest surface, two execution profiles. A host declares which profile it loads; the manifest never forks. Every host below lints its packs through the same `packstruct lint --deep`.

| Host | Profile | Packs it loads |
|---|---|---|
| crashtest | scenario | Hostile scenarios against a transport, isolated; the dogfood double every member's `crashtest.config.js` drives. |
| poststruct | check | Pure-reading verifiers over files on disk: eleven baked-site shape packs plus `eyes-reference`. |
| eyestruct | check | The capture and canon lanes (`eye-shapes`, `eye-text-leg`, `eye-ci-gate`), conformance-checked through packstruct 1.0.0. |
| govstruct | check | The source-consistency profile: ten check packs over its own tree, plus a hostile member-block lane over `govstruct lint`. |
| monoforge | queued | None yet, per the factory's rule of three. A pack lands when a second real provider or a first real client pack appears. |

## Running a packdir

```bash
npx packstruct lint packs/ --deep     # manifest + entry + id-census grammar
npx packstruct lint packs/ --json     # machine-readable verdict
npx packstruct audit-conformance .    # verify a host loader honors the spec
```

The conformance harness runs bundled verdict-claiming fixture packs against a host's own loader command and checks pass/fail as promised, so the `implements: packstruct@1` pin is verifiable rather than honorary. See the [Conformance harness]({{ '/conformance' | relative_url }}) page for the case list.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/linter' | relative_url }}">the linter</a> ·
<a href="{{ '/profiles' | relative_url }}">entry profiles</a></p>
</div>
