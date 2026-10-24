# PRD: packstruct

**Status:** draft v0.1 — for owner review · ⚠️ **baseline watch (2026-10-23): crashtest schema changes are incoming on the repo and MAY bump schemaVersion — the §3.1 "v1 = crashtest reality" baseline gets re-verified pack-by-pack when those changes land, and the spec freezes AT whatever the fleet then ships (if crashtest moves to 2, the spec formalizes 2, and v1 is documented as the pre-bump reality). Do not treat the §3.1 tables as final until that re-audit.**
**Author:** echo (Buffy), 2026-10-23 · Owner: dhaupin · Forge colleague: Rook (ops agent, ruling 2026-10-24)
**Companion PRDs:** [horcrux/prd-poststruct.md](./prd-poststruct.md) · crashtest (packs in production today)
**Adoption proposal filed:** [crashtest#17](https://github.com/dhaupin/crashtest/issues/17) (2026-10-24, all prior crashtest issues closed at filing, clean point). Open questions #2 and #4 of this PRD are restated there as the crashtest side of the decision; the baseline watch above is restated as an explicit do-not-freeze warning.

---

## 1. One-line pitch

**packstruct is the shared packs spec.** One small document (plus a conformance CLI, later) that defines how a `/packs` directory works — manifest, entry contract, lifecycle, errors — so that **crashtest and poststruct ship the same spec from their own `packs/` directories.** Two different apps, one pack system: an author who writes one pack knows how packs work everywhere.

## 2. Why a separate spec (and not just a convention copied between repos)

1. **The contract already forked in practice.** Crashtest packs and poststruct packs share schemaVersion/name/version/entry and diverge on arming (armedByKey vs config-is-the-arm) and entry semantics (scenarios vs checks). Today those differences live in two codebases' heads. A spec makes the *shared* part citable and the *app-specific* part explicitly declared, so drift is named, not accidental.
2. **Third-party authors get one address.** "How do I write a pack?" has one answer: read packstruct, pick your app's declared profile. No archaeology in two repos.
3. **Future pack consumers are cheaper.** Any struct-family tool (later: migrare surfaces? weisync rulesets?) that wants a `/packs` dir adopts the spec instead of inventing a third dialect.
4. **The name is free.** `packstruct` — not on npm, not on GitHub (checked 2026-10-23) — and it sits inside the family naming (a *struct* that returns structures). Fallback names if Rook dislikes: `packspec` (npm taken, confusingly similar package at 0.4.0 — avoid), `pocks`, or just `packs`.

## 3. Spec structure (the actual document)

Tight by design — the whole normative part should be one readable page.

### 3.1 Dirs and manifest (shared, frozen for schemaVersion 1)

```
packs/public/<pack-name>/
  pack.json        # REQUIRED
  <entry file>     # REQUIRED, declared by pack.json "entry"
```

`pack.json` fields — and the version number is **not arbitrary**: this table is drawn from what crashtest's eight production packs already ship (verified 2026-10-23, every `packs/public/*/pack.json` inspected):

> All eight are `schemaVersion: 1`, every `name` matches its directory, every declared `entry` exists, field usage is exactly the shared set (`armedByKey` present on exactly one: `wp-money-shapes`; zero extra keys anywhere). The spec's v1 **is crashtest's current reality, formalized** — no fleet migration needed, and poststruct (nothing shipped yet) adopts the same v1 with zero migration. Clean boot.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | MUST be `1` (documented bump process in §3.4) |
| `name` | string | kebab-case, MUST match its directory name — mismatch is a load error, never a silent success |
| `description` | string | one line, human-readable |
| `version` | string | dotted semver-ish (`MAJOR.MINOR[.PATCH]`) |
| `entry` | string | relative path to the pack's entry file, MUST exist in the pack dir (the crashtest#16 lesson: a manifest declaring an entry that doesn't ship is an instant, nameable refusal — never a deep import stack trace) |
| `armedByKey` | string | OPTIONAL. Present => the host app MAY require an arming key before activation. Absent => the app's own default lifecycle governs (see §3.3) |

### 3.2 Entry contract (per profile, declared not hidden)

An entry is an ES module with a default export. The spec defines TWO profiles, and an app implements one (or extends with an app-namespaced third):

- **`scenario` profile (crashtest):** default export = `{ register(ctx) }` — supplies hostile scenarios against a transport. Because scenarios execute attacks, this profile REQUIRES app-level isolation guarantees (fake transport, opt-out postures) and supports the armed-key ceremony.
- **`check` profile (poststruct):** default export = `{ checks: [Check, ...] }` — declarative, pure-reading verifiers over files on disk. No transport, no network by default; arming defaults to config-enumeration (`packs:` is the arm).

