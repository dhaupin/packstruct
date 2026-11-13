---
title: "Announcing packstruct v1.1.2"
description: "The packstruct v1.1.2 release post - the packstruct-lint-shapes pack now rides the published tarball, so a consumer that arms it by an exact npm pin actually receives it (poststruct#79)."
author: "Creadev.org"
lang: "en"
date: 2026-11-13
last_modified_at: 2026-11-13
nav_order: 12
layout: default
version: "1.1.2"
permalink: /discussions/announcing-v1.1.2
---

# packstruct v1.1.2

packstruct is a conformance harness and linter for the family's shape packs. v1.1.2 is a distribution fix with no linter-surface change: the `packstruct-lint-shapes` pack now rides the published tarball. This post ships with the v1.1.2 tag:

```bash
npx packstruct lint <packs>
```

## What landed

**The pack rides the published tarball (poststruct#79).** `package.json` `files` listed `bin/`, `src/`, `spec/`, `profiles/`, `conformance/`, and `LICENSE`, but not `packs/`. npm honours `files`, so `npm pack` shipped zero pack bytes and `npm i packstruct` installed a tree with no `node_modules/packstruct/packs/`. The `packstruct-lint-shapes` pack - the hostile-manifest wire truths (a malformed `pack.json` never crashes the CLI, entry path traversal is contained) - was committed and green yet undeliverable, because the family arms every verdict by an EXACT npm pin.

`packs/` joins the whitelist, so a consumer arms `node_modules/packstruct/packs/public/packstruct-lint-shapes` from the pin. The publish lane's verify job passes `--allowed "packs/"` - the family-default forbidden scan refuses `packs/` by prefix, so the flag de-asserts exactly that drift. `tests/distribution.test.cjs` pins the two halves of the contract, so a refactor that drops the whitelist fails CI instead of a consumer's install.

## Quality layer

The battery, the refusal matrix, the docs gates, and the pack linter all run on every push and pull request. This round changed distribution, not the linter, so no new pins were needed and none regressed.

## Links

- Repo and docs: https://github.com/dhaupin/packstruct / https://packstruct.creadev.org
- npm: https://www.npmjs.com/package/packstruct
- Changelog: https://github.com/dhaupin/packstruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/packstruct/issues
