---
title: "The linter"
description: "packstruct lint validates every pack under packs/public/ against SPEC v1 - schemaVersion, name/dir match, entry existence - with exit codes and JSON output for CI."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-23
nav_order: 3
layout: default
version: 0.9.0
permalink: /linter
---

# packstruct lint

Validates every pack under `packs/public/` against SPEC v1's manifest and
directory contract: schemaVersion 1, kebab-case name matching its directory,
dotted versions, non-empty description, relative entry paths, and that the
entry file physically exists - the crashtest#16 class, killed at author time.

```bash
npx packstruct lint packs/          # human, exit 0/1/2
npx packstruct lint packs/ --json   # { schema, packsChecked, violations }
```

Runs in both fleet repos' CI the day it works (dogfooding rule: replace
hand-rolled manifest checks, don't fork the contract).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/' | relative_url }}">home</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
