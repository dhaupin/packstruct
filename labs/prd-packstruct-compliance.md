# PRD rider: packstruct - the ISO 9001 / ISO 27001 compliance frame

**Status:** rider v0.1, 2026-10-29 · Owner: dhaupin
**Companion:** `prd-packstruct.md`, `spec/SPEC.md`; govstruct's
`prd-govstruct-compliance.md` is the family's canonical frame.
**The one law:** an evidence map, not a certificate. It names which ISO
9001:2015 clauses and ISO 27001:2022 controls the packs spec and its linter can
**evidence**, and the gate that proves each one.

---

## 0. Why packstruct carries a frame

packstruct is the family's **spec**: one `/packs` manifest contract, frozen at
v1, with a STRICT linter. A frozen, versioned, machine-checked contract is the
purest form of ISO 9001 clause 7.5 (documented information) and clause 8.5.1
(control of production) a software repo can hold: the spec is normative, and the
linter refuses anything the spec does not promise. This rider makes that
mapping explicit.

---

## 1. The clause map

### ISO 9001:2015 - quality management

| clause | what it requires | the packstruct surface that evidences it | the gate |
|---|---|---|---|
| 4.4 | processes and their interactions | `spec/SPEC.md` (normative) + `src/` + `bin/` implement it | `npm test` |
| 7.5.2 | creating and updating documented information | the spec's revision history + `CHANGELOG.md` (Keep-a-Changelog) | `lint:docs` |
| 7.5.3 | control of documented information | spec frozen at v1; a major bump needs a migration note (SPEC §6) | `npm test` |
| 8.5.1 | control of production | the STRICT linter refuses only what the SPEC promises | `lint:packs --deep` |
| 8.5.2 | identification and traceability | the manifest table: schemaVersion, pack ids, entry paths | `packstruct lint` |
| 8.6 | release of products | `audit-conformance` over a host's own packs | `conform:packs` |
| 8.7 | nonconforming outputs | the refusal matrix (golden): every refusal code, both ways | `matrix:check` |
| 9.1 | monitoring and measurement | the refusal matrix is regenerated and diffed | `matrix:gen --check` |
| 10.2 | nonconformity and corrective action | a check the SPEC does not promise is a bug in the check, never shipped | `npm test` |

### ISO 27001:2022 - Annex A, the technological controls

| control | what it requires | the packstruct surface that evidences it | the gate |
|---|---|---|---|
| A.5.1 | policies for information security | the SPEC is the policy, versioned and normative | `lint:docs` |
| A.8.9 | configuration management | the manifest grammar is the single config contract | `lint:packs` |
| A.8.28 | secure coding | the linter is zero-dependency; pack entry paths stay in-pack | `lint:packs --deep` |
| A.8.29 | security testing in development | crashtest attacks the lint contract with hostile manifest corpora | `crashtest.yml` |
| A.8.32 | change management | additive-first patches (SPEC §6); the spec tags what the fleet ships | `npm test` |

---

## 2. The evidence surfaces (what an auditor reads)

| artifact | path | what it proves |
|---|---|---|
| the spec | `spec/SPEC.md` | the normative contract (7.5.2) |
| refusal matrix | `labs/refusal-matrix.golden.json` + `.md` | every refusal, both directions (8.7) |
| corpus receipt | `labs/corpus-receipt.md` | the manifest corpora the linter was run against (8.6) |
| changelog | `CHANGELOG.md` | Keep-a-Changelog; every PR adds an Unreleased item (7.5.2) |
| crashtest dogfood | `crashtest.config.js` + `packs/public/packstruct-lint-shapes` | the lint contract attacked in-process (A.8.29) |
| ship-from-download | `tests/ship-from-download.test.cjs` | the published tarball works as shipped (8.6) |

---

## 3. Steps to stand the frame up

1. **Freeze the spec.** `spec/SPEC.md` is normative; everything in `src/` and
   `bin/` implements it. Evidence for 4.4, 7.5.2.
2. **Wire the two-way fixtures.** `test/fixtures/` carry a clean sample pack plus
   a broken manifest pointing at a missing entry. Adding a validate rule = added
   cases both ways. Evidence for 8.5.1, 10.2.
3. **Regenerate the refusal matrix.** `matrix:gen` then `matrix:check` in CI so
   the golden matrix cannot drift. Evidence for 8.7, 9.1.
4. **Dogfood with crashtest.** `npx crashtest run` attacks the lint contract via
   an in-process double. Evidence for A.8.29.
5. **Ship from download.** The `test:ship` lane proves the published tarball
   behaves. Evidence for 8.6.
6. **Attach the govstruct profile pack** for the family roll-up.

---

## 4. What this frame does not claim

- **No certification.** The frame emits evidence; a body decides.
- **No physical or people controls** (ISO 27001 A.6/A.7).
- **No spec promises beyond the SPEC.** The linter is STRICT against spec norms
  and only those norms: a check the SPEC does not promise is a bug in the check.
  That is the frame's integrity guarantee, not a claim of coverage.
- **No version bump without a migration note** (SPEC §6) - a major bump that
  breaks hosts without a note would be a nonconformity, and the frame says so.
