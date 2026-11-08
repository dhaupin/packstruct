# A memory profile for packstruct (candidate, additive, no schemaVersion bump)

Status: proposal, offered for adoption through the normal traveler ramp (SPEC section 10). Nothing here is adopted; this file exists so the discussion has one address and real receipts instead of prose.

Origin: a public thread asking how to standardize the many memory systems onto one spec, with git suggested as the substrate. The short answer is the layer trap: "what is a memory" (schema and verbs) and "where does it live and merge" (persistence and sync) are two questions, and git answers only the second. packstruct is already the answer to the first for packs. This proposes the memory case as a profile, grounded in two engines the family already ships.

## 1. The problem this closes

A pack has a frozen manifest, a directory contract, and nameable refusals. A memory has none of that. Every memory system re-invents its own record shape and its own merge, so "move my memory between systems" is a rewrite every time. That is the xkcd-927 shape: the answer is not a new memory system, it is a small frozen interchange plus a conformance lane.

packstruct is the right home because the machinery already exists and is proven:

- a manifest plus entry plus lifecycle contract (SPEC sections 1 to 4),
- a linter that refuses by name at author time (SPEC section 5),
- a conformance harness that runs a host's own loader over bundled cases (SPEC section 7),
- a traveler ramp for a new host that owns only its execution semantics (SPEC section 10).

A memory profile adds cases and one module shape. It does not move the manifest grammar.

## 2. Receipts (the engines that already hold the behavior)

Every clause below cites a shipped engine, not a future requirement.

- **The files shape is shipped by vant.** vant's README: "The files are plain markdown in your own repository, so git history becomes the memory lineage. Any agent on any stack can use it, because the memory is files and the tool interface is MCP." Its brain lives at `models/public/<brain>/` and `models/private/<brain>/`; its memory store is key-value plus documents with TTL, per-brain scoped, sandbox-gated writes (`vant/README.md`, rows "The brain" and "The memory store"). This is the profile where git already IS the persistence and provenance tier.
- **The merge is shipped by gistory.** `gistory/src/sync/merge.ts` is pure, deterministic, tombstone-aware, and states its own rules in the header comment: later timestamp wins (`updatedAt ?? createdAt`); equal timestamps break by sender device id (lexicographically larger wins) so every device converges on the same winner; deletions ride as tombstones (`id -> deletedAt`) and a tombstone hides an item unless the item was edited after the deletion, in which case the edit resurrects it. The functions are pure so they unit-test without a browser. This is the profile where git alone is NOT enough and the semantics live in a merge driver.
- **The record shape is shipped by gistory.** `gistory/src/lib/models.ts`: every record carries `id`, `createdAt`, optional `updatedAt`, and optional later-added fields, with the house rule spelled out in a comment: a new field is optional so "payloads saved before this field existed stay mergeable." That optionality discipline is exactly what an additive spec row needs.

Two engines, two very different persistence stories, one grammar. That is the same shape as the existing scenario and check pair.

## 3. The two memory profiles

Following SPEC section 3, a profile is the host's execution semantics for a default export. Two are proposed.

### memory-files (the vant shape)

Default export provides the record read and write surface over files on disk; the host points it at a tree and git carries lineage. No transport, no network by default (the check-profile posture). Conformance is about record shape and the file layout, not about a wire.

```js
export default {
  records: [
    // kebab-case id + a read-only projection over the host's memory tree
  ],
}
```

### memory-sync (the gistory shape)

Default export provides `merge` plus the record surface; the host owns the transport and the ciphertext, the profile owns the reconciliation. The merge is the LWW plus tombstone contract in section 4, and it is the thing conformance grades hardest.

```js
export default {
  merge, // (local, remote, { senderDeviceId }) -> merged, pure and deterministic
  records: [
    // kebab-case id + the read surface over the merged store
  ],
}
```

A host declares which memory profile(s) it loads, exactly as it declares scenario or check today. A pack never changes its own semantics based on the host.

Naming is offered, not fixed: `memory-files` and `memory-sync` read clearly as a pair, but the maintainer rules on profile names and these are open.

## 4. The record shape and the merge contract

The record shape is deliberately the intersection of the two receipts, and every field after the first four is optional so old payloads stay mergeable (the gistory house rule).

```json
{
  "id": "mem_01H...",
  "createdAt": 1730000000000,
  "updatedAt": 1730000000000,
  "deletedAt": null,
  "kind": "lesson",
  "scope": "private",
  "body": "markdown or plain text",
  "links": ["mem_01H..."],
  "provenance": {},
  "ttl": null
}
```

