---
title: "Announcing packstruct v1.1.0"
description: "The packstruct v1.1.0 release post - SPEC v1.1 adds five engine-receipted rows without moving schemaVersion, the linter gains local/ lane linting and wrong-argument hints, and the repo gains a composed gate and a publish gate."
author: "Creadev.org"
lang: "en"
date: 2026-11-06
last_modified_at: 2026-11-06
nav_order: 10
layout: default
version: "1.1.0"
permalink: /discussions/announcing-v1.1.0/
---

# packstruct v1.1.0

packstruct is the shared `/packs` spec: one manifest, entry, and lifecycle contract so an author who writes one pack knows how packs work everywhere. v1.1.0 is the additive-first patch section 6 promised: five SPEC rows, every one citing an engine receipt, none moving `schemaVersion` and none changing a conforming host's behavior - plus linter ergonomics and a repo that now gates its own publish.

```bash
npx packstruct lint packs/ --deep
npx packstruct lint packs/ --local
npx packstruct new my-pack
```

## What 1.1.0 changes

**SPEC v1.1.0: the five additive rows.** Engine-receipted, no `schemaVersion` move, no conforming host changes: the optional `implements` key (format-lint only, a WARNING never a refusal), the formalized `--loader` template contract, ESM-default entries stated plainly, interop routes as a lifecycle norm, and companion-pin receipts. Sections 8-11 of the normative document. The frozen `schemaVersion` stays 1, because v1.1.0 is additive by construction.

**The walk-exit (promotion) rule.** A walk is not done until every finding it produced is promoted to a battery leg, a pack verdict row, or a named docket row - the one-mortem class made a norm.

**The new-host onboarding shape and the MIGRATION-NOTE convention.** A traveler joins by answering the three questions the spec already structures (manifest / lint / run) - profiles, never forks - and inherits the standing refusals. The MIGRATION-NOTE convention defines the shape a non-additive schema event must carry before first need: a schema-number bump, a MIGRATIONS row, refusal wording on old shapes, a dual-read window only where a host owns the artifact, and consumer receipts.

**`lint --local` - the gitignored WIP lane is now lintable, opt-in.** The default stays public-only and byte-compatible; the flag also walks `<packs-root>/local/`, the manifests an author is actively editing and the ones a public-only walk left invisible. Local rows carry `lane: "local"` in `--json`, the JSON gains a `localChecked` count, and `--deep` pairs with it.

**`packstruct new <name>` - a conforming pack skeleton at author time.** The cheapest break class - a new author guessing the field list - dies earlier when the starting point is generated correct. `new` writes `public/<name>/{pack.json,index.js}` that the lint accepts clean the moment it lands, and refuses by name without clobbering.

**Wrong-argument hints.** Passing the `public/` dir itself, one pack dir, or the repo root used to draw a faithful-but-nonsense `directory-contract` refusal. Those shapes now answer a `usage`-norm hint naming the probable intent. A genuinely empty root still refuses `directory-contract`.

**Unknown flags are refused, not silently ignored.** A typo'd mode flag used to run the WRONG mode with no signal. Every leading-dash token must now be a recognized flag or the run exits 2 naming it, for both `lint` and `audit-conformance`.

## The gate and the publish lane

The repo had only `test` and no `prepublishOnly`, so a corrupt or drifted SPEC/pack surface could publish ungated. `check` now composes the four docs gates, a deep lint of the repo's own shipped pack, and the 8/8 conformance audit; the gate is `prepublishOnly = npm test && npm run check`, so `npm publish` cannot cut a release the battery has not verified.

## Surfaces

- Landing: [packstruct.creadev.org](https://packstruct.creadev.org/)
- Docs: [docs.creadev.org/packstruct](https://docs.creadev.org/packstruct)
- npm: [npmjs.com/package/packstruct](https://www.npmjs.com/package/packstruct)
- Source: [github.com/dhaupin/packstruct](https://github.com/dhaupin/packstruct)

packstruct is made by [Creadev.org](https://creadev.org).
