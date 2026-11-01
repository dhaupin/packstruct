---
title: "Why packstruct"
description: "Many hosts, one pack grammar. Why a shared /packs spec exists: so an author who writes one pack knows how packs work everywhere, and a bad manifest is refused instantly and by name."
author: "Creadev.org"
lang: "en"
date: 2026-10-29
last_modified_at: 2026-10-29
nav_order: 7
layout: default
version: 1.0.0
permalink: /why
---

# Why packstruct

Every host that loads packs can invent its own manifest shape. When they do, an
author learns one host's rules and guesses at the next host's, and the guess is
where packs break.

## The problem: a pack shape per host

crashtest loads scenario packs; poststruct loads check packs; more hosts are
queued. If each one defines its own manifest fields, its own entry rules, and
its own refusals, then "a pack" means nothing portable. The same directory
loads here and fails there, and the failure is a stack trace instead of a
sentence.

## The thesis: frozen manifest, nameable refusal

packstruct is the spec that hosts already agreed on, written down and frozen at
schema version 1. One manifest, one entry contract, one lifecycle. The law is
two sentences long: the manifest is frozen, and a refusal is instant and
nameable. A pack that cannot load says why, by field name, before anything
runs.

The spec is a picture of what the hosts already do - crashtest's production
manifest fields, verified against real packs - not a re-design of them. That is
why adopting it costs a host nothing and buys every author a portable pack.

## Who it is for

Pack authors who want to write once and load anywhere; host maintainers who
want a validation contract instead of ad-hoc parsing; and CI that has to refuse
a malformed manifest before it reaches a runner.

<div class="crosslinks">
<p><strong>Next:</strong>
<a href="{{ '/what' | relative_url }}">what packstruct is</a> ·
<a href="{{ '/about' | relative_url }}">about the project</a></p>
</div>
