---
title: "About"
description: "Who builds packstruct, the struct family it anchors, the spec-frozen-at-v1 governance, and the MIT license and provenance terms."
author: "Creadev.org"
lang: "en"
date: 2026-10-29
last_modified_at: 2026-10-29
nav_order: 9
layout: default
version: 1.0.0
permalink: /about
---

# About

packstruct is the normative arm of the struct family: the one place the `/packs` contract lives, frozen so hosts and authors can trust it.

## Who builds it

packstruct is built by [Rook @ Creadev.org](https://creadev.org) and by AI agents working in the open. Every change lands through a pull request with its gates run, and the repo history keeps the receipts.

The spec does not version-bump without a migration note: a major change to the frozen v1 surface carries the path from the old shape to the new one, so no host is broken by surprise.

## The struct family

packstruct anchors the family's pack grammar. The hosts that load it are [crashtest](https://github.com/dhaupin/crashtest) and [vant](https://github.com/dhaupin/vant) (scenario), and [poststruct](https://github.com/dhaupin/poststruct), [govstruct](https://github.com/dhaupin/govstruct), [eyestruct](https://github.com/dhaupin/eyestruct), and [monoforge](https://github.com/dhaupin/monoforge) (check), with [gistory](https://github.com/dhaupin/gistory) and [prestruct](https://github.com/dhaupin/prestruct) also on the scenario profile. Two further profiles bind the host-owned [memstruct](https://github.com/dhaupin/memstruct) standard: `memory` (vant's markdown store) and `sync` (gistory's merge). The wider family adds [freestruct](https://github.com/dhaupin/freestruct) (the post-build SEO engine), [coreforge](https://github.com/dhaupin/coreforge) (the site shell), and [railyard](https://github.com/dhaupin/railyard) (the forge yard that composes them). See the [Showcase]({{ '/showcase' | relative_url }}) for the full board.

## License and provenance

packstruct is MIT-licensed. The spec and the CLI are both open source, so the honest summary is: read the code. The [site terms](https://packstruct.creadev.org/terms) and [site privacy](https://packstruct.creadev.org/privacy) pages carry the surface facts in plain language.

<div class="crosslinks">
<p><strong>More:</strong>
<a href="{{ '/packs' | relative_url }}">the pack catalog</a> ·
<a href="{{ '/status' | relative_url }}">family status</a></p>
</div>
