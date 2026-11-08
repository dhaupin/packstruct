# memstruct: a memory standard for all (candidate)

Status: proposal. This is v2 of the memory proposal filed as dhaupin/packstruct#84. Where v1 offered a memory profile inside packstruct, v2 splits the concern: the record format becomes its own standard, **memstruct**, and packstruct binds it through two profiles. Nothing is adopted; the maintainer rules.

Origin: a public thread asking how to standardize the many memory systems onto one spec, with git suggested as the substrate. The short answer is the layer trap: "what is a memory" (schema and verbs) and "where does it live and merge" (persistence and sync) are two questions, and git answers only the second.

## 1. The decision (what changed from v1)

v1 left four questions open. The maintainer's answers, and this revision:

- **The standard is for ALL memory systems, not only the family.** That rules out a family-only binding as the home for the format.
- **The name is memstruct.** Verified unclaimed on npm at proposal time (`npm view memstruct` returned E404). It matches the family's `*struct` cadence.
- **The richer merge road is open.** A CRDT-class merge conforms if it satisfies the normative properties; LWW is the reference algorithm, not the ceiling.
- **Profile names are `memory` and `sync`**, replacing v1's `memory-files` and `memory-sync`.

The consequence is a two-layer design: a language-neutral standard, and family bindings to it.

## 2. Two layers: the standard and the bindings

- **memstruct (the standard).** A language-neutral record format plus a normative merge contract. Conformance is graded by CLI over JSON on stdin and stdout, so a Rust, Python, or Go implementation is graded exactly as a JS one.
- **packstruct profiles `memory` and `sync` (the bindings).** How a packstruct host loads and runs a memory implementation. A binding is a thin adapter; the standard is the interop surface.

Why the split is required, not stylistic: a packstruct profile is an ESM default export, which is a JS-family binding. A standard for all cannot require that. The portable thing has to be data plus a CLI contract, and the profile becomes the family's adapter to it. This is also the honest answer to "standard for all": the artifact is what any language conforms to; the profile is how our hosts load it.

Versioning follows the family's `implements` discipline: `implements: memstruct@1`, format-only, additive-first.

## 3. The record format (memstruct@1)

A memory is a JSON object. The envelope is four fields, two required, so a minimal record is tiny and old payloads stay mergeable (the gistory optionality house rule, cited in section 10).

```json
{
  "id": "01H8Z...",
  "createdAt": 1730000000000,
  "updatedAt": 1730000000000,
  "deletedAt": null,
  "kind": "lesson",
  "scope": "private",
  "body": "markdown or plain text",
  "links": ["01H8Z..."],
  "provenance": {},
  "ttl": null,
  "meta": {}
}
```

**Envelope (the shared-facts column, every conforming reader assigns meaning):**

