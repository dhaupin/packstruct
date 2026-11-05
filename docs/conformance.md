---
title: "Conformance harness"
description: "packstruct audit-conformance runs bundled verdict-claiming fixture packs against a host's own loader command and verifies pass/fail as promised - SPEC v1 section 7."
author: "Creadev.org"
lang: "en"
date: 2026-10-24
last_modified_at: 2026-10-24
nav_order: 5
layout: default
version: 1.0.0
permalink: /conformance
---

# `packstruct audit-conformance`

The linter checks pack manifests (section 2 + section 1 of the SPEC). The conformance harness checks the other half: whether a **loader** honors the spec. That makes the `implements: packstruct@1` pin verifiable instead of honorary.

```bash
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}"
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}" --json
                                    # { schema, mode: 'audit', repo, claims, cases, honored, violations }
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}" --claims
```

## How it works

The CLI ships **verdict-claiming fixture cases** (bundled in the npm package under `conformance/cases/`): one clean bundle, one bundle per [SPEC section 5](https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md) refusal norm (schemaVersion, kebab-case name, name/dir match, missing entry, empty description, non-dotted version), a name-collision pair, and one **`env-claims`** bundle carrying the host-owned `env` block (SPEC section 2 - an accept case: a pack that merely declares claims is conforming, so a loader must never refuse it). For each case the harness:

1. materializes the bundle into a fresh scratch root under the system temp dir;
2. `{packs}` in the loader template becomes that bundle root (shell-quoted for you), and the **host's own loader command** runs over it;
3. grades verdict, nothing else: a conforming loader exits 0 on the clean bundle, and exits non-zero **AND names the pack** on every violation bundle (SPEC section 5 says refusals are nameable - the harness matches pack identity, never refusal jargon, since wording stays host-owned).

Any other outcome is an audit violation naming the case:

```text
npx packstruct audit-conformance: 5/9 case(s) honored by the loader over .
  AUDIT schema-version [audit-refuse]: loader exit 0 (loader accepted) on case "schema-version" - the spec verdict is refuse
  AUDIT clean [audit-accept]: loader exit 1 on case "clean" - the spec verdict is accept
```

Exit ladder is the same as lint: `0` all cases honored, `1` any case failed (list above), `2` usage error (missing `--loader`, no `{packs}` placeholder).

## `--claims`: proving the loader carries `env`, not just tolerates it

The `env` block is spec'd (SPEC section 2, host-owned) but a loader that silently **ignores** it still passes the default audit - refusing nothing, it looks conforming while the claims go nowhere. `--claims` closes that gap: on the `env-claims` case the loader must exit 0 **and echo the declared block** as one stdout line,

```text
packstruct:env-claims {"d1":{"DB":{"tables":["charges"]}},"kv":{"UPLOADS":{}},"routes":["charge"],"seed":{...}}
```

The harness reads the expected claims straight from the case's own manifest, canonicalizes both sides (key order and array order are not part of the claim), and names two defects: a loader that **refuses** the block (the spec'd-key-rejection class) and one that accepts but does **not echo** (the silent-ignore class). The echo is opt-in because only hosts that read `env` can produce it - a loader that has no `env` semantics honestly stays on the default leg.

## What it deliberately does not check

The harness refuses to grade host cargo beyond the SPEC's promises: it never judges refusal wording, never evaluates the loader's output format (beyond the one opt-in `--claims` echo line), and never runs loader code itself - the host command runs in a shell the host owns. If your loader needs more wiring than a one-line command template, wrap it in a shim script and point `--loader` at that.

## Receipt

The house rule (receipt ships in the same commit): packstruct's own CLI is the first audited loader - `npm test` runs the 9 bundled cases through `node bin/cli.mjs lint {packs}` and asserts 9/9 honored, plus both failure directions (a loader that accepts everything honors only the 2 accept cases and fails the 7 refuse cases; a loader that refuses without naming the pack fails all 9). The `--claims` leg has its own both-ways pins: an env-echoing loader honors 9/9 with `--claims` (and 9/9 without it), an accept-everything loader is named for accepting-but-not-echoing, and a refuser is named for refusing the spec-allowed block (packstruct#71).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/profiles' | relative_url }}">entry profiles</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a></p>
</div>
