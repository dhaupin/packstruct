---
title: "Fleet and enterprise"
description: "One grammar across many repos: exact-pin companion receipts, conformance as a CI gate, governance as portable packs, and open-source adoption - all MIT."
author: "Creadev.org"
lang: "en"
date: 2026-11-03
last_modified_at: 2026-11-03
nav_order: 12
layout: default
version: 1.1.0
permalink: /enterprise
---

# Fleet and enterprise

The moment more than one team writes packs, "it loads on my machine" stops being good enough. This page is the adoption path for a fleet: how the spec scales, how to gate CI on it, and how to bring a problem to the issue tracker. The branded version is at [packstruct.creadev.org/enterprise](https://packstruct.creadev.org/enterprise).

## What enterprise actually needs

- **Frozen and versioned.** v1 does not drift. Additive changes keep the schema number; removing or renaming is a major bump that must carry a migration note (SPEC section 11).
- **Provable conformance.** A host does not claim conformance; it runs `packstruct audit-conformance` and passes. The claim is a command, so it is testable in CI.
- **Receipts, not promises.** Each host carries the packstruct version it conforms to as an exact devDependency and a receipt row. Hosts may lag each other; what is forced is the synchronized receipt when a bump happens.
- **Governance as packs.** govstruct proves it: its compliance rules **are** check packs, so governance ships as a portable `/packs` surface instead of a wiki.

## An adoption path that scales

1. **Audit what you have.** Run `npx packstruct lint --deep` over each repo's `packs/` directory. You get a nameable list of every manifest that points at nothing, and every id collision.
2. **Pin the spec you adopt.** Add `packstruct` as an exact devDependency and a receipt row: version, the commit it was cut against, the lint result, the date.
3. **Gate CI on the lanes.** `lint` and `audit-conformance` both exit `0` clean, `1` violations, `2` usage. Wire them as a required check.
4. **Declare your conformance.** Carry `implements: packstruct@1` in your docs and serve your verdicts with the [family-status@1 dialect]({{ '/status' | relative_url }}).

```bash
# 1. audit
npx packstruct lint packs/ --deep

# 3. the two CI gates (both exit 0 clean / 1 violations / 2 usage)
npx packstruct lint packs/ --deep
npx packstruct audit-conformance . --loader "node loader.mjs {packs}"
```

Every step above is already how the live hosts in the [Showcase]({{ '/showcase' | relative_url }}) run. You are adopting a lane with receipts, not a proposal.

## Open source, and staying that way

packstruct is MIT-licensed. The spec, the CLI, and the harness are all open, and development happens in the open through pull requests with their gates run. The CLI ships with zero runtime dependencies, so adopting it adds nothing to your supply chain. Published on npm as [packstruct](https://www.npmjs.com/package/packstruct).

## Bring us a problem

The fastest way to shape where the spec goes is to file what you need. These are the prefilled issue forms - each opens GitHub's own composer with the right template, which you review and submit there:

- [Adopt packstruct](https://github.com/dhaupin/packstruct/issues/new?template=adoption.md) - standardize a repo or a fleet on the grammar.
- [Register a new host](https://github.com/dhaupin/packstruct/issues/new?template=new_host.md) - you built an engine that loads packs.
- [Propose a spec change](https://github.com/dhaupin/packstruct/issues/new?template=feature_request.md) - a new field, key, or profile.
- [Report a bug](https://github.com/dhaupin/packstruct/issues/new?template=bug_report.md) - the linter, the harness, or the spec text.

Prefer to see what is already open? Browse the [issue tracker](https://github.com/dhaupin/packstruct/issues) first; a good issue is a searchable receipt that helps the next adopter.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/conformance' | relative_url }}">conformance harness</a> ·
<a href="{{ '/status' | relative_url }}">family status</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a></p>
</div>
