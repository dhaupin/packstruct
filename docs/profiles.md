---
title: "Entry profiles"
description: "The declared entry profiles: scenario (crashtest), check (poststruct), and the memstruct-bound memory (vant) and sync (gistory) profiles. One manifest surface, four execution contracts - the host declares which profile it loads."
author: "Creadev.org"
lang: "en"
date: 2026-10-24
last_modified_at: 2026-11-08
nav_order: 4
layout: default
version: 1.0.0
permalink: /profiles
---

# Entry profiles

An entry is an ES module with a default export. The manifest/dir/entry surface never forks between hosts; execution semantics are declared as **profiles**, and a pack never changes its own semantics based on the host. The spec declares the four family profiles; a host may extend with an app-namespaced fifth.

## Scenario profile - crashtest

Default export carries `name`, `description`, and an `attacks[]` array: hostile scenarios executed against a transport. Because scenarios attack, hosts of this profile provide isolation (fake transport, opt-out postures) and support the `armedByKey` ceremony when the manifest carries it.

**Full module contract:** the module-shape contract is host-owned by design (doc drift beats indirection, ruled on [crashtest#19](https://github.com/dhaupin/crashtest/issues/19)) - read it at [crashtest's scenario contract](https://github.com/dhaupin/crashtest/blob/main/docs/reference/scenario-contract.md).

## Check profile - poststruct

Default export = `{ checks: [Check] }`: declarative, pure-reading verifiers over files on disk. No transport, no network by default. Arming defaults to config enumeration - being listed in the host's `packs:` config IS the arm; no separate key ceremony. (poststruct is not shipping yet; the shape is declared here, loader receipts follow engine-first.)

## Memory profile - vant

Default export = `{ records: [Record] }`: a durable memory store. The record grammar is host-owned by the [memstruct](https://github.com/dhaupin/memstruct) standard (the envelope `id`/`createdAt`/`updatedAt`/`deletedAt`; the body host-owned and carried, never refused), so this profile **links** to memstruct rather than restating it. No transport, no network by default; git (or a database, or a directory) is the host's substrate. Arming defaults to config enumeration, as in the check profile. The engine receipt is vant's markdown brain store (`models/public/<brain>/`, `models/private/<brain>/`).

## Sync profile - gistory

Default export = `{ merge(local, remote) }`: a pure reconciliation of two memstruct stores. The merge contract is host-owned by [memstruct](https://github.com/dhaupin/memstruct) section 4 (four normative properties: convergence, determinism, tombstone semantics, monotonicity), so this profile links to memstruct too. A sync pack is graded by the language-neutral `memstruct audit-merge` case kind, not by any packstruct lane. The engine receipt is gistory's merge (`src/sync/merge.ts`, pure, deterministic, tombstone-aware) over its record shape (`src/lib/models.ts`).

## The one-address rule

The canonical profile pages live with the spec, not the hosts: [`profiles/scenario.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/scenario.md), [`profiles/check.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/check.md), [`profiles/memory.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/memory.md), and [`profiles/sync.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/sync.md) in the repo. The scenario page LINKS to crashtest's reference, and the memory and sync pages LINK to memstruct, rather than copying either - so a host-side or standard-side edit can never quietly fork from the spec's copy of it.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/conformance' | relative_url }}">conformance harness</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a></p>
</div>
