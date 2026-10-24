---
title: "The linter"
description: "packstruct lint validates every pack under packs/public/ against SPEC v1 - schemaVersion, name/dir match, entry existence - with exit codes and JSON output for CI."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-24
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

npx packstruct lint packs/ --deep   # + entry import + id census, exit 0/1/2
npx packstruct lint packs/ --deep --json
                                    # { schema, mode, packsChecked, modulesProbed, idsCensused, violations }
```

## --deep: load-level parity (probe only)

The manifest pass stops at file existence. `--deep` goes as far as the
linter can go without becoming a host:

1. **Import** each declared entry once, in-process, and name the failure if
   the host's loader would have hit it (`entry "..." failed to import`).
2. **Check** the default export exists (SPEC section 3: entry is an ES
   module with a default export).
3. **Census ids** - module names and attack/step names (scenario shape) or
   check names (check shape) - and refuse the same shapes the host's order
   does: within-pack duplicates and cross-pack id collisions. The engine's
   shared-`seen` refusal (crashtest `loader.js:389-391`) now happens at
   author time.

Boundaries, spelled out: deep is a PROBE. Host module-shape norms stay
host-owned (SPEC section 3) - deep censes ids, it does not police the
host's contract shapes, and the id-vs-host-library census needs a host
library reference, which is future work (tracked in packstruct#2).
Importing runs the entry's top-level code; data modules are inert, and
hostile modules are the host's isolation domain, not the linter's.

Receipt: lints crashtest's 8 shipped packs deep-clean on the pinned corpus
lane - 44 ids censused, zero collisions (see labs/corpus-receipt.md).

Runs in both fleet repos' CI the day it works (dogfooding rule: replace
hand-rolled manifest checks, don't fork the contract).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/' | relative_url }}">home</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