- `id`, `createdAt` required. `updatedAt` and `deletedAt` carry the merge clock.
- `kind` and `scope` are HOST-OWNED vocabulary (vant's kinds are identity, goals, lessons, errors, preferences; scope mirrors private versus shared).
- `body` is the payload; `links` are optional graph edges; `provenance` and `ttl` are optional and host-owned.
- Delete is a record with `deletedAt`, never a history rewrite. This is what lets "forget" be a tombstone instead of a `filter-branch`.

The merge contract is gistory's, verbatim, and it is what makes the profile worth standardizing:

1. Later timestamp wins (`updatedAt ?? createdAt`).
2. Equal timestamps break by sender device id, lexicographically larger wins, so all devices pick the same winner.
3. A tombstone hides an item unless the item was edited after the deletion, in which case the edit resurrects it.
4. Merge is pure and deterministic: same inputs, same output, on every device.

## 5. Git as the substrate (the unofficial extension, named)

The honest position on git, stated so the spec does not overclaim:

- Git is the persistence and provenance tier. Content-addressing gives identity, history gives receipts, and every device holds a full copy. vant already runs this way.
- Git has NO opinion on memory semantics, and that is fine, because the semantics live in a merge driver, not in git. This is git's sanctioned unofficial-extension surface, no fork required:

```text
# .gitattributes
memories/** merge=memory
```

```text
git config merge.memory.name "packstruct memory merge (LWW plus tombstones)"
git config merge.memory.driver "packstruct merge-memory %O %A %B %L %P"
```

- The other sanctioned hooks, each optional: clean/smudge filters for encrypt-at-rest, `git notes` for provenance without rewriting history, ref namespaces (`refs/memories/<scope>/<id>`) for scoping and speculative branches, and the LFS or DVC pattern for vectors and large blobs as pointer files with a sidecar store.
- The ceiling, stated plainly so nobody proposes past it: a fifth git object type is not cleanly possible (a `git hash-object -t memory` writes an object nothing else reads), and git refuses to operate on a repo carrying an unknown `extensions.*` key. So this proposal does NOT extend git's format and does NOT fork git. It uses hooks, which is how `git-lfs` and partial-clone arrived.

The split is therefore: git owns snapshots, the memory-sync merge driver owns reconciliation, a database or vector index owns hot recall, and packstruct owns the record grammar that lets them interoperate.

## 6. What conformance grades

Following SPEC section 7, an `audit-conformance` case set keyed to the memory profile ids:

- a clean bundle: a well-formed memory pack the host loader accepts, exit 0;
- one bundle per section-5 refusal norm, each exited non-zero with the offending pack named;
- a **merge-convergence** bundle (memory-sync only): two divergent snapshots plus the expected converged result, so a loader whose merge is not deterministic is named instead of passing;
- a **tombstone-resurrection** bundle: a delete plus a later edit, asserting the edit resurrects and the tombstone is not a permanent shadow.

The merge and tombstone cases are the memory-specific teeth. They are the reason a memory profile is worth more than a naming convention.

## 7. Explicitly NOT proposed

- NO change to the frozen `pack.json` field table (SPEC section 2). The record shape lives in the entry, not the manifest.
- NO `schemaVersion` bump. All rows are additive; a conforming host's behavior is unchanged.
- NO extension of git's object model, and NO fork of git. Merge driver and hooks only (section 5).
- NO remote or auto-downloaded memory packs (SPEC section 4 stands).
- NO claim that this standardizes the world's memory systems. It is a family profile grounded in two shipped engines, offered on the traveler ramp. Adoption is earned one host at a time, exactly as scenario and check were.

## 8. Adoption ladder

Rows adopted one at a time, by the engines that already hold the behavior:

1. **Record shape (section 4)** first: it is pure data, self-verifying, and both receipts already satisfy it.
2. **memory-files** next: vant already conforms in substance; the work is naming the shape and adding a lint leg.
3. **memory-sync merge contract** next: gistory already holds every clause; the work is the conformance bundle that proves convergence.
4. **The git merge-driver form (section 5)** last: it is a host-side convenience, not a spec norm, and it only makes sense once the merge contract is frozen.

Each row lands as a tool-bump-only revision under the same frozen schema, with the section-6 decoupling quoted intact.

## 9. Open questions for the maintainer

1. Profile names: `memory-files` and `memory-sync`, or something else in the one-word cadence (`files` and `sync`)?
2. Is a record schema a profile concern (this proposal) or a fourth artifact type the spec should name?
3. Should the merge contract be normative in the spec, or host-owned with the spec linking to it (the crashtest#19 precedent for the scenario contract)?
4. Does the conformance harness need a new case kind for merge convergence, or does it fit the existing bundle mechanism?

Filed from the family workspace, 2026-11-03.
