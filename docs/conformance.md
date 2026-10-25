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

The linter checks pack manifests (section 2 + section 1 of the SPEC). The
conformance harness checks the other half: whether a **loader** honors the
spec. That makes the `implements: packstruct@1` pin verifiable instead of
honorary.

```bash
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}"
npx packstruct audit-conformance . --loader "node bin/load-packs.js {packs}" --json
                                    # { schema, mode: 'audit', repo, cases, honored, violations }
```

## How it works

The CLI ships **verdict-claiming fixture cases** (bundled in the npm
package under `conformance/cases/`): one clean bundle, one bundle per
[SPEC section 5](https://github.com/dhaupin/packstruct/blob/main/spec/SPEC.md) refusal norm (schemaVersion,
kebab-case name, name/dir match, missing entry, empty description,
non-dotted version), and a name-collision pair. For each case the harness:

1. materializes the bundle into a fresh scratch root under the system
   temp dir;
2. `{packs}` in the loader template becomes that bundle root (shell-quoted
   for you), and the **host's own loader command** runs over it;
3. grades verdict, nothing else: a conforming loader exits 0 on the clean
   bundle, and exits non-zero **AND names the pack** on every violation
   bundle (SPEC section 5 says refusals are nameable - the harness matches
   pack identity, never refusal jargon, since wording stays host-owned).

Any other outcome is an audit violation naming the case:

```text
npx packstruct audit-conformance: 5/8 case(s) honored by the loader over .
  AUDIT schema-version [audit-refuse]: loader exit 0 (loader accepted) on case "schema-version" - the spec verdict is refuse
  AUDIT clean [audit-accept]: loader exit 1 on case "clean" - the spec verdict is accept
```

Exit ladder is the same as lint: `0` all cases honored, `1` any case
failed (list above), `2` usage error (missing `--loader`, no `{packs}`
placeholder).

## What it deliberately does not check

The harness refuses to grade host cargo beyond the SPEC's promises: it
never judges refusal wording, never evaluates the loader's output format,
and never runs loader code itself - the host command runs in a shell the
host owns. If your loader needs more wiring than a one-line command
template, wrap it in a shim script and point `--loader` at that.

## Receipt

The house rule (receipt ships in the same commit): packstruct's own CLI is
the first audited loader - `npm test` runs the 8 bundled cases through
`node bin/cli.mjs lint {packs}` and asserts 8/8 honored, plus both
failure directions (a loader that accepts everything fails 7 cases; a
loader that refuses without naming the pack fails all 8).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/profiles' | relative_url }}">entry profiles</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a></p>
</div>
