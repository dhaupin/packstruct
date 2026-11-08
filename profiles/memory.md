# The memory profile

Declared per SPEC v1.2 section 3 (normative) and filed here once, per the one-address ruling on [crashtest#19](https://github.com/dhaupin/crashtest).

This is the profile [vant](https://github.com/dhaupin/vant) loads. The record grammar is HOST-OWNED by the [memstruct](https://github.com/dhaupin/memstruct) standard, so this page LINKS to it rather than copying it - the same rule the `scenario` profile follows for crashtest's contract (doc drift is worse than indirection).

## The module shape

An entry module under this profile is an ES module with a default export carrying a `records` array:

```js
export default {
  records: [
    // Durable memory records: id, createdAt, an optional updatedAt/deletedAt
    // envelope, and a host-owned body (typically markdown). The envelope is
    // memstruct's; the body vocabulary is the host's.
  ],
}
```

## The record grammar is memstruct

The envelope is not packstruct's to define. [memstruct](https://github.com/dhaupin/memstruct) SPEC section 3 owns it:

- `id` - REQUIRED, stable, opaque to the format.
- `createdAt` - REQUIRED integer (epoch ms).
- `updatedAt` - OPTIONAL integer; the merge clock.
- `deletedAt` - OPTIONAL integer or null; the tombstone (a delete is not an erase).
- `kind`, `scope`, `body`, `links`, `provenance`, `ttl`, `meta` - host-owned, carried through, never refused.

The store is `{ "memstruct": 1, "records": [...] }`. A memory pack's store validates with `npx memstruct lint <store.json>`.

## What the spec guarantees

- **No transport, no network by default.** A memory pack reads and writes the records the host points it at. Git (or a database, or a directory) is the substrate; memstruct is silent on it by design.
- **Config-is-the-arm.** Being enumerated in the host's `packs:` config IS the arm, as in the `check` profile. A `pack.json` may still carry `armedByKey` (the shared manifest surface never forks), and the loader gives it the default lifecycle.
- **Namespaced ids.** Pack ids live in the pack-slug namespace; cross-namespace collision at load refuses to start (SPEC section 4).
- **Refusals** are instant, one-line, and name the pack (SPEC section 5).

## Boundary charter

The `memory` profile is the store tier; the replicated tier is the [`sync` profile](https://github.com/dhaupin/packstruct/blob/main/profiles/sync.md), which binds gistory's merge. Both ride the same memstruct grammar, so a store written under `memory` merges under `sync` without a translation layer. The engine receipt for this profile is vant's markdown brain store (`models/public/<brain>/`, `models/private/<brain>/`) and its MCP door.