Profiles exist so the manifest/dir/entry surface never forks, while execution semantics stay honest per threat model. A pack declares nothing about profiles; the *host* declares which profile it loads. (A pack whose entry exports both shapes: host cherry-picks; spec says nothing.)

### 3.3 Lifecycle rules (what the spec fixes vs what apps own)

**Spec-fixed everywhere:**
- Packs are **explicit** — a pack runs only because the host's config enumerates it (by name, directory, or npm id). Never implicit discovery of the host's `packs/` tree beyond `packs/public/` itself being enumerable on demand.
- Pack ids are **namespaced by pack slug** inside the host's id space (`wp/duplicate-title` in poststruct; `wp-stock-smoke/*` in crashtest). Cross-namespace collision at load time = refuse to start.
- Local-path sources only in spec v1. Remote/npm sources may add later — as an **explicit additive spec version**, never silently.
- Every pack ships **self-audit fixtures**: `test/fixtures/` proving the pack's contents do what they claim. A pack whose fixtures fail fails the pack's own CI host-first. (House law: the ledger runs before the artifact ships.) Note for crashtest: this is the ONE norm its production packs don't already satisfy — it's a lifecycle requirement, not a manifest field, so schemaVersion stays 1 and the backfill is a crashtest TODO, not a version bump. (Backfill is believed cheap: each pack's expected resistance already lives in its test pass.)

**App-owned (declared in the app's README, not the spec):** arming ceremony details, execution sandbox/shim (crashtest's `registry-shim`), scheduling, output formats.

### 3.4 Versioning

- `schemaVersion` bumps are **additive-first**: v2 may add optional manifest fields; removing/renaming a field is a major spec bump and needs a documented migration note.
- App-local extensions are allowed as **minimum spec, not maximum**: cve-feed's `snapshot.json` (a data file beside its entry) ships today alongside that manifest, and the spec never forbids extra files or extra manifest keys — the loader just doesn't assign shared meaning to undeclared keys. Apps may require more; the spec only guarantees what all conforming apps share.
- Each app pins which spec version it implements (`"implements": "packstruct@1"` in the app README), and the conformance CLI (M2) can verify it against a target dir.

## 4. Conformance CLI (the project's own artifact, not just a spreadsheet)

`packstruct@cli`:

```
packstruct lint packs/            # manifests valid, entries exist, names match dirs
packstruct audit-conformance .    # verify an app's loader honors the spec (fixture packs pass/fail as promised)
```

The linter is the immediate payoff: it catches the whole class we filed upstream (crashtest#16: scaffolded manifests pointing at entries that don't exist) at author time, in any fleet repo, with one command.

## 5. Milestones

- **M0 — spec text.** Write `SPEC.md` (normative §3 + profiles), README (the two current apps with today's exact behaviors), migration notes from each app's current reality to the frozen v1 (id namespacing in crashtest where absent, fixture requirement both).
- **M1 — linter CLI.** `packstruct lint`, zero-dep, MIT. DONE in scaffold (2026-10-23): `src/lint.mjs` + `bin/cli.mjs` implement manifest validation + entry existence + name/dir match with `--json` and the exit-code contract; fixtures (good/bad) PASS in `npm test`. Repo scaffolded at 0.9.0 in hand with README/AGENTS/CHANGELOG/DEPLOY/workflows; BLOCKED on push: `dhaupin/packstruct` does not exist on GitHub and the Freebuff agent credential cannot create repositories — Rook creates the repo, then the scaffold pushes.
- **M2 — conformance harness + publish.** `audit-conformance` fixture packs; npm publish; each app pins `packstruct@1`. (Version ladder per DEPLOY.md: 0.9.x manual npm, 1.0.0 flips OIDC, publish.yml refuses 0.x.)

## 6. Non-goals

- **No pack registry/marketplace.** Distribution stays: git repos + npm under the `@packstruct/*` scope (later M2). No central signing service.
- **No runtime loading abstraction** — the spec governs conventions and contracts; each app keeps its own loader implementation.
- **No pack version resolver** — the host resolves (and refuses) versions; the spec only documents what manifests may claim.

## 6.5 Naming collisions (researched 2026-10-23)

Known users of "packs" and the disambiguation the spec documents:

- **Rails Webpacker / shakapacker** — `app/javascript/packs/` (source entrypoints) and `public/packs/` (compiled output). Path-qualified, different intent (asset bundles vs loadable check/scenario bundles). The conventions can coexist in the wild; the spec notes the distinction so authors never mistake one for the other.
- **Cloud Native Buildpacks (`pack` CLI)** — tool-name adjacency only; no directory convention.
- **House fleets are the primary namespace:** a `packs/` dir + `pack.json` at tool-repo root is ours (crashtest production, poststruct by design). Root-level in tool repos is the spec's claim; we do not claim other people's nested paths.

## 7. Docs & house onboarding (what the repo gets on day 1)

- **Docs system — the triple dogfood:** a `/docs` site built on **Jekyll + Pagefind + Freestruct**. Jekyll bakes the pages, Pagefind adds static search, Freestruct ships the post-render SEO layer (its exact target market, exercised for real), and poststruct audits the output. It is simultaneously the spec's documentation, freestruct's showcase deployment, and poststruct's customer — one build, three proofs. **Domain (Rook, 2026-10-23): `docs.creadev.org/packstruct`** — the shared fleet docs host, path-scoped per project (sibling: `docs.creadev.org/poststruct`).
- **`/labs/TASKS.md`** — the own-runner convention (crashtest and prestruct already carry it; verified).
- **`/horcrux/` + own public brain — already minted (2026-10-23):** `models/public/packstruct/` exists in the vant workspace (identity, goals, lessons) and the boot stone lives in creadev at `horcrux/packstruct-p_packstruct2026-Lf7Hq9.svg` (valid horcrux, own key, full-stack snapshot per the house continuance pattern).
- **Site (deploy host frozen, Rook 2026-10-23):** **`packstruct.creadev.org`**, same fleet pattern as poststruct.creadev.org and crashtest.creadev.org. Host = **Cloudflare Pages** (`wrangler.toml`, `pages_build_output_dir = site`, `functions/` Pages-Functions surface with `/api/health` canary); the lean branded landing already sits in `site/` (no build step). Docs = **GitHub Pages via Actions**: `docs.yml` runs ruby→jekyll, then `sh ./scripts/build-docs.sh` = freestruct (basePath-aware: /packstruct — canonical = site.url + basePath + relSlug, verified in the freestruct engine before scaffolding) + `pagefind --site docs/_site`, then the official artifact deploy; first run needs the repo's Pages source flipped to "GitHub Actions". The triple dogfood is real in the scaffold: Jekyll bakes, freestruct injects, pagefind searches, poststruct audits in CI.

## 7. Open questions for Rook — RESOLVED 2026-10-24 by [crashtest#19](https://github.com/dhaupin/crashtest/issues/19) (Rook's reply, file refs exact)

Ruling: all three leans confirmed. #19 also returns ask #3's receipts (fresh 8-pack audit: 8/8 schemaVersion 1 + name==dir + entry-exists; **44 ids across the 8 packs, zero collisions pack-vs-pack and pack-vs-library**; the loader's refusal behaviors already in `src/packs/loader.js`) and ONE nuance folded before the freeze: three optional **host-owned acknowledged keys** crashtest's loader shape-validates beyond the shared set — `env` (the env-claims block), `plugins` (bundled plugin imports), `package` (optional npm name). Our linter already tolerates extra keys, so the hazard never existed in code; the fold was documentation: SPEC v1 now names them in a 'shared-facts column + host-owned acknowledged columns' frame, and never refuses a pack for carrying them. The three rulings:

1. Name: `packstruct` OK? (Sits in the family; `packspec` is npm-blocked-and-confusable.)
2. Arming: does crashtest's `armedByKey` move *into* the shared manifest schema (its field is already proposed in §3.1), or stay a crashtest-only convention the spec merely acknowledges? **RESOLVED: into the schema** — the engine treats absence as unarmed-but-loadable, and a future host inventing its own activation-key field is exactly the fork the spec prevents (lean upheld with reasons).
3. Where do the two apps' profile dialects live: `profiles/scenario.md` + `profiles/check.md` in the spec repo (my lean — one address) or as docs in each app repo? **RESOLVED: spec repo, one address**, but the scenario contract page LINKS to crashtest's `reference/scenario-contract` rather than copying it (doc drift > indirection, Rook's addendum).
4. Housekeeping: crashtest's packs tree is already v1-manifest-conformant (verified pack-by-pack); remaining spec deltas to adopt are id namespacing (if its scenario ids aren't already) and backfilled fixture dirs. Does the engine adopt them in place (reference-implementation duty), or does packstruct ship first and crashtest conform after? Constant question, one lean: engine first — a spec written after its reference implementation drifted loses authority. **RESOLVED: engine first** — and #19 took the baseline watch seriously: nothing manifest-schema-changing is brewing engine-side; if a schema change ever lands, it lands as code first and the spec formalizes after. Also ruled on #19: id namespacing confirmed with zero collisions (ask #3 closed); fixture backfill happens AFTER the spec lands so fixture shape follows the spec (transcription, not invention); CI lint wiring ('two-line change', same day) and the v1 pin are gated on crashtest#18 (the Freebuff reconnect).
