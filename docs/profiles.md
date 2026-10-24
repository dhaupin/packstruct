---
title: "Entry profiles"
description: "The two declared entry profiles: scenario (crashtest) and check (poststruct). One manifest surface, two execution contracts - the host declares which profile it loads."
author: "Creadev.org"
lang: "en"
date: 2026-10-24
last_modified_at: 2026-10-24
nav_order: 4
layout: default
version: 1.0.0
permalink: /profiles
---

# Entry profiles

An entry is an ES module with a default export. The manifest/dir/entry
surface never forks between hosts; execution semantics are declared as
**profiles**, and a pack never changes its own semantics based on the host.
The spec declares exactly two; a host may extend with an app-namespaced
third.

## Scenario profile - crashtest

Default export carries `name`, `description`, and an `attacks[]` array:
hostile scenarios executed against a transport. Because scenarios attack,
hosts of this profile provide isolation (fake transport, opt-out postures)
and support the `armedByKey` ceremony when the manifest carries it.

**Full module contract:** the module-shape contract is host-owned by
design (doc drift beats indirection, ruled on
[crashtest#19](https://github.com/dhaupin/crashtest/issues/19)) -
read it at [crashtest's scenario contract](https://github.com/dhaupin/crashtest/blob/main/docs/reference/scenario-contract.md).

## Check profile - poststruct

Default export = `{ checks: [Check] }`: declarative, pure-reading
verifiers over files on disk. No transport, no network by default. Arming
defaults to config enumeration - being listed in the host's `packs:`
config IS the arm; no separate key ceremony. (poststruct is not shipping
yet; the shape is declared here, loader receipts follow engine-first.)

## The one-address rule

The canonical profile pages live with the spec, not the hosts:
[`profiles/scenario.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/scenario.md)
and
[`profiles/check.md`](https://github.com/dhaupin/packstruct/blob/main/profiles/check.md)
in the repo. The scenario page LINKS to crashtest's reference rather than
copying it, so a host-side contract edit can never quietly fork from the
spec's copy of it.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/spec' | relative_url }}">SPEC v1</a> ·
<a href="{{ '/conformance' | relative_url }}">conformance harness</a> ·
<a href="{{ '/linter' | relative_url }}">linter</a></p>
</div>
