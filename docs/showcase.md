---
title: "Showcase"
description: "The hosts that speak the packstruct grammar: every repo that ships a packs/ directory the linter approves, with the profile it loads and the counts from its own tree."
author: "Creadev.org"
lang: "en"
date: 2026-11-03
last_modified_at: 2026-11-03
nav_order: 6
layout: default
version: 1.1.0
permalink: /showcase
---

# Showcase

packstruct is only worth anything if real projects load it. They do: **69 packs across nine live hosts**, every one linted clean through the same `packstruct lint --deep` lane. Each row below is a real repo with a real `packs/` directory - the counts are receipts from that repo's own tree, not a claim on this page. The branded version with crosslink cards is at [packstruct.creadev.org/showcase](https://packstruct.creadev.org/showcase).

A host is a repo that ships a `packs/` directory and declares which entry profile it loads. The manifest never forks; only the execution semantics do.

## The hosts

| Host | Profile | Packs | Ids | What it loads packs for |
|---|---|---|---|---|
| packstruct (dogfood) | scenario | 1 | 5 | The spec attacks itself: four hostile-manifest campaigns drive the real lint CLI against SPEC v1 section 5. |
| crashtest | scenario | 9 | 47 | Adversarial QA for agent-built apps: seeded, in-process attacks against real handlers, graded into a hardening ledger CI fails on. |
| vant | scenario | 24 | 290 | The agent OS: 24 attack packs that measure its own defenses (kernel, mcp, relay, brain, walls). |
| gistory | scenario | 1 | 15 | E2EE multi-device sync: one chain-relay dialect pack attacks its push/pull sync surface in-process. |
| prestruct | scenario | 1 | 6 | AI-first SEO prerender: prestruct-proxy attacks its own HTTP render proxy pair (VPS + Worker). |
| poststruct | check | 12 | - | Audit what shipped: walks baked HTML and verifies head, links, and site hygiene, one check pack per SSG shape. |
| govstruct | check | 14 | 42 | The controller layer: its compliance rules ARE check packs, so governance is a portable /packs surface. |
| eyestruct | check | 6 | - | Eyes for production agents: its capture and canon lanes ride as check packs. |
| monoforge | check | 1 | 6 | The fleet factory: forge-shapes verifies a stamped tree ships its receipt and holds the truth-slot law. |

`Ids` is the declared-id census from `lint --deep`; `-` means the packs carry file checks rather than named ids.

## The two profiles

- **scenario** - a module that returns attack verdicts: hostile scenarios driven against a transport, isolated, with the armed-key ceremony available. Loaded by crashtest, vant, gistory, prestruct, and packstruct itself.
- **check** - a module that returns pass/fail findings: declarative, pure-reading verifiers over files on disk, no transport by default. Loaded by poststruct, govstruct, eyestruct, and monoforge.

## The rest of the family

Engines and rigs that compose with the spec without shipping a `/packs` directory of their own:

- [freestruct](https://github.com/dhaupin/freestruct) - the post-build SEO layer for static doc sites.
- [coreforge](https://github.com/dhaupin/coreforge) - the shell the family ships sites from.
- [railyard](https://github.com/dhaupin/railyard) - the forge yard that composes the forges.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/packs' | relative_url }}">the pack catalog</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/profiles' | relative_url }}">entry profiles</a></p>
</div>
