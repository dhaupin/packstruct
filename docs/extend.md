---
title: "Extend"
description: "For builders: write a pack a host will run, point a host at your own packs, add a new host profile, and prove it with --deep lint and the conformance harness."
author: "Creadev.org"
lang: "en"
date: 2026-11-03
last_modified_at: 2026-11-03
nav_order: 11
layout: default
version: 1.1.0
permalink: /extend
---

# Extend

Once you can write a valid `pack.json` (see [Start here]({{ '/start' | relative_url }})), the next step is making it do something and making a host actually load it. Everything on this page is grounded in [SPEC v1]({{ '/spec' | relative_url }}); nothing is invented. The branded version is at [packstruct.creadev.org/extend](https://packstruct.creadev.org/extend).

## Step 1 - pick a profile

A pack's entry is an ES module with a default export. What that default export **is** depends on the profile the **host** declares - a pack never changes its own semantics based on who loads it. Two profiles ship today.

- **scenario** - the default export carries `name`, `description`, and an `attacks[]` array (kebab-case names, each with a `run` function or a `steps` chain). Hostile scenarios run against a transport; the host provides isolation and may use the `armedByKey` ceremony. Loaded by crashtest, vant, gistory, and prestruct.
- **check** - the default export is `{ checks: [Check] }`: declarative, pure-reading verifiers over files. No transport, no network by default. Arming is config enumeration: being listed in the host's `packs:` config **is** the arm. Loaded by poststruct, govstruct, eyestruct, and monoforge.

The module-shape contract is host-owned in full - see [Entry profiles]({{ '/profiles' | relative_url }}) for the detail.

## Step 2 - check it deeper

The shallow lint checks the manifest. `--deep` imports each declared entry in an isolated child and censuses the ids, so the spec's own load-time refusals surface at author time.

```bash
# shallow: manifest + directory contract
npx packstruct lint packs/

# deep: + import each entry in a child, census ids
npx packstruct lint packs/ --deep

# refuse id collisions against a host library
npx packstruct lint packs/ --deep --against ./host-lib.mjs
```

| What `--deep` adds | Refusal it names |
|---|---|
| entry fails to import, or has no default export | `entry-import` / `entry-default-export` |
| duplicate id within one pack | `id-duplicate` |
| id collides across packs | `id-collision` |
| id collides with the host's library | `id-library-collision` |

A hostile entry is killed on a timeout or an output cap and refused nameably; it is never run in the linter's own process.

## Step 3 - prove a loader honors the spec

Writing packs is one half. The other half is a host that loads them correctly, and "correctly" should be provable. The conformance harness materializes bundled case packs and runs your loader over each.

```bash
npx packstruct audit-conformance . --loader "node loader.mjs {packs}"
```

A conforming loader exits `0` on the clean bundle and exits non-zero **and names the offending pack** on every violation bundle. The loader runs with CWD at the audited repo root, no network, and no implicit host config. A loader that times out or crashes is a failure, never a pass. `--claims` additionally requires the loader to echo a pack's declared `env` block. See the [conformance harness]({{ '/conformance' | relative_url }}) for the full case list.

## Step 4 - add a new host (a "traveler")

A new engine joins the grammar by answering three questions the spec already structures, never by forking the manifest (SPEC section 10):

1. **What does the manifest see?** The frozen v1 field table plus the host-owned acknowledged keys (`env`, `plugins`, `package`, `implements`). Nothing to fork.
2. **What does the lint see?** The same `packstruct lint` and `audit-conformance` lanes. A new profile only extends the cases reported, never the manifest grammar.
3. **What does run mean?** The only new thing you own: a profile row (your execution semantics), an engine receipt per adopted behavior, and cases in `audit-conformance` keyed to your profile id.

## House rules that keep packs honest

- **Self-audit fixtures.** Every pack ships `test/fixtures/` proving its contents do what they claim.
- **Pack version is the pack's own.** A `pack.json` `version` bumps only when that pack's surface changes, never when the linter or a consumer ships.
- **Explicit loads only.** A pack runs because the host's config names it. No remote or npm packs in v1.
- **Interop through the front door.** If your pack needs a sibling tool, go through that tool's public CLI, never by importing its internals.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/profiles' | relative_url }}">entry profiles</a> ·
<a href="{{ '/conformance' | relative_url }}">conformance harness</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a></p>
</div>