| Field | Rules |
|---|---|
| `id` | REQUIRED string. Stable and unique within a store. Opaque to the format (a ULID, a UUID, a hash: the implementation's choice). |
| `createdAt` | REQUIRED integer. Epoch milliseconds. |
| `updatedAt` | OPTIONAL integer. Epoch milliseconds. The merge clock. Absent means `createdAt` (the `updatedAt ?? createdAt` rule). |
| `deletedAt` | OPTIONAL integer or null. Epoch milliseconds. The tombstone. A record with `deletedAt` is deleted, not erased. |

**Body (host-owned vocabulary, never refused, never assigned shared meaning):**

- `kind` (string), `scope` (string): the implementation's own taxonomy. vant's kinds are identity, goals, lessons, errors, preferences; scope mirrors private versus shared.
- `body` (string): the payload, typically markdown. A record with no `body` is legal (a link or index record).
- `links` (array of ids): optional graph edges.
- `provenance` (object): optional, PROV-O-shaped (see section 9).
- `ttl` (integer or null): optional expiry hint; the store's policy decides what to do with it.
- `meta` (object): optional, host-owned escape hatch. A reader must carry it through unchanged and never refuse a record for it.

**The store (the unit of exchange).** A memory store is one JSON document. This is what moves between systems.

```json
{
  "memstruct": 1,
  "records": [ { "id": "...", "createdAt": 1730000000000 } ]
}
```

**Draft JSON Schema (normative shape, non-normative wording).**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://memstruct.dev/schema/store-1.json",
  "title": "memstruct store v1",
  "type": "object",
  "required": ["memstruct", "records"],
  "properties": {
    "memstruct": { "const": 1 },
    "records": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "createdAt"],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "createdAt": { "type": "integer" },
          "updatedAt": { "type": "integer" },
          "deletedAt": { "type": ["integer", "null"] },
          "kind": { "type": "string" },
          "scope": { "type": "string" },
          "body": { "type": "string" },
          "links": { "type": "array", "items": { "type": "string" } },
          "provenance": { "type": "object" },
          "ttl": { "type": ["integer", "null"] },
          "meta": { "type": "object" }
        },
        "additionalProperties": true
      }
    }
  },
  "additionalProperties": true
}
```

`additionalProperties: true` at both levels is deliberate: an unknown field is carried through, never refused. Refusals are reserved for the envelope (a missing `id`, a non-integer `createdAt`), never for extra data.

## 4. The merge contract (normative, property-based)

This is the part that makes the standard worth more than a naming convention, and the part where memstruct takes on real liability: it owns a semantic contract, so a bug in the merge is a spec bug. That is the price of convergence, and convergence between independent implementations is the entire product.

**The normative properties.** A conforming merge MUST satisfy all four, whatever algorithm it uses:

1. **Convergence.** The same set of records, merged in any order on any replica, yields the same result. Order-independence is the property, not a side effect.
2. **Determinism.** Merge is a pure function of its inputs. Same inputs, same output, on every device, every run.
3. **Tombstone semantics.** A record with `deletedAt` is hidden unless the record was updated after the deletion, in which case the update resurrects it.
4. **Monotonicity.** Applying a payload never resurrects a tombstoned record without a newer update, and never drops a newer record in favor of an older one.

**The reference algorithm (LWW plus tombstones).** The default every implementation can copy, and the one our receipts already hold:

1. Later timestamp wins, where the timestamp is `updatedAt ?? createdAt`.
2. Equal timestamps break by sender device id, lexicographically larger wins, so every device picks the same winner.
3. A tombstone hides a record unless the record was updated after the deletion, in which case the update resurrects it.

**The richer road (the escape hatch).** A CRDT-class merge (an operation-based or state-based replicated data type, Automerge-style) conforms if and only if it satisfies the four properties. The properties are normative; the algorithm is the reference, not the requirement. This admits the academic answer to concurrent semantic writes without freezing every implementation on timestamps.

**The CLI contract (the interop surface).** Merge is invoked, never imported:

```text
memstruct merge --local A.json --remote B.json --device-id X   # merged store on stdout, exit 0
```

Pure, no network, no host config, JSON in and JSON out. This is what makes the contract language-neutral: the harness runs the command, not a JS function.

## 5. The packstruct bindings

Following SPEC section 3, a profile is the host's execution semantics for a default export. Two bindings, both thin adapters over the memstruct CLI.

### `memory` (the store binding, the vant shape)

Default export provides the record read and write surface over a tree or a database. No transport, no network by default (the check-profile posture). git, or any store, carries lineage. Conformance is about record shape and the store layout, not about a wire.

```js
export default {
  records: [
    // kebab-case id + a read-only projection over the host's memory store
  ],
}
```

### `sync` (the replicated binding, the gistory shape)

Default export provides `merge` plus the record surface. The host owns transport and ciphertext; the profile owns reconciliation, and reconciliation is the memstruct merge contract invoked through the CLI. This is the profile conformance grades hardest.

```js
export default {
  merge, // (local, remote, { senderDeviceId }) -> merged, satisfying the four properties
  records: [
    // kebab-case id + the read surface over the merged store
  ],
}
```

A host declares which binding(s) it loads, exactly as it declares `scenario` or `check` today. A pack never changes its own semantics based on the host. The frozen `pack.json` field table (SPEC section 2) does not move.

## 6. Git as the substrate (the unofficial extension, named)

The honest position, stated so neither spec overclaims:

- Git is the persistence and provenance tier. Content-addressing gives identity, history gives receipts, and every device holds a full copy. vant already runs this way.
- Git has NO opinion on memory semantics, and that is fine, because the semantics live in a merge driver, not in git. This is git's sanctioned unofficial-extension surface, no fork required:

```text
# .gitattributes
memories/** merge=memory
```

```text
git config merge.memory.name "memstruct memory merge (LWW plus tombstones)"
git config merge.memory.driver "memstruct merge --base %O --local %A --remote %B --marker-size %L --path %P"
```

- The other sanctioned hooks, each optional: clean/smudge filters for encrypt-at-rest, `git notes` for provenance without rewriting history, ref namespaces (`refs/memories/<scope>/<id>`) for scoping and speculative branches, and the LFS or DVC pointer pattern for vectors and large blobs.
- The ceiling, stated plainly so nobody proposes past it: a fifth git object type is not cleanly possible (a `git hash-object -t memory` writes an object nothing else reads), and git refuses to operate on a repo carrying an unknown `extensions.*` key. So this does NOT extend git's format and does NOT fork git. It uses hooks, which is how `git-lfs` and partial-clone arrived.

The split is therefore: git owns snapshots, the memstruct merge owns reconciliation, a database or vector index owns hot recall, and memstruct owns the record grammar that lets them interoperate.

## 7. Conformance

Two commands, both CLI and both language-neutral.

```text
memstruct lint <store.json>                 # envelope + schema; exit 0 clean / 1 violations / 2 usage
memstruct audit-merge <case-dir>            # the sync case kind; exit 0 all cases honored / 1 any failed / 2 usage
```

`memstruct lint` grades the record format: required envelope fields, integer timestamps, and `additionalProperties` carried through rather than refused.

`memstruct audit-merge` is a NEW case kind, distinct from packstruct's existing bundle mechanism. The existing `audit-conformance` asserts exit code plus refusal naming over materialized bundles; it has no concept of comparing a produced artifact to an expected one. Merge convergence needs exactly that, so the case kind:

- feeds `local` + `remote` (+ device id) and captures the merged output,
- diffs it against a golden,
- runs BOTH input orders and asserts the same result (the order-independence leg, which is what makes convergence testable rather than asserted).

Bundled cases: a clean merge; a conflict where the later timestamp wins; a tie broken by device id; a tombstone that hides a record; a tombstone plus a later update that resurrects; and an order-swap of each. A merge that is not deterministic, or not order-independent, is named instead of passing. Because the case kind invokes a CLI, it grades a Python or Go implementation identically to a JS one.

## 8. Prior art (so this is not the 50,001st standard)

The answer to fragmentation is not a new system, it is a small frozen interchange that rides existing rails. memstruct should cite and reuse, not reinvent:

- **MCP (Model Context Protocol)** is the wire. memstruct is the record grammar that rides MCP, not a competing transport. vant already says "the tool interface is MCP."
- **Letta / MemGPT (memory blocks), Mem0, Zep / Graphiti (temporal graph)** are record-shape and lifecycle prior art; memstruct should formalize their intersection, not diverge from it.
- **W3C PROV-O** is the provenance ontology the optional `provenance` field should follow.
- **RFC 6902 (JSON Patch) and RFC 7386 (JSON Merge Patch)** are patch prior art for a future delta payload.
- **CRDTs / Automerge / Yjs** are the richer-merge family the properties clause admits.
- **ActivityStreams / ActivityPub** are the governance prior art: how a standard object plus federation is shaped, versioned, and adopted.
- **Obsidian, Roam, markdown-in-git** are the files tier that already converged; memstruct is compatible with it by construction.

## 9. Explicitly NOT proposed

- NO change to packstruct's frozen `pack.json` field table (SPEC section 2); memstruct is a sibling standard, not a pack grammar change.
- NO `schemaVersion` bump on packstruct. All rows are additive; a conforming packstruct host is unchanged.
- NO extension of git's object model, and NO fork of git. Merge driver and hooks only (section 6).
- NO remote or auto-downloaded memory stores in the first cut.
- NO requirement that an implementation be JS. The binding is the family's adapter; the standard is data plus a CLI.
- NO claim that this standardizes the world's memory systems by fiat. It is a frozen interchange with a conformance lane, offered for adoption one implementation at a time.

## 10. Receipts (the engines that already hold the behavior)

Every clause cites a shipped engine, not a future requirement.

- **The store shape is shipped by vant.** Its README: "The files are plain markdown in your own repository, so git history becomes the memory lineage. Any agent on any stack can use it, because the memory is files and the tool interface is MCP." Brain at `models/public/<brain>/` and `models/private/<brain>/`; a key-value plus documents store with TTL, per-brain scoped, sandbox-gated writes (`vant/README.md`, rows "The brain" and "The memory store"). This is the `memory` binding, where git already IS the persistence and provenance tier.
- **The merge is shipped by gistory.** `gistory/src/sync/merge.ts` is pure, deterministic, tombstone-aware, and states its rules in its own header: later timestamp wins (`updatedAt ?? createdAt`); equal timestamps break by sender device id (lexicographically larger wins) so every device converges; deletions ride as tombstones (`id -> deletedAt`) and a tombstone hides an item unless the item was edited after the deletion, in which case the edit resurrects it. This is the reference algorithm in section 4, and the `sync` binding.
- **The record shape is shipped by gistory.** `gistory/src/lib/models.ts`: every record carries `id` + `createdAt` + optional `updatedAt`, and later fields are optional by house rule so "payloads saved before this field existed stay mergeable." This is the optionality discipline in section 3.

Two engines, two persistence stories, one grammar. The same shape as the existing `scenario` and `check` pair.

## 11. Adoption ladder

Rows adopted one at a time, by the engines that already hold the behavior:

1. **Mint memstruct** as its own repo and package (`memstruct` on npm), with the record schema (section 3), the merge contract (section 4), and the two CLI commands (section 7). Smallest first cut: `lint` plus `audit-merge`.
2. **The `memory` binding** in packstruct: vant already conforms in substance; the work is naming the shape and adding a lint leg.
3. **The `sync` binding** in packstruct: gistory already holds every clause; the work is the convergence case kind.
4. **The git merge-driver form** (section 6) last: a host-side convenience, not a spec norm, and it only makes sense once the merge contract is frozen.

Each row lands as a tool-bump-only revision under the same frozen schema.

## 12. Resolved questions and remaining opens

Resolved by the maintainer (section 1): the standard is memstruct; it is for all; the richer merge road is open; the profiles are `memory` and `sync`.

Remaining opens for the maintainer:

1. **Repo and license.** memstruct as a new public repo under the family org, MIT, minted from the family template (monoforge) or hand-scaffolded? Recommendation: monoforge-stamped so it inherits the gates and the release ladder on day one.
2. **Spec home.** Does memstruct carry its own SPEC.md and versioning, or does it start as a section inside packstruct and graduate? Recommendation: its own SPEC.md, since a standard for all should not live inside a pack grammar.
3. **The properties clause wording.** Are the four properties the right cut, or should monotonicity fold into tombstone semantics? Recommendation: keep four, since monotonicity is the property a naive merge fails silently.
4. **First-cut scope.** `lint` plus `audit-merge` only, or also a reference `merge` implementation shipped in the package? Recommendation: ship the reference `merge`, since a standard with a runnable reference is adoptable on day one.

Filed from the family workspace, 2026-11-03.
