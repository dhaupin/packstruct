# labs/TASKS.md

Last updated: 2026-10-24 (scaffold complete at 0.9.0, folded the crashtest#19/#20 rulings; push pending crashtest#18. The proposal arc: #17 filed, #19 receipts + leans confirmed, #20 release-atomicity ruling encoded in DEPLOY.md.)

- [ ] M2: conformance harness (packs a loader must pass/fail)
- [ ] M2: scenario-profile fixture for crashtest-host packs
- [ ] M3: language pack (poststruct vibe checks)

## 2026-11-03 - the pin guard goes family-wide (packstruct#69 back-port)

- `scripts/check-action-pins.cjs` (the "pins, never floats" guard) was a packstruct-only artifact (it landed on packstruct's `fix/sha-pin-actions`). It is now copied byte-identical into every sibling: `crashtest`, `eyestruct`, `freestruct`, `gistory`, `govstruct`, `monoforge`, `poststruct`, `prestruct` (packstruct already had it).
- Wired as `npm run lint:pins` inside each repo's publish gate (`check` / `gate` / `prepublishOnly`) and CI, and the guard's own battery (`check-action-pins.test.*`) rides `npm test`.
- Each repo's workflows were already SHA-pinned, so the guard is now mechanical here too. Receipt: `ACTION PINS: PASS (19 ref(s), all SHA-pinned)`, pin battery 8/8, full battery green.

---

### 2026-11-04 - session: the docs-lane consolidation (this repo now calls THE one lane)

The family carried four docs topologies - freestruct's `docs-lane.yml`, coreforge's forked `docs-build.yml`, govstruct's copy of that fork, and five inline hand-copies - and the two reusable lanes had already drifted (ruby 3.2 vs 3.4, pagefind `latest` scrape vs npm pin). Owner call: consolidate to ONE lane, `dhaupin/freestruct`'s `docs-lane.yml`, no drift.

- `.github/workflows/docs.yml` - now a THIN caller of `dhaupin/freestruct/.github/workflows/docs-lane.yml@22bb7e9b2634d6cdd966963d9e25c7f892577276`. The runbook (Jekyll, the hardened pagefind scrape, the pinned freestruct post-build layer, the optional crashtest dogfood campaign, the Pages upload, the main-gated deploy) lives once in the lane; this file keeps only the trigger, permissions, concurrency, and this repo's input pins.
- No `package-lock.json` here (a library), so the lane's lock-aware install takes the `npm install` path (and the lane's setup-node cache is skipped, since it needs a lockfile). No `crashtest.config.js`: the dogfood leg stays off. ruby 3.4.
- **Receipts:** the caller parses; `uses:` resolves to the lane at the pinned SHA; no local `docs-build.yml` remains.
- **No version bump**; a workflow consolidation, not a released surface.

- **The pin guard now scans `action.yml` (2026-11-04 sweep).** The family pin guard (`scripts/check-action-pins.cjs`) scanned only `.github/workflows/`, so a floating `uses:` in a repo-root composite Action manifest went unseen. crashtest's `action.yml` (the gate other repos add) carried `actions/setup-node@v6` and `actions/upload-artifact@v6` plus a duplicated `default:` key; both are now pinned and the key is gone. The guard scans the manifest alongside the workflows, and its battery proves the new leg bites. Sweep finding; no version bump.

---

### 2026-11-07 - session: the spec gets a face (showcase + a reworked landing)

The proto site was accurate but abstract - it explained the manifest grammar before it explained why anyone would care, listed five hosts and called monoforge "queued", and had no single place to walk the family. This session reworks the site so a first-time visitor understands what packstruct IS and sees the proof, without losing the frame (the same Vite + React shell, prestruct prerender, nav/sidebar/theme tokens, and legal/status pages the fleet shares).

- **New `/showcase` page (web) + `/showcase` docs page.** Every host that ships a `packs/` directory, with crosslinks to each repo and site: crashtest, vant, gistory, prestruct (scenario); poststruct, govstruct, eyestruct, monoforge (check); plus packstruct's own dogfood pack. Static by design (prerenders from pure data, so crawlers and no-JS visitors read the whole board).
- **One pure-data registry (`web/src/hosts.js`).** Home, Packs, and Showcase all render from it, so a new host or a count change lands in one place. Profile badges, host cards, and the family list share one shape.
- **The counts are receipts, not invention.** Every pack count and id census came from running `packstruct lint <repo>/packs --deep` over each host's live tree; every pin was read from that repo's `package.json`. Result: **69 packs / 9 hosts**, all clean (vant shows one pre-existing `entry-import` violation in `vant-carriers` - a vant-side path, filed as a finding, not a spec issue).
- **Home reworked** to lead with the plain-language pitch ("Write one pack. Load it in nine hosts.") and a "what is it, in one breath" trio (spec / linter / harness), then the host proof and the existing pipeline/why sections.
- **What/Why/About refreshed** to name all nine hosts and the wider family (freestruct, coreforge, railyard), with crosslinks. Packs page now lists all nine hosts with real counts instead of five.
- **README family-lanes registry** re-cut: rows for poststruct, govstruct, monoforge, vant, gistory, prestruct added; the stale eyestruct row (5/5) corrected to 6/6.
- **Receipts:** web build 11/11 routes, prestruct audit 0 failures; `npm run check` green (frontmatter/links/style/jekyll/language, action pins, prestruct pins, legal, refusal matrix, lint:packs, conform:packs 9/9, conform:claims 9/9).
- **No version bump yet** (Unreleased; the site is a served surface but the release ladder is tag-driven).

---

### 2026-11-03 - session: the spec learns to speak (three audience tiers + a human front door)

The site explained the grammar to people who already knew it. A newcomer landed on a pitch about "one manifest, many hosts" with no on-ramp, no plain-language definition of what a pack even is, and no path from "curious" to "running the linter". This session adds three audience tiers and a human front door, all grounded in SPEC v1 (no invented rules).

- **`/start` - the absolute beginner.** "A pack is a folder. This is the rulebook for it." Plain-words definition (a folder with a label file), a copy-paste first pack, the one command that checks it, a table of what the linter catches by name (leading with the crashtest#16 class), and four "where to go next" doors.
- **`/extend` - the hobbyist/builder.** Pick a profile (scenario / check, with the real default-export shapes from SPEC section 3), `--deep` (entry import + id census, the four refusals it names), the `audit-conformance` loader contract, the "traveler" host on-ramp (SPEC section 10), and the four house rules.
- **`/enterprise` - the fleet.** What enterprise needs (frozen and versioned, provable conformance, exact-pin receipts, governance as packs), a four-step adoption path, the MIT/OSS posture, and four prefilled issue forms.
- **Prefilled issue links, built in the browser.** `web/src/issues.js` builds `issues/new?template=...&title=...&body=...` URLs and opens them in a new tab; nothing is POSTed from the site. Same shape as vant's contact composer (cited, not invented).
- **Issue templates + chooser.** `.github/ISSUE_TEMPLATE/{bug_report,feature_request,adoption,new_host}.md` plus `config.yml` (blank issues off, contact links). Two new labels created: `adoption`, `host`. The web forms deep-link the templates by name.
- **CONTRIBUTING.md.** The short path in (five forms, branch flow), the gate (`npm test && npm run check`), the two surprise rules (a new check ships with a breaking fixture; pins, never floats), and a pointer to AGENTS.md as canonical (vant's front-door pattern).
- **SEO surface cleaned to zero warnings.** The three new pages + prestruct's structured `ogImage` object form (width/height/alt), every route description inside 70-165 chars, and page-level `<h1>` on `/spec`, `/lint`, `/status` (they were bare `<h2>`). Audit: **22 warnings -> 0**; prerender **14/14** routes.
- **Nav kept inside the wrap.** `Extend`/`Enterprise`/`About` moved out of the inline desktop header (a `header: false` flag) into the burger sidebar at every viewport.
- **Docs parity.** New `docs/start.md`, `docs/extend.md`, `docs/enterprise.md`; `docs/_data/nav.yml` and `docs/index.md` crosslinks updated.
- **Receipts:** web build 14/14 routes, prestruct audit **0 failures / 0 warnings**; `npm run check` green (FRONTMATTER 19 pages, DOCS LINKS, DOCS STYLE, JEKYLL FILTERS, LANGUAGE, ACTION PINS 14 refs/5 workflows, PRESTRUCT PINS, LEGAL PAGES, refusal matrix 18 rows, lint:packs, conform:packs 9/9, conform:claims 9/9).
- **No version bump** (Unreleased; the release ladder is tag-driven).
### 2026-11-08 - session: packstruct binds memstruct (the `memory` / `sync` profiles)

The memory standard [memstruct](https://github.com/dhaupin/memstruct) was minted in its own repo (record format + a four-property merge contract + a language-neutral CLI). packstruct is where it meets the pack grammar. Owner ruling: separation of concerns - packstruct owns the pack (manifest + entry + lifecycle), memstruct owns the record grammar and the merge contract, and the two new profiles are the join.

- **SPEC v1.2.0 - two profile rows (section 3), two section-8 rows.** `memory` profile: default export `{ records: [Record] }`, a durable store, the grammar owned by memstruct (so the page LINKS to memstruct, the same one-address rule `scenario` applies to crashtest's contract). `sync` profile: default export `{ merge(local, remote) }`, a pure reconciliation, the contract owned by memstruct section 4 (convergence, determinism, tombstone semantics, monotonicity). Neither moves `schemaVersion` nor adds a manifest field - additive-first, per section 6.
- **Canonical pages `profiles/memory.md` and `profiles/sync.md`**, filed with the spec (one address). They link memstruct rather than copying it, so a memstruct edit can never silently fork packstruct's copy. `profiles/` now holds four pages; SPEC section 3 and section 8 both enumerate them.
- **Receipts (engine-first).** `memory` cites vant's markdown brain store (`models/public/<brain>/`, `models/private/<brain>/`, "git history becomes the memory lineage"). `sync` cites gistory's merge (`src/sync/merge.ts`, pure, deterministic, tombstone-aware) over its record shape (`src/lib/models.ts`). Both engines currently ship **scenario** packs, so the profiles are declared (engine-first: code first, spec formalizes after) and the adopters are named on the pages, not claimed as live loaders yet.
- **Surfaces updated in the same change** (so they cannot drift): README (host line + Profiles section), docs `index`/`about`/`packs`/`profiles` (frontmatter descriptions + bodies), and the web registry (`web/src/hosts.js` `PROFILES` gains `memory`/`sync`; `Showcase.jsx` renders four cards; `styles.css` gains two badges).
- **A sync pack is graded by `memstruct audit-merge`**, not by any packstruct lane - the packstruct harness proves the manifest, memstruct proves the merge. Recorded in the `sync` page's "How a sync pack is graded".
- **Receipts:** `npm run check` green (frontmatter 19 pages, docs links/style, jekyll, language 36 files, action pins 14 refs, prestruct pins, legal, refusal matrix 18 rows, lint:packs, conform:packs 9/9, conform:claims 9/9); `npm test` green (50 + 11 tests).
- **No version bump yet** (Unreleased; the profiles are a spec + docs + web surface, and the release ladder is tag-driven).

---

### 2026-11-03 - session: packstruct adopts the relevance row (SPEC v1.3.0, from crashtest#104)

The ignore/relevance mechanism shipped in crashtest's loader (a pack declares `requires` - the host-owned capability tokens it needs from a run root; the run root declares `provides`/`ignore`; the loader skips an unmet pack BEFORE import, so the pack costs the run nothing). Engine-first: crashtest#104 is the receipt, and packstruct formalizes it. One additive row, no `schemaVersion` move, no change to a host that declares nothing.

- **SPEC v1.3.0 (section 2).** `requires` joins the manifest table AND the host-owned acknowledged keys: an OPTIONAL array of kebab-case capability tokens, vocabulary host-owned and free-form (the spec never forks a shared capability list).
- **SPEC v1.3.0 (section 4).** The lifecycle norm: a conforming loader whose run root declares a non-empty `provides` MUST skip, before import, any pack whose `requires` is not a subset of `provides` (and any pack named in an explicit `ignore` deny-list, which wins); the skip is reportable, and a run root declaring neither is byte-identical to before. Named the honest inverse of a `.packignore` deny-list: it fails CLOSED (a new pack self-skips) and travels WITH the pack (a manifest field, so lint sees it).
- **SPEC section 8 row 9** with the engine receipt (crashtest's `src/packs/relevance.js` + skip wiring in `loader.js`/`cli.js`/`plans.js`; six shipped packs carrying `requires`; `test/pack-relevance.test.js`). Section 10's "what does the manifest see?" list gains `requires`.
- **Linter (`src/lint.mjs`).** `requires` is shape-checked as a REFUSAL: array of unique kebab-case tokens; a malformed shape refuses `[requires]`. The tokens carry no meaning in the linter.
- **Conformance (`src/audit.mjs` + `conformance/cases/requires-claims/`).** A new accept case: a pack declaring the spec'd `requires` key must never be REFUSED. The bundle is now 10 cases, 3 accept. The SKIP behavior is host-owned (a run root's `provides`/`ignore` are the host's channel), so it is graded by crashtest's own suite - the harness only proves the key is tolerated.
- **Refusal matrix (`scripts/gen-refusal-matrix.mjs` + golden).** Five new rows (`requires-ok`, `requires-not-array`, `requires-bad-token`, `requires-empty-token`, `requires-duplicate`) observed from BOTH validators: packstruct and crashtest agree on all five. Matrix 18 -> 23 rows; `labs/refusal-matrix.golden.json` gains the crashtest column observations.
- **Surfaces moved in the same change:** CHANGELOG (Unreleased), README gate line, docs `spec`/`conformance`/`linter`/`what`/`packs`/`extend`, AGENTS.md gate line, `test/fixtures/good` demo pack carries a `requires` row (the additive key costs a conforming host nothing).
- **Receipts:** `npm test` green (50 + 11 tests); `npm run check` green (FRONTMATTER 19, DOCS LINKS, DOCS STYLE, JEKYLL FILTERS, LANGUAGE 36 files, ACTION PINS 14 refs/5 workflows, PRESTRUCT PINS, LEGAL PAGES, refusal matrix 23 rows all honest + golden agrees, lint:packs deep, conform:packs 10/10, conform:claims 10/10).
- **No version bump yet** (Unreleased; a spec revision is decoupled from the tool semver per section 6, and the release ladder is tag-driven).
