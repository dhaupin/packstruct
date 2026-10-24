# The scenario profile

Declared per SPEC v1 section 3 (normative) and filed here once, per the
one-address ruling on [crashtest#19](https://github.com/dhaupin/crashtest).

This is the profile [crashtest](https://github.com/dhaupin/crashtest) loads.

## The module shape

An entry module under this profile is an ES module with a default export
carrying three things:

```js
export default {
  name: 'my-scenario-pack',        // kebab-case
  description: 'one line',
  attacks: [
    {
      name: 'kebab-case-attack',   // kebab-case ids, namespaced by pack
      run: (ctx) => { /* ... */ }, // OR a steps chain, not both unnamed
    },
    {
      name: 'atted-attack',
      steps: [ /* named, ordered steps */ ],
    },
  ],
}
```

- Attack and step names join the host's id space under the pack-slug
  namespace (SPEC section 4). Collision at load = refuse to start, never
  silent dedupe.
- Exporting both a `run` and a `steps` chain on one attack: the host owns
  that ruling (SPEC section 3: host-cherry-picks territory).

## The authoritative contract is the host's

The full module-shape contract - what `ctx` carries, verdict semantics,
exit rules, ledger output - is **host-owned**. This page links to it rather
than copying it: doc drift is worse than indirection, ruled on crashtest#19
(the `register(ctx)` default-export shape in earlier drafts here was stale
and was deleted against the engine truth at `fc93ca6`).

**Authoritative reference:** [crashtest's scenario contract](https://github.com/dhaupin/crashtest/blob/main/docs/reference/scenario-contract.md)
(mirrored at [docs.creadev.org/crashtest/reference/scenario-contract](https://docs.creadev.org/crashtest/reference/scenario-contract)).

## What the spec guarantees anyway

Under any conforming host:

- the manifest that declares the entry - `pack.json` per SPEC section 2 -
  is validated against the frozen v1 table before the entry ever imports;
- `armedByKey` presence is the arming ceremony's manifest surface: the host
  MAY require an arming key before activation. Absent = the host's default
  lifecycle governs;
- refusals are instant, one-line, and name the pack (SPEC section 5);
- load isolation is the host's job: hostile scenarios run against the
  host's fake transport and opt-out postures, never a live target unless
  the host's runbook arms it.
