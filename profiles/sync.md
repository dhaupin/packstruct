# The sync profile

Declared per SPEC v1.2 section 3 (normative) and filed here once, per the one-address ruling on [crashtest#19](https://github.com/dhaupin/crashtest).

This is the profile [gistory](https://github.com/dhaupin/gistory) loads. The merge contract is HOST-OWNED by the [memstruct](https://github.com/dhaupin/memstruct) standard, so this page LINKS to it rather than copying it.

## The module shape

An entry module under this profile is an ES module with a default export carrying a `merge` function:

```js
export default {
  // Reconcile two memstruct stores into one. Pure: no I/O, no clock, no
  // randomness. The winner per id is decided by the merge contract below.
  merge(local, remote) {
    return { memstruct: 1, records: [/* ... */] }
  },
}
```

## The merge contract is memstruct

memstruct SPEC section 4 owns it. A conforming merge satisfies four observable properties:

1. **Convergence** - the same records merge to the same result on every replica, in any order.
2. **Determinism** - merge is a pure function of its inputs.
3. **Tombstone semantics** - a delete hides a record unless it was updated after the deletion, in which case the update resurrects it.
4. **Monotonicity** - an older version never displaces a newer one.

The **reference algorithm** is last-write-wins plus tombstones over a total order of `(clock, contentHash)`, `clock = max(updatedAt ?? createdAt, deletedAt ?? 0)`. The properties are normative; the algorithm is the reference, not the requirement, so a CRDT-class merge conforms if it satisfies all four.

## How a sync pack is graded

The language-neutral case kind is `memstruct audit-merge` (memstruct SPEC section 6): each case carries `local.json`, `remote.json`, and `expected.json`, and the harness runs the merge **both ways** and asserts each equals the expected store - the order-independence leg, which names a non-deterministic merge instead of passing it. Because the case kind is pure data in and pure data out, it grades a Python or Go merge identically to the JS reference.

## What the spec guarantees

- **No transport, no network by default.** The merge is a pure function; the substrate (a git repo, a relay, a database) is the host's, not the profile's.
- **Config-is-the-arm.** Being enumerated in the host's `packs:` config IS the arm. A `pack.json` may still carry `armedByKey`; the loader gives it the default lifecycle.
- **Namespaced ids.** Cross-namespace collision at load refuses to start (SPEC section 4).
- **Refusals** are instant, one-line, and name the pack (SPEC section 5).

## Boundary charter

The `sync` profile is the replicated tier; the store tier is the [`memory` profile](https://github.com/dhaupin/packstruct/blob/main/profiles/memory.md), which binds vant's store. Both ride the same memstruct grammar. The engine receipt for this profile is gistory's merge (`src/sync/merge.ts`, pure, deterministic, tombstone-aware) over its record shape (`src/lib/models.ts`).
