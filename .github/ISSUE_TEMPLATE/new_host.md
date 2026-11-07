---
name: New Host
about: Register an engine that loads packs (the "traveler" on-ramp, SPEC section 10)
title: '[host] '
labels: host
assignees: ''
---

## Host / engine name

What the engine is called, and a one-line description of what it does.

## Repo

Link to the repository.

## Profile

Which profile it loads - `scenario`, `check`, or a new one you are declaring. If new, describe the default-export shape the host expects.

## Where its packs live

The path to the host's `packs/public/` directory, and roughly how many packs it ships.

## Conformance

Have you run `npx packstruct audit-conformance . --loader "<cmd> {packs}"`? Paste the result, or say you have not yet - both are useful answers.
