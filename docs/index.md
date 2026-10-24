---
title: "packstruct - one /packs system, many hosts"
description: "The shared spec for /packs directories: one normative document plus a zero-dependency lint CLI, so crashtest and poststruct ship the same pack system."
author: "Creadev.org"
lang: "en"
date: 2026-10-23
last_modified_at: 2026-10-24
nav_order: 1
permalink: /
layout: default
version: 0.9.0
---
# packstruct

The shared spec for `/packs` directories. One small normative document plus a
zero-dependency lint CLI, so **crashtest** (scenario profile) and
**poststruct** (check profile) ship the same pack system from their own repos.

The branded landing lives at <https://packstruct.creadev.org/>; these docs
carry the normative detail.

```bash
npx packstruct lint packs/          # exit 0 clean / 1 violations / 2 usage
npx packstruct lint packs/ --json   # machine-readable
```

The v1 manifest is the formalized reality of crashtest's production packs:
`schemaVersion: 1`, kebab-case name matching its directory, dotted version,
one-line description, relative `entry` that **must exist**, optional
`armedByKey`.

Published on npm as [`packstruct@0.9.0`](https://www.npmjs.com/package/packstruct)
(zero dependencies; `npx` fetches it straight from that page).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a> ·
<a href="https://www.npmjs.com/package/packstruct">npm</a> ·
<a href="{{ '/search' | relative_url }}">search</a></p>
</div>
