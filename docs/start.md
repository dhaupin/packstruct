---
title: "Start here"
description: "New to packstruct? What a pack is, the one command that checks it, and how to write your first pack.json - the beginner on-ramp, no prior knowledge assumed."
author: "Creadev.org"
lang: "en"
date: 2026-11-03
last_modified_at: 2026-11-03
nav_order: 10
layout: default
version: 1.1.0
permalink: /start
---

# Start here

This page assumes you have never heard of packstruct. It takes about five minutes and ends with a valid pack you have checked yourself. The branded version is at [packstruct.creadev.org/start](https://packstruct.creadev.org/start).

## A pack is a folder with a label

A **pack** is a directory under `packs/public/<name>/`. Inside it sits one small file, `pack.json`, that describes the folder. That is the whole idea. There is no build step, no registry, no code generation: a folder and a label file.

Something has to notice the folder and load it. That something is a **host** - a program that keeps a list of which packs it loads. Your folder does not run by itself; the host runs it because its list names it.

Before a host ever touches your folder, one command reads `pack.json` and tells you whether it is correct.

## Your first pack

```bash
# 1. make the folder and its one required file
mkdir -p packs/public/hello-pack
```

The label file, `packs/public/hello-pack/pack.json`:

```json
{
  "schemaVersion": 1,
  "name":          "hello-pack",
  "description":   "My first pack",
  "version":       "1.0.0",
  "entry":         "index.js"
}
```

Four fields do the work:

- `schemaVersion` - always `1` in v1.
- `name` - must equal the folder name exactly.
- `description` - one short human sentence.
- `entry` - a path to a file **inside** the pack that must exist.

There is a fifth field, `armedByKey`, you can ignore until much later.

Then the entry file the manifest names, `packs/public/hello-pack/index.js` (an empty file is fine to start), and the check:

```bash
npx packstruct lint packs/
```

Exit code `0` means you are done.

## What the check catches

| If you get this wrong | What you see |
|---|---|
| `entry` names a file that is not there | A named refusal: `entry "index.js" does not exist`. Not a stack trace three screens deep. |
| `name` does not match the folder | A refusal that names both values. |
| `schemaVersion` is missing or wrong | A refusal that says the version must be `1`. |
| Everything is correct | `ok` and exit code `0`. Silence is success. |

The first row is the whole reason the spec exists. It is the mistake crashtest filed as issue #16, and packstruct makes it impossible to ship by accident.

## Where to go next

- **Just checking a pack?** You are done. See the [linter]({{ '/linter' | relative_url }}) for the flags, or [try it in the browser](https://packstruct.creadev.org/lint).
- **Building on it?** Read [Extend]({{ '/extend' | relative_url }}) - it assumes only what this page covers.
- **Running a fleet?** Read [Fleet and enterprise]({{ '/enterprise' | relative_url }}).
- **Want the exact rule?** [SPEC v1]({{ '/spec' | relative_url }}) is the normative text.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/extend' | relative_url }}">extend</a> ·
<a href="{{ '/enterprise' | relative_url }}">fleet and enterprise</a> ·
<a href="{{ '/spec' | relative_url }}">SPEC v1</a></p>
</div>
